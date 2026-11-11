jest.mock('../utils/apiClient.js', () => ({
  API_BASE: 'http://localhost:5000'
}));

jest.mock('../store/useCogniStore', () => {
  const state = { token: 'test-jwt-token' };
  const store = () => state;
  store.getState = () => state;
  return {
    __esModule: true,
    default: store
  };
});

describe('Unified fetchInterceptor', () => {
  let originalWindowFetch;

  beforeEach(() => {
    originalWindowFetch = window.fetch;
    jest.resetModules();
  });

  afterEach(() => {
    window.fetch = originalWindowFetch;
    window.localStorage?.clear();
  });

  it('installs a single idempotent wrapper regardless of middleware count or unregister', async () => {
    const nativeMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    window.fetch = nativeMock;

    const { installFetchInterceptor, registerFetchMiddleware } = require('../utils/fetchInterceptor.js');

    installFetchInterceptor();
    const wrappedFetch = window.fetch;
    expect(wrappedFetch).not.toBe(nativeMock);
    expect(wrappedFetch.__cognicoreFetchIntercepted).toBe(true);

    installFetchInterceptor();
    const unregA = registerFetchMiddleware({ id: 'mw-a', priority: 10 });
    const unregB = registerFetchMiddleware({ id: 'mw-b', priority: 20 });

    // Never double-wraps window.fetch
    expect(window.fetch).toBe(wrappedFetch);

    // Unregistering cleans middleware only without tearing down window.fetch
    unregA();
    unregB();
    expect(window.fetch).toBe(wrappedFetch);

    await window.fetch('http://localhost:5000/api/ping');
    expect(nativeMock).toHaveBeenCalledTimes(1);
  });

  it('injects Authorization header for backend API requests without clobbering explicit auth or leaking externally', async () => {
    const nativeMock = jest.fn().mockImplementation(async () => ({ ok: true, status: 200 }));
    window.fetch = nativeMock;

    const { installFetchInterceptor } = require('../utils/fetchInterceptor.js');
    installFetchInterceptor();

    await window.fetch('http://localhost:5000/api/health', { method: 'GET' });
    expect(nativeMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:5000/api/health',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-jwt-token'
        })
      })
    );

    await window.fetch('http://localhost:5000/api/custom', {
      method: 'GET',
      headers: { Authorization: 'Bearer explicit-token' }
    });
    expect(nativeMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:5000/api/custom',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer explicit-token'
        })
      })
    );

    await window.fetch('https://example.com/public.json', { method: 'GET' });
    expect(nativeMock).toHaveBeenNthCalledWith(
      3,
      'https://example.com/public.json',
      expect.objectContaining({
        method: 'GET'
      })
    );
    const thirdCallHeaders = nativeMock.mock.calls[2][1].headers || {};
    expect(thirdCallHeaders.Authorization).toBeUndefined();
  });

  it('executes beforeRequest, handleRequest, and afterResponse in middleware priority order', async () => {
    const nativeMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    window.fetch = nativeMock;

    const trace = [];
    const { registerFetchMiddleware } = require('../utils/fetchInterceptor.js');

    registerFetchMiddleware({
      id: 'game-mode',
      priority: 20,
      beforeRequest: ({ options }) => {
        trace.push('before:20');
        const body = JSON.parse(options.body || '{}');
        return { options: { ...options, body: JSON.stringify({ ...body, game_mode: 'timed' }) } };
      },
      afterResponse: () => {
        trace.push('after:20');
      }
    });

    registerFetchMiddleware({
      id: 'hud',
      priority: 10,
      beforeRequest: ({ options }) => {
        trace.push('before:10');
        const body = JSON.parse(options.body || '{}');
        return { options: { ...options, body: JSON.stringify({ ...body, smoothing_alpha: 0.75 }) } };
      },
      afterResponse: () => {
        trace.push('after:10');
      }
    });

    await window.fetch('http://localhost:5000/api/dda', {
      method: 'POST',
      body: JSON.stringify({ score: 1 })
    });

    expect(trace).toEqual(['before:10', 'before:20', 'after:10', 'after:20']);
    const sentBody = JSON.parse(nativeMock.mock.calls[0][1].body);
    expect(sentBody).toEqual({ score: 1, smoothing_alpha: 0.75, game_mode: 'timed' });
  });
});
