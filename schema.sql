-- districts.sqlite

-- Таблица районов
CREATE TABLE IF NOT EXISTS districts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT,
    population INTEGER,
    area_km2 REAL,
    capital TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица с данными по периодам
CREATE TABLE IF NOT EXISTS district_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    district_id TEXT NOT NULL,
    date DATE NOT NULL,
    indicator_type TEXT NOT NULL, -- 'population', 'economy', 'climate', etc.
    indicator_name TEXT NOT NULL, -- 'Население', 'ВРП', 'Температура'
    value REAL NOT NULL,
    unit TEXT, -- 'чел.', 'млн руб.', '°C'
    source TEXT,
    FOREIGN KEY (district_id) REFERENCES districts (id),
    UNIQUE(district_id, date, indicator_type, indicator_name)
);

-- Таблица с дополнительной информацией
CREATE TABLE IF NOT EXISTS district_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    district_id TEXT NOT NULL,
    category TEXT NOT NULL, -- 'geography', 'economy', 'demographics'
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES districts (id)
);

-- Индексы для быстрого поиска
CREATE INDEX idx_district_data_district_date ON district_data(district_id, date);
CREATE INDEX idx_district_data_type ON district_data(indicator_type);