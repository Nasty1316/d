<?php
/**
 * API авторизации пользователей сайта
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();

require_once __DIR__ . '/../database/Database.php';
require_once __DIR__ . '/../includes/booking_helpers.php';

function auth_json($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function auth_user_payload($user) {
    return [
        'id' => (int) $user['id'],
        'username' => $user['username'],
        'email' => $user['email'],
        'full_name' => $user['full_name'],
        'phone' => $user['phone'] ?? '',
        'role' => $user['role'],
    ];
}

try {
    $db = Database::getInstance();
    $action = $_GET['action'] ?? '';
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET' && $action === 'me') {
        if (empty($_SESSION['user_id'])) {
            auth_json(['authenticated' => false]);
        }
        $user = $db->fetch(
            'SELECT id, username, email, full_name, phone, role, is_active FROM users WHERE id = :id',
            ['id' => $_SESSION['user_id']]
        );
        if (!$user || !(int) $user['is_active']) {
            session_destroy();
            auth_json(['authenticated' => false]);
        }
        auth_json(['authenticated' => true, 'user' => auth_user_payload($user)]);
    }

    if ($method !== 'POST') {
        auth_json(['success' => false, 'message' => 'Метод не поддерживается'], 405);
    }

    $input = json_decode(file_get_contents('php://input'), true);
    if (!is_array($input)) {
        $input = $_POST;
    }

    if ($action === 'register') {
        $fullName = booking_clean_str($input['full_name'] ?? '', 100);
        $email = strtolower(booking_clean_str($input['email'] ?? '', 120));
        $phone = booking_clean_str($input['phone'] ?? '', 40);
        $password = (string) ($input['password'] ?? '');
        $passwordConfirm = (string) ($input['password_confirm'] ?? '');

        if ($fullName === '' || $email === '' || $phone === '' || $password === '') {
            auth_json(['success' => false, 'message' => 'Заполните все обязательные поля'], 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            auth_json(['success' => false, 'message' => 'Некорректный email'], 400);
        }
        if (strlen($password) < 6) {
            auth_json(['success' => false, 'message' => 'Пароль должен быть не короче 6 символов'], 400);
        }
        if ($password !== $passwordConfirm) {
            auth_json(['success' => false, 'message' => 'Пароли не совпадают'], 400);
        }

        $maxUsers = booking_get_max_users($db);
        $currentUsers = booking_count_registered_users($db);
        if ($currentUsers >= $maxUsers) {
            auth_json([
                'success' => false,
                'message' => 'Достигнут лимит регистраций (' . $maxUsers . ' пользователей). Обратитесь в администрацию.'
            ], 403);
        }

        $existing = $db->fetch(
            'SELECT id FROM users WHERE username = :username OR email = :email',
            ['username' => $email, 'email' => $email]
        );
        if ($existing) {
            auth_json(['success' => false, 'message' => 'Пользователь с таким email уже зарегистрирован'], 409);
        }

        $userId = $db->insert('users', [
            'username' => $email,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'email' => $email,
            'full_name' => $fullName,
            'phone' => $phone,
            'role' => 'user',
            'is_active' => 1,
        ]);

        $_SESSION['user_id'] = (int) $userId;
        $_SESSION['user_role'] = 'user';

        $user = $db->findById('users', $userId);
        auth_json([
            'success' => true,
            'message' => 'Регистрация успешна',
            'user' => auth_user_payload($user),
        ]);
    }

    if ($action === 'login') {
        $email = strtolower(booking_clean_str($input['email'] ?? '', 120));
        $password = (string) ($input['password'] ?? '');

        if ($email === '' || $password === '') {
            auth_json(['success' => false, 'message' => 'Укажите email и пароль'], 400);
        }

        $user = $db->fetch(
            'SELECT id, username, email, full_name, phone, role, password_hash, is_active FROM users WHERE (username = :login OR email = :login) AND role = :role',
            ['login' => $email, 'role' => 'user']
        );

        if (!$user || !(int) $user['is_active'] || !password_verify($password, $user['password_hash'])) {
            auth_json(['success' => false, 'message' => 'Неверный email или пароль'], 401);
        }

        $_SESSION['user_id'] = (int) $user['id'];
        $_SESSION['user_role'] = 'user';

        auth_json([
            'success' => true,
            'message' => 'Вход выполнен',
            'user' => auth_user_payload($user),
        ]);
    }

    if ($action === 'logout') {
        session_destroy();
        auth_json(['success' => true, 'message' => 'Вы вышли из системы']);
    }

    auth_json(['success' => false, 'message' => 'Неизвестное действие'], 400);

} catch (Exception $e) {
    auth_json(['success' => false, 'message' => 'Ошибка сервера'], 500);
}
