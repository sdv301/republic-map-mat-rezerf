// src/components/InfoPanel.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './InfoPanel.css';

const COLORS = ['#38bdf8', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
const DEFAULT_FILTERS = { startDate: '2020-01-01', endDate: '2023-12-31', dataType: 'all' };

const InfoPanel = ({ district, filters = {}, isFiltersExpanded, onPanelToggle }) => {
  const [districtInfo, setDistrictInfo] = useState(null);
  const [districtData, setDistrictData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIndicator, setSelectedIndicator] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Открываем панель при выборе района
  useEffect(() => {
    if (district?.id) {
      setIsExpanded(true);
      if (onPanelToggle) onPanelToggle(true);
    }
  }, [district?.id]);

  useEffect(() => {
    if (isFiltersExpanded && isExpanded) togglePanel();
  }, [isFiltersExpanded]);

  // Загрузка данных
  useEffect(() => {
    if (!district?.id) {
      setDistrictInfo(null); 
      setDistrictData(null); 
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const encodedId = encodeURIComponent(district.id);
        const [infoRes, dataRes] = await Promise.allSettled([
          fetch(`http://localhost:5000/api/district/${encodedId}`),
          fetch(`http://localhost:5000/api/district/${encodedId}/data`)
        ]);

        if (infoRes.status === 'fulfilled' && infoRes.value.ok) {
          setDistrictInfo(await infoRes.value.json());
        }

        if (dataRes.status === 'fulfilled' && dataRes.value.ok) {
          const data = await dataRes.value.json();
          setDistrictData(data);
          if (data.indicators && Object.keys(data.indicators).length > 0) {
            setSelectedIndicator(Object.keys(data.indicators)[0]);
          }
        }
      } catch (error) {
        console.error('Ошибка:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [district]);

  const chartData = useMemo(() => {
    if (!districtData?.indicators?.[selectedIndicator]) return [];
    const dateMap = {};
    Object.entries(districtData.indicators[selectedIndicator]).forEach(([name, values]) => {
      values.forEach(item => {
        const dKey = item.date?.substring(0, 7) || 'N/A';
        if (!dateMap[dKey]) dateMap[dKey] = { name: dKey, date: item.date };
        dateMap[dKey][name] = item.value;
      });
    });
    return Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [districtData, selectedIndicator]);

  const togglePanel = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onPanelToggle) onPanelToggle(newState);
  }, [isExpanded, onPanelToggle]);

  return (
    <div className={`info-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button className="panel-toggle-btn" onClick={togglePanel}>
        <span className="toggle-icon">{isExpanded ? '▶' : '◀'}</span>
      </button>

      {/* УБРАЛИ лишний expanded-view, контент сразу внутри панели */}
      {!district?.id ? (
        <div className="empty-state">
          <h3>👆 Выберите район</h3>
          <p>Кликните на карту для информации</p>
        </div>
      ) : loading ? (
        <div className="loading-state">
          <h3 style={{color: 'var(--primary-color)'}}>Загрузка...</h3>
        </div>
      ) : (
        <>
          <div className="panel-header">
            <h2>{districtInfo?.name || district.name || 'Район'}</h2>
          </div>

          <div className="tabs">
            {['overview', 'data', 'charts'].map(tab => (
              <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
                {tab === 'overview' ? 'Обзор' : tab === 'data' ? 'Данные' : 'Графики'}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {activeTab === 'overview' && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Население</div>
                  <div className="stat-value">{districtInfo?.population?.toLocaleString() || 'Н/Д'}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Площадь</div>
                  <div className="stat-value">{districtInfo?.area_km2?.toLocaleString() || 'Н/Д'}</div>
                  <div className="stat-unit">км²</div>
                </div>
              </div>
            )}

            {(activeTab === 'data' || activeTab === 'charts') && (
              <>
                <select value={selectedIndicator} onChange={e => setSelectedIndicator(e.target.value)} style={{marginBottom: '15px'}}>
                  {districtData?.indicators && Object.keys(districtData.indicators).length > 0 ?
                    Object.keys(districtData.indicators).map(type => <option key={type} value={type}>{type}</option>) :
                    <option value="">Нет данных</option>
                  }
                </select>

                {activeTab === 'charts' ? (
                  chartData.length > 0 ? (
                    <div className="chart-container">
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/>
                          <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} />
                          <YAxis stroke="var(--text-secondary)" fontSize={12} />
                          <Tooltip contentStyle={{background: 'var(--bg-dark)', border: '1px solid var(--border-color)', borderRadius: '8px'}}/>
                          <Legend wrapperStyle={{fontSize: '12px', marginTop: '10px'}}/>
                          {districtData?.indicators[selectedIndicator] && 
                            Object.keys(districtData.indicators[selectedIndicator]).map((key, i) => (
                              <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={{r: 4}}/>
                            ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <p style={{color: 'var(--text-secondary)', textAlign: 'center'}}>Нет данных для графиков</p>
                ) : (
                  districtData?.indicators?.[selectedIndicator] ? (
                    <div>
                      {Object.entries(districtData.indicators[selectedIndicator]).map(([name, values]) => (
                        <div key={name} style={{background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '12px', marginBottom: '10px'}}>
                          <h4 style={{margin: '0 0 10px 0', color: 'var(--text-primary)'}}>{name}</h4>
                          {values.slice(-3).reverse().map((item, idx) => (
                            <div key={idx} style={{display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px'}}>
                              <span style={{color: 'var(--text-secondary)'}}>{item.date}</span>
                              <strong style={{color: 'var(--primary-color)'}}>{item.value?.toLocaleString()}</strong>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : <p style={{color: 'var(--text-secondary)', textAlign: 'center'}}>Нет данных</p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InfoPanel;