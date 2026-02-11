// src/server.cjs
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const PORT = 5000;

app.use(cors());
app.use(express.json());

const dbPath = path.resolve(__dirname, '../data.sqlite');
const db = new sqlite3.Database(dbPath);

// --- API эндпоинты ---

// 1. Получить все районы
app.get('/api/districts', (req, res) => {
  db.all('SELECT * FROM districts ORDER BY name', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 2. Получить справочник индикаторов
app.get('/api/indicators', (req, res) => {
  const sql = `
    SELECT i.id, i.name, i.unit, c.name as category 
    FROM indicators i 
    JOIN indicator_categories c ON i.category_id = c.id
    ORDER BY c.name, i.name`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 3. Получить информацию о районе (ищем и по ID, и по имени)
app.get('/api/district/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM districts WHERE id = ? OR name = ?', [id, id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Район не найден' });
    res.json(row);
  });
});

// 4. Получить данные района с группировкой
app.get('/api/district/:id/data', (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  // Сначала находим правильный внутренний ID района (цифру или строку)
  db.get('SELECT id FROM districts WHERE id = ? OR name = ?', [id, id], (err, district) => {
    if (err || !district) return res.json({ indicators: {}, summary: {}, statistics: {} });

    let sql = `
      SELECT i.name as indicator_name, c.name as category_name, dv.date, dv.value, i.unit, dv.source
      FROM data_values dv
      JOIN indicators i ON dv.indicator_id = i.id
      JOIN indicator_categories c ON i.category_id = c.id
      WHERE dv.district_id = ?
    `;
    const params = [district.id];

    if (startDate && endDate) {
      sql += " AND dv.date BETWEEN ? AND ?";
      params.push(startDate, endDate);
    }
    sql += " ORDER BY dv.date ASC";

    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });

      const indicators = {};
      rows.forEach(row => {
        if (!indicators[row.category_name]) indicators[row.category_name] = {};
        if (!indicators[row.category_name][row.indicator_name]) indicators[row.category_name][row.indicator_name] = [];
        indicators[row.category_name][row.indicator_name].push({
          date: row.date, value: row.value, unit: row.unit, source: row.source
        });
      });

      const summary = {};
      Object.keys(indicators).forEach(cat => {
        summary[cat] = {};
        Object.keys(indicators[cat]).forEach(ind => {
          const vals = indicators[cat][ind].map(v => v.value);
          summary[cat][ind] = {
            stats: {
              latest: vals[vals.length - 1],
              avg: vals.reduce((a, b) => a + b, 0) / vals.length,
              min: Math.min(...vals),
              max: Math.max(...vals),
              unit: indicators[cat][ind][0].unit
            }
          };
        });
      });

      res.json({
        indicators, summary,
        statistics: {
          total_indicators: rows.length,
          earliest_date: rows[0]?.date,
          latest_date: rows[rows.length - 1]?.date
        }
      });
    });
  });
});

// 5. Получить доп. инфо (статьи)
app.get('/api/district/:id/info', (req, res) => {
  const { id } = req.params;
  db.all('SELECT * FROM district_info WHERE district_id = ?', [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    
    const grouped = {};
    rows.forEach(row => {
      const cat = row.category || 'Общее';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(row);
    });
    res.json(grouped);
  });
});

// 6. Добавить данные вручную
app.post('/api/data', (req, res) => {
  const { district_id, indicator_id, date, value, source } = req.body;
  const sql = `INSERT OR REPLACE INTO data_values (district_id, indicator_id, date, value, source) VALUES (?, ?, ?, ?, ?)`;
  db.run(sql, [district_id, indicator_id, date, value, source], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, id: this.lastID });
  });
});

// 7. Импорт из Excel
app.post('/api/upload-excel', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });

  try {
    const workbook = xlsx.readFile(req.file.path);
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    db.serialize(() => {
      const stmt = db.prepare(`INSERT OR REPLACE INTO data_values (district_id, indicator_id, date, value, source) VALUES (?, ?, ?, ?, ?)`);
      data.forEach(row => {
        stmt.run(row.district_id, row.indicator_id, row.date, row.value, row.source);
      });
      stmt.finalize();
    });

    fs.unlinkSync(req.file.path);
    res.json({ success: true, count: data.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Экспорт в Excel за период
app.get('/api/export-excel', (req, res) => {
  const { startDate, endDate } = req.query;
  let sql = `
    SELECT d.name as "Район", c.name as "Категория", i.name as "Показатель", dv.date as "Дата", dv.value as "Значение", i.unit as "Ед. изм.", dv.source as "Источник"
    FROM data_values dv
    JOIN districts d ON dv.district_id = d.id
    JOIN indicators i ON dv.indicator_id = i.id
    JOIN indicator_categories c ON i.category_id = c.id
  `;
  const params = [];
  if (startDate && endDate) {
    sql += " WHERE dv.date BETWEEN ? AND ?";
    params.push(startDate, endDate);
  }
  sql += " ORDER BY dv.date DESC, d.name ASC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).send(err.message);
    const ws = xlsx.utils.json_to_sheet(rows);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Data");
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="export.xlsx"');
    res.send(buf);
  });
});

// 9. Скачать шаблон
app.get('/api/download-template', (req, res) => {
  const template = [{ district_id: 'yakutsk', indicator_id: 1, date: '2023-01-01', value: 330000, source: 'Росстат' }];
  const ws = xlsx.utils.json_to_sheet(template);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Template");
  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Disposition', 'attachment; filename="template.xlsx"');
  res.send(buf);
});

app.get('/', (req, res) => res.json({ message: '🚀 API Yakutia Map Online' }));

app.listen(PORT, () => console.log(`✅ Server: http://localhost:${PORT}`));
