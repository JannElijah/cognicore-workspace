import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('../store/useCogniStore', () => {
  const state = { user: null, token: null };
  const useStore = (selector) => (typeof selector === 'function' ? selector(state) : state);
  useStore.getState = () => state;
  useStore.setState = (partial) => Object.assign(state, partial);
  return {
    __esModule: true,
    default: useStore
  };
});

import useCogniStore from '../store/useCogniStore';
import AppNavigation from '../components/AppNavigation';
import IsoEvaluationModal from '../components/IsoEvaluationModal';

jest.mock('../utils/supabaseClient', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(() => Promise.resolve({ error: null }))
    }
  }
}));

const buildNavProps = (overrides = {}) => ({
  currentUser: 'promoted_admin',
  setCurrentUser: jest.fn(),
  portalView: 'participant',
  setPortalView: jest.fn(),
  setShowProfileModal: jest.fn(),
  setShowLeaderboard: jest.fn(),
  activeGame: null,
  setActiveGame: jest.fn(),
  showDashboard: false,
  setShowDashboard: jest.fn(),
  coins: 100,
  totalXp: 250,
  currentLevel: 2,
  dailyRewardData: null,
  xpPercent: 50,
  inventory: [],
  globalMuted: false,
  setGlobalMuted: jest.fn(),
  audioDda: false,
  setShowShop: jest.fn(),
  showSoundTuner: false,
  setShowSoundTuner: jest.fn(),
  isMobile: false,
  ...overrides
});

describe('Role-based Admin menu visibility (AppNavigation)', () => {
  afterEach(() => {
    useCogniStore.setState({ user: null, token: null });
    jest.restoreAllMocks();
  });

  it('shows Admin Dashboard for non-allowlisted username when backend role/is_admin is admin', () => {
    const setPortalView = jest.fn();
    useCogniStore.setState({
      user: { id: 'u-admin', username: 'promoted_admin', role: 'admin', is_admin: true },
      token: 'jwt-admin'
    });

    render(<AppNavigation {...buildNavProps({ currentUser: 'promoted_admin', setPortalView })} />);

    // Mobile drawer item should render Admin Dashboard immediately when isAdmin is true
    expect(screen.getAllByRole('button', { name: /Admin Dashboard/i })).toHaveLength(1);

    // Open desktop portal switcher dropdown (first button is desktop switcher, second is mobile drawer)
    fireEvent.click(screen.getAllByRole('button', { name: /Participant Portal/i })[0]);

    const adminButtons = screen.getAllByRole('button', { name: /Admin Dashboard/i });
    expect(adminButtons).toHaveLength(2);

    fireEvent.click(adminButtons[0]);
    expect(setPortalView).toHaveBeenCalledWith('admin');
  });

  it('hides Admin Dashboard for legacy allowlisted usernames when role is participant', () => {
    useCogniStore.setState({
      user: { id: 'u-part', username: 'alyhomie', role: 'participant', is_admin: false },
      token: 'jwt-part'
    });

    render(<AppNavigation {...buildNavProps({ currentUser: 'alyhomie' })} />);

    fireEvent.click(screen.getAllByRole('button', { name: /Participant Portal/i })[0]);
    expect(screen.queryByRole('button', { name: /Admin Dashboard/i })).toBeNull();
  });
});

describe('IsoEvaluationModal', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  it('loads summary, submits Likert scores to POST /api/iso-evaluations, and invokes onSubmitted', async () => {
    const onClose = jest.fn();
    const onSubmitted = jest.fn();

    const initialSummary = {
      avg_functionality: 4.0,
      avg_usability: 4.5,
      avg_reliability: 4.2,
      avg_efficiency: 4.4,
      avg_ux: 4.6,
      count: 5
    };
    const updatedSummary = {
      avg_functionality: 4.2,
      avg_usability: 4.6,
      avg_reliability: 4.3,
      avg_efficiency: 4.5,
      avg_ux: 4.7,
      count: 6
    };

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', summary: initialSummary })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ status: 'success', message: 'ISO 25010 evaluation recorded successfully.' })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', summary: updatedSummary })
      });

    global.fetch = fetchMock;

    render(<IsoEvaluationModal isOpen onClose={onClose} onSubmitted={onSubmitted} />);

    await waitFor(() => {
      expect(screen.getByText(/Cohort Mean: 4\.34 \/ 5\.00 \(5 evaluations\)/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Functional Suitability 4 out of 5' }));
    fireEvent.click(screen.getByRole('button', { name: 'Usability & Learnability 3 out of 5' }));

    fireEvent.click(screen.getByRole('button', { name: /Submit Evaluation/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('ISO 25010 evaluation recorded successfully.');
    });

    expect(onSubmitted).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/\/api\/iso-evaluations$/),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          functionality_score: 4,
          usability_score: 3,
          reliability_score: 5,
          efficiency_score: 5,
          ux_score: 5
        })
      })
    );
    expect(screen.getByText(/Cohort Mean: 4\.46 \/ 5\.00 \(6 evaluations\)/i)).toBeInTheDocument();
  });

  it('displays server error when POST /api/iso-evaluations fails', async () => {
    const onSubmitted = jest.fn();

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'success', summary: { count: 0 } })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ status: 'error', message: 'Authentication token missing.' })
      });

    render(<IsoEvaluationModal isOpen onClose={jest.fn()} onSubmitted={onSubmitted} />);

    await waitFor(() => {
      expect(screen.getByText(/No ISO 25010 evaluations recorded yet/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Evaluation/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Authentication token missing.');
    });
    expect(onSubmitted).not.toHaveBeenCalled();
  });
});
