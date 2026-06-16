import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import styled from 'styled-components';
import { brainRegions } from '../data/brainRegions';

const CanvasContainer = styled.div`
  width: 100%;
  height: 100vh;
  position: relative;
`;

function BrainModel(props) {
  const { scene } = useGLTF('/brain.glb');
  return <primitive object={scene} scale={18} {...props} />;
}

const Hotspots = ({ onRegionClick, selectedRegion, setHovered, hovered }) => (
  <group>
    {brainRegions.map(region => (
      <mesh
        key={region.id}
        position={region.hotspot}
        onPointerOver={() => setHovered(region.id)}
        onPointerOut={() => setHovered(null)}
        onClick={() => onRegionClick(region)}
        visible={true}
      >
        <sphereGeometry args={[region.size * 0.7, 32, 32]} />
        <meshStandardMaterial
          color={region.color}
          transparent
          opacity={0.4}
          emissive={region.color}
          emissiveIntensity={0.15}
        />
      </mesh>
    ))}
  </group>
);

const BrainMap = ({ onRegionClick, selectedRegion }) => {
  const [hovered, setHovered] = useState(null);
  return (
    <CanvasContainer>
      <Canvas camera={{ position: [0, 0, 55], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Suspense fallback={null}>
          <BrainModel />
          <Hotspots
            onRegionClick={onRegionClick}
            selectedRegion={selectedRegion}
            setHovered={setHovered}
            hovered={hovered}
          />
        </Suspense>
        <OrbitControls enablePan enableZoom enableRotate target={[0,0,0]} />
      </Canvas>
    </CanvasContainer>
  );
};

export default BrainMap; 