<?php
header('Content-Type: application/json');

$uploadDir = 'images/';
$allowedTypes = ['gallery', 'hero', 'about'];
$allowedFileTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
$maxFileSize = 10 * 1024 * 1024; // 10MB

$subDir = $_POST['type'] ?? 'gallery';
if (!in_array($subDir, $allowedTypes, true)) {
    $subDir = 'gallery';
}

$targetDir = $uploadDir . $subDir . '/';

if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}
if (!file_exists($targetDir)) {
    mkdir($targetDir, 0777, true);
}

$response = ['success' => false, 'message' => '', 'files' => []];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['files'])) {
    $files = $_FILES['files'];

    for ($i = 0; $i < count($files['name']); $i++) {
        $file = [
            'name' => $files['name'][$i],
            'tmp_name' => $files['tmp_name'][$i],
            'size' => $files['size'][$i],
            'type' => $files['type'][$i],
            'error' => $files['error'][$i]
        ];

        if ($file['error'] === UPLOAD_ERR_OK) {
            if ($file['size'] > $maxFileSize) {
                $response['message'] .= "Файл {$file['name']} слишком большой. ";
                continue;
            }

            $fileExt = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if (!in_array($fileExt, $allowedFileTypes, true)) {
                $response['message'] .= "Файл {$file['name']} имеет недопустимый тип. ";
                continue;
            }

            $fileName = uniqid() . '_' . $file['name'];
            $targetPath = $targetDir . $fileName;

            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                $response['files'][] = [
                    'name' => $file['name'],
                    'path' => $targetPath,
                    'url' => $targetPath,
                    'size' => $file['size'],
                    'type' => $file['type'],
                    'uploadDate' => date('c')
                ];
                $response['success'] = true;
            } else {
                $response['message'] .= "Не удалось загрузить файл {$file['name']}. ";
            }
        } else {
            $response['message'] .= "Ошибка загрузки файла {$file['name']}: " . $file['error'] . ". ";
        }
    }

    if ($response['success'] && empty($response['message'])) {
        $response['message'] = 'Файлы успешно загружены';
    }
} else {
    $response['message'] = 'Нет файлов для загрузки';
}

echo json_encode($response);
