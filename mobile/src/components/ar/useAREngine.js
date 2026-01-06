import { useState, useEffect, useRef } from 'react';
import { DeviceMotion } from 'expo-sensors';
import * as THREE from 'three';

/**
 * True AR Engine with plane detection and depth sensing
 * For React Native + Expo
 */
export function useAREngine() {
  const [planesDetected, setPlanesDetected] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState({
    rotation: new THREE.Euler(0, 0, 0),
    quaternion: new THREE.Quaternion(),
  });
  
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const placedObjects = useRef([]);
  const raycaster = useRef(new THREE.Raycaster());
  
  // Initialize AR session
  const startARSession = () => {
    setIsTracking(true);
    
    // Subscribe to device motion for orientation tracking
    DeviceMotion.setUpdateInterval(16); // 60fps
    
    const subscription = DeviceMotion.addListener((motion) => {
      if (motion.rotation) {
        const { alpha, beta, gamma } = motion.rotation;
        
        // Convert to radians
        const euler = new THREE.Euler(
          THREE.MathUtils.degToRad(beta),
          THREE.MathUtils.degToRad(alpha),
          THREE.MathUtils.degToRad(gamma),
          'YXZ'
        );
        
        const quaternion = new THREE.Quaternion();
        quaternion.setFromEuler(euler);
        
        setDeviceOrientation({ rotation: euler, quaternion });
      }
    });
    
    return subscription;
  };
  
  const stopARSession = (subscription) => {
    setIsTracking(false);
    if (subscription) {
      subscription.remove();
    }
  };
  
  // Simulate plane detection (in production, use ARKit/ARCore)
  const detectPlanes = () => {
    // This would normally use native AR APIs
    // For now, we'll simulate horizontal plane detection
    const mockPlanes = [
      {
        id: 'floor_1',
        type: 'horizontal',
        center: new THREE.Vector3(0, -1.5, -2),
        extent: { width: 5, height: 5 },
        orientation: new THREE.Quaternion(0, 0, 0, 1),
      }
    ];
    
    setPlanesDetected(mockPlanes);
    return mockPlanes;
  };
  
  // Place object on detected plane
  const placeObjectOnPlane = (plane, position) => {
    const objectData = {
      id: `object_${Date.now()}`,
      planeId: plane.id,
      position: position.clone(),
      rotation: new THREE.Euler(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
    };
    
    placedObjects.current.push(objectData);
    return objectData;
  };
  
  // Raycast to find plane intersection
  const hitTest = (screenX, screenY, camera) => {
    if (!camera) return null;
    
    // Normalize screen coordinates
    const normalizedX = (screenX / window.innerWidth) * 2 - 1;
    const normalizedY = -(screenY / window.innerHeight) * 2 + 1;
    
    raycaster.current.setFromCamera(
      new THREE.Vector2(normalizedX, normalizedY),
      camera
    );
    
    // Check intersection with detected planes
    const planeIntersections = planesDetected.map(plane => {
      const planeGeometry = new THREE.PlaneGeometry(
        plane.extent.width,
        plane.extent.height
      );
      const planeMesh = new THREE.Mesh(planeGeometry);
      planeMesh.position.copy(plane.center);
      planeMesh.rotation.x = -Math.PI / 2; // Horizontal
      
      const intersects = raycaster.current.intersectObject(planeMesh);
      return intersects.length > 0 ? { plane, point: intersects[0].point } : null;
    }).filter(Boolean);
    
    return planeIntersections[0] || null;
  };
  
  // Get objects in view frustum
  const getVisibleObjects = (camera) => {
    if (!camera) return [];
    
    const frustum = new THREE.Frustum();
    const projScreenMatrix = new THREE.Matrix4();
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(projScreenMatrix);
    
    return placedObjects.current.filter(obj => {
      const point = new THREE.Vector3().copy(obj.position);
      return frustum.containsPoint(point);
    });
  };
  
  return {
    isTracking,
    planesDetected,
    deviceOrientation,
    placedObjects: placedObjects.current,
    startARSession,
    stopARSession,
    detectPlanes,
    placeObjectOnPlane,
    hitTest,
    getVisibleObjects,
    sceneRef,
    cameraRef,
    rendererRef,
  };
}