<?php
header('Content-Type: application/json; charset=utf-8');

$dataDir = __DIR__ . DIRECTORY_SEPARATOR . 'data';
$file = $dataDir . DIRECTORY_SEPARATOR . 'schedule.json';

$default = [
    'note' => 'Расписание появится после настройки файла data/schedule.json',
    'days' => []
];

if (is_readable($file)) {
    $raw = file_get_contents($file);
    $decoded = json_decode($raw, true);
    if (is_array($decoded) && isset($decoded['days']) && is_array($decoded['days'])) {
        echo json_encode(['success' => true, 'schedule' => $decoded], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

echo json_encode(['success' => true, 'schedule' => $default], JSON_UNESCAPED_UNICODE);
