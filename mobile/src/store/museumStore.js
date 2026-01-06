import { create } from 'zustand';
import { museumAPI, visitAPI, challengeAPI } from '../services/api';
import locationService from '../services/locationService';

export const useMuseumStore = create((set, get) => ({
  // Current location (userLocation is alias for compatibility)
  currentLocation: null,
  userLocation: null,
  locationError: null,

  // Museum data
  museums: [],
  nearbyMuseums: [],
  detectedMuseum: null,
  selectedMuseum: null,

  // Visit data
  activeVisit: null,
  visitHistory: [],

  // Challenge data
  activeChallenge: null,
  
  // Loading states
  isLoadingMuseums: false,
  isLoading: false,
  isDetecting: false,

  // Set current location (both aliases)
  setLocation: (location) => set({ currentLocation: location, userLocation: location, locationError: null }),
  setUserLocation: (location) => set({ currentLocation: location, userLocation: location, locationError: null }),
  setLocationError: (error) => set({ locationError: error }),

  // Fetch all museums
  fetchMuseums: async () => {
    set({ isLoadingMuseums: true });
    try {
      const response = await museumAPI.getAll();
      set({ museums: response.data.data, isLoadingMuseums: false });
    } catch (error) {
      console.error('Error fetching museums:', error);
      set({ isLoadingMuseums: false });
    }
  },

  // Fetch nearby museums
  fetchNearbyMuseums: async (lat, lng, radius = 5000) => {
    const { currentLocation } = get();
    const latitude = lat || currentLocation?.latitude;
    const longitude = lng || currentLocation?.longitude;
    
    if (!latitude || !longitude) {
      console.log('No location available for fetching nearby museums');
      return;
    }

    set({ isLoading: true });
    try {
      const response = await museumAPI.getNearby(latitude, longitude, radius);
      set({ nearbyMuseums: response.data.data || [], isLoading: false });
    } catch (error) {
      console.error('Error fetching nearby museums:', error);
      // Fallback: fetch all museums if nearby fails
      try {
        const allResponse = await museumAPI.getAll();
        set({ nearbyMuseums: allResponse.data.data || [], isLoading: false });
      } catch (fallbackError) {
        console.error('Error fetching all museums:', fallbackError);
        set({ isLoading: false });
      }
    }
  },

  // Detect current museum
  detectMuseum: async () => {
    const { currentLocation } = get();
    if (!currentLocation) {
      set({ detectedMuseum: null });
      return null;
    }

    set({ isDetecting: true });
    try {
      const response = await museumAPI.detect(
        currentLocation.latitude,
        currentLocation.longitude
      );
      
      const result = response.data;
      if (result.detected) {
        set({ detectedMuseum: result.data, isDetecting: false });
        return result.data;
      } else {
        set({ detectedMuseum: null, isDetecting: false });
        return null;
      }
    } catch (error) {
      console.error('Error detecting museum:', error);
      set({ isDetecting: false });
      return null;
    }
  },

  // Select a museum for viewing
  selectMuseum: (museum) => set({ selectedMuseum: museum }),

  // Start a visit
  startVisit: async (museumId) => {
    const { currentLocation } = get();
    try {
      const response = await visitAPI.start({
        museumId,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
      });
      
      set({ activeVisit: response.data.data.visit });
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to start visit';
      return { success: false, error: message };
    }
  },

  // End a visit
  endVisit: async (rating, feedback) => {
    const { activeVisit } = get();
    if (!activeVisit) return { success: false, error: 'No active visit' };

    try {
      const response = await visitAPI.end(activeVisit._id, { rating, feedback });
      set({ activeVisit: null });
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to end visit';
      return { success: false, error: message };
    }
  },

  // Get active visit
  fetchActiveVisit: async () => {
    try {
      const response = await visitAPI.getActive();
      set({ activeVisit: response.data.data });
    } catch (error) {
      console.error('Error fetching active visit:', error);
    }
  },

  // Start a puzzle challenge
  startChallenge: async (beyId) => {
    const { activeVisit, currentLocation, detectedMuseum } = get();
    
    try {
      const response = await challengeAPI.start({
        beyId,
        visitId: activeVisit?._id,
        museumId: detectedMuseum?.museum?._id || activeVisit?.museum,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
      });
      
      set({ activeChallenge: response.data.data.challenge });
      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to start challenge';
      return { success: false, error: message };
    }
  },

  // Collect a puzzle piece
  collectPiece: async (pieceIndex, hotspotName) => {
    const { activeChallenge, currentLocation } = get();
    if (!activeChallenge) return { success: false, error: 'No active challenge' };

    try {
      const response = await challengeAPI.collectPiece(activeChallenge._id, {
        pieceIndex,
        latitude: currentLocation?.latitude,
        longitude: currentLocation?.longitude,
        hotspotName,
      });

      // Update local challenge state
      if (response.data.data.completed) {
        set({ activeChallenge: null });
      } else {
        set((state) => ({
          activeChallenge: {
            ...state.activeChallenge,
            collectedPieces: [
              ...state.activeChallenge.collectedPieces,
              { pieceIndex }
            ],
          },
        }));
      }

      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to collect piece';
      return { success: false, error: message };
    }
  },

  // Use a hint
  useHint: async () => {
    const { activeChallenge } = get();
    if (!activeChallenge) return { success: false, error: 'No active challenge' };

    try {
      const response = await challengeAPI.useHint(activeChallenge._id);
      
      set((state) => ({
        activeChallenge: {
          ...state.activeChallenge,
          hintsUsed: state.activeChallenge.hintsUsed + 1,
        },
      }));

      return { success: true, data: response.data.data };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to use hint';
      return { success: false, error: message };
    }
  },

  // Set active challenge
  setActiveChallenge: (challenge) => set({ activeChallenge: challenge }),

  // Clear detected museum
  clearDetectedMuseum: () => set({ detectedMuseum: null }),

  // Reset store
  reset: () => set({
    currentLocation: null,
    detectedMuseum: null,
    activeVisit: null,
    activeChallenge: null,
  }),
}));
