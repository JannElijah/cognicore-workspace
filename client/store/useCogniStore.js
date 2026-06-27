import { create } from 'zustand';

const useCogniStore = create((set) => ({
  user: null,
  token: null,
  cognitiveProfile: {
    archetype: null,
    confidence_score: 0.0,
  },
  
  login: (userData, token) => set({ user: userData, token }),
  
  logout: () => set({ user: null, token: null, cognitiveProfile: { archetype: null, confidence_score: 0.0 } }),
  
  setCognitiveProfile: (profileData) => set({ cognitiveProfile: profileData }),
}));

export default useCogniStore;
