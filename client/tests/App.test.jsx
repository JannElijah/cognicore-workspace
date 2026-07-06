import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

jest.mock('../utils/apiClient.js', () => ({
  API_BASE: 'http://localhost:5000'
}));

jest.mock('../utils/supabaseClient.js', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } }))
    }
  }
}));

// Mock zustand store to prevent API calls during render
jest.mock('../store/useCogniStore', () => {
  const store = () => ({
    user: null,
    token: null,
    coins: 0,
    totalXp: 0,
    inventory: [],
    reduceFlashes: false,
    cognitiveProfile: { archetype: null, confidence_score: 0 },
    login: jest.fn(),
    logout: jest.fn(),
    setCognitiveProfile: jest.fn(),
    fetchInventory: jest.fn(),
  });
  store.getState = store;
  return {
    __esModule: true,
    default: store
  };
});

describe('App Component', () => {
  it('renders without crashing', () => {
    // Due to the complexity of App.jsx we might need to mock more things
    // For now we do a simple render
    const { container } = render(<App />);
    expect(container).toBeInTheDocument();
  });
});
