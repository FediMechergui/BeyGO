import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const useProgressStore = create(
  persist(
    (set, get) => ({
      coins: 0,
      xp: 0,
      level: 1,
      achievements: [],
      collectedPieces: [],
      completedPuzzles: [],
      visitedMuseums: [],
      loading: false,

      addCoins: (amount) => {
        set((state) => ({ coins: state.coins + amount }));
      },

      addXp: (amount) => {
        const newXp = get().xp + amount;
        const newLevel = Math.floor(newXp / 1000) + 1;
        set({ xp: newXp, level: newLevel });
      },

      collectPiece: (puzzleId, pieceNumber) => {
        set((state) => ({
          collectedPieces: [
            ...state.collectedPieces,
            { puzzleId, pieceNumber, collectedAt: new Date().toISOString() },
          ],
        }));
      },

      completePuzzle: (puzzleId) => {
        set((state) => ({
          completedPuzzles: [
            ...state.completedPuzzles,
            { puzzleId, completedAt: new Date().toISOString() },
          ],
        }));
      },

      visitMuseum: (museumId) => {
        if (!get().visitedMuseums.includes(museumId)) {
          set((state) => ({
            visitedMuseums: [...state.visitedMuseums, museumId],
          }));
        }
      },

      unlockAchievement: (achievement) => {
        if (!get().achievements.find((a) => a.id === achievement.id)) {
          set((state) => ({
            achievements: [...state.achievements, { ...achievement, unlockedAt: new Date().toISOString() }],
          }));
        }
      },

      syncWithServer: async () => {
        set({ loading: true });
        try {
          const response = await api.get('/progress');
          const serverData = response.data.data || response.data;
          set({
            coins: serverData.coins || get().coins,
            xp: serverData.xp || get().xp,
            level: serverData.level || get().level,
            achievements: serverData.achievements || get().achievements,
            loading: false,
          });
        } catch (error) {
          console.log('Sync error (offline mode):', error.message);
          set({ loading: false });
        }
      },

      reset: () => {
        set({
          coins: 0,
          xp: 0,
          level: 1,
          achievements: [],
          collectedPieces: [],
          completedPuzzles: [],
          visitedMuseums: [],
        });
      },
    }),
    {
      name: 'beygo-progress',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
