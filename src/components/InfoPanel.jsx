// src/components/InfoPanel.jsx - улучшенная версия со сворачиванием
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import './InfoPanel.css';

// Константы вынесены наружу
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const DEFAULT_FILTERS = {
  startDate: '2020-01-01',
  endDate: '2023-12-31',
  dataType: 'all'
};

const InfoPanel = ({ district, filters = {}, isFiltersExpanded, onPanelToggle }) => {
  const [districtInfo, setDistrictInfo] = useState(null);
  const [districtData, setDistrictData] = useState(null);
  const [additionalInfo, setAdditionalInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIndicator, setSelectedIndicator] = useState('population');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Инициализация после монтирования
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Сворачиваем панель, если развернуты фильтры
  useEffect(() => {
    if (isFiltersExpanded && isExpanded) {
      togglePanel();
    }
  }, [isFiltersExpanded, isExpanded]);

  // Мемоизированные вычисления
  const effectiveFilters = useMemo(() => ({ 
    ...DEFAULT_FILTERS, 
    ...filters 
  }), [filters]);

  const categoryLabels = useMemo(() => ({
    geography: 'География',
    economy: 'Экономика',
    demographics: 'Демография'
  }), []);

  // Оптимизированная загрузка данных
  useEffect(() => {
    if (!district?.id) {
      setDistrictInfo(null);
      setDistrictData(null);
      setAdditionalInfo(null);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      
      try {
        const encodedId = encodeURIComponent(district.id);
        
        // Параллельная загрузка всех данных
        const [infoRes, dataRes, additionalRes] = await Promise.allSettled([
          fetch(`http://localhost:5000/api/district/${encodedId}`),
          fetch(`http://localhost:5000/api/district/${encodedId}/data?${new URLSearchParams({
            startDate: effectiveFilters.startDate,
            endDate: effectiveFilters.endDate,
            indicatorType: effectiveFilters.dataType === 'all' ? 'all' : selectedIndicator
          })}`),
          fetch(`http://localhost:5000/api/district/${encodedId}/info`)
        ]);

        // Обработка результатов
        if (infoRes.status === 'fulfilled' && infoRes.value.ok) {
          setDistrictInfo(await infoRes.value.json());
        }

        if (dataRes.status === 'fulfilled' && dataRes.value.ok) {
          setDistrictData(await dataRes.value.json());
        }

        if (additionalRes.status === 'fulfilled' && additionalRes.value.ok) {
          setAdditionalInfo(await additionalRes.value.json());
        }

      } catch (error) {
        console.error('Ошибка загрузки:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [district, effectiveFilters, selectedIndicator]);

  // Оптимизированная подготовка данных для графиков
  const chartData = useMemo(() => {
    if (!districtData?.indicators?.[selectedIndicator]) return [];
    
    return Object.entries(districtData.indicators[selectedIndicator])
      .flatMap(([name, values]) => 
        values.map(item => ({
          name: item.date?.substring(0, 7) || 'N/A',
          [name]: item.value,
          date: item.date
        }))
      );
  }, [districtData, selectedIndicator]);

  const summary = districtData?.summary?.[selectedIndicator];

  // Обработчики событий
  const handleIndicatorChange = useCallback((e) => {
    setSelectedIndicator(e.target.value);
  }, []);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
  }, []);

  const togglePanel = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onPanelToggle) {
      onPanelToggle(newState);
    }
  }, [isExpanded, onPanelToggle]);

  // Обработчик клика по свернутой панели
  const handleCollapsedClick = useCallback((e) => {
    e.stopPropagation();
    if (!isExpanded) {
      togglePanel();
    }
  }, [isExpanded, togglePanel]);

  // Если не инициализировано, не рендерим ничего
  if (!isInitialized) {
    return null;
  }

  // Рендер пустого состояния
  if (!district?.id) {
    return (
      <div className={`info-panel empty ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <button 
          className="panel-toggle-btn"
          onClick={togglePanel}
          title={isExpanded ? "Свернуть панель" : "Информация"}
        >
          <span className="toggle-icon">
            {isExpanded ? '←' : '💡'}
          </span>
        </button>

        {!isExpanded && (
          <div className="collapsed-view" onClick={handleCollapsedClick}>
            <div className="collapsed-content">
              <div className="collapsed-title">Информация</div>
            </div>
          </div>
        )}

        {isExpanded && (
          <div className="expanded-view">
            <div className="empty-state">
              <h3>👆 Выберите район на карте</h3>
              <p>Кликните на любой район Якутии для получения информации</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Рендер загрузки
  if (loading) {
    return (
      <div className={`info-panel loading ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <button 
          className="panel-toggle-btn"
          onClick={togglePanel}
          title={isExpanded ? "Свернуть панель" : "Информация"}
        >
          <span className="toggle-icon">
            {isExpanded ? '←' : '💡'}
          </span>
        </button>

        {!isExpanded && (
          <div className="collapsed-view" onClick={handleCollapsedClick}>
            <div className="collapsed-content">
              <div className="collapsed-title">Информация</div>
              <div className="collapsed-district">
                <span className="district-icon">📍</span>
                <span className="district-name">{district.name}</span>
              </div>
            </div>
          </div>
        )}

        {isExpanded && (
          <div className="expanded-view">
            <div className="spinner"></div>
            <p>Загрузка данных...</p>
          </div>
        )}
      </div>
    );
  }

  // Вспомогательные рендер-функции
  const renderStats = () => (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-label">Население</div>
        <div className="stat-value">
          {districtInfo?.population?.toLocaleString() || 'Н/Д'}
        </div>
        <div className="stat-unit">человек</div>
      </div>
      
      <div className="stat-card">
        <div className="stat-label">Площадь</div>
        <div className="stat-value">
          {districtInfo?.area_km2?.toLocaleString() || 'Н/Д'}
        </div>
        <div className="stat-unit">км²</div>
      </div>
      
      {districtData?.statistics && (
        <>
          <div className="stat-card">
            <div className="stat-label">Показателей</div>
            <div className="stat-value">{districtData.statistics.total_indicators || 0}</div>
            <div className="stat-unit">ед.</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-label">Период данных</div>
            <div className="stat-value">
              {districtData.statistics.earliest_date ? 
                `${districtData.statistics.earliest_date.substring(0,4)}-${districtData.statistics.latest_date.substring(0,4)}` : 
                'Н/Д'}
            </div>
            <div className="stat-unit">годы</div>
          </div>
        </>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="overview">
            {renderStats()}
            {districtInfo?.description && (
              <div className="description">
                <h4>Описание района</h4>
                <p>{districtInfo.description}</p>
              </div>
            )}
          </div>
        );

      case 'data':
        return (
          <div className="data-section">
            <div className="indicator-selector">
              <label>Показатель:</label>
              <select value={selectedIndicator} onChange={handleIndicatorChange}>
                {districtData?.indicators ? 
                  Object.keys(districtData.indicators).map(type => (
                    <option key={type} value={type}>{type}</option>
                  )) :
                  <option value="population">Население</option>
                }
              </select>
            </div>

            {districtData?.indicators?.[selectedIndicator] ? (
              <div className="indicators-list">
                {Object.entries(districtData.indicators[selectedIndicator]).map(([name, values]) => (
                  <div key={name} className="indicator-item">
                    <div className="indicator-header">
                      <h4>{name}</h4>
                      <span className="unit">{values[0]?.unit || ''}</span>
                    </div>
                    <div className="indicator-values">
                      {values.slice(-5).reverse().map((item, idx) => (
                        <div key={idx} className="value-row">
                          <span className="date">{item.date}</span>
                          <span className="value">{item.value?.toLocaleString() || 'N/A'}</span>
                          {item.source && <span className="source">{item.source}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <p>Нет данных для выбранного показателя</p>
              </div>
            )}
          </div>
        );

      case 'info':
        return (
          <div className="additional-info">
            {additionalInfo && Object.keys(additionalInfo).length > 0 ? (
              Object.entries(additionalInfo).map(([category, items]) => (
                <div key={category} className="info-category">
                  <h3>{categoryLabels[category] || category}</h3>
                  {items.map((item, idx) => (
                    <div key={idx} className="info-item">
                      <h4>{item.title}</h4>
                      <p>{item.content}</p>
                      {item.updatedAt && (
                        <div className="info-meta">
                          Обновлено: {new Date(item.updatedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="no-data">
                <p>Дополнительная информация отсутствует</p>
              </div>
            )}
          </div>
        );

      case 'charts':
        return (
          <div className="charts-section">
            <div className="chart-controls">
              <select value={selectedIndicator} onChange={handleIndicatorChange}>
                {districtData?.indicators ? 
                  Object.keys(districtData.indicators).map(type => (
                    <option key={type} value={type}>{type}</option>
                  )) :
                  <option value="population">Население</option>
                }
              </select>
            </div>

            {chartData.length > 0 ? (
              <>
                <div className="chart-container">
                  <h4>Динамика показателей</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {districtData?.indicators[selectedIndicator] && 
                        Object.keys(districtData.indicators[selectedIndicator]).map((key, index) => (
                          <Line 
                            key={key}
                            type="monotone" 
                            dataKey={key} 
                            stroke={COLORS[index % COLORS.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                          />
                        ))
                      }
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {summary && (
                  <div className="summary-section">
                    <h4>Сводная статистика</h4>
                    <div className="summary-grid">
                      {Object.entries(summary).map(([indicator, data]) => (
                        data.stats && (
                          <div key={indicator} className="summary-card">
                            <h5>{indicator}</h5>
                            <div className="summary-stats">
                              <div>
                                <span>Текущее:</span>
                                <strong>{data.stats.latest?.toLocaleString()} {data.stats.unit}</strong>
                              </div>
                              <div>
                                <span>Среднее:</span>
                                <strong>{data.stats.avg?.toFixed(1)} {data.stats.unit}</strong>
                              </div>
                              <div>
                                <span>Изменение:</span>
                                <strong className={data.stats.max - data.stats.min > 0 ? 'positive' : 'negative'}>
                                  {(data.stats.max - data.stats.min)?.toFixed(1)}
                                </strong>
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="no-data">
                <p>Нет данных для построения графиков</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`info-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Кнопка переключения */}
      <button 
        className="panel-toggle-btn"
        onClick={togglePanel}
        title={isExpanded ? "Свернуть панель" : "Информация о районе"}
      >
        <span className="toggle-icon">
          {isExpanded ? '←' : '💡'}
        </span>
      </button>

      {/* Свернутый вид */}
      {!isExpanded && (
        <div className="collapsed-view" onClick={handleCollapsedClick}>
          <div className="collapsed-content">
            <div className="collapsed-title">Информация</div>
            <div className="collapsed-district">
              <span className="district-icon">📍</span>
              <span className="district-name">{districtInfo?.name || district.name || 'Район'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Развернутый вид */}
      {isExpanded && (
        <div className="expanded-view">
          {/* Заголовок */}
          <div className="panel-header">
            <h2>{districtInfo?.name || district.name || 'Район'}</h2>
            <div className="district-meta">
              {districtInfo?.code && <span className="badge">Код: {districtInfo.code}</span>}
              {districtInfo?.capital && <span className="badge">Адм. центр: {districtInfo.capital}</span>}
            </div>
          </div>

          {/* Вкладки */}
          <div className="tabs">
            {['overview', 'data', 'info', 'charts'].map(tab => (
              <button
                key={tab}
                className={activeTab === tab ? 'active' : ''}
                onClick={() => handleTabChange(tab)}
              >
                {tab === 'overview' ? 'Обзор' :
                 tab === 'data' ? 'Данные' :
                 tab === 'info' ? 'Информация' : 'Графики'}
              </button>
            ))}
          </div>

          {/* Контент вкладок */}
          <div className="tab-content">
            {renderTabContent()}
          </div>

          {/* Футер */}
          {districtData?.statistics && (
            <div className="panel-footer">
              <small>
                {districtData.statistics.earliest_date && 
                  `Данные за период: ${districtData.statistics.earliest_date} — ${districtData.statistics.latest_date}`}
                {districtData.statistics.total_indicators && 
                  ` • ${districtData.statistics.total_indicators} показателей`}
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InfoPanel;