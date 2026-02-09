// src/App.jsx
import { useState, useCallback } from 'react';
import Map from './components/Map';
import Filters from './components/Filters';
import InfoPanel from './components/InfoPanel';
import './App.css';

function App() {
  const [filters, setFilters] = useState({
    start: '',
    end: '',
    specific: ''
  });
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtData, setDistrictData] = useState(null);
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(false);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handleDistrictSelect = useCallback((district) => {
    setSelectedDistrict(prev => 
      prev?.id === district.id && prev?.name === district.name ? prev : district
    );
  }, []);

  const handleFiltersToggle = useCallback((expanded) => {
    setIsFiltersExpanded(expanded);
  }, []);

  const handleInfoPanelToggle = useCallback((expanded) => {
    if (expanded) {
      setIsFiltersExpanded(false);
    }
  }, []);

  return (
    <div className="app">
      <Filters 
        filters={filters} 
        setFilters={handleFilterChange}
        selectedDistrict={selectedDistrict}
        districtData={districtData}
        onPanelToggle={handleFiltersToggle}
      />
      
      <div className="main">
        <div className="map-container">
          <Map 
            filters={filters} 
            onDistrictClick={handleDistrictSelect}
          />
        </div>
        
        <InfoPanel 
          district={selectedDistrict} 
          filters={filters}
          setDistrictData={setDistrictData}
          isFiltersExpanded={isFiltersExpanded}
          onPanelToggle={handleInfoPanelToggle}
        />
      </div>
    </div>
  );
}

export default App;
