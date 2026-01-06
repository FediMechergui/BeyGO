import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Vibration,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import { Ionicons } from '@expo/vector-icons';
import * as THREE from 'three';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { useMuseumStore } from '../../store/museumStore';
import { usePuzzleStore } from '../../stores/puzzleStore';

const { width, height } = Dimensions.get('window');

// Calculate bearing between two coordinates
const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const toRad = (deg) => deg * (Math.PI / 180);
  const toDeg = (rad) => rad * (180 / Math.PI);
  
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
            Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  
  let bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
};

// Calculate distance between two coordinates in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => deg * (Math.PI / 180);
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function ARCameraScreen({ route, navigation }) {
  const { challengeId, bey } = route.params || {};
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState(null);
  const [placedCards, setPlacedCards] = useState([]);
  const [planeDetected, setPlaneDetected] = useState(false);
  const [collectedCount, setCollectedCount] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [showCelebration, setShowCelebration] = useState(null);
  
  // Location & Compass state
  const [userLocation, setUserLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  const [compassReady, setCompassReady] = useState(false);
  const [locationError, setLocationError] = useState(null);
  
  // GL state
  const [glReady, setGlReady] = useState(false);
  const glRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const cardsRef = useRef([]);
  const animationRef = useRef(null);
  
  // Animated compass arrow
  const compassRotation = useRef(new Animated.Value(0)).current;
  
  const { collectPiece, activeChallenge } = useMuseumStore();
  const { notifyPieceCollected } = usePuzzleStore();
  
  const sessionTimerRef = useRef(null);
  const locationSubscriptionRef = useRef(null);
  const magnetometerSubscriptionRef = useRef(null);
  const headingSubscriptionRef = useRef(null);

  // Request permissions
  useEffect(() => {
    const requestPermissions = async () => {
      // Camera permission
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
      
      // Location permission
      try {
        const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        
        if (foregroundStatus === 'granted') {
          setLocationPermission(true);
          console.log('✅ Location permission granted');
          
          // Start location tracking
          startLocationTracking();
        } else {
          setLocationPermission(false);
          setLocationError('Location permission denied');
          console.log('❌ Location permission denied');
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
        setLocationError(error.message);
      }
    };
    
    requestPermissions();
    
    return () => {
      stopAllSensors();
    };
  }, []);

  // Start location tracking
  const startLocationTracking = async () => {
    try {
      // Check if location services are enabled
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setLocationError('Location services are disabled. Please enable GPS.');
        Alert.alert(
          'Location Required',
          'Please enable location services (GPS) to use the AR treasure hunt.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Get initial location with high accuracy
      console.log('📍 Getting initial location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
        maximumAge: 5000,
      });
      
      console.log('📍 Initial location:', location.coords);
      setUserLocation(location.coords);
      setLocationError(null);
      
      // Start watching location
      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (newLocation) => {
          console.log('📍 Location update:', newLocation.coords.latitude, newLocation.coords.longitude);
          setUserLocation(newLocation.coords);
          setLocationError(null);
        }
      );
      
      // Start compass (magnetometer)
      startCompass();
      
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setLocationError(error.message);
      
      // Fallback: try with lower accuracy
      try {
        const fallbackLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation(fallbackLocation.coords);
        setLocationError(null);
      } catch (fallbackError) {
        console.error('Fallback location also failed:', fallbackError);
      }
    }
  };

  // Start compass using Location heading (more reliable than DeviceMotion)
  const startCompass = async () => {
    try {
      // Use Location.watchHeadingAsync for compass (most reliable on Android)
      headingSubscriptionRef.current = await Location.watchHeadingAsync((headingData) => {
        // Use trueHeading if available, otherwise magHeading
        const newHeading = headingData.trueHeading >= 0 
          ? headingData.trueHeading 
          : headingData.magHeading;
        setHeading(newHeading);
        setCompassReady(true);
      });
      console.log('🧭 Using Location heading for compass');
    } catch (headingError) {
      console.log('⚠️ Location heading not available, trying Magnetometer');
      
      // Fallback to magnetometer
      try {
        const magnetometerAvailable = await Magnetometer.isAvailableAsync();
        
        if (magnetometerAvailable) {
          Magnetometer.setUpdateInterval(100);
          magnetometerSubscriptionRef.current = Magnetometer.addListener((data) => {
            // Calculate heading from magnetometer
            let angle = Math.atan2(data.y, data.x);
            let newHeading = angle * (180 / Math.PI);
            newHeading = (newHeading + 360) % 360;
            setHeading(newHeading);
            setCompassReady(true);
          });
          console.log('🧭 Using Magnetometer for compass');
        } else {
          console.log('⚠️ No compass available on this device');
          // Set a default heading so the app still works
          setCompassReady(true);
        }
      } catch (magError) {
        console.error('Error starting magnetometer:', magError);
        setCompassReady(true); // Allow app to work without compass
      }
    }
  };

  // Stop all sensors
  const stopAllSensors = () => {
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
    }
    if (magnetometerSubscriptionRef.current) {
      magnetometerSubscriptionRef.current.remove();
    }
    if (headingSubscriptionRef.current) {
      headingSubscriptionRef.current.remove();
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (sessionTimerRef.current) {
      clearInterval(sessionTimerRef.current);
    }
  };

  // Generate card locations around user
  const generateCardLocations = useCallback((userCoords) => {
    if (!userCoords) return;
    
    const cardsToSpawn = 9 - collectedCount;
    const newCards = [];
    
    for (let i = 0; i < cardsToSpawn; i++) {
      const angle = (i / cardsToSpawn) * Math.PI * 2;
      const radius = 0.0001 + Math.random() * 0.0002; // ~10-30 meters
      
      const cardLat = userCoords.latitude + Math.cos(angle) * radius;
      const cardLon = userCoords.longitude + Math.sin(angle) * radius;
      
      const card = {
        id: `card_${i}_${Date.now()}`,
        pieceNumber: i + 1,
        latitude: cardLat,
        longitude: cardLon,
        position: {
          x: Math.cos(angle) * (1.5 + Math.random()),
          y: 0.3,
          z: -Math.sin(angle) * (1.5 + Math.random()),
        },
        isCollectable: false,
        distance: 0,
        bearing: 0,
        scale: 1,
      };
      
      newCards.push(card);
    }
    
    setPlacedCards(newCards);
    setPlaneDetected(true);
  }, [collectedCount]);

  // Update card distances and bearings
  useEffect(() => {
    if (!userLocation || placedCards.length === 0) return;
    
    const updateInterval = setInterval(() => {
      setPlacedCards(prev => prev.map(card => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          card.latitude,
          card.longitude
        );
        
        const bearing = calculateBearing(
          userLocation.latitude,
          userLocation.longitude,
          card.latitude,
          card.longitude
        );
        
        return {
          ...card,
          distance,
          bearing,
          isCollectable: distance < 15, // Within 15 meters
          scale: distance < 15 ? 1.3 : 1,
        };
      }));
    }, 500);
    
    return () => clearInterval(updateInterval);
  }, [userLocation]);

  // Initialize location and cards when location is available
  useEffect(() => {
    if (userLocation && placedCards.length === 0 && cameraPermission?.granted) {
      console.log('🎯 Generating card locations around user');
      generateCardLocations(userLocation);
      
      // Start session timer
      sessionTimerRef.current = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
  }, [userLocation, cameraPermission, generateCardLocations]);

  // Animate compass arrow to nearest card
  useEffect(() => {
    const closestCard = placedCards.reduce((closest, card) => {
      if (!closest || card.distance < closest.distance) return card;
      return closest;
    }, null);
    
    if (closestCard && compassReady) {
      // Calculate relative angle (bearing minus current heading)
      const relativeAngle = (closestCard.bearing - heading + 360) % 360;
      
      Animated.timing(compassRotation, {
        toValue: relativeAngle,
        duration: 200,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  }, [placedCards, heading, compassReady]);

  // Setup Three.js scene
  const onGLContextCreate = async (gl) => {
    console.log('🎮 GL Context created');
    glRef.current = gl;
    
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
    camera.position.set(0, 1.6, 0); // Eye level
    cameraRef.current = camera;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);
    
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(0, 5, 0);
    spotLight.angle = 0.3;
    scene.add(spotLight);
    
    setGlReady(true);
    
    // Start render loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      
      // Animate cards
      const time = Date.now() * 0.001;
      cardsRef.current.forEach((cardGroup, index) => {
        if (cardGroup) {
          // Float animation
          cardGroup.position.y = 0.3 + Math.sin(time * 1.5 + index) * 0.1;
          // Gentle rotation
          cardGroup.rotation.y = Math.sin(time * 0.5 + index) * 0.15;
        }
      });
      
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    
    animate();
  };

  // Create 3D card mesh
  const createCardMesh = (isCollectable = false) => {
    const group = new THREE.Group();
    
    const goldColor = 0xFFD700;
    const darkGoldColor = 0xB8860B;
    const collectableColor = isCollectable ? 0x4CAF50 : goldColor;
    
    // Outer glow
    const glowGeometry = new THREE.CircleGeometry(0.4, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: collectableColor,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.z = -0.02;
    group.add(glow);
    
    // Card border
    const borderGeometry = new THREE.BoxGeometry(0.34, 0.46, 0.015);
    const borderMaterial = new THREE.MeshStandardMaterial({
      color: darkGoldColor,
      metalness: 1,
      roughness: 0.05,
      emissive: darkGoldColor,
      emissiveIntensity: 0.3,
    });
    const border = new THREE.Mesh(borderGeometry, borderMaterial);
    border.position.z = -0.005;
    group.add(border);
    
    // Main card body
    const cardGeometry = new THREE.BoxGeometry(0.3, 0.42, 0.02);
    const cardMaterial = new THREE.MeshStandardMaterial({
      color: goldColor,
      metalness: 0.9,
      roughness: 0.1,
      emissive: darkGoldColor,
      emissiveIntensity: 0.2,
    });
    const card = new THREE.Mesh(cardGeometry, cardMaterial);
    group.add(card);
    
    // Center diamond
    const diamondGeometry = new THREE.PlaneGeometry(0.15, 0.15);
    const diamondMaterial = new THREE.MeshStandardMaterial({
      color: darkGoldColor,
      metalness: 0.8,
      roughness: 0.2,
    });
    const diamond = new THREE.Mesh(diamondGeometry, diamondMaterial);
    diamond.position.set(0, 0.02, 0.012);
    diamond.rotation.z = Math.PI / 4;
    group.add(diamond);
    
    // Corner decorations
    const corners = [[-0.11, 0.17], [0.11, 0.17], [-0.11, -0.17], [0.11, -0.17]];
    corners.forEach(([x, y]) => {
      const cornerGeometry = new THREE.CircleGeometry(0.02, 16);
      const cornerMaterial = new THREE.MeshBasicMaterial({ color: 0xFF4444 });
      const corner = new THREE.Mesh(cornerGeometry, cornerMaterial);
      corner.position.set(x, y, 0.012);
      group.add(corner);
    });
    
    // Collectable indicator
    if (isCollectable) {
      const indicatorGeometry = new THREE.PlaneGeometry(0.2, 0.05);
      const indicatorMaterial = new THREE.MeshBasicMaterial({ color: 0x4CAF50 });
      const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
      indicator.position.set(0, -0.28, 0.012);
      group.add(indicator);
    }
    
    return group;
  };

  // Update 3D scene when cards change
  useEffect(() => {
    if (!sceneRef.current || !glReady) return;
    
    // Remove old cards
    cardsRef.current.forEach(card => {
      if (card && sceneRef.current) {
        sceneRef.current.remove(card);
      }
    });
    cardsRef.current = [];
    
    // Add new cards
    placedCards.forEach((card, index) => {
      const cardMesh = createCardMesh(card.isCollectable);
      cardMesh.position.set(card.position.x, card.position.y, card.position.z);
      cardMesh.scale.setScalar(card.scale || 1);
      sceneRef.current.add(cardMesh);
      cardsRef.current[index] = cardMesh;
    });
  }, [placedCards, glReady]);

  // Handle card collection
  const handleCardCollect = async (card) => {
    if (!card.isCollectable) {
      Alert.alert('Too Far!', `Walk ${Math.round(card.distance)}m closer to collect this card.`);
      return;
    }
    
    console.log('✨ Collecting card:', card.pieceNumber);
    
    // Haptic feedback
    Vibration.vibrate([0, 50, 50, 50, 50, 100]);
    
    // Remove card
    setPlacedCards(prev => prev.filter(c => c.id !== card.id));
    
    // Update state
    setCollectedCount(prev => prev + 1);
    setShowCelebration(card.pieceNumber);
    
    // API call
    try {
      if (challengeId || activeChallenge?._id) {
        await collectPiece(card.pieceNumber, 'AR Camera');
      }
    } catch (error) {
      console.error('Error collecting piece:', error);
    }
    
    notifyPieceCollected(card.pieceNumber);
    
    // Hide celebration
    setTimeout(() => {
      setShowCelebration(null);
    }, 3000);
  };

  // Handle screen tap
  const handleScreenTap = () => {
    if (!planeDetected) return;
    
    const collectableCards = placedCards.filter(c => c.isCollectable);
    if (collectableCards.length > 0) {
      const closestCollectable = collectableCards.reduce((closest, card) => {
        if (!closest || card.distance < closest.distance) return card;
        return closest;
      }, null);
      
      if (closestCollectable) {
        handleCardCollect(closestCollectable);
      }
    }
  };

  // Format time
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Get closest card
  const closestCard = placedCards.reduce((closest, card) => {
    if (!closest || card.distance < closest.distance) return card;
    return closest;
  }, null);

  // Permission screen
  if (!cameraPermission?.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={80} color="#666" />
        <Text style={styles.permissionTitle}>Camera Required</Text>
        <Text style={styles.permissionText}>
          Enable camera access to start AR treasure hunt!
        </Text>
        <TouchableOpacity 
          style={styles.permissionBtn} 
          onPress={requestCameraPermission}
        >
          <Text style={styles.permissionBtnText}>Enable Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Feed */}
      <CameraView 
        style={StyleSheet.absoluteFill} 
        facing="back"
      />
      
      {/* 3D AR Layer using expo-gl */}
      <GLView
        style={StyleSheet.absoluteFill}
        onContextCreate={onGLContextCreate}
      />
      
      {/* Tap overlay */}
      <TouchableOpacity 
        style={StyleSheet.absoluteFill} 
        activeOpacity={1}
        onPress={handleScreenTap}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerTitle}>
          <Text style={styles.titleText}>🎯 AR TREASURE HUNT</Text>
          <Text style={styles.subtitleText}>{bey?.name || 'Find Golden Cards'}</Text>
        </View>
        
        <View style={styles.timerBox}>
          <Ionicons name="time-outline" size={18} color="#FFF" />
          <Text style={styles.timerText}>{formatTime(sessionTime)}</Text>
        </View>
      </View>
      
      {/* Location status */}
      {locationError && (
        <View style={styles.locationError}>
          <Ionicons name="location-outline" size={20} color="#F44336" />
          <Text style={styles.locationErrorText}>{locationError}</Text>
          <TouchableOpacity onPress={startLocationTracking}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Location loading */}
      {!userLocation && !locationError && (
        <View style={styles.loadingLocation}>
          <Ionicons name="locate" size={40} color="#FFD700" />
          <Text style={styles.loadingText}>Getting your location...</Text>
          <Text style={styles.loadingSubtext}>Make sure GPS is enabled</Text>
        </View>
      )}
      
      {/* Detection prompt */}
      {!planeDetected && userLocation && (
        <View style={styles.detectionPrompt}>
          <View style={styles.scanningCircle}>
            <Ionicons name="scan-outline" size={60} color="#FFD700" />
          </View>
          <Text style={styles.detectionText}>
            📱 Setting up AR environment...
          </Text>
          <Text style={styles.detectionSubtext}>
            Cards will appear around you
          </Text>
        </View>
      )}
      
      {/* Compass Navigation to nearest card */}
      {closestCard && planeDetected && compassReady && (
        <View style={styles.compassContainer}>
          <View style={[
            styles.compassRing,
            { borderColor: closestCard.isCollectable ? '#4CAF50' : '#FFD700' }
          ]}>
            <Animated.View style={{
              transform: [{
                rotate: compassRotation.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0deg', '360deg'],
                })
              }]
            }}>
              <Ionicons 
                name="navigate" 
                size={40} 
                color={closestCard.isCollectable ? '#4CAF50' : '#FFD700'} 
              />
            </Animated.View>
          </View>
          <Text style={[
            styles.compassDist,
            { color: closestCard.isCollectable ? '#4CAF50' : '#FFD700' }
          ]}>
            {closestCard.distance < 1000 
              ? `${Math.round(closestCard.distance)}m` 
              : `${(closestCard.distance/1000).toFixed(1)}km`}
          </Text>
          <Text style={styles.compassMsg}>
            {closestCard.isCollectable ? '✨ TAP TO COLLECT!' : '👆 Walk towards arrow'}
          </Text>
          <Text style={styles.compassBearing}>
            {Math.round(closestCard.bearing)}° • Heading: {Math.round(heading)}°
          </Text>
        </View>
      )}
      
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Ionicons name="albums" size={24} color="#FFD700" />
          <Text style={styles.statNum}>{collectedCount}/9</Text>
          <Text style={styles.statLabel}>Collected</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons 
            name="location" 
            size={24} 
            color={userLocation ? '#4CAF50' : '#F44336'} 
          />
          <Text style={styles.statNum}>{placedCards.length}</Text>
          <Text style={styles.statLabel}>Cards</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons 
            name="compass" 
            size={24} 
            color={compassReady ? '#4CAF50' : '#F44336'} 
          />
          <Text style={styles.statNum}>{Math.round(heading)}°</Text>
          <Text style={styles.statLabel}>Heading</Text>
        </View>
        <View style={styles.statBox}>
          <Ionicons name="star" size={24} color="#FFD700" />
          <Text style={styles.statNum}>{collectedCount * 10}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>
      
      {/* Card list */}
      {planeDetected && placedCards.length > 0 && (
        <View style={styles.cardList}>
          <Text style={styles.cardListTitle}>Nearby Cards:</Text>
          {placedCards.slice(0, 3).map((card, index) => (
            <TouchableOpacity 
              key={card.id}
              style={[
                styles.cardItem,
                card.isCollectable && styles.cardItemCollectable
              ]}
              onPress={() => handleCardCollect(card)}
            >
              <Text style={styles.cardItemText}>
                Card #{card.pieceNumber} - {Math.round(card.distance)}m
                {card.isCollectable && ' ✅'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      
      {/* Celebration Overlay */}
      {showCelebration && (
        <View style={styles.celebrationOverlay}>
          <View style={styles.celebrationCard}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.celebrationTitle}>PIECE COLLECTED!</Text>
            <Text style={styles.celebrationPiece}>Golden Card #{showCelebration}</Text>
            <View style={styles.celebrationPoints}>
              <Ionicons name="star" size={28} color="#FFD700" />
              <Text style={styles.celebrationPointsText}>+10 Points</Text>
            </View>
            <Text style={styles.celebrationProgress}>
              {collectedCount}/9 Collected
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  
  // Permission
  permissionContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 20,
  },
  permissionText: {
    fontSize: 16,
    color: '#AAA',
    textAlign: 'center',
    marginTop: 10,
  },
  permissionBtn: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    marginTop: 30,
  },
  permissionBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  
  // Header
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    zIndex: 100,
  },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    alignItems: 'center',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  subtitleText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  
  // Location error
  locationError: {
    position: 'absolute',
    top: 110,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  locationErrorText: {
    color: '#FFF',
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
  retryText: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  
  // Loading location
  loadingLocation: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 15,
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 5,
  },
  
  // Detection prompt
  detectionPrompt: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 50,
  },
  scanningCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    borderColor: '#FFD700',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  detectionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  detectionSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 5,
  },
  
  // Compass
  compassContainer: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 15,
    borderRadius: 20,
    zIndex: 90,
    minWidth: 150,
  },
  compassRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  compassDist: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  compassMsg: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 4,
    textAlign: 'center',
  },
  compassBearing: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  
  // Card list
  cardList: {
    position: 'absolute',
    top: 280,
    left: 15,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    padding: 10,
    zIndex: 80,
  },
  cardListTitle: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  cardItem: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 3,
  },
  cardItemCollectable: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  cardItemText: {
    color: '#FFF',
    fontSize: 11,
  },
  
  // Stats
  statsBar: {
    position: 'absolute',
    bottom: 30,
    left: 15,
    right: 15,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 25,
    paddingVertical: 12,
    zIndex: 80,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 2,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
  },
  
  // Celebration
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  celebrationCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFD700',
  },
  celebrationEmoji: {
    fontSize: 60,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 10,
  },
  celebrationPiece: {
    fontSize: 20,
    color: '#FFD700',
    marginTop: 8,
  },
  celebrationPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
  },
  celebrationPointsText: {
    color: '#FFD700',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  celebrationProgress: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 12,
  },
});
