<?php
/**
 * API управления бронированиями (админ) и проверки доступности слотов
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../database/Database.php';
require_once __DIR__ . '/../includes/booking_helpers.php';

function bookings_json($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function bookings_require_admin() {
    if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
        bookings_json(['error' => 'Требуется авторизация'], 401);
    }
    $token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
    if ($token !== 'demo-token') {
        bookings_json(['error' => 'Неверный токен авторизации'], 401);
    }
}

try {
    $db = Database::getInstance();
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';

    if ($method === 'GET' && $action === 'availability') {
        $facility = booking_clean_str($_GET['facility'] ?? '', 40);
        $date = booking_clean_str($_GET['date'] ?? '', 20);
        $facilities = booking_facilities();

        if (!isset($facilities[$facility]) || $date === '') {
            bookings_json(['success' => false, 'message' => 'Укажите объект и дату'], 400);
        }

        $rows = $db->fetchAll(
            "SELECT start_time, duration_minutes FROM bookings
             WHERE facility = :facility AND booking_date = :date AND status = 'confirmed'
             ORDER BY start_time ASC",
            ['facility' => $facility, 'date' => $date]
        );

        $busy = array_map(function ($row) {
            $start = booking_time_to_minutes($row['start_time']);
            $end = $start + (int) $row['duration_minutes'];
            return [
                'start_time' => substr($row['start_time'], 0, 5),
                'duration_minutes' => (int) $row['duration_minutes'],
                'end_time' => sprintf('%02d:%02d', intdiv($end, 60) % 24, $end % 60),
            ];
        }, $rows);

        bookings_json([
            'success' => true,
            'facility' => $facility,
            'date' => $date,
            'default_duration' => $facilities[$facility]['duration'],
            'busy_slots' => $busy,
        ]);
    }

    if ($method === 'GET' && $action === 'stats') {
        bookings_require_admin();
        $total = $db->count('bookings');
        $users = booking_count_registered_users($db);
        $maxUsers = booking_get_max_users($db);
        bookings_json([
            'success' => true,
            'total_bookings' => $total,
            'registered_users' => $users,
            'max_users' => $maxUsers,
        ]);
    }

    if ($method === 'GET') {
        bookings_require_admin();
        $bookings = $db->fetchAll(
            "SELECT b.*, u.email AS user_email
             FROM bookings b
             LEFT JOIN users u ON u.id = b.user_id
             ORDER BY b.booking_date DESC, b.start_time DESC, b.created_at DESC"
        );
        bookings_json(['success' => true, 'bookings' => $bookings]);
    }

    if ($method === 'DELETE') {
        bookings_require_admin();
        $id = (int) ($_GET['id'] ?? 0);
        if ($id <= 0) {
            bookings_json(['success' => false, 'message' => 'Некорректный ID'], 400);
        }
        $deleted = $db->delete('bookings', 'id = :id', ['id' => $id]);
        if ($deleted === 0) {
            bookings_json(['success' => false, 'message' => 'Запись не найдена'], 404);
        }
        bookings_json(['success' => true, 'message' => 'Бронирование удалено']);
    }

    bookings_json(['success' => false, 'message' => 'Метод не поддерживается'], 405);

} catch (Exception $e) {
    bookings_json(['success' => false, 'message' => 'Ошибка сервера'], 500);
}
