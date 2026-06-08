<?php
/**
 * Публичное чтение и сохранение настроек кастомизации сайта (админ: Bearer demo-token)
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$dataDir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data';
$configFile = $dataDir . DIRECTORY_SEPARATOR . 'site_customization.json';
$scheduleFile = $dataDir . DIRECTORY_SEPARATOR . 'schedule.json';

function sc_json($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

function sc_require_admin() {
    if (!isset($_SERVER['HTTP_AUTHORIZATION'])) {
        sc_json(['success' => false, 'error' => 'Требуется авторизация'], 401);
    }
    $token = str_replace('Bearer ', '', $_SERVER['HTTP_AUTHORIZATION']);
    if ($token !== 'demo-token') {
        sc_json(['success' => false, 'error' => 'Неверный токен авторизации'], 401);
    }
}

function sc_defaults() {
    $path = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'site_customization.json';
    if (is_readable($path)) {
        $raw = file_get_contents($path);
        $decoded = json_decode($raw, true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }
    return [
        'version' => 1,
        'theme' => [
            'primaryColor' => '#2563eb',
            'secondaryColor' => '#1e40af',
            'accentColor' => '#fbbf24',
            'textDark' => '#1f2937',
            'heroGradient' => 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
            'fontFamily' => 'Inter, sans-serif',
            'customCss' => '',
        ],
        'sections' => [],
        'nav' => [],
        'textOverrides' => ['ru' => [], 'en' => [], 'be' => []],
        'seo' => ['ru' => [], 'en' => [], 'be' => []],
        'contacts' => ['blocks' => []],
        'footer' => ['copyright' => ['ru' => '', 'en' => '', 'be' => '']],
        'hero' => ['showFloatingCards' => true, 'overlayOpacity' => 0.4],
        'content' => ['news' => null, 'about' => null, 'prices' => null, 'contacts' => null],
        'schedule' => null,
    ];
}

function sc_load($file) {
    if (!is_readable($file)) {
        return sc_defaults();
    }
    $raw = file_get_contents($file);
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return sc_defaults();
    }
    return array_replace_recursive(sc_defaults(), $decoded);
}

function sc_save($file, $data) {
    $dir = dirname($file);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    $data['updated_at'] = date('c');
    $json = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    if ($json === false) {
        return false;
    }
    return file_put_contents($file, $json, LOCK_EX) !== false;
}

function sc_merge_deep(array $base, array $patch) {
    foreach ($patch as $key => $value) {
        if (is_array($value) && isset($base[$key]) && is_array($base[$key]) && sc_is_assoc($value) && sc_is_assoc($base[$key])) {
            $base[$key] = sc_merge_deep($base[$key], $value);
        } else {
            $base[$key] = $value;
        }
    }
    return $base;
}

function sc_is_assoc(array $arr) {
    if ($arr === []) {
        return true;
    }
    return array_keys($arr) !== range(0, count($arr) - 1);
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';

    if ($method === 'GET') {
        $config = sc_load($configFile);
        if ($action === 'schedule') {
            if (is_readable($scheduleFile)) {
                $sched = json_decode(file_get_contents($scheduleFile), true);
                if (is_array($sched)) {
                    sc_json(['success' => true, 'schedule' => $sched]);
                }
            }
            sc_json(['success' => true, 'schedule' => $config['schedule'] ?? ['days' => [], 'note' => '']]);
        }
        sc_json(['success' => true, 'customization' => $config]);
    }

    if ($method === 'PUT' || ($method === 'POST' && $action === 'save')) {
        sc_require_admin();
        $body = json_decode(file_get_contents('php://input'), true);
        if (!is_array($body)) {
            sc_json(['success' => false, 'error' => 'Некорректный JSON'], 400);
        }

        $current = sc_load($configFile);
        $incoming = isset($body['customization']) ? $body['customization'] : $body;
        $merged = sc_merge_deep($current, $incoming);

        if (!empty($body['schedule']) && is_array($body['schedule'])) {
            file_put_contents(
                $scheduleFile,
                json_encode($body['schedule'], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT),
                LOCK_EX
            );
            $merged['schedule'] = $body['schedule'];
        }

        if (!sc_save($configFile, $merged)) {
            sc_json(['success' => false, 'error' => 'Не удалось сохранить файл'], 500);
        }

        sc_json(['success' => true, 'customization' => $merged, 'message' => 'Настройки сохранены']);
    }

    if ($method === 'POST' && $action === 'reset') {
        sc_require_admin();
        $defaults = sc_defaults();
        foreach (['textOverrides', 'seo'] as $key) {
            if (isset($defaults[$key])) {
                $defaults[$key] = ['ru' => [], 'en' => [], 'be' => []];
            }
        }
        $defaults['contacts'] = ['blocks' => []];
        $defaults['content'] = ['news' => null, 'about' => null, 'prices' => null, 'contacts' => null];
        sc_save($configFile, $defaults);
        sc_json(['success' => true, 'customization' => $defaults, 'message' => 'Сброшено к значениям по умолчанию']);
    }

    sc_json(['success' => false, 'error' => 'Метод не поддерживается'], 405);
} catch (Throwable $e) {
    sc_json(['success' => false, 'error' => $e->getMessage()], 500);
}
