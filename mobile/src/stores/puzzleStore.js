import { create } from 'zustand';
import api from '../services/api';

export const usePuzzleStore = create((set, get) => ({
  puzzles: [],
  currentPuzzle: null,
  loading: false,
  error: null,
  
  // For AR piece collection callback (avoids passing functions in navigation)
  lastCollectedPiece: null,
  pieceCollectionTimestamp: null,

  // Called from ARCameraScreen when a piece is collected
  notifyPieceCollected: (pieceNumber) => {
    set({ 
      lastCollectedPiece: pieceNumber,
      pieceCollectionTimestamp: Date.now()
    });
  },

  // Reset the notification state
  clearPieceNotification: () => {
    set({ lastCollectedPiece: null, pieceCollectionTimestamp: null });
  },

  fetchPuzzles: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/puzzles');
      set({ puzzles: response.data.data || response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchPuzzleById: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/puzzles/${id}`);
      set({ currentPuzzle: response.data.data || response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      // Return mock data for dev mode
      set({
        currentPuzzle: {
          _id: id,
          name: 'Muradid Dynasty Puzzle',
          description: 'Discover the secrets of the Muradid dynasty through this interactive puzzle.',
          type: 'jigsaw',
          difficulty: 'medium',
          timeLimit: 300,
          image: 'https://picsum.photos/400/400',
          reward: { coins: 50, xp: 100 },
          hints: ['Look for patterns in the architecture', 'The year 1613 is significant'],
        },
        loading: false,
      });
    }
  },

  startPuzzle: async (id) => {
    try {
      const response = await api.post(`/puzzles/${id}/start`);
      return response.data;
    } catch (error) {
      console.log('Start puzzle error (dev mode):', error.message);
      return { success: true };
    }
  },

  completePuzzle: async (id, result) => {
    try {
      const response = await api.post(`/puzzles/${id}/complete`, result);
      return response.data;
    } catch (error) {
      console.log('Complete puzzle error (dev mode):', error.message);
      return { success: true, reward: result };
    }
  },
}));
