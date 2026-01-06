import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';

/**
 * 3D Golden Collectible Card with animations
 * React Native compatible - no DOM dependencies
 */
export function GoldenCard3D({ 
  position = [0, 0, 0], 
  pieceNumber = 1,
  isCollectable = false,
  onCollect,
  scale = 1 
}) {
  const groupRef = useRef();
  const glowRef = useRef();
  
  const goldColor = 0xFFD700;
  const darkGoldColor = 0xB8860B;
  const collectableColor = isCollectable ? 0x4CAF50 : goldColor;
  
  // Floating animation
  useFrame(({ clock }) => {
    if (groupRef.current) {
      const time = clock.getElapsedTime();
      
      // Float up and down
      groupRef.current.position.y = position[1] + Math.sin(time * 1.5) * 0.1;
      
      // Gentle rotation
      groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.15;
      
      // Pulse when collectable
      if (isCollectable) {
        const pulse = 1 + Math.sin(time * 3) * 0.1;
        groupRef.current.scale.setScalar(scale * pulse);
      }
    }
    
    // Glow animation
    if (glowRef.current && glowRef.current.material) {
      const glowIntensity = 0.3 + Math.sin(clock.getElapsedTime() * 2) * 0.2;
      glowRef.current.material.opacity = glowIntensity;
    }
  });
  
  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Outer glow ring */}
      <mesh ref={glowRef} position={[0, 0, -0.02]}>
        <circleGeometry args={[0.4, 32]} />
        <meshBasicMaterial
          color={collectableColor}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Card border/frame */}
      <mesh position={[0, 0, -0.005]}>
        <boxGeometry args={[0.34, 0.46, 0.015]} />
        <meshStandardMaterial
          color={darkGoldColor}
          metalness={1}
          roughness={0.05}
          emissive={darkGoldColor}
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Main card body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.3, 0.42, 0.02]} />
        <meshStandardMaterial
          color={goldColor}
          metalness={0.9}
          roughness={0.1}
          emissive={darkGoldColor}
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Center diamond shape */}
      <mesh position={[0, 0.02, 0.012]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.15, 0.15]} />
        <meshStandardMaterial
          color={darkGoldColor}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Diamond shine highlight */}
      <mesh position={[0, 0.05, 0.013]} rotation={[0, 0, Math.PI / 4]}>
        <planeGeometry args={[0.06, 0.06]} />
        <meshBasicMaterial
          color={0xFFFFFF}
          transparent
          opacity={0.4}
        />
      </mesh>
      
      {/* Corner decorations */}
      {[[-0.11, 0.17], [0.11, 0.17], [-0.11, -0.17], [0.11, -0.17]].map(([x, y], i) => (
        <group key={i} position={[x, y, 0.012]}>
          <mesh>
            <circleGeometry args={[0.02, 16]} />
            <meshBasicMaterial color={0xFF4444} />
          </mesh>
          <mesh position={[0, 0, 0.001]}>
            <ringGeometry args={[0.018, 0.025, 16]} />
            <meshBasicMaterial color={goldColor} />
          </mesh>
        </group>
      ))}
      
      {/* Holographic shimmer layer */}
      <mesh position={[0, 0, 0.011]}>
        <planeGeometry args={[0.28, 0.4]} />
        <meshBasicMaterial
          transparent
          opacity={0.15}
          color={0xFFFFFF}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Particle sparkles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={30}
            array={new Float32Array(
              Array.from({ length: 90 }, () => 
                (Math.random() - 0.5) * 0.6
              )
            )}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.015}
          color={collectableColor}
          transparent
          opacity={0.7}
          sizeAttenuation
        />
      </points>
      
      {/* Collectable indicator */}
      {isCollectable && (
        <mesh position={[0, -0.28, 0.012]}>
          <planeGeometry args={[0.2, 0.05]} />
          <meshBasicMaterial color={0x4CAF50} />
        </mesh>
      )}
    </group>
  );
}

export default GoldenCard3D;