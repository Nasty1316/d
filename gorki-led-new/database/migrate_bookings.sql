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
