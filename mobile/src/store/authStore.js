import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI, userAPI } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Load user from storage on app start
  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userString = await AsyncStorage.getItem('user');

      if (token && userString) {
        const user = JSON.parse(userString);
        set({ user, token, isAuthenticated: true });
        
        // Verify token is still valid
        try {
          const response = await authAPI.getMe();
          set({ user: response.data.data });
        } catch (error) {
          // Token invalid, clear storage
          await get().logout();
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  },

  // Register
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(userData);
      const { token, user } = response.data.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      set({ user, token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Logout
  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  // Update user data
  updateUser: (userData) => {
    set((state) => ({
      user: { ...state.user, ...userData },
    }));
    AsyncStorage.setItem('user', JSON.stringify(get().user));
  },

  // Verify student
  verifyStudent: async (studentId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.verifyStudent(studentId);
      const user = response.data.data;
      
      set({ user, isLoading: false });
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Refresh user profile
  refreshProfile: async () => {
    try {
      const response = await userAPI.getProfile();
      const user = response.data.data;
      set({ user });
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Set loading state (for testing)
  setLoading: (isLoading) => set({ isLoading }),

  // Set error state (for testing)
  setError: (error) => set({ error }),
}));
