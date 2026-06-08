<?php
/**
 * Резервная копия: images/, data/, database.sqlite
 * Вызов: backup.php?token=ВАШ_СЕКРЕТ (секрет в data/backup.token)
 * Первый запуск: скопируйте data/backup.token.example → data/backup.token и задайте свой ключ.
 */
declare(strict_types=1);

$tokenFile = __DIR__ . '/data/backup.token';
if (!is_readable($tokenFile)) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Создайте файл data/backup.token (см. data/backup.token.example) и откройте backup.php?token=ваш_секрет";
    exit;
}

$expected = trim((string) file_get_contents($tokenFile));
$provided = isset($_GET['token']) ? trim((string) $_GET['token']) : '';

if ($expected === '' || !hash_equals($expected, $provided)) {
    http_response_code(403);
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Доступ запрещён';
    exit;
}

if (!class_exists('ZipArchive')) {
    http_response_code(500);
    echo 'На сервере не включено расширение ZipArchive';
    exit;
}

$backupDir = __DIR__ . '/backups';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
}

$stamp = date('Y-m-d_H-i');
$zipPath = $backupDir . '/gorki-backup_' . $stamp . '.zip';

$zip = new ZipArchive();
if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
    http_response_code(500);
    echo 'Не удалось создать архив';
    exit;
}

function addDirToZip(ZipArchive $zip, string $dir, string $zipPrefix): void
{
    if (!is_dir($dir)) {
        return;
    }
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    foreach ($iterator as $file) {
        $path = $file->getPathname();
        $relative = $zipPrefix . substr($path, strlen($dir) + 1);
        $relative = str_replace('\\', '/', $relative);
        if ($file->isDir()) {
            $zip->addEmptyDir(rtrim($relative, '/') . '/');
        } else {
            $zip->addFile($path, $relative);
        }
    }
}

addDirToZip($zip, __DIR__ . '/images', 'images/');
addDirToZip($zip, __DIR__ . '/data', 'data/');

$dbFile = __DIR__ . '/database.sqlite';
if (is_file($dbFile)) {
    $zip->addFile($dbFile, 'database.sqlite');
}

$zip->close();

header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'success' => true,
    'file' => basename($zipPath),
    'path' => 'backups/' . basename($zipPath),
    'size' => filesize($zipPath),
    'created' => date('c'),
], JSON_UNESCAPED_UNICODE);
