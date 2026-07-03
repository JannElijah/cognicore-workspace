import { API_BASE } from '../utils/apiClient.js';
import { create } from 'zustand';

const useCogniStore = create((set) => ({
  user: null,
  token: null,
  coins: 0,
  totalXp: 0,
  inventory: [],
  reduceFlashes: false,
  cognitiveProfile: {
    archetype: null,
    confidence_score: 0.0,
  },
  
  login: (userData, token) => set({ user: userData, token }),
  
  logout: () => set({ user: null, token: null, coins: 0, totalXp: 0, inventory: [], reduceFlashes: false, cognitiveProfile: { archetype: null, confidence_score: 0.0 } }),
  
  setCognitiveProfile: (profileData) => set({ cognitiveProfile: profileData }),

  fetchInventory: async () => {
    const state = useCogniStore.getState();
    if (!state.user || !state.token) return;
    try {
      const username = typeof state.user === 'string' ? state.user : state.user.username;
      const res = await fetch(`${API_BASE}/api/user-inventory/${username}`, {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        set({ coins: data.coins, totalXp: data.total_xp, inventory: data.inventory, reduceFlashes: data.reduce_flashes });
      }
    } catch (e) {
      console.error('Failed to fetch inventory:', e);
    }
  }
}));

export default useCogniStore;
