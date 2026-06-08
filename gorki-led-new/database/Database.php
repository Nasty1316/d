<?php
/**
 * Класс для работы с базой данных SQLite
 * Горецкая ДЮСШ
 */

class Database {
    private static $instance = null;
    private $pdo;
    private $dbPath;
    
    /**
     * Приватный конструктор для реализации Singleton
     */
    private function __construct() {
        $this->dbPath = __DIR__ . '/gorki_led.db';
        $this->connect();
    }
    
    /**
     * Получение экземпляра класса (Singleton)
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Подключение к базе данных
     */
    private function connect() {
        try {
            // Проверка существования базы данных
            if (!file_exists($this->dbPath)) {
                $this->createDatabase();
            }
            
            $this->pdo = new PDO('sqlite:' . $this->dbPath);
            $this->pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Включение внешних ключей
            $this->pdo->exec("PRAGMA foreign_keys = ON");

            $this->runMigrations();
            
        } catch (PDOException $e) {
            die("Ошибка подключения к базе данных: " . $e->getMessage());
        }
    }

    /**
     * Применение миграций для существующих баз данных
     */
    private function runMigrations() {
        $migrationFile = __DIR__ . '/migrate_bookings.sql';
        if (!file_exists($migrationFile)) {
            return;
        }
        if (!$this->tableExists('bookings')) {
            $sql = file_get_contents($migrationFile);
            $this->pdo->exec($sql);
        }
        $cols = $this->fetchAll("PRAGMA table_info(users)");
        $hasPhone = false;
        foreach ($cols as $col) {
            if ($col['name'] === 'phone') {
                $hasPhone = true;
                break;
            }
        }
        if (!$hasPhone) {
            $this->query('ALTER TABLE users ADD COLUMN phone VARCHAR(40)');
        }
    }
    
    /**
     * Создание базы данных и заполнение начальными данными
     */
    private function createDatabase() {
        try {
            // Создание файла базы данных
            $pdo = new PDO('sqlite:' . $this->dbPath);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Чтение и выполнение схемы
            $schema = file_get_contents(__DIR__ . '/schema.sql');
            $pdo->exec($schema);
            
            // Чтение и выполнение начальных данных
            $seed = file_get_contents(__DIR__ . '/seed.sql');
            $pdo->exec($seed);
            
            // Установка прав доступа к файлу
            chmod($this->dbPath, 0666);
            
        } catch (PDOException $e) {
            die("Ошибка создания базы данных: " . $e->getMessage());
        }
    }
    
    /**
     * Выполнение SQL запроса с параметрами
     */
    public function query($sql, $params = []) {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            error_log("Ошибка SQL запроса: " . $e->getMessage());
            error_log("SQL: " . $sql);
            error_log("Params: " . json_encode($params));
            throw new Exception("Ошибка выполнения запроса к базе данных");
        }
    }
    
    /**
     * Получение одной записи
     */
    public function fetch($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }
    
    /**
     * Получение всех записей
     */
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    /**
     * Получение одной записи по ID
     */
    public function findById($table, $id, $columns = '*') {
        $sql = "SELECT {$columns} FROM {$table} WHERE id = :id";
        return $this->fetch($sql, ['id' => $id]);
    }
    
    /**
     * Вставка записи
     */
    public function insert($table, $data) {
        $columns = implode(', ', array_keys($data));
        $placeholders = ':' . implode(', :', array_keys($data));
        $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
        
        $this->query($sql, $data);
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Обновление записи
     */
    public function update($table, $data, $where, $whereParams = []) {
        $setClause = [];
        $params = [];
        
        foreach ($data as $key => $value) {
            $setClause[] = "{$key} = :{$key}";
            $params[$key] = $value;
        }
        
        $setClause = implode(', ', $setClause);
        $sql = "UPDATE {$table} SET {$setClause} WHERE {$where}";
        
        $params = array_merge($params, $whereParams);
        $stmt = $this->query($sql, $params);
        
        return $stmt->rowCount();
    }
    
    /**
     * Удаление записи
     */
    public function delete($table, $where, $params = []) {
        $sql = "DELETE FROM {$table} WHERE {$where}";
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }
    
    /**
     * Подсчет записей
     */
    public function count($table, $where = '1=1', $params = []) {
        $sql = "SELECT COUNT(*) as count FROM {$table} WHERE {$where}";
        $result = $this->fetch($sql, $params);
        return (int)$result['count'];
    }
    
    /**
     * Начало транзакции
     */
    public function beginTransaction() {
        return $this->pdo->beginTransaction();
    }
    
    /**
     * Подтверждение транзакции
     */
    public function commit() {
        return $this->pdo->commit();
    }
    
    /**
     * Откат транзакции
     */
    public function rollback() {
        return $this->pdo->rollback();
    }
    
    /**
     * Получение последнего вставленного ID
     */
    public function lastInsertId() {
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Проверка существования таблицы
     */
    public function tableExists($table) {
        $sql = "SELECT name FROM sqlite_master WHERE type='table' AND name=:table";
        $result = $this->fetch($sql, ['table' => $table]);
        return !empty($result);
    }
    
    /**
     * Получение структуры таблицы
     */
    public function getTableStructure($table) {
        $sql = "PRAGMA table_info({$table})";
        return $this->fetchAll($sql);
    }
    
    /**
     * Очистка таблицы
     */
    public function truncate($table) {
        $sql = "DELETE FROM {$table}";
        $this->query($sql);
        
        // Сброс автоинкремента
        $sql = "DELETE FROM sqlite_sequence WHERE name='{$table}'";
        $this->query($sql);
    }
    
    /**
     * Получение размера базы данных
     */
    public function getDatabaseSize() {
        if (file_exists($this->dbPath)) {
            return filesize($this->dbPath);
        }
        return 0;
    }
    
    /**
     * Создание резервной копии
     */
    public function backup($backupPath = null) {
        if ($backupPath === null) {
            $backupPath = __DIR__ . '/backup_' . date('Y-m-d_H-i-s') . '.db';
        }
        
        try {
            $source = new PDO('sqlite:' . $this->dbPath);
            $backup = new PDO('sqlite:' . $backupPath);
            
            // Копирование структуры и данных
            $tables = $this->fetchAll("SELECT name FROM sqlite_master WHERE type='table'");
            
            foreach ($tables as $table) {
                $tableName = $table['name'];
                
                // Копирование структуры
                $schema = $source->query("SELECT sql FROM sqlite_master WHERE type='table' AND name='{$tableName}'")->fetchColumn();
                $backup->exec($schema);
                
                // Копирование данных
                $data = $source->query("SELECT * FROM {$tableName}")->fetchAll(PDO::FETCH_ASSOC);
                
                if (!empty($data)) {
                    $columns = array_keys($data[0]);
                    $placeholders = ':' . implode(', :', $columns);
                    $sql = "INSERT INTO {$tableName} (" . implode(', ', $columns) . ") VALUES ({$placeholders})";
                    $stmt = $backup->prepare($sql);
                    
                    foreach ($data as $row) {
                        $stmt->execute($row);
                    }
                }
            }
            
            return $backupPath;
            
        } catch (Exception $e) {
            throw new Exception("Ошибка создания резервной копии: " . $e->getMessage());
        }
    }
    
    /**
     * Восстановление из резервной копии
     */
    public function restore($backupPath) {
        if (!file_exists($backupPath)) {
            throw new Exception("Файл резервной копии не найден");
        }
        
        // Закрытие текущего подключения
        $this->pdo = null;
        
        // Замена файла базы данных
        if (!copy($backupPath, $this->dbPath)) {
            throw new Exception("Ошибка восстановления базы данных");
        }
        
        // Переподключение
        $this->connect();
        
        return true;
    }
    
    /**
     * Оптимизация базы данных
     */
    public function optimize() {
        $this->query("VACUUM");
        $this->query("ANALYZE");
    }
    
    /**
     * Получение статистики базы данных
     */
    public function getStats() {
        $stats = [];
        
        // Размер базы данных
        $stats['size'] = $this->getDatabaseSize();
        $stats['size_formatted'] = $this->formatBytes($stats['size']);
        
        // Количество записей в основных таблицах
        $tables = ['users', 'news', 'services', 'gallery_photos', 'contacts', 'management'];
        
        foreach ($tables as $table) {
            if ($this->tableExists($table)) {
                $stats['tables'][$table] = $this->count($table);
            }
        }
        
        return $stats;
    }
    
    /**
     * Форматирование байтов
     */
    private function formatBytes($bytes, $precision = 2) {
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
    
    /**
     * Закрытие подключения
     */
    public function close() {
        $this->pdo = null;
    }
    
    /**
     * Предотвращение клонирования
     */
    private function __clone() {}
    
    /**
     * Предотвращение десериализации
     */
    public function __wakeup() {
        throw new Exception("Нельзя десериализовать Singleton");
    }
}
