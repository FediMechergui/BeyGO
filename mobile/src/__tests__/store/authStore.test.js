import { useAuthStore } from '../../store/authStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Mock API
jest.mock('../../services/api', () => ({
  post: jest.fn(),
  get: jest.fn(),
  defaults: { headers: { common: {} } },
}));

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('initializes with default state', () => {
    const state = useAuthStore.getState();
    
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('sets loading state correctly', () => {
    const { setLoading } = useAuthStore.getState();
    
    setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
    
    setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('sets error state correctly', () => {
    const { setError } = useAuthStore.getState();
    
    setError('Test error');
    expect(useAuthStore.getState().error).toBe('Test error');
  });

  it('clears error state', () => {
    useAuthStore.setState({ error: 'Existing error' });
    
    const { clearError } = useAuthStore.getState();
    clearError();
    
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('updates user profile', () => {
    useAuthStore.setState({
      user: { id: '1', name: 'Test User', email: 'test@test.com' },
    });

    const { updateUser } = useAuthStore.getState();
    updateUser({ name: 'Updated Name' });

    const state = useAuthStore.getState();
    expect(state.user.name).toBe('Updated Name');
    expect(state.user.email).toBe('test@test.com');
  });

  it('handles logout correctly', async () => {
    useAuthStore.setState({
      user: { id: '1', name: 'Test User' },
      token: 'test-token',
      isAuthenticated: true,
    });

    const { logout } = useAuthStore.getState();
    await logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
