-- Миграция: онлайн-бронирование и поля пользователей

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

-- Настройка лимита пользователей (если ещё нет)
INSERT OR IGNORE INTO settings (key, value, description, type, is_public)
VALUES ('max_booking_users', '200', 'Максимум зарегистрированных пользователей для онлайн-бронирования', 'number', 0);

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

-- Начальные данные для базы данных Горецкой ДЮСШ

-- Вставка администратора (пароль: admin123)
INSERT INTO users (username, password_hash, email, full_name, role) VALUES 
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO9G', 'admin@gorkiled.by', 'Администратор системы', 'admin');

-- Категории новостей
INSERT INTO news_categories (name, slug, description, color) VALUES 
('Спортивные события', 'sports-events', 'Новости о соревнованиях и турнирах', '#2563eb'),
('Объявления', 'announcements', 'Важные объявления для посетителей', '#f59e0b'),
('Ремонтные работы', 'maintenance', 'Информация о ремонтах и обновлениях', '#ef4444'),
('Достижения', 'achievements', 'Победы и достижения наших спортсменов', '#10b981');

-- Примеры новостей
INSERT INTO news (title, slug, content, excerpt, category_id, status, published_at) VALUES 
('Открытие нового хоккейного сезона', 'opening-hockey-season', 
'Начинается набор детей в хоккейную секцию Горецкой ДЮСШ. Приглашаем всех желающих возрастом от 6 до 16 лет. Тренировки проходят на современной ледовой арене под руководством опытных тренеров.', 
'Начинается набор детей в хоккейную секцию', 1, 'published', '2026-02-25 10:00:00'),
('Ремонт ледовой арены', 'ice-arena-maintenance', 
'Плановые работы по обновлению оборудования ледовой арены пройдут с 1 по 5 марта. В этот период доступ на арену будет ограничен.', 
'Плановые работы по обновлению оборудования', 2, 'published', '2026-02-22 14:30:00'),
('Наши спортсмены победили в областных соревнованиях', 'regional-victory', 
'Команда Горецкой ДЮСШ заняла первое место в областных соревнованиях по хоккею среди юношей до 14 лет.', 
'Победа в областных соревнованиях', 4, 'published', '2026-02-20 16:00:00');

-- Категории услуг
INSERT INTO service_categories (name, slug, description, icon, order_index) VALUES 
('Ледовая арена', 'ice-arena', 'Услуги на ледовой арене', 'fa-hockey-sticks', 1),
('Спортивный зал', 'sports-hall', 'Услуги в спортивном зале', 'fa-dumbbell', 2),
('Стадион', 'stadium', 'Услуги на стадионе', 'fa-futbol', 3),
('Фитнес и тренажерный зал', 'fitness', 'Фитнес услуги и тренажеры', 'fa-heartbeat', 4),
('Конный спорт', 'equestrian', 'Услуги конного спорта', 'fa-horse', 5),
('Сауна', 'sauna', 'Услуги сауны', 'fa-hot-tub', 6),
('Бильярд', 'billiards', 'Бильярдные услуги', 'fa-circle', 7),
('Настольный теннис', 'table-tennis', 'Настольный теннис', 'fa-table-tennis', 8);

-- Услуги
INSERT INTO services (name, description, category_id, price, duration_minutes) VALUES 
('Массовое катание (1 час)', 'Катание для всех желателей', 1, 15.00, 60),
('Аренда ледового поля (1 час)', 'Аренда всего ледового поля', 1, 120.00, 60),
('Обучение хоккею (индивидуально)', 'Индивидуальные тренировки по хоккею', 1, 45.00, 60),
('Аренда спортивного зала (1 час)', 'Аренда всего спортивного зала', 2, 25.00, 60),
('Групповые занятия в зале', 'Групповые тренировки', 2, 10.00, 90),
('Аренда стадиона (1 час)', 'Аренда футбольного поля', 3, 35.00, 60),
('Тренировка по футболу', 'Групповые тренировки по футболу', 3, 12.00, 90),
('Посещение тренажерного зала (день)', 'Разовое посещение тренажерного зала', 4, 8.00, 120),
('Абонемент на месяц (фитнес)', 'Безлимитное посещение фитнес-зона', 4, 85.00, 0),
('Прогулка на лошади (30 минут)', 'Прогулка верхом для начинающих', 5, 20.00, 30),
('Урок верховой езды (1 час)', 'Индивидуальный урок с инструктором', 5, 35.00, 60),
('Посещение сауны (1 час)', 'Посещение сауны', 6, 12.00, 60),
('Аренда бильярдного стола (1 час)', 'Аренда стола для игры в бильярд', 7, 15.00, 60),
('Игровое время настольный теннис (1 час)', 'Аренда стола для настольного тенниса', 8, 8.00, 60);

-- Альбомы галереи
INSERT INTO gallery_albums (name, slug, description, order_index) VALUES 
('Соревнования', 'competitions', 'Фотографии с соревнований и турниров', 1),
('Тренировки', 'training', 'Фотографии тренировочного процесса', 2),
('Мероприятия', 'events', 'Фотографии с различных мероприятий', 3),
('Объекты', 'facilities', 'Фотографии наших спортивных объектов', 4),
('Команда', 'team', 'Фотографии наших спортсменов и тренеров', 5);

-- Примеры фотографий
INSERT INTO gallery_photos (album_id, title, description, image_url, order_index) VALUES 
(1, 'Хоккейный матч', 'Финальный матч хоккейного турнира', '/images/gallery/hockey-match-1.jpg', 1),
(1, 'Награждение победителей', 'Церемония награждения', '/images/gallery/awards-1.jpg', 2),
(2, 'Тренировка по футболу', 'Утренняя тренировка футбольной команды', '/images/gallery/football-training-1.jpg', 1),
(3, 'Открытие сезона', 'Торжественное открытие спортивного сезона', '/images/gallery/season-opening-1.jpg', 1),
(4, 'Ледовая арена', 'Современная ледовая арена', '/images/gallery/ice-arena-1.jpg', 1),
(5, 'Команда хоккеистов', 'Наша юношеская команда по хоккею', '/images/gallery/hockey-team-1.jpg', 1);

-- Контактная информация
INSERT INTO contacts (type, title, content, icon, order_index) VALUES 
('main', 'Основная информация', 'Государственное учебно-спортивное учреждение "Горецкая детско-юношеская спортивная школа"', 'fa-info-circle', 1),
('address', 'Адрес', '213410, ул. Вокзальная, 23, г. Горки, Могилевская обл.', 'fa-map-marker-alt', 2),
('phone', 'Телефон', '+375 (2233) 79998', 'fa-phone', 3),
('email', 'Email', 'info@gorkiled.by', 'fa-envelope', 4),
('schedule', 'График работы', 'Понедельник-пятница: 8:00-17:00\nСуббота: 9:00-15:00\nВоскресенье: выходной', 'fa-clock', 5);

-- Руководство
INSERT INTO management (full_name, position, phone, email, order_index) VALUES 
('Королёв Владимир Иванович', 'Директор', '8(02233)79998', 'director@gorkiled.by', 1),
('Рудько Николай Николаевич', 'Заместитель директора по основной деятельности', '8(02233)70146', 'deputy@gorkiled.by', 2),
('Петров Сергей Александрович', 'Главный бухгалтер', '8(02233)70147', 'accountant@gorkiled.by', 3);

-- Банковские реквизиты
INSERT INTO bank_details (bank_name, account_number, beneficiary_name, unp, okpo, description) VALUES 
('Филиал №519 АСБ "Беларусбанк"', 'BY55 AKBB 3014 3010 0000 1234 5678', 'ГУСУ "Горецкая ДЮСШ"', '190123456789', '375123456', 'Расчетный счет для оплаты услуг');

-- Настройки сайта
INSERT INTO settings (key, value, description, type, is_public) VALUES 
('site_title', 'Горецкая ДЮСШ', 'Название сайта', 'text', 1),
('site_description', 'Государственное учебно-спортивное учреждение "Горецкая детско-юношеская спортивная школа"', 'Описание сайта', 'text', 1),
('admin_email', 'admin@gorkiled.by', 'Email администратора', 'text', 0),
('contact_email', 'info@gorkiled.by', 'Контактный email', 'text', 1),
('phone', '+375 (2233) 79998', 'Основной телефон', 'text', 1),
('address', 'ул. Вокзальная, 23, г. Горки', 'Адрес', 'text', 1),
('working_hours', '8:00-17:00', 'Часы работы', 'text', 1),
('social_links', '{"facebook": "#", "instagram": "#", "youtube": "#"}', 'Ссылки на социальные сети', 'json', 1),
('analytics_code', '', 'Код аналитики', 'text', 0),
('maintenance_mode', 'false', 'Режим обслуживания', 'boolean', 0);

-- Начальная статистика
INSERT INTO visit_stats (date, page_views, unique_visitors) VALUES 
('2026-02-20', 145, 89),
('2026-02-21', 167, 102),
('2026-02-22', 189, 115),
('2026-02-23', 201, 128),
('2026-02-24', 178, 109),
('2026-02-25', 234, 145),
('2026-02-26', 198, 121),
('2026-02-27', 156, 98),
('2026-02-28', 189, 116);

-- Популярные страницы
INSERT INTO popular_pages (page_url, page_title, view_count, last_visited) VALUES 
('/', 'Главная страница', 567, '2026-02-28 15:30:00'),
('/#about', 'О нас', 234, '2026-02-28 14:20:00'),
('/#services', 'Услуги', 189, '2026-02-28 13:45:00'),
('/#gallery', 'Галерея', 156, '2026-02-28 12:30:00'),
('/#contacts', 'Контакты', 98, '2026-02-28 11:15:00');

