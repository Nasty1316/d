# База данных SQLite - Горецкая ДЮСШ

Полнофункциональная база данных SQLite для управления контентом сайта спортивной школы.

## 📋 Содержание

- [Структура базы данных](#структура-базы-данных)
- [Установка](#установка)
- [API](#api)
- [Примеры использования](#примеры-использования)
- [Резервное копирование](#резервное-копирование)
- [Оптимизация](#оптимизация)

## 🏗️ Структура базы данных

### 👥 Пользователи и безопасность

#### `users` - Пользователи системы
- `id` - Уникальный идентификатор
- `username` - Имя пользователя (уникальное)
- `password_hash` - Хеш пароля
- `email` - Email пользователя
- `full_name` - Полное имя
- `role` - Роль пользователя (admin, editor, viewer)
- `is_active` - Активность аккаунта
- `created_at`, `updated_at` - Временные метки

#### `admin_logs` - Логи действий администраторов
- `id` - Уникальный идентификатор
- `user_id` - ID пользователя
- `action` - Тип действия (create, update, delete, login, logout)
- `entity_type` - Тип сущности (news, services, photos)
- `entity_id` - ID сущности
- `old_values`, `new_values` - JSON данные до/после изменения
- `ip_address` - IP адрес
- `user_agent` - User Agent браузера
- `created_at` - Время действия

### 📰 Контент

#### `news_categories` - Категории новостей
- `id` - Уникальный идентификатор
- `name` - Название категории
- `slug` - URL-дружественное название
- `description` - Описание
- `color` - Цвет категории (hex)
- `created_at` - Время создания

#### `news` - Новости
- `id` - Уникальный идентификатор
- `title` - Заголовок
- `slug` - URL-дружественное название
- `content` - Содержание
- `excerpt` - Краткое описание
- `category_id` - ID категории
- `image_url` - URL изображения
- `status` - Статус (published, draft, archived)
- `view_count` - Количество просмотров
- `is_featured` - Избранная новость
- `published_at` - Время публикации
- `created_at`, `updated_at` - Временные метки

### 💼 Услуги

#### `service_categories` - Категории услуг
- `id` - Уникальный идентификатор
- `name` - Название категории
- `slug` - URL-дружественное название
- `description` - Описание
- `icon` - Иконка (Font Awesome)
- `order_index` - Порядок сортировки
- `is_active` - Активность категории
- `created_at` - Время создания

#### `services` - Услуги
- `id` - Уникальный идентификатор
- `name` - Название услуги
- `description` - Описание
- `category_id` - ID категории
- `price` - Цена
- `duration_minutes` - Длительность в минутах
- `image_url` - URL изображения
- `is_active` - Активность услуги
- `order_index` - Порядок сортировки
- `created_at`, `updated_at` - Временные метки

### 🖼️ Галерея

#### `gallery_albums` - Альбомы галереи
- `id` - Уникальный идентификатор
- `name` - Название альбома
- `slug` - URL-дружественное название
- `description` - Описание
- `cover_image_url` - URL обложки
- `is_active` - Активность альбома
- `order_index` - Порядок сортировки
- `created_at` - Время создания

#### `gallery_photos` - Фотографии
- `id` - Уникальный идентификатор
- `album_id` - ID альбома
- `title` - Название фотографии
- `description` - Описание
- `image_url` - URL изображения
- `thumbnail_url` - URL миниатюры
- `file_size` - Размер файла
- `width`, `height` - Размеры изображения
- `order_index` - Порядок сортировки
- `is_active` - Активность фотографии
- `created_at` - Время загрузки

### 📞 Контакты и информация

#### `contacts` - Контактная информация
- `id` - Уникальный идентификатор
- `type` - Тип информации (main, phone, email, address, schedule)
- `title` - Заголовок
- `content` - Содержание
- `icon` - Иконка
- `order_index` - Порядок сортировки
- `is_active` - Активность
- `created_at`, `updated_at` - Временные метки

#### `management` - Руководство
- `id` - Уникальный идентификатор
- `full_name` - Полное имя
- `position` - Должность
- `phone` - Телефон
- `email` - Email
- `photo_url` - URL фотографии
- `order_index` - Порядок сортировки
- `is_active` - Активность
- `created_at`, `updated_at` - Временные метки

#### `bank_details` - Банковские реквизиты
- `id` - Уникальный идентификатор
- `bank_name` - Название банка
- `account_number` - Номер счета
- `beneficiary_name` - Имя получателя
- `unp` - УНП
- `okpo` - ОКПО
- `description` - Описание
- `is_active` - Активность
- `created_at`, `updated_at` - Временные метки

### ⚙️ Настройки и статистика

#### `settings` - Настройки сайта
- `id` - Уникальный идентификатор
- `key` - Ключ настройки (уникальный)
- `value` - Значение
- `description` - Описание
- `type` - Тип значения (text, number, boolean, json)
- `is_public` - Доступно для публичного просмотра
- `created_at`, `updated_at` - Временные метки

#### `visit_stats` - Статистика посещений
- `id` - Уникальный идентификатор
- `date` - Дата
- `page_views` - Количество просмотров страниц
- `unique_visitors` - Уникальные посетители
- `referrer` - Источник перехода
- `user_agent` - User Agent
- `ip_address` - IP адрес
- `created_at` - Время записи

#### `popular_pages` - Популярные страницы
- `id` - Уникальный идентификатор
- `page_url` - URL страницы
- `page_title` - Заголовок страницы
- `view_count` - Количество просмотров
- `last_visited` - Последнее посещение
- `created_at`, `updated_at` - Временные метки

## 🚀 Установка

### Автоматическая установка

1. Откройте в браузере: `http://your-site.com/database/setup.php`
2. Нажмите кнопку "Установить базу данных"
3. Дождитесь завершения установки

### Ручная установка

1. Убедитесь, что PHP 7.4+ установлен
2. Скопируйте файлы базы данных в папку `database/`
3. Выполните команды:

```bash
# Создание базы данных
php -f database/schema.php

# Заполнение начальными данными
php -f database/seed.php
```

### Проверка установки

```bash
# Проверка структуры таблиц
sqlite3 database/gorki_led.db ".tables"

# Проверка данных
sqlite3 database/gorki_led.db "SELECT COUNT(*) FROM news;"
```

## 🔌 API

### Новости

#### Получение всех новостей
```http
GET /api/news.php
```

Параметры:
- `page` - Страница (по умолчанию: 1)
- `limit` - Количество на странице (по умолчанию: 10)
- `category` - Фильтр по категории
- `search` - Поиск по заголовку и содержанию
- `status` - Статус новостей (published, draft, archived)

#### Создание новости
```http
POST /api/news.php
Authorization: Bearer demo-token
Content-Type: application/json

{
    "title": "Заголовок новости",
    "content": "Содержание новости",
    "excerpt": "Краткое описание",
    "category_id": 1,
    "image_url": "/images/news/photo.jpg",
    "status": "published",
    "is_featured": 0
}
```

#### Обновление новости
```http
PUT /api/news.php?id=1
Authorization: Bearer demo-token
Content-Type: application/json

{
    "title": "Обновленный заголовок",
    "content": "Обновленное содержание"
}
```

#### Удаление новости
```http
DELETE /api/news.php?id=1
Authorization: Bearer demo-token
```

### Услуги

#### Получение всех услуг
```http
GET /api/services.php
```

Параметры:
- `category` - Фильтр по категории
- `active` - Активные услуги (1/0)

#### Создание услуги
```http
POST /api/services.php
Authorization: Bearer demo-token
Content-Type: application/json

{
    "name": "Название услуги",
    "description": "Описание услуги",
    "category_id": 1,
    "price": 25.50,
    "duration_minutes": 60,
    "is_active": 1
}
```

### Галерея

#### Получение фотографий
```http
GET /api/gallery.php
```

Параметры:
- `album` - Фильтр по альбому (slug)
- `page` - Страница
- `limit` - Количество на странице
- `active` - Активные фотографии (1/0)

#### Создание фотографии
```http
POST /api/gallery.php
Authorization: Bearer demo-token
Content-Type: application/json

{
    "album_id": 1,
    "title": "Название фото",
    "description": "Описание",
    "image_url": "/images/gallery/photo.jpg",
    "file_size": 1024000,
    "width": 1920,
    "height": 1080
}
```

#### Создание альбома
```http
POST /api/gallery.php?type=album
Authorization: Bearer demo-token
Content-Type: application/json

{
    "name": "Название альбома",
    "description": "Описание альбома",
    "cover_image_url": "/images/gallery/cover.jpg"
}
```

## 💻 Примеры использования

### PHP

```php
require_once 'database/Database.php';

$db = Database::getInstance();

// Получение всех новостей
$news = $db->fetchAll("SELECT * FROM news WHERE status = 'published' ORDER BY published_at DESC");

// Создание новости
$newsData = [
    'title' => 'Новая новость',
    'content' => 'Содержание новости',
    'status' => 'published'
];
$newsId = $db->insert('news', $newsData);

// Обновление новости
$db->update('news', ['title' => 'Обновленный заголовок'], 'id = :id', ['id' => $newsId]);

// Удаление новости
$db->delete('news', 'id = :id', ['id' => $newsId]);
```

### JavaScript

```javascript
// Получение новостей
async function getNews() {
    const response = await fetch('/api/news.php');
    const data = await response.json();
    console.log(data.data);
}

// Создание новости
async function createNews(newsData) {
    const response = await fetch('/api/news.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer demo-token'
        },
        body: JSON.stringify(newsData)
    });
    
    const result = await response.json();
    console.log(result);
}
```

## 💾 Резервное копирование

### Автоматическое резервирование

```php
$db = Database::getInstance();

// Создание резервной копии
$backupPath = $db->backup();
echo "Резервная копия создана: {$backupPath}";

// Восстановление из копии
$db->restore($backupPath);
echo "База данных восстановлена";
```

### Ручное резервирование

```bash
# Создание копии
cp database/gorki_led.db database/backup_$(date +%Y%m%d_%H%M%S).db

# Восстановление
cp database/backup_20230228_120000.db database/gorki_led.db
```

## ⚡ Оптимизация

### Автоматическая оптимизация

```php
$db = Database::getInstance();

// Оптимизация базы данных
$db->optimize();

// Получение статистики
$stats = $db->getStats();
echo "Размер БД: {$stats['size_formatted']}";
```

### Индексы

База данных включает следующие индексы для оптимизации:

- `idx_news_category` - для фильтрации новостей по категориям
- `idx_news_status` - для фильтрации по статусу
- `idx_services_category` - для фильтрации услуг
- `idx_gallery_album` - для получения фотографий альбома
- `idx_admin_logs_user` - для логов пользователя
- `idx_visit_stats_date` - для статистики посещений

### Рекомендации по производительности

1. **Регулярная оптимизация** - выполняйте `VACUUM` и `ANALYZE` еженедельно
2. **Мониторинг размера** - следите за размером базы данных
3. **Резервное копирование** - создавайте копии перед изменениями
4. **Очистка логов** - удаляйте старые записи в `admin_logs`

## 🔧 Настройка

### Конфигурация PHP

```ini
; php.ini
extension=pdo_sqlite
sqlite3.case_sensitive_like = 0
sqlite3.assoc_case = 0
```

### Права доступа

```bash
# Установка прав на папку базы данных
chmod 755 database/
chmod 666 database/gorki_led.db
```

## 🐛 Устранение неполадок

### Частые проблемы

#### 1. "Database is locked"
```bash
# Проверка процессов
lsof database/gorki_led.db

# Перезапуск веб-сервера
sudo systemctl restart apache2
```

#### 2. "Unable to open database"
```bash
# Проверка прав доступа
ls -la database/gorki_led.db

# Установка прав
chmod 666 database/gorki_led.db
```

#### 3. Медленная работа
```php
// Оптимизация
$db->optimize();

// Проверка индексов
$indexes = $db->fetchAll("PRAGMA index_list(news)");
```

## 📊 Мониторинг

### Статистика базы данных

```php
$db = Database::getInstance();
$stats = $db->getStats();

echo "Размер: {$stats['size_formatted']}\n";
echo "Новостей: {$stats['tables']['news']}\n";
echo "Услуг: {$stats['tables']['services']}\n";
```

### Логирование действий

```php
// Все действия автоматически логируются в admin_logs
$logs = $db->fetchAll("SELECT * FROM admin_logs ORDER BY created_at DESC LIMIT 100");
```

## 🔄 Обновление

### Обновление структуры

1. Создайте файл миграции `migration_v1.1.sql`
2. Добавьте новые таблицы или измените существующие
3. Выполните миграцию:

```php
$db->query(file_get_contents('migration_v1.1.sql'));
```

## 📝 Лицензия

Этот проект распространяется под лицензией MIT.

---

**Разработано для Горецкой ДЮСШ**  
*Версия 1.0.0*  
*Февраль 2026*
