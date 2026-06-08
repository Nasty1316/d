<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не поддерживается']);
    exit;
}

function clean_str($v, $max = 2000) {
    $v = trim(strip_tags((string) $v));
    if (function_exists('mb_substr')) {
        return mb_substr($v, 0, $max);
    }
    return substr($v, 0, $max);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = $_POST;
}

$name = clean_str($input['name'] ?? '', 200);
$email = clean_str($input['email'] ?? '', 120);
$phone = clean_str($input['phone'] ?? '', 40);
$message = clean_str($input['message'] ?? '', 4000);

if ($name === '' || $email === '' || $message === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Заполните имя, email и сообщение']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Некорректный email']);
    exit;
}

$dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
if (!is_dir($dataDir)) {
    mkdir($dataDir, 0755, true);
}

$file = $dataDir . DIRECTORY_SEPARATOR . 'feedback_messages.json';
$entry = [
    'id' => bin2hex(random_bytes(8)),
    'name' => $name,
    'email' => $email,
    'phone' => $phone,
    'message' => $message,
    'created_at' => date('c'),
    'ip' => $_SERVER['REMOTE_ADDR'] ?? ''
];

$fp = fopen($file, 'c+');
if ($fp === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Не удалось сохранить сообщение']);
    exit;
}

if (!flock($fp, LOCK_EX)) {
    fclose($fp);
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Сервис временно недоступен']);
    exit;
}

$size = filesize($file);
$list = [];
if ($size > 0) {
    rewind($fp);
    $contents = fread($fp, $size);
    $list = json_decode($contents, true);
    if (!is_array($list)) {
        $list = [];
    }
}

$list[] = $entry;
rewind($fp);
ftruncate($fp, 0);
fwrite($fp, json_encode($list, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

echo json_encode(['success' => true, 'message' => 'Сообщение принято. Мы свяжемся с вами в рабочее время.']);
