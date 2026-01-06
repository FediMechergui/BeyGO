import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Platform, Dimensions, LogBox } from 'react-native';
import { GLView } from 'expo-gl';
import * as THREE from 'three';
import { Renderer, TextureLoader } from 'expo-three';
import { colors } from '../../theme';
import config from '../../config/env';

// Suppress three.js deprecation warning (this is from the library, not our code)
LogBox.ignoreLogs(['Scripts "build/three.js"']);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Gold card appearance settings
const GOLD_CARD_CONFIG = {
  baseColor: 0xd4af37, // Rich gold
  accentColor: 0xffd700, // Bright gold
  emissiveColor: 0x442200, // Warm glow
  shininess: 200,
  cardWidth: 0.85, // Credit card proportions
  cardHeight: 1.35,
  cardDepth: 0.08,
  cornerRadius: 0.08,
};

/**
 * AR 3D Model Renderer using Three.js
 * Renders 3D objects overlay on AR camera view
 */
export default function AR3DRenderer({
  model,
  position = { x: 0, y: 0, z: -5 },
  rotation = { x: 0, y: 0, z: 0 },
  scale = 1,
  animate = true,
  onLoad,
  onError,
  style,
}) {
  const [isReady, setIsReady] = useState(false);
  const timeoutRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const animationRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  const onContextCreate = async (gl) => {
    try {
      // Create renderer
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0x000000, 0); // Transparent background
      rendererRef.current = renderer;

      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );
      camera.position.z = 5;
      cameraRef.current = camera;

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);

      const pointLight = new THREE.PointLight(0xc8a45c, 1, 100);
      pointLight.position.set(0, 2, 2);
      scene.add(pointLight);

      // Create 3D object based on model type
      const mesh = createARObject(model, scale);
      mesh.position.set(position.x, position.y, position.z);
      mesh.rotation.set(rotation.x, rotation.y, rotation.z);
      meshRef.current = mesh;
      scene.add(mesh);

      // Add particle effects
      const particles = createParticleSystem();
      scene.add(particles);

      setIsReady(true);
      onLoad?.();

      // Animation loop
      const animate = () => {
        animationRef.current = requestAnimationFrame(animate);

        if (meshRef.current && animate) {
          // Floating animation
          meshRef.current.rotation.y += 0.01;
          meshRef.current.position.y = position.y + Math.sin(Date.now() * 0.002) * 0.2;
        }

        // Rotate particles
        particles.rotation.y += 0.002;

        renderer.render(scene, camera);
        gl.endFrameEXP();
      };

      animate();
    } catch (error) {
      console.error('AR 3D Renderer Error:', error);
      onError?.(error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <GLView
        style={StyleSheet.absoluteFill}
        onContextCreate={onContextCreate}
      />
    </View>
  );
}

// Create AR object based on model type
function createARObject(model, scale) {
  let geometry;
  let material;

  switch (model?.type) {
    case 'bey_spirit':
      // Create a stylized crown/turban shape
      geometry = new THREE.ConeGeometry(1, 2, 8);
      material = new THREE.MeshPhongMaterial({
        color: 0xc8a45c, // Gold color
        shininess: 100,
        emissive: 0x332200,
      });
      break;

    case 'artifact':
      // Create a decorative vase shape
      geometry = new THREE.LatheGeometry(createVaseProfile(), 32);
      material = new THREE.MeshPhongMaterial({
        color: 0x8b4513,
        shininess: 80,
      });
      break;

    case 'coin':
      // Create coin shape
      geometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
      material = new THREE.MeshPhongMaterial({
        color: 0xffd700,
        shininess: 150,
        emissive: 0x332200,
      });
      break;

    case 'document':
      // Create scroll shape
      geometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 16);
      material = new THREE.MeshPhongMaterial({
        color: 0xf4e4ba,
        shininess: 30,
      });
      break;

    case 'puzzle_piece':
    case 'gold_card':
    default:
      // Create a stylized 3D Gold Card (like Sketchfab model)
      return createGoldCardModel(scale);
  }

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(scale, scale, scale);

  return mesh;
}

// Create beautiful 3D gold card model
function createGoldCardModel(scale) {
  const group = new THREE.Group();
  
  const { cardWidth, cardHeight, cardDepth, baseColor, accentColor, emissiveColor, shininess } = GOLD_CARD_CONFIG;
  
  // Main card body with rounded corners (using shape + extrude)
  const shape = new THREE.Shape();
  const radius = 0.08;
  shape.moveTo(-cardWidth/2 + radius, -cardHeight/2);
  shape.lineTo(cardWidth/2 - radius, -cardHeight/2);
  shape.quadraticCurveTo(cardWidth/2, -cardHeight/2, cardWidth/2, -cardHeight/2 + radius);
  shape.lineTo(cardWidth/2, cardHeight/2 - radius);
  shape.quadraticCurveTo(cardWidth/2, cardHeight/2, cardWidth/2 - radius, cardHeight/2);
  shape.lineTo(-cardWidth/2 + radius, cardHeight/2);
  shape.quadraticCurveTo(-cardWidth/2, cardHeight/2, -cardWidth/2, cardHeight/2 - radius);
  shape.lineTo(-cardWidth/2, -cardHeight/2 + radius);
  shape.quadraticCurveTo(-cardWidth/2, -cardHeight/2, -cardWidth/2 + radius, -cardHeight/2);
  
  const extrudeSettings = {
    depth: cardDepth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
  };
  
  const cardGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  const cardMaterial = new THREE.MeshPhongMaterial({
    color: baseColor,
    shininess: shininess,
    emissive: emissiveColor,
    specular: 0xffffcc,
  });
  const cardMesh = new THREE.Mesh(cardGeometry, cardMaterial);
  group.add(cardMesh);
  
  // Decorative border frame
  const borderGeometry = new THREE.RingGeometry(
    Math.min(cardWidth, cardHeight) * 0.35,
    Math.min(cardWidth, cardHeight) * 0.4,
    32
  );
  const borderMaterial = new THREE.MeshPhongMaterial({
    color: accentColor,
    shininess: 250,
    emissive: 0x331100,
    side: THREE.DoubleSide,
  });
  const borderMesh = new THREE.Mesh(borderGeometry, borderMaterial);
  borderMesh.position.z = cardDepth + 0.01;
  group.add(borderMesh);
  
  // Central emblem (star/crown shape)
  const emblemGeometry = new THREE.ConeGeometry(0.15, 0.25, 8);
  const emblemMaterial = new THREE.MeshPhongMaterial({
    color: accentColor,
    shininess: 300,
    emissive: 0x442200,
  });
  const emblemMesh = new THREE.Mesh(emblemGeometry, emblemMaterial);
  emblemMesh.position.z = cardDepth + 0.05;
  emblemMesh.rotation.x = Math.PI;
  group.add(emblemMesh);
  
  // Small gem accents at corners
  const gemGeometry = new THREE.OctahedronGeometry(0.05, 0);
  const gemMaterial = new THREE.MeshPhongMaterial({
    color: 0xff4444,
    shininess: 400,
    emissive: 0x330000,
  });
  
  const gemPositions = [
    [-cardWidth/2 + 0.12, cardHeight/2 - 0.12],
    [cardWidth/2 - 0.12, cardHeight/2 - 0.12],
    [-cardWidth/2 + 0.12, -cardHeight/2 + 0.12],
    [cardWidth/2 - 0.12, -cardHeight/2 + 0.12],
  ];
  
  gemPositions.forEach(([x, y]) => {
    const gem = new THREE.Mesh(gemGeometry, gemMaterial);
    gem.position.set(x, y, cardDepth + 0.03);
    group.add(gem);
  });
  
  // Add shimmer effect plane
  const shimmerGeometry = new THREE.PlaneGeometry(cardWidth * 0.9, cardHeight * 0.9);
  const shimmerMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.1,
    blending: THREE.AdditiveBlending,
  });
  const shimmerMesh = new THREE.Mesh(shimmerGeometry, shimmerMaterial);
  shimmerMesh.position.z = cardDepth + 0.015;
  group.add(shimmerMesh);
  
  group.scale.set(scale, scale, scale);
  return group;
}

// Create vase profile for lathe geometry
function createVaseProfile() {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const t = i / 9;
    const r = 0.3 + Math.sin(t * Math.PI) * 0.4 + Math.sin(t * Math.PI * 2) * 0.1;
    points.push(new THREE.Vector2(r, t * 2 - 1));
  }
  return points;
}

// Create puzzle piece shape
function createPuzzlePieceShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(1, 0);
  shape.bezierCurveTo(1.2, 0.3, 1.2, 0.7, 1, 1);
  shape.lineTo(0, 1);
  shape.bezierCurveTo(-0.2, 0.7, -0.2, 0.3, 0, 0);
  return shape;
}

// Create particle system for magical effect
function createParticleSystem() {
  const particleCount = 100;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

    // Gold/amber particles
    colors[i * 3] = 0.8 + Math.random() * 0.2;
    colors[i * 3 + 1] = 0.6 + Math.random() * 0.3;
    colors[i * 3 + 2] = 0.2 + Math.random() * 0.2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.1,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
  });

  return new THREE.Points(geometry, material);
}

// Bey Spirit specific model
export function BeySpirit3D({ bey, scale = 1, ...props }) {
  const model = {
    type: 'bey_spirit',
    bey,
  };

  return <AR3DRenderer model={model} scale={scale} {...props} />;
}

// Historical Artifact model
export function Artifact3D({ artifact, scale = 1, ...props }) {
  const model = {
    type: 'artifact',
    artifact,
  };

  return <AR3DRenderer model={model} scale={scale} {...props} />;
}

// Beylical Coin model
export function Coin3D({ coin, scale = 1, ...props }) {
  const model = {
    type: 'coin',
    coin,
  };

  return <AR3DRenderer model={model} scale={scale} {...props} />;
}

// Puzzle Piece model (now renders as gold card)
export function PuzzlePiece3D({ pieceIndex, scale = 1, ...props }) {
  const model = {
    type: 'gold_card',
    pieceIndex,
  };

  return <AR3DRenderer model={model} scale={scale} {...props} />;
}

// Gold Card collectible model
export function GoldCard3D({ pieceIndex, scale = 1, ...props }) {
  const model = {
    type: 'gold_card',
    pieceIndex,
  };

  return <AR3DRenderer model={model} scale={scale} {...props} />;
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});
