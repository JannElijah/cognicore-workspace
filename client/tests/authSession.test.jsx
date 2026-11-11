import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  clearLegacyLocalAuth,
  clearSessionAuth,
  getCustomPrescribedGame,
  getStoredToken,
  getStoredUser,
  setCustomPrescribedGame,
  setStoredToken,
  setStoredUser,
} from '../utils/authSession.js';

const mockGetSession = jest.fn();
const mockSignOut = jest.fn();
const mockLogin = jest.fn();
const mockLogout = jest.fn();
const mockFetchInventory = jest.fn();

jest.mock('../utils/apiClient.js', () => ({
  API_BASE: 'http://localhost:5000',
}));

jest.mock('../utils/supabaseClient.js', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      getSession: (...args) => mockGetSession(...args),
      signOut: (...args) => mockSignOut(...args),
    },
  },
}));

jest.mock('../store/useCogniStore', () => {
  const state = {
    user: null,
    token: null,
    coins: 0,
    totalXp: 0,
    inventory: [],
    reduceFlashes: false,
    cognitiveProfile: { archetype: null, confidence_score: 0 },
    login: (...args) => mockLogin(...args),
    logout: (...args) => mockLogout(...args),
    setCognitiveProfile: jest.fn(),
    fetchInventory: (...args) => mockFetchInventory(...args),
  };
  const store = () => state;
  store.getState = () => state;
  store.setState = (patch) => Object.assign(state, patch);
  return {
    __esModule: true,
    default: store,
  };
});

import App from '../App';

describe('Tab-scoped auth session & login-first entry', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    localStorage.clear();
    sessionStorage.clear();
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockSignOut.mockResolvedValue({ error: null });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    localStorage.clear();
    sessionStorage.clear();
  });

  test('authSession stores credentials in sessionStorage and clears legacy localStorage auth only', () => {
    localStorage.setItem('cognicore_user', 'subject_legacy');
    localStorage.setItem('token', 'legacy-jwt');
    localStorage.setItem('cognicore_custom_prescribed', 'PriorityQueue');
    localStorage.setItem('sb-proj-auth-token', '{"access_token":"old"}');
    localStorage.setItem('pwd_highContrast', 'true');
    localStorage.setItem('cognicore_seizure_disclaimer', 'true');

    clearLegacyLocalAuth();

    expect(localStorage.getItem('cognicore_user')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('cognicore_custom_prescribed')).toBeNull();
    expect(localStorage.getItem('sb-proj-auth-token')).toBeNull();
    expect(localStorage.getItem('pwd_highContrast')).toBe('true');
    expect(localStorage.getItem('cognicore_seizure_disclaimer')).toBe('true');

    setStoredUser('alice');
    setStoredToken('tab-jwt');
    setCustomPrescribedGame('MentalFlex');
    expect(getStoredUser()).toBe('alice');
    expect(getStoredToken()).toBe('tab-jwt');
    expect(getCustomPrescribedGame()).toBe('MentalFlex');
    expect(localStorage.getItem('cognicore_user')).toBeNull();

    clearSessionAuth();
    expect(getStoredUser()).toBe('');
    expect(getStoredToken()).toBeNull();
    expect(getCustomPrescribedGame()).toBe('');
  });

  test('ignores leftover localStorage subject session and renders Login/Sign up first', async () => {
    localStorage.setItem('cognicore_user', 'subject_unknown');
    localStorage.setItem('token', 'stale-jwt');
    localStorage.setItem('sb-xyz-auth-token', '{"access_token":"stale"}');

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('TRAINING PORTAL')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Standard Login' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    expect(screen.queryByText('subject_unknown')).not.toBeInTheDocument();
    expect(localStorage.getItem('cognicore_user')).toBeNull();
    expect(localStorage.getItem('sb-xyz-auth-token')).toBeNull();
  });

  test('fails closed back to Login/Sign up when tab session fails backend sync verification', async () => {
    setStoredUser('subject_stale');
    setStoredToken('expired-jwt');
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'expired-jwt',
          user: { user_metadata: { username: 'subject_stale' }, email: 'subject_stale@cognicore.local' },
        },
      },
      error: null,
    });
    global.fetch = jest.fn(async (url) => {
      if (String(url).includes('/api/health')) {
        return { ok: true, json: async () => ({ status: 'ok' }) };
      }
      if (String(url).includes('/api/sync-user')) {
        return { ok: false, status: 401, json: async () => ({ message: 'Token expired' }) };
      }
      return { ok: false, status: 404, json: async () => ({}) };
    });

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(screen.getByText('TRAINING PORTAL')).toBeInTheDocument();
    });
    expect(getStoredUser()).toBe('');
    expect(getStoredToken()).toBeNull();
    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(mockLogout).toHaveBeenCalled();
  });
});
