// src/components/InfoPanel.jsx - улучшенная версия со сворачиванием
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts';
import './InfoPanel.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#ec4899'];
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
  
  // ИСПРАВЛЕНИЕ: Теперь мы работаем с категориями, а не жестко заданным 'population'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialized(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // ИСПРАВЛЕНИЕ: Автоматически разворачиваем панель при выборе нового района на карте
  useEffect(() => {
    if (district?.id) {
      setIsExpanded(true);
      if (onPanelToggle) onPanelToggle(true);
    }
  }, [district?.id]);

  useEffect(() => {
    if (isFiltersExpanded && isExpanded) togglePanel();
  }, [isFiltersExpanded, isExpanded]);

  const effectiveFilters = useMemo(() => ({ ...DEFAULT_FILTERS, ...filters }), [filters]);

  useEffect(() => {
    if (!district?.id) {
      setDistrictInfo(null); setDistrictData(null); setAdditionalInfo(null);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const encodedId = encodeURIComponent(district.id);
        const [infoRes, dataRes, additionalRes] = await Promise.allSettled([
          fetch(`http://localhost:5000/api/district/${encodedId}`),
          fetch(`http://localhost:5000/api/district/${encodedId}/data?startDate=${effectiveFilters.startDate}&endDate=${effectiveFilters.endDate}`),
          fetch(`http://localhost:5000/api/district/${encodedId}/info`)
        ]);

        if (infoRes.status === 'fulfilled' && infoRes.value.ok) {
          setDistrictInfo(await infoRes.value.json());
        }

        if (dataRes.status === 'fulfilled' && dataRes.value.ok) {
          const data = await dataRes.value.json();
          setDistrictData(data);
          
          // ИСПРАВЛЕНИЕ: Автоматически выбираем первую доступную категорию из базы
          if (data.indicators) {
            const categories = Object.keys(data.indicators);
            if (categories.length > 0) setSelectedCategory(categories[0]);
          }
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
  }, [district, effectiveFilters]);

  // ИСПРАВЛЕНИЕ: Корректное формирование данных для Recharts
  const chartData = useMemo(() => {
    if (!districtData?.indicators || !selectedCategory || !districtData.indicators[selectedCategory]) return [];
    
    const dateMap = {};
    Object.entries(districtData.indicators[selectedCategory]).forEach(([indicatorName, values]) => {
      values.forEach(item => {
        const dateKey = item.date?.substring(0, 7) || item.date || 'N/A';
        if (!dateMap[dateKey]) dateMap[dateKey] = { name: dateKey, date: item.date };
        dateMap[dateKey][indicatorName] = item.value;
      });
    });
    
    return Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [districtData, selectedCategory]);

  const summary = districtData?.summary?.[selectedCategory];

  const handleCategoryChange = useCallback((e) => setSelectedCategory(e.target.value), []);
  const handleTabChange = useCallback((tab) => setActiveTab(tab), []);
  
  const togglePanel = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onPanelToggle) onPanelToggle(newState);
  }, [isExpanded, onPanelToggle]);

  const handleCollapsedClick = useCallback((e) => {
    e.stopPropagation();
    if (!isExpanded) togglePanel();
  }, [isExpanded, togglePanel]);

  if (!isInitialized) return null;

  const displayDistrictName = districtInfo?.name || district?.name || 'Район';

  if (!district?.id) {
    return (
      <div className={`info-panel empty ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <button className="panel-toggle-btn" onClick={togglePanel} title={isExpanded ? "Свернуть" : "Информация"}>
          <span className="toggle-icon">{isExpanded ? '→' : '💡'}</span>
        </button>
        {!isExpanded && (
          <div className="collapsed-view" onClick={handleCollapsedClick}>
            <div className="collapsed-content"><div className="collapsed-title">Информация</div></div>
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

  if (loading) {
    return (
      <div className={`info-panel loading ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <button className="panel-toggle-btn" onClick={togglePanel} title={isExpanded ? "Свернуть" : "Информация"}>
          <span className="toggle-icon">{isExpanded ? '→' : '💡'}</span>
        </button>
        {!isExpanded && (
          <div className="collapsed-view" onClick={handleCollapsedClick}>
            <div className="collapsed-content">
              <div className="collapsed-title">Информация</div>
              <div className="collapsed-district">
                <span className="district-icon">📍</span>
                <span className="district-name">{displayDistrictName}</span>
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

  const renderStats = () => (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-label">Население</div>
        <div className="stat-value">{districtInfo?.population?.toLocaleString() || 'Н/Д'}</div>
        <div className="stat-unit">человек</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Площадь</div>
        <div className="stat-value">{districtInfo?.area_km2?.toLocaleString() || 'Н/Д'}</div>
        <div className="stat-unit">км²</div>
      </div>
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
              <label>Категория:</label>
              <select value={selectedCategory || ''} onChange={handleCategoryChange}>
                {districtData?.indicators ? 
                  Object.keys(districtData.indicators).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  )) : <option value="">Нет данных</option>
                }
              </select>
            </div>

            {districtData?.indicators?.[selectedCategory] ? (
              <div className="indicators-list">
                {Object.entries(districtData.indicators[selectedCategory]).map(([name, values]) => (
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
            ) : <div className="no-data"><p>Нет данных для этой категории</p></div>}
          </div>
        );

      case 'info':
        return (
          <div className="additional-info">
            {additionalInfo && Object.keys(additionalInfo).length > 0 ? (
              Object.entries(additionalInfo).map(([category, items]) => (
                <div key={category} className="info-category">
                  <h3>{category}</h3>
                  {items.map((item, idx) => (
                    <div key={idx} className="info-item">
                      <h4>{item.title}</h4>
                      <p>{item.content}</p>
                    </div>
                  ))}
                </div>
              ))
            ) : <div className="no-data"><p>Дополнительная информация отсутствует</p></div>}
          </div>
        );

      case 'charts':
        return (
          <div className="charts-section">
            <div className="chart-controls">
              <select value={selectedCategory || ''} onChange={handleCategoryChange} style={{padding: '8px', borderRadius: '4px'}}>
                {districtData?.indicators ? 
                  Object.keys(districtData.indicators).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  )) : <option value="">Нет данных</option>
                }
              </select>
            </div>

            {chartData.length > 0 ? (
              <>
                <div className="chart-container">
                  <h4>Динамика: {selectedCategory}</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      {districtData?.indicators[selectedCategory] && 
                        Object.keys(districtData.indicators[selectedCategory]).map((key, index) => (
                          <Line key={key} type="monotone" dataKey={key} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
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
                              <div><span>Текущее:</span><strong>{data.stats.latest?.toLocaleString()} {data.stats.unit}</strong></div>
                              <div><span>Среднее:</span><strong>{data.stats.avg?.toFixed(1)} {data.stats.unit}</strong></div>
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
            ) : <div className="no-data"><p>Нет данных для построения графиков</p></div>}
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className={`info-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button className="panel-toggle-btn" onClick={togglePanel} title={isExpanded ? "Свернуть" : "Развернуть"}>
        <span className="toggle-icon">{isExpanded ? '→' : '💡'}</span>
      </button>

      {!isExpanded && (
        <div className="collapsed-view" onClick={handleCollapsedClick}>
          <div className="collapsed-content">
            <div className="collapsed-title">Информация</div>
            <div className="collapsed-district">
              <span className="district-icon">📍</span>
              <span className="district-name">{displayDistrictName}</span>
            </div>
          </div>
        </div>
      )}

      {isExpanded && (
        <div className="expanded-view">
          <div className="panel-header">
            <h2>{displayDistrictName}</h2>
            <div className="district-meta">
              {districtInfo?.capital && <span className="badge">Адм. центр: {districtInfo.capital}</span>}
            </div>
          </div>

          <div className="tabs">
            {['overview', 'data', 'info', 'charts'].map(tab => (
              <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => handleTabChange(tab)}>
                {tab === 'overview' ? 'Обзор' : tab === 'data' ? 'Данные' : tab === 'info' ? 'Инфо' : 'Графики'}
              </button>
            ))}
          </div>

          <div className="tab-content">{renderTabContent()}</div>
        </div>
      )}
    </div>
  );
};

class PanelErrorBoundary extends React.Component {
  constructor(props) { 
    super(props); 
    this.state = { hasError: false, error: null }; 
  }
  
  static getDerivedStateFromError(error) { 
    return { hasError: true, error }; 
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ position: 'fixed', top: '60px', right: 0, width: '400px', height: '100%', background: '#1e293b', color: '#f1f5f9', padding: '30px', zIndex: 9999, borderLeft: '2px solid #ef4444' }}>
          <h3 style={{ color: '#ef4444' }}>💥 Ошибка компонента</h3>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>{this.state.error.toString()}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SafeInfoPanel(props) {
  return (
    <PanelErrorBoundary>
      <InfoPanel {...props} />
    </PanelErrorBoundary>
  );
}