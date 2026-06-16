import React, { useState } from 'react';
import styled from 'styled-components';
import BrainMap from './components/BrainMap';
import InfoPanel from './components/InfoPanel';

const AppContainer = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  position: relative;
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(227, 240, 252, 0.7); /* very pale blue overlay for translucency */
  pointer-events: none;
  z-index: 0;
`;

const CenteredBrainMap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100vh;
`;

const Sidebar = styled.div`
  width: clamp(300px, 30vw, 420px);
  height: 100vh;
  box-sizing: border-box;
  @media (max-width: 700px) {
    width: 100vw;
    min-width: 0;
    max-width: 100vw;
    padding: 8px;
  }
`;

const App = () => {
  const [selectedRegion, setSelectedRegion] = useState(null);

  const handleRegionClick = (region) => {
    setSelectedRegion(region);
  };

  // Hide InfoPanel when clicking outside brain model
  const handleAppClick = () => {
    setSelectedRegion(null);
  };

  return (
    <AppContainer onClick={handleAppClick}>
      <Overlay />
      <CenteredBrainMap onClick={e => e.stopPropagation()}>
        <BrainMap onRegionClick={handleRegionClick} selectedRegion={selectedRegion} />
      </CenteredBrainMap>
      <Sidebar onClick={e => e.stopPropagation()}>
        <InfoPanel selectedRegion={selectedRegion} />
      </Sidebar>
    </AppContainer>
  );
};

export default App; 