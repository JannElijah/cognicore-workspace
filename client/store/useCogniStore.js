import { create } from 'zustand';

const useCogniStore = create((set) => ({
  user: null,
  token: null,
  coins: 0,
  inventory: [],
  cognitiveProfile: {
    archetype: null,
    confidence_score: 0.0,
  },
  
  login: (userData, token) => set({ user: userData, token }),
  
  logout: () => set({ user: null, token: null, coins: 0, inventory: [], cognitiveProfile: { archetype: null, confidence_score: 0.0 } }),
  
  setCognitiveProfile: (profileData) => set({ cognitiveProfile: profileData }),

  fetchInventory: async () => {
    const state = useCogniStore.getState();
    if (!state.user || !state.token) return;
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/user-inventory/${state.user}`, {
        headers: { 'Authorization': `Bearer ${state.token}` }
      });
      const data = await res.json();
      if (data.status === 'success') {
        set({ coins: data.coins, inventory: data.inventory });
      }
    } catch (e) {
      console.error('Failed to fetch inventory:', e);
    }
  }
}));

export default useCogniStore;
