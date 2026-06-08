<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не поддерживается']);
    exit;
}

session_start();

require_once __DIR__ . '/database/Database.php';
require_once __DIR__ . '/includes/booking_helpers.php';

if (empty($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Войдите в аккаунт для бронирования']);
    exit;
}

$facilities = booking_facilities();

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = $_POST;
}

$name = booking_clean_str($input['name'] ?? '', 200);
$phone = booking_clean_str($input['phone'] ?? '', 40);
$email = booking_clean_str($input['email'] ?? '', 120);
$facilityKey = booking_clean_str($input['facility'] ?? '', 40);
$date = booking_clean_str($input['date'] ?? '', 20);
$startTime = booking_normalize_time($input['time_pref'] ?? $input['start_time'] ?? '');
$durationMinutes = (int) ($input['duration_minutes'] ?? 0);
$peopleCount = (int) ($input['people_count'] ?? 0);
$comment = booking_clean_str($input['comment'] ?? '', 2000);

if ($name === '' || $phone === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Укажите имя и телефон для связи']);
    exit;
}

if (!isset($facilities[$facilityKey])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Выберите объект из списка']);
    exit;
}

if ($date === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Укажите желаемую дату']);
    exit;
}

if ($startTime === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Укажите время бронирования']);
    exit;
}

if (!booking_validate_time($startTime)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Бронирование доступно с 9:00 до 23:00']);
    exit;
}

if ($durationMinutes <= 0) {
    $durationMinutes = $facilities[$facilityKey]['duration'];
}

if ($peopleCount < 1) {
    $peopleCount = 1;
}
if ($peopleCount > 500) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Укажите корректное количество людей']);
    exit;
}

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Некорректный email']);
    exit;
}

try {
    $db = Database::getInstance();
    $userId = (int) $_SESSION['user_id'];

    $user = $db->fetch('SELECT id, is_active, role FROM users WHERE id = :id', ['id' => $userId]);
    if (!$user || !(int) $user['is_active'] || $user['role'] !== 'user') {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Сессия недействительна. Войдите снова.']);
        exit;
    }

    $conflict = booking_find_conflicts($db, $facilityKey, $date, $startTime, $durationMinutes);
    if ($conflict) {
        $busyEnd = booking_time_to_minutes($conflict['start_time']) + (int) $conflict['duration_minutes'];
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => 'Это время уже занято. Выберите другой слот (занято с '
                . substr($conflict['start_time'], 0, 5) . ' до '
                . sprintf('%02d:%02d', intdiv($busyEnd, 60) % 24, $busyEnd % 60) . ').',
        ]);
        exit;
    }

    $db->beginTransaction();

    $conflict = booking_find_conflicts($db, $facilityKey, $date, $startTime, $durationMinutes);
    if ($conflict) {
        $db->rollback();
        http_response_code(409);
        echo json_encode(['success' => false, 'message' => 'Это время уже занято другим пользователем']);
        exit;
    }

    $bookingId = $db->insert('bookings', [
        'user_id' => $userId,
        'name' => $name,
        'phone' => $phone,
        'email' => $email,
        'facility' => $facilityKey,
        'facility_label' => $facilities[$facilityKey]['label'],
        'booking_date' => $date,
        'start_time' => $startTime,
        'duration_minutes' => $durationMinutes,
        'people_count' => $peopleCount,
        'comment' => $comment,
        'status' => 'confirmed',
        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? '',
    ]);

    $db->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Бронирование подтверждено на ' . $date . ' в ' . $startTime
            . ' (' . $durationMinutes . ' мин.).',
        'booking_id' => (int) $bookingId,
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    if (isset($db)) {
        try {
            $db->rollback();
        } catch (Exception $ignored) {
        }
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Не удалось сохранить бронирование']);
}
