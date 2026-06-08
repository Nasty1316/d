<?php
header('Content-Type: application/json');

$uploadDir = 'images/';
$allowedTypes = ['gallery', 'hero', 'about'];
$type = $_GET['type'] ?? 'gallery';
if (!in_array($type, $allowedTypes, true)) {
    $type = 'gallery';
}

$allowedImageExt = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

$response = ['success' => false, 'message' => '', 'files' => []];

function collectImagesFromDir(string $dir, array $allowedImageExt): array
{
    $imageFiles = [];
    if (!file_exists($dir)) {
        return $imageFiles;
    }

    $files = scandir($dir);
    foreach ($files as $file) {
        if ($file === '.' || $file === '..') {
            continue;
        }
        $filePath = rtrim($dir, '/\\') . '/' . $file;
        if (!is_file($filePath)) {
            continue;
        }
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowedImageExt, true)) {
            continue;
        }
        $imageFiles[] = [
            'name' => $file,
            'path' => $filePath,
            'url' => $filePath,
            'size' => filesize($filePath),
            'type' => mime_content_type($filePath),
            'uploadDate' => date('c', filemtime($filePath))
        ];
    }

    return $imageFiles;
}

$targetDir = $uploadDir . $type . '/';
$imageFiles = collectImagesFromDir($targetDir, $allowedImageExt);

// Совместимость: старые файлы галереи в корне images/
if ($type === 'gallery') {
    $legacyFiles = collectImagesFromDir($uploadDir, $allowedImageExt);
    $existingNames = array_column($imageFiles, 'name');
    foreach ($legacyFiles as $file) {
        if (!in_array($file['name'], $existingNames, true)) {
            $imageFiles[] = $file;
        }
    }
}

if (!empty($imageFiles)) {
    usort($imageFiles, function ($a, $b) {
        return strtotime($b['uploadDate']) - strtotime($a['uploadDate']);
    });

    $response['success'] = true;
    $response['files'] = $imageFiles;
    $response['message'] = 'Найдено ' . count($imageFiles) . ' файлов';
} else {
    $response['message'] = 'Файлы не найдены в ' . $targetDir;
}

echo json_encode($response);
