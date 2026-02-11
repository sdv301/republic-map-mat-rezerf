-- schema.sql
-- База данных для карты Республики Саха (Якутия)

-- 1. Справочник районов
CREATE TABLE IF NOT EXISTS districts (
    id TEXT PRIMARY KEY,          -- Например: 'yakutsk', 'aldansky'
    name TEXT NOT NULL,           -- Полное название
    code TEXT,                    -- Код (ОКТМО или внутренний)
    population_base INTEGER,      -- Базовое население (справочно)
    area_km2 REAL,                -- Площадь
    capital TEXT,                 -- Адм. центр
    description TEXT,             -- Общее описание
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Справочник категорий показателей
CREATE TABLE IF NOT EXISTS indicator_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE     -- 'Население', 'Экономика', 'Климат', 'Образование'
);

-- 3. Справочник самих показателей
CREATE TABLE IF NOT EXISTS indicators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER,
    name TEXT NOT NULL,           -- 'Численность населения', 'ВРП', 'Средняя температура'
    unit TEXT,                    -- 'чел.', 'млн руб.', '°C'
    description TEXT,
    FOREIGN KEY (category_id) REFERENCES indicator_categories (id),
    UNIQUE(category_id, name)
);

-- 4. Основная таблица значений (временные ряды)
CREATE TABLE IF NOT EXISTS data_values (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    district_id TEXT NOT NULL,
    indicator_id INTEGER NOT NULL,
    date DATE NOT NULL,           -- Дата записи (например, '2023-01-01')
    value REAL NOT NULL,          -- Числовое значение
    source TEXT,                  -- Источник (текстом для гибкости)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES districts (id),
    FOREIGN KEY (indicator_id) REFERENCES indicators (id),
    UNIQUE(district_id, indicator_id, date)
);

-- 5. Дополнительная текстовая информация (статьи, факты)
CREATE TABLE IF NOT EXISTS district_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    district_id TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (district_id) REFERENCES districts (id)
);

-- Индексы для оптимизации
CREATE INDEX IF NOT EXISTS idx_values_district_date ON data_values(district_id, date);
CREATE INDEX IF NOT EXISTS idx_values_indicator ON data_values(indicator_id);
