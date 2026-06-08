-- База данных для Горецкой ДЮСШ
-- SQLite Schema

-- Включение внешних ключей
PRAGMA foreign_keys = ON;

-- Таблица пользователей (администраторы)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100),
    phone VARCHAR(40),
    role VARCHAR(20) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица категорий новостей
CREATE TABLE IF NOT EXISTS news_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#2563eb',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица новостей
CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category_id INTEGER,
    image_url VARCHAR(255),
    status VARCHAR(20) DEFAULT 'published', -- published, draft, archived
    view_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT 0,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES news_categories(id) ON DELETE SET NULL
);

-- Таблица категорий услуг
CREATE TABLE IF NOT EXISTS service_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица услуг
CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INTEGER,
    price DECIMAL(10, 2),
    duration_minutes INTEGER,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE SET NULL
);

-- Таблица галереи (альбомы)
CREATE TABLE IF NOT EXISTS gallery_albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    cover_image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT 1,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица фотографий
CREATE TABLE IF NOT EXISTS gallery_photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER,
    title VARCHAR(200),
    description TEXT,
    image_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),
    file_size INTEGER,
    width INTEGER,
    height INTEGER,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (album_id) REFERENCES gallery_albums(id) ON DELETE CASCADE
);

-- Таблица контактной информации
CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type VARCHAR(50) NOT NULL, -- main, phone, email, address, schedule
    title VARCHAR(100),
    content TEXT NOT NULL,
    icon VARCHAR(50),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица руководства
CREATE TABLE IF NOT EXISTS management (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    photo_url VARCHAR(255),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица банковских реквизитов
CREATE TABLE IF NOT EXISTS bank_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    beneficiary_name VARCHAR(100) NOT NULL,
    unp VARCHAR(12),
    okpo VARCHAR(10),
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица настроек сайта
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key VARCHAR(50) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    type VARCHAR(20) DEFAULT 'text', -- text, number, boolean, json
    is_public BOOLEAN DEFAULT 0, -- доступно для публичного просмотра
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица логов действий администратора
CREATE TABLE IF NOT EXISTS admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action VARCHAR(50) NOT NULL, -- create, update, delete, login, logout
    entity_type VARCHAR(50), -- news, services, photos, etc.
    entity_id INTEGER,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Таблица статистики посещений
CREATE TABLE IF NOT EXISTS visit_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    page_views INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    referrer VARCHAR(255),
    user_agent TEXT,
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица популярных страниц
CREATE TABLE IF NOT EXISTS popular_pages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    page_url VARCHAR(255) NOT NULL,
    page_title VARCHAR(200),
    view_count INTEGER DEFAULT 0,
    last_visited DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category_id);
CREATE INDEX IF NOT EXISTS idx_news_status ON news(status);
CREATE INDEX IF NOT EXISTS idx_news_published_at ON news(published_at);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);
CREATE INDEX IF NOT EXISTS idx_gallery_album ON gallery_photos(album_id);
CREATE INDEX IF NOT EXISTS idx_contacts_type ON contacts(type);
CREATE INDEX IF NOT EXISTS idx_management_active ON management(is_active);
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_admin_logs_user ON admin_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_visit_stats_date ON visit_stats(date);
CREATE INDEX IF NOT EXISTS idx_popular_pages_url ON popular_pages(page_url);

-- Триггеры для обновления updated_at
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
    AFTER UPDATE ON users 
    FOR EACH ROW 
    BEGIN 
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_news_updated_at 
    AFTER UPDATE ON news 
    FOR EACH ROW 
    BEGIN 
        UPDATE news SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_services_updated_at 
    AFTER UPDATE ON services 
    FOR EACH ROW 
    BEGIN 
        UPDATE services SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_contacts_updated_at 
    AFTER UPDATE ON contacts 
    FOR EACH ROW 
    BEGIN 
        UPDATE contacts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_management_updated_at 
    AFTER UPDATE ON management 
    FOR EACH ROW 
    BEGIN 
        UPDATE management SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_bank_details_updated_at 
    AFTER UPDATE ON bank_details 
    FOR EACH ROW 
    BEGIN 
        UPDATE bank_details SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_settings_updated_at 
    AFTER UPDATE ON settings 
    FOR EACH ROW 
    BEGIN 
        UPDATE settings SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_popular_pages_updated_at 
    AFTER UPDATE ON popular_pages 
    FOR EACH ROW 
    BEGIN 
        UPDATE popular_pages SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Таблица изображений о нас
CREATE TABLE IF NOT EXISTS about_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    size INTEGER NOT NULL,
    type TEXT NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица изображений галереи
CREATE TABLE IF NOT EXISTS gallery_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    size INTEGER NOT NULL,
    type TEXT NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Таблица фона главного экрана
CREATE TABLE IF NOT EXISTS hero_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    size INTEGER NOT NULL,
    type TEXT NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для таблиц изображений
CREATE INDEX IF NOT EXISTS idx_about_images_upload_date ON about_images(upload_date);
CREATE INDEX IF NOT EXISTS idx_gallery_images_upload_date ON gallery_images(upload_date);
CREATE INDEX IF NOT EXISTS idx_hero_images_upload_date ON hero_images(upload_date);

-- Таблица онлайн-бронирований
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    email VARCHAR(120),
    facility VARCHAR(40) NOT NULL,
    facility_label VARCHAR(100) NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    people_count INTEGER NOT NULL DEFAULT 1,
    comment TEXT,
    status VARCHAR(20) DEFAULT 'confirmed',
    ip_address VARCHAR(45),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bookings_facility_date ON bookings(facility, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date_time ON bookings(booking_date, start_time);

INSERT OR IGNORE INTO settings (key, value, description, type, is_public)
VALUES ('max_booking_users', '200', 'Максимум зарегистрированных пользователей для онлайн-бронирования', 'number', 0);
