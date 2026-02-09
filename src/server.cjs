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

// Убедимся, что папка uploads существует
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const PORT = 5000;

app.use(cors());
app.use(express.json());

// Подключение к БД
const dbPath = path.resolve(__dirname, '../data.sqlite');
const db = new sqlite3.Database(dbPath);

// Данные для ВСЕХ районов Якутии
const allDistricts = {
  'город Якутск': { id: 'yakutsk', name: 'Якутск', population: 330000, area_km2: 122, capital: 'Якутск', code: 'YAK' },
  'Жатай': { id: 'zhatay', name: 'Жатай', population: 11000, area_km2: 8, capital: 'Жатай', code: 'ZHT' },
  'Абыйский район': { id: 'abysky', name: 'Абыйский район', population: 4500, area_km2: 69300, capital: 'Белая Гора', code: 'ABY' },
  'Алданский район': { id: 'aldansky', name: 'Алданский район', population: 41000, area_km2: 156800, capital: 'Алдан', code: 'ALD' },
  'Аллаиховский район': { id: 'allaikhovsky', name: 'Аллаиховский район', population: 3000, area_km2: 107300, capital: 'Чокурдах', code: 'ALL' },
  'Амгинский район': { id: 'amginsky', name: 'Амгинский район', population: 17000, area_km2: 29300, capital: 'Амга', code: 'AMG' },
  'Анабарский район': { id: 'anabarsky', name: 'Анабарский район', population: 3400, area_km2: 55900, capital: 'Саскылах', code: 'ANA' },
  'Булунский район': { id: 'bulunsky', name: 'Булунский район', population: 8500, area_km2: 223600, capital: 'Тикси', code: 'BUL' },
  'Верхневилюйский район': { id: 'verkhnevilyuysky', name: 'Верхневилюйский район', population: 21000, area_km2: 42000, capital: 'Верхневилюйск', code: 'VVL' },
  'Верхнеколымский район': { id: 'verkhnekolymsky', name: 'Верхнеколымский район', population: 4300, area_km2: 67800, capital: 'Зырянка', code: 'VKL' },
  'Верхоянский район': { id: 'verkhoyansky', name: 'Верхоянский район', population: 11500, area_km2: 137400, capital: 'Батагай', code: 'VRY' },
  'Вилюйский район': { id: 'vilyuysky', name: 'Вилюйский район', population: 25000, area_km2: 55200, capital: 'Вилюйск', code: 'VIL' },
  'Горный район': { id: 'gorny', name: 'Горный район', population: 11000, area_km2: 45600, capital: 'Бердигестях', code: 'GRN' },
  'Жиганский район': { id: 'zhigansky', name: 'Жиганский район', population: 4200, area_km2: 140200, capital: 'Жиганск', code: 'ZHI' },
  'Кобяйский район': { id: 'kobyaysky', name: 'Кобяйский район', population: 13000, area_km2: 108000, capital: 'Сангар', code: 'KOB' },
  'Ленский район': { id: 'lensky', name: 'Ленский район', population: 39000, area_km2: 77000, capital: 'Ленск', code: 'LEN' },
  'Мегино-Кангаласский район': { id: 'megino-kangalassky', name: 'Мегино-Кангаласский район', population: 31000, area_km2: 11700, capital: 'Нижний Бестях', code: 'MEG' },
  'Мирнинский район': { id: 'mirninsky', name: 'Мирнинский район', population: 72000, area_km2: 165800, capital: 'Мирный', code: 'MIR' },
  'Момский район': { id: 'omsky', name: 'Момский район', population: 4500, area_km2: 104600, capital: 'Хонуу', code: 'MOM' },
  'Намский район': { id: 'namsky', name: 'Намский район', population: 25000, area_km2: 11900, capital: 'Намцы', code: 'NAM' },
  'Нерюнгринский район': { id: 'neryungrinsky', name: 'Нерюнгринский район', population: 75000, area_km2: 93000, capital: 'Нерюнгри', code: 'NER' },
  'Нижнеколымский район': { id: 'nizhnekolymsky', name: 'Нижнеколымский район', population: 4500, area_km2: 87600, capital: 'Черский', code: 'NKL' },
  'Нюрбинский район': { id: 'nyurbinsky', name: 'Нюрбинский район', population: 25000, area_km2: 52400, capital: 'Нюрба', code: 'NYU' },
  'Оймяконский район': { id: 'oymyakonsky', name: 'Оймяконский район', population: 10500, area_km2: 92000, capital: 'Усть-Нера', code: 'OYM' },
  'Олёкминский район': { id: 'olekminsky', name: 'Олёкминский район', population: 26000, area_km2: 161300, capital: 'Олёкминск', code: 'OLE' },
  'Оленёкский район': { id: 'olenek', name: 'Оленёкский район', population: 4300, area_km2: 318000, capital: 'Оленёк', code: 'OLK' },
  'Среднеколымский район': { id: 'srednekolymsky', name: 'Среднеколымский район', population: 7800, area_km2: 125200, capital: 'Среднеколымск', code: 'SKL' },
  'Сунтарский район': { id: 'suntarsky', name: 'Сунтарский район', population: 25000, area_km2: 57800, capital: 'Сунтар', code: 'SUN' },
  'Таттинский район': { id: 'tattinsky', name: 'Таттинский район', population: 17000, area_km2: 18900, capital: 'Ытык-Кюёль', code: 'TAT' },
  'Томпонский район': { id: 'tomponsky', name: 'Томпонский район', population: 13500, area_km2: 135800, capital: 'Хандыга', code: 'TOM' },
  'Усть-Алданский район': { id: 'ust-aldansky', name: 'Усть-Алданский район', population: 22000, area_km2: 18300, capital: 'Борогонцы', code: 'UAL' },
  'Усть-Майский район': { id: 'ust-maysky', name: 'Усть-Майский район', population: 8500, area_km2: 95300, capital: 'Усть-Мая', code: 'UMA' },
  'Усть-Янский район': { id: 'ust-yansky', name: 'Усть-Янский район', population: 7300, area_km2: 120300, capital: 'Депутатский', code: 'UYA' },
  'Хангаласский район': { id: 'khangalassky', name: 'Хангаласский район', population: 34000, area_km2: 24700, capital: 'Покровск', code: 'KHA' },
  'Чурапчинский район': { id: 'churapchinsky', name: 'Чурапчинский район', population: 20000, area_km2: 12600, capital: 'Чурапча', code: 'CHU' },
  'Эвено-Бытантайский район': { id: 'eveno-bytantaysky', name: 'Эвено-Бытантайский район', population: 2800, area_km2: 55300, capital: 'Батагай-Алыта', code: 'EVB' }
};

// Функция поиска района
function findDistrict(id) {
  const decodedId = decodeURIComponent(id);
  
  if (allDistricts[decodedId]) {
    return allDistricts[decodedId];
  }
  
  return Object.values(allDistricts).find(d => 
    d.id === decodedId || 
    d.name.toLowerCase() === decodedId.toLowerCase() ||
    d.name.toLowerCase().includes(decodedId.toLowerCase())
  );
}

// API: Добавить данные вручную
app.post('/api/district/:id/data', (req, res) => {
  const { id } = req.params;
  const data = req.body;
  
  const district = findDistrict(id);
  if (!district) {
    return res.status(404).json({ error: 'Район не найден' });
  }

  const sql = `INSERT INTO district_data 
    (district_id, date, indicator_type, indicator_name, value, unit, source) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`;
  
  const params = [
    district.id,
    data.date,
    data.indicator_type,
    data.indicator_name,
    data.value,
    data.unit,
    data.source
  ];

  db.run(sql, params, function(err) {
    if (err) {
      console.error('Ошибка записи в БД:', err.message);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.json({ success: true, id: this.lastID });
  });
});

// API: Загрузка Excel
app.post('/api/upload-excel', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не загружен' });
  }

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    let count = 0;
    const stmt = db.prepare(`INSERT OR REPLACE INTO district_data 
      (district_id, date, indicator_type, indicator_name, value, unit, source) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`);

    data.forEach(row => {
      stmt.run(
        row.district_id,
        row.date,
        row.indicator_type || row.type,
        row.indicator_name || row.name,
        row.value,
        row.unit,
        row.source
      );
      count++;
    });

    stmt.finalize();
    // Удаляем временный файл
    fs.unlinkSync(req.file.path);
    res.json({ success: true, count });
  } catch (error) {
    console.error('Ошибка обработки Excel:', error);
    res.status(500).json({ error: error.message });
  }
});

// API: Список всех районов
app.get('/api/districts', (req, res) => {
  const districtsList = Object.values(allDistricts).map(d => ({
    id: d.id,
    name: d.name,
    code: d.code,
    population: d.population,
    area_km2: d.area_km2,
    capital: d.capital
  }));
  res.json(districtsList);
});

// API: Получить информацию о районе
app.get('/api/district/:id', (req, res) => {
  const { id } = req.params;
  const district = findDistrict(id);
  
  if (district) {
    res.json({
      ...district,
      description: `${district.name} расположен в Республике Саха (Якутия).`
    });
  } else {
    res.status(404).json({ error: 'Район не найден' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: '🚀 Сервер карты Якутии работает!' });
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});
