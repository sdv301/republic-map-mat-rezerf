// src/server.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

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
  
  // Точное совпадение
  if (allDistricts[decodedId]) {
    return allDistricts[decodedId];
  }
  
  // Поиск по ID или части названия
  return Object.values(allDistricts).find(d => 
    d.id === decodedId || 
    d.name.toLowerCase() === decodedId.toLowerCase() ||
    d.name.toLowerCase().includes(decodedId.toLowerCase())
  );
}

// КОРНЕВОЙ МАРШРУТ
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Сервер карты Якутии работает!',
    version: '1.0',
    districtsCount: Object.keys(allDistricts).length,
    endpoints: {
      '/api/districts': 'GET - список всех районов',
      '/api/district/:id': 'GET - информация о районе',
      '/api/district/:id/data': 'GET - данные с фильтрами',
      '/api/district/:id/info': 'GET - дополнительная информация'
    },
    example: 'Попробуйте: /api/district/Якутск или /api/districts'
  });
});

// API: Получить информацию о районе
app.get('/api/district/:id', (req, res) => {
  const { id } = req.params;
  console.log('📥 Запрос района:', id);
  
  const district = findDistrict(id);
  
  if (district) {
    const response = {
      ...district,
      description: `${district.name} расположен в Республике Саха (Якутия). Население: ${district.population.toLocaleString()} чел., площадь: ${district.area_km2.toLocaleString()} км².`
    };
    res.json(response);
  } else {
    res.status(404).json({ 
      error: 'Район не найден',
      requested: id,
      suggestion: 'Проверьте правильность названия или посмотрите список районов: /api/districts'
    });
  }
});

// API: Получить данные с фильтрами
app.get('/api/district/:id/data', (req, res) => {
  const { id } = req.params;
  const { startDate = '2020-01-01', endDate = '2023-12-31', indicatorType = 'all' } = req.query;
  
  console.log('📊 Запрос данных для:', id, { startDate, endDate, indicatorType });
  
  const district = findDistrict(id);
  
  if (!district) {
    res.status(404).json({ error: 'Район не найден' });
    return;
  }
  
  // Тестовые данные
  const years = ['2020', '2021', '2022', '2023'];
  const populationData = years.map((year, idx) => ({
    date: `${year}-01-01`,
    value: Math.round(district.population * (0.95 + idx * 0.02)),
    unit: 'чел.',
    source: 'Росстат'
  }));
  
  const testData = {
    districtId: district.id,
    period: { startDate, endDate },
    indicators: {
      population: {
        'Население': populationData
      },
      economy: {
        'ВРП': [
          { date: '2023-01-01', value: Math.round(district.population * 1.2), unit: 'млн руб.', source: 'Минэкономразвития' }
        ],
        'Средняя з/п': [
          { date: '2023-01-01', value: district.id === 'yakutsk' ? 85000 : 65000, unit: 'руб.', source: 'Росстат' }
        ]
      },
      climate: {
        'Средняя температура года': [
          { date: '2023-01-01', value: district.id === 'yakutsk' ? -8.5 : -15.5, unit: '°C', source: 'Росгидромет' }
        ]
      }
    },
    statistics: {
      total_indicators: 4,
      earliest_date: '2020-01-01',
      latest_date: '2023-01-01'
    }
  };
  
  if (indicatorType !== 'all' && testData.indicators[indicatorType]) {
    testData.indicators = { [indicatorType]: testData.indicators[indicatorType] };
  }
  
  res.json(testData);
});

// API: Дополнительная информация
app.get('/api/district/:id/info', (req, res) => {
  const { id } = req.params;
  const district = findDistrict(id);
  
  if (!district) {
    res.status(404).json({ error: 'Район не найден' });
    return;
  }
  
  res.json({
    geography: [{
      title: 'Географическое положение',
      content: `${district.name} расположен в Республике Саха (Якутия). Административный центр — ${district.capital}. Площадь: ${district.area_km2.toLocaleString()} км².`,
      updatedAt: '2023-01-01'
    }],
    economy: [{
      title: 'Экономика',
      content: district.id === 'yakutsk' 
        ? 'Алмазогранильная промышленность, строительство, энергетика, пищевая промышленность, транспортный узел.'
        : 'Основные отрасли: сельское хозяйство, оленеводство, добывающая промышленность, рыболовство.',
      updatedAt: '2023-01-01'
    }]
  });
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

// Обработчик 404 для несуществующих маршрутов
app.use((req, res) => {
  res.status(404).json({
    error: 'Маршрут не найден',
    path: req.path,
    availableEndpoints: [
      '/',
      '/api/districts',
      '/api/district/:id',
      '/api/district/:id/data',
      '/api/district/:id/info'
    ]
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
  console.log(`📊 Данные для ${Object.keys(allDistricts).length} районов`);
  console.log(`🌐 Проверьте работу:`);
  console.log(`   http://localhost:${PORT}/`);
  console.log(`   http://localhost:${PORT}/api/districts`);
  console.log(`   http://localhost:${PORT}/api/district/Якутск`);
});

module.exports = app;