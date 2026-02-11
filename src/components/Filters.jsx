// src/components/Filters.jsx
import React, { useState } from 'react';
import './Filters.css';

const Filters = ({ filters, setFilters, selectedDistrict, onPanelToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const togglePanel = (e) => {
    if (e) e.stopPropagation();
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onPanelToggle) {
      onPanelToggle(newState);
    }
  };

  const handleChange = (field, value) => {
    setFilters({ ...filters, [field]: value });
  };

  const handleExport = () => {
    const start = filters.startDate;
    const end = filters.endDate;
    window.location.href = `http://localhost:5000/api/export-excel?startDate=${start}&endDate=${end}`;
  };

  const setPeriod = (period) => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start = '';
    
    switch(period) {
      case 'month':
        const m = new Date(today); m.setMonth(today.getMonth() - 1);
        start = m.toISOString().split('T')[0];
        break;
      case 'year':
        const y = new Date(today); y.setFullYear(today.getFullYear() - 1);
        start = y.toISOString().split('T')[0];
        break;
      case 'all':
        start = '2020-01-01';
        break;
      default: return;
    }
    setFilters({ ...filters, startDate: start, endDate: end });
  };

  return (
    <div className={`filters-panel ${isExpanded ? 'expanded' : ''}`}>
      <button 
        className="panel-toggle"
        onClick={togglePanel}
      >
        {isExpanded ? '✕ Закрыть фильтры' : '⚙️ Настройки и Экспорт'}
      </button>

      <div className="expanded-view">
        <div className="filters-main">
          <div className="filter-section">
            <h3>📅 Временной период</h3>
            <div className="quick-periods">
              <button className="period-btn" onClick={() => setPeriod('month')}>Месяц</button>
              <button className="period-btn" onClick={() => setPeriod('year')}>Год</button>
              <button className="period-btn" onClick={() => setPeriod('all')}>Все время</button>
            </div>
            
            <div className="date-inputs">
              <div className="filter-group">
                <label>Начало</label>
                <input 
                  type="date" 
                  value={filters.startDate} 
                  onChange={e => handleChange('startDate', e.target.value)} 
                  className="date-input" 
                />
              </div>
              <div className="filter-group">
                <label>Конец</label>
                <input 
                  type="date" 
                  value={filters.endDate} 
                  onChange={e => handleChange('endDate', e.target.value)} 
                  className="date-input" 
                />
              </div>
            </div>
          </div>
          
          <div className="export-section">
            <h3>📊 Экспорт в Excel</h3>
            <p>Выгрузить данные по всем районам за выбранный период для детальной аналитики.</p>
            <button className="export-btn" onClick={handleExport}>
              📥 Скачать Excel-отчет
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filters;
