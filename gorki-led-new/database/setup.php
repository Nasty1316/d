<?php
/**
 * Установочный скрипт для базы данных
 * Горецкая ДЮСШ
 */

header('Content-Type: text/html; charset=utf-8');

require_once 'Database.php';

?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Установка базы данных - Горецкая ДЮСШ</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 3rem;
            max-width: 800px;
            width: 100%;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .logo {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .logo i {
            font-size: 3rem;
            color: #2563eb;
        }
        
        .logo h1 {
            font-size: 2rem;
            font-weight: 700;
            color: #1e293b;
        }
        
        .subtitle {
            color: #64748b;
            font-size: 1rem;
            margin-bottom: 2rem;
        }
        
        .status {
            padding: 1rem;
            border-radius: 10px;
            margin-bottom: 2rem;
        }
        
        .status.success {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #16a34a;
        }
        
        .status.error {
            background: #fef2f2;
            border: 1px solid #fecaca;
            color: #dc2626;
        }
        
        .status.info {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1e40af;
        }
        
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, #2563eb, #1e40af);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        
        .btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
            transform: none;
        }
        
        .btn.secondary {
            background: #64748b;
        }
        
        .btn.secondary:hover {
            box-shadow: 0 4px 12px rgba(100, 116, 139, 0.3);
        }
        
        .progress {
            background: #f1f5f9;
            border-radius: 10px;
            height: 8px;
            overflow: hidden;
            margin: 1rem 0;
        }
        
        .progress-bar {
            height: 100%;
            background: linear-gradient(135deg, #2563eb, #1e40af);
            width: 0%;
            transition: width 0.3s ease;
        }
        
        .log {
            background: #1e293b;
            color: #e2e8f0;
            padding: 1rem;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            max-height: 300px;
            overflow-y: auto;
            margin-top: 1rem;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
        }
        
        .stat-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2rem;
            font-weight: 700;
            color: #2563eb;
        }
        
        .stat-label {
            color: #64748b;
            font-size: 0.875rem;
        }
        
        .actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            margin-top: 2rem;
            flex-wrap: wrap;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <i class="fas fa-hockey-sticks"></i>
                <h1>Установка базы данных</h1>
            </div>
            <p class="subtitle">Горецкая детско-юношеская спортивная школа</p>
        </div>
        
        <div id="status" class="status info">
            <i class="fas fa-info-circle"></i>
            <span>Готов к установке базы данных SQLite</span>
        </div>
        
        <div class="actions">
            <button id="installBtn" class="btn" onclick="installDatabase()">
                <i class="fas fa-database"></i>
                Установить базу данных
            </button>
            <button id="resetBtn" class="btn secondary" onclick="resetDatabase()">
                <i class="fas fa-redo"></i>
                Сбросить базу данных
            </button>
            <a href="../index.html" class="btn secondary">
                <i class="fas fa-home"></i>
                На сайт
            </a>
        </div>
        
        <div id="progressContainer" style="display: none;">
            <div class="progress">
                <div id="progressBar" class="progress-bar"></div>
            </div>
            <div id="progressText">0%</div>
        </div>
        
        <div id="logContainer" style="display: none;">
            <h3>Лог установки:</h3>
            <div id="log" class="log"></div>
        </div>
        
        <div id="statsContainer" style="display: none;">
            <h3>Статистика базы данных:</h3>
            <div id="stats" class="stats"></div>
        </div>
    </div>

    <script>
        function updateStatus(message, type = 'info') {
            const status = document.getElementById('status');
            status.className = `status ${type}`;
            status.innerHTML = `
                <i class="fas fa-${getIcon(type)}"></i>
                <span>${message}</span>
            `;
        }
        
        function getIcon(type) {
            const icons = {
                'success': 'check-circle',
                'error': 'exclamation-circle',
                'info': 'info-circle',
                'warning': 'exclamation-triangle'
            };
            return icons[type] || 'info-circle';
        }
        
        function updateProgress(percent, text = '') {
            const progressBar = document.getElementById('progressBar');
            const progressText = document.getElementById('progressText');
            const progressContainer = document.getElementById('progressContainer');
            
            progressContainer.style.display = 'block';
            progressBar.style.width = percent + '%';
            progressText.textContent = percent + '% ' + text;
        }
        
        function addLog(message) {
            const log = document.getElementById('log');
            const logContainer = document.getElementById('logContainer');
            const timestamp = new Date().toLocaleTimeString();
            
            logContainer.style.display = 'block';
            log.innerHTML += `[${timestamp}] ${message}\n`;
            log.scrollTop = log.scrollHeight;
        }
        
        function showStats(stats) {
            const statsContainer = document.getElementById('statsContainer');
            const statsDiv = document.getElementById('stats');
            
            statsContainer.style.display = 'block';
            
            let html = '';
            for (const [key, value] of Object.entries(stats)) {
                if (typeof value === 'object') {
                    continue;
                }
                
                const label = getStatLabel(key);
                html += `
                    <div class="stat-card">
                        <div class="stat-number">${value}</div>
                        <div class="stat-label">${label}</div>
                    </div>
                `;
            }
            
            statsDiv.innerHTML = html;
        }
        
        function getStatLabel(key) {
            const labels = {
                'size_formatted': 'Размер БД',
                'total': 'Всего новостей',
                'published': 'Опубликовано',
                'draft': 'Черновики',
                'archived': 'В архиве',
                'featured': 'Избранные',
                'total_services': 'Всего услуг',
                'active_services': 'Активные',
                'inactive_services': 'Неактивные',
                'total_albums': 'Всего альбомов',
                'active_albums': 'Активные',
                'total_photos': 'Всего фото',
                'active_photos': 'Активные'
            };
            return labels[key] || key;
        }
        
        function setButtonsState(installing = false) {
            const installBtn = document.getElementById('installBtn');
            const resetBtn = document.getElementById('resetBtn');
            
            installBtn.disabled = installing;
            resetBtn.disabled = installing;
            
            if (installing) {
                installBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Установка...';
            } else {
                installBtn.innerHTML = '<i class="fas fa-database"></i> Установить базу данных';
            }
        }
        
        async function installDatabase() {
            setButtonsState(true);
            updateStatus('Начинаю установку базы данных...', 'info');
            updateProgress(0, 'Подготовка...');
            addLog('Начало установки базы данных');
            
            try {
                updateProgress(10, 'Создание структуры...');
                addLog('Создание структуры таблиц');
                
                const response = await fetch('setup.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ action: 'install' })
                });
                
                updateProgress(50, 'Заполнение данными...');
                addLog('Заполнение начальными данными');
                
                const result = await response.json();
                
                updateProgress(100, 'Завершено!');
                addLog('Установка завершена успешно');
                
                if (result.success) {
                    updateStatus('База данных успешно установлена!', 'success');
                    showStats(result.stats);
                } else {
                    updateStatus('Ошибка при установке: ' + result.error, 'error');
                    addLog('Ошибка: ' + result.error);
                }
                
            } catch (error) {
                updateStatus('Ошибка соединения: ' + error.message, 'error');
                addLog('Ошибка соединения: ' + error.message);
            } finally {
                setButtonsState(false);
            }
        }
        
        async function resetDatabase() {
            if (!confirm('Вы уверены, что хотите сбросить базу данных? Все данные будут удалены!')) {
                return;
            }
            
            setButtonsState(true);
            updateStatus('Сброс базы данных...', 'warning');
            updateProgress(0, 'Удаление...');
            addLog('Начало сброса базы данных');
            
            try {
                const response = await fetch('setup.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ action: 'reset' })
                });
                
                updateProgress(50, 'Создание заново...');
                addLog('Создание новой базы данных');
                
                const result = await response.json();
                
                updateProgress(100, 'Завершено!');
                addLog('Сброс завершен');
                
                if (result.success) {
                    updateStatus('База данных успешно сброшена!', 'success');
                    showStats(result.stats);
                } else {
                    updateStatus('Ошибка при сбросе: ' + result.error, 'error');
                    addLog('Ошибка: ' + result.error);
                }
                
            } catch (error) {
                updateStatus('Ошибка соединения: ' + error.message, 'error');
                addLog('Ошибка соединения: ' + error.message);
            } finally {
                setButtonsState(false);
            }
        }
        
        // Проверка состояния при загрузке
        window.addEventListener('load', async function() {
            try {
                const response = await fetch('setup.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ action: 'check' })
                });
                
                const result = await response.json();
                
                if (result.exists) {
                    updateStatus('База данных уже установлена', 'success');
                    showStats(result.stats);
                    document.getElementById('installBtn').textContent = 'Переустановить базу данных';
                }
                
            } catch (error) {
                updateStatus('Ошибка проверки состояния: ' + error.message, 'error');
            }
        });
    </script>
</body>
</html>

<?php
// Обработка AJAX запросов
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';
    
    try {
        $db = Database::getInstance();
        
        switch ($action) {
            case 'install':
                installDatabase($db);
                break;
            case 'reset':
                resetDatabase($db);
                break;
            case 'check':
                checkDatabase($db);
                break;
            default:
                throw new Exception('Неизвестное действие');
        }
    } catch (Exception $e) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}

function installDatabase($db) {
    // Удаление существующей базы данных если есть
    $dbPath = __DIR__ . '/gorki_led.db';
    if (file_exists($dbPath)) {
        unlink($dbPath);
    }
    
    // Создание новой базы данных
    $db = Database::getInstance();
    
    // Получение статистики
    $stats = getDatabaseStats($db);
    
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'stats' => $stats]);
}

function resetDatabase($db) {
    // Очистка всех таблиц
    $tables = ['users', 'news', 'news_categories', 'services', 'service_categories', 
              'gallery_albums', 'gallery_photos', 'contacts', 'management', 
              'bank_details', 'settings', 'admin_logs', 'visit_stats', 'popular_pages'];
    
    foreach ($tables as $table) {
        if ($db->tableExists($table)) {
            $db->truncate($table);
        }
    }
    
    // Повторное заполнение начальными данными
    $seed = file_get_contents(__DIR__ . '/seed.sql');
    $db->query($seed);
    
    $stats = getDatabaseStats($db);
    
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'stats' => $stats]);
}

function checkDatabase($db) {
    $dbPath = __DIR__ . '/gorki_led.db';
    $exists = file_exists($dbPath);
    
    $stats = [];
    if ($exists) {
        $stats = getDatabaseStats($db);
    }
    
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'exists' => $exists, 'stats' => $stats]);
}

function getDatabaseStats($db) {
    $stats = [];
    
    // Размер базы данных
    $stats['size_formatted'] = formatBytes($db->getDatabaseSize());
    
    // Новости
    $stats['total'] = $db->count('news');
    $stats['published'] = $db->count('news', 'status = "published"');
    $stats['draft'] = $db->count('news', 'status = "draft"');
    $stats['archived'] = $db->count('news', 'status = "archived"');
    $stats['featured'] = $db->count('news', 'is_featured = 1');
    
    // Услуги
    $stats['total_services'] = $db->count('services');
    $stats['active_services'] = $db->count('services', 'is_active = 1');
    $stats['inactive_services'] = $db->count('services', 'is_active = 0');
    
    // Галерея
    $stats['total_albums'] = $db->count('gallery_albums');
    $stats['active_albums'] = $db->count('gallery_albums', 'is_active = 1');
    $stats['total_photos'] = $db->count('gallery_photos');
    $stats['active_photos'] = $db->count('gallery_photos', 'is_active = 1');
    
    return $stats;
}

function formatBytes($bytes, $precision = 2) {
    if ($bytes === 0) return '0 B';
    
    $units = ['B', 'KB', 'MB', 'GB'];
    
    for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
        $bytes /= 1024;
    }
    
    return round($bytes, $precision) . ' ' . $units[$i];
}
?>
