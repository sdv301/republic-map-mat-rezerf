// src/components/Filters.jsx
import React, { useState } from 'react';
import './Filters.css';

const Filters = ({ filters, setFilters, selectedDistrict, districtData, onPanelToggle }) => {
  const [exportLoading, setExportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [isExpanded, setIsExpanded] = useState(false);

  const togglePanel = () => {
    setIsExpanded(!isExpanded);
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onPanelToggle) {
      onPanelToggle(newState);
    }
  };

  const handleChange = (field, value) => {
    const newFilters = { ...filters };
    
    if (field === 'specific' && value) {
      newFilters.specific = value;
      newFilters.start = '';
      newFilters.end = '';
    } else if (field === 'start' || field === 'end') {
      newFilters[field] = value;
      newFilters.specific = '';
    }
    
    setFilters(newFilters);
  };


  const exportToExcel = () => {
    if (!selectedDistrict || !districtData) return;
    
    setExportLoading(true);
    
    const exportData = {
      district: selectedDistrict.name,
      period: districtData.period,
      exportDate: new Date().toLocaleString('ru-RU'),
      indicators: districtData.indicators || {}
    };
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `"Отчет по району: ${selectedDistrict.name}"\n`;
    csvContent += `"Период данных: ${districtData.period.startDate} - ${districtData.period.endDate}"\n`;
    csvContent += `"Дата экспорта: ${exportData.exportDate}"\n\n`;
    
    Object.entries(exportData.indicators).forEach(([category, indicators]) => {
      csvContent += `"${category.toUpperCase()}"\n`;
      Object.entries(indicators).forEach(([indicator, values]) => {
        csvContent += `"${indicator}"\n`;
        csvContent += "Дата,Значение,Единица измерения,Источник\n";
        values.forEach(item => {
          csvContent += `"${item.date}","${item.value}","${item.unit || ''}","${item.source || ''}"\n`;
        });
        csvContent += "\n";
      });
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedDistrict.name}_данные_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setExportLoading(false);
  };

  const exportToWord = () => {
    if (!selectedDistrict || !districtData) return;
    
    setExportLoading(true);
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Отчет по району ${selectedDistrict.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          h2 { color: #34495e; margin-top: 30px; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th { background-color: #3498db; color: white; padding: 10px; text-align: left; }
          td { border: 1px solid #ddd; padding: 8px; }
          .meta { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { margin-top: 50px; font-size: 12px; color: #7f8c8d; }
        </style>
      </head>
      <body>
        <h1>Отчет по району: ${selectedDistrict.name}</h1>
        <div class="meta">
          <strong>Период данных:</strong> ${districtData.period.startDate} - ${districtData.period.endDate}<br>
          <strong>Дата экспорта:</strong> ${new Date().toLocaleString('ru-RU')}<br>
          <strong>Всего показателей:</strong> ${districtData.statistics?.total_indicators || 0}
        </div>
        ${Object.entries(districtData.indicators || {}).map(([category, indicators]) => `
          <h2>${category === 'population' ? 'Демографические показатели' : 
                category === 'economy' ? 'Экономические показатели' : 
                category === 'climate' ? 'Климатические показатели' : category}</h2>
          ${Object.entries(indicators).map(([indicator, values]) => `
            <h3>${indicator}</h3>
            <table>
              <thead><tr><th>Дата</th><th>Значение</th><th>Единица</th><th>Источник</th></tr></thead>
              <tbody>
                ${values.map(item => `
                  <tr><td>${item.date}</td><td>${item.value}</td><td>${item.unit || ''}</td><td>${item.source || ''}</td></tr>
                `).join('')}
              </tbody>
            </table>
          `).join('')}
        `).join('')}
        <div class="footer">
          Отчет сгенерирован автоматически в информационной системе карты Якутии<br>
          © ${new Date().getFullYear()} Республика Саха (Якутия)
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedDistrict.name}_отчет_${new Date().toISOString().split('T')[0]}.doc`;
    link.click();
    URL.revokeObjectURL(url);
    
    setExportLoading(false);
  };

  const handleExport = () => {
    if (!selectedDistrict) {
      alert('Сначала выберите район на карте');
      return;
    }
    
    if (!districtData) {
      alert('Нет данных для экспорта');
      return;
    }
    
    switch(exportFormat) {
      case 'excel':
        exportToExcel();
        break;
      case 'word':
        exportToWord();
        break;
      default:
        exportToExcel();
    }
  };

  const resetFilters = () => {
    setFilters({
      start: '',
      end: '',
      specific: ''
    });
  };

  const setPeriod = (period) => {
    const today = new Date();
    const newFilters = { ...filters, specific: '' };
    
    switch(period) {
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        newFilters.start = weekAgo.toISOString().split('T')[0];
        newFilters.end = today.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        newFilters.start = monthAgo.toISOString().split('T')[0];
        newFilters.end = today.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date(today);
        yearAgo.setFullYear(today.getFullYear() - 1);
        newFilters.start = yearAgo.toISOString().split('T')[0];
        newFilters.end = today.toISOString().split('T')[0];
        break;
      case 'all':
        newFilters.start = '2020-01-01';
        newFilters.end = today.toISOString().split('T')[0];
        break;
      default:
        return;
    }
    
    setFilters(newFilters);
  };

  return (
    <div 
      className={`filters-panel ${isExpanded ? 'expanded' : 'collapsed'}`}
      onClick={() => !isExpanded && togglePanel()}
    >
      <button 
        className="panel-toggle"
        onClick={togglePanel}
        title={isExpanded ? "Свернуть панель" : "Развернуть фильтры"}
      >
        <span className="toggle-icon">
          {isExpanded ? '👆' : '👇'}
        </span>
        <span className="toggle-text">
          {isExpanded ? 'Свернуть' : 'Фильтры'}
        </span>
      </button>

      {/* Всегда видимая шапка */}
      <div className="collapsed-view">
        <div className="collapsed-content">
          {selectedDistrict && (
            <div className="current-district-mini">
              <span className="district-icon">📍</span>
              <span className="district-name">{selectedDistrict.name}</span>
            </div>
          )}
          
          {/* Быстрые фильтры - сдвинуты влево */}
          <div className="quick-filters-mini">
            <button 
              className="mini-btn"
              onClick={(e) => {
                e.stopPropagation();
                setPeriod('week');
              }}
              title="Данные за неделю"
            >
              7д
            </button>
            <button 
              className="mini-btn"
              onClick={(e) => {
                e.stopPropagation();
                setPeriod('month');
              }}
              title="Данные за месяц"
            >
              30д
            </button>
            <button 
              className="mini-btn"
              onClick={(e) => {
                e.stopPropagation();
                setPeriod('year');
              }}
              title="Данные за год"
            >
              1г
            </button>
          </div>
          
          {selectedDistrict && districtData && (
            <button 
              className="export-mini-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleExport();
              }}
              disabled={exportLoading}
              title="Экспорт данных"
            >
              {exportLoading ? '...' : '📥'}
            </button>
          )}
        </div>
      </div>

      {/* Развернутая панель на весь экран */}
      <div className="expanded-view">
        <div className="filters-header">
          <h2>
            <span className="header-icon">⚙️</span>
            Панель фильтров и экспорта
          </h2>
          <div className="district-info">
            {selectedDistrict ? (
              <span className="current-district">
                <strong>Текущий район:</strong> {selectedDistrict.name}
              </span>
            ) : (
              <span className="no-district">Выберите район на карте</span>
            )}
          </div>
        </div>
        
        <div className="filters-main">
          <div className="filter-section">
            <h3>📅 Выбор периода данных</h3>
            
            <div className="quick-periods">
              <button 
                type="button" 
                className="period-btn"
                onClick={() => setPeriod('week')}
              >
                Неделя
              </button>
              <button 
                type="button" 
                className="period-btn"
                onClick={() => setPeriod('month')}
              >
                Месяц
              </button>
              <button 
                type="button" 
                className="period-btn"
                onClick={() => setPeriod('year')}
              >
                Год
              </button>
              <button 
                type="button" 
                className="period-btn"
                onClick={() => setPeriod('all')}
              >
                Весь период
              </button>
            </div>
            
            <div className="date-inputs">
              <div className="filter-group">
                <label>
                  <span className="label-icon">📅</span>
                  Начальная дата:
                </label>
                <input
                  type="date"
                  value={filters.start}
                  onChange={e => handleChange('start', e.target.value)}
                  className="date-input"
                  max={filters.end || new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="filter-group">
                <label>
                  <span className="label-icon">📅</span>
                  Конечная дата:
                </label>
                <input
                  type="date"
                  value={filters.end}
                  onChange={e => handleChange('end', e.target.value)}
                  className="date-input"
                  min={filters.start}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="filter-group">
                <label>
                  <span className="label-icon">🎯</span>
                  Конкретная дата:
                </label>
                <input
                  type="date"
                  value={filters.specific}
                  onChange={e => handleChange('specific', e.target.value)}
                  className="date-input"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            <div className="filter-actions">
              <button 
                type="button" 
                className="reset-btn"
                onClick={resetFilters}
              >
                🗑️ Сбросить фильтры
              </button>
              
              <div className="filter-status">
                {filters.specific ? (
                  <span className="status-active">
                    📍 Показаны данные за: <strong>{filters.specific}</strong>
                  </span>
                ) : filters.start && filters.end ? (
                  <span className="status-active">
                    📅 Период: <strong>{filters.start}</strong> - <strong>{filters.end}</strong>
                  </span>
                ) : (
                  <span className="status-default">
                    ⏳ Данные по умолчанию (2020-2023)
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="export-section">
            <h3>💾 Экспорт данных</h3>
            
            <div className="export-controls">
              <div className="format-selector">
                <label>Формат экспорта:</label>
                <select 
                  value={exportFormat} 
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="format-select"
                >
                  <option value="excel">Excel (CSV)</option>
                  <option value="word">Word документ</option>
                </select>
              </div>
              
              <button 
                type="button" 
                className="export-btn"
                onClick={handleExport}
                disabled={!selectedDistrict || exportLoading}
              >
                {exportLoading ? (
                  <>
                    <span className="spinner"></span>
                    Экспорт...
                  </>
                ) : (
                  <>
                    <span className="export-icon">
                      {exportFormat === 'excel' ? '📊' : '📄'}
                    </span>
                    Экспортировать данные
                  </>
                )}
              </button>
              
              <div className="export-info">
                {selectedDistrict ? (
                  <div className="data-stats">
                    <div className="stat-item">
                      <span className="stat-label">Показателей:</span>
                      <span className="stat-value">
                        {districtData?.statistics?.total_indicators || 0}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Период:</span>
                      <span className="stat-value">
                        {districtData?.period?.startDate?.substring(0,4) || '2020'}-
                        {districtData?.period?.endDate?.substring(0,4) || '2023'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="export-hint">
                    ⚠️ Выберите район для экспорта данных
                  </p>
                )}
              </div>
            </div>
            
            <div className="export-features">
              <h4>📋 Что будет в отчете:</h4>
              <ul className="features-list">
                <li>✓ Название района и период данных</li>
                <li>✓ Все показатели с историческими значениями</li>
                <li>✓ Единицы измерения и источники данных</li>
                <li>✓ Дата и время генерации отчета</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filters;