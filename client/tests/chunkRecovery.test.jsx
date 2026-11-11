import React, { Suspense } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';
import {
  installVitePreloadErrorHandler,
  isChunkLoadError,
  lazyWithRecovery,
  reloadOnceForChunkError
} from '../utils/chunkRecovery.js';

describe('chunkRecovery utilities', () => {
  it('identifies dynamic import and chunk load errors accurately', () => {
    expect(
      isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://example.com/assets/NeuroMazeGame-123.js'))
    ).toBe(true);
    const chunkErr = new Error('Loading chunk 42 failed');
    chunkErr.name = 'ChunkLoadError';
    expect(isChunkLoadError(chunkErr)).toBe(true);
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false);
    expect(isChunkLoadError(null)).toBe(false);
  });

  it('reloads once and obeys cooldown to prevent infinite reload loops', () => {
    const store = new Map();
    const mockStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, v)
    };
    const reloadFn = jest.fn();

    expect(reloadOnceForChunkError(mockStorage, reloadFn, 1000)).toBe(true);
    expect(reloadFn).toHaveBeenCalledTimes(1);

    // Within 15s cooldown -> suppressed
    expect(reloadOnceForChunkError(mockStorage, reloadFn, 5000)).toBe(false);
    expect(reloadFn).toHaveBeenCalledTimes(1);

    // After cooldown expires -> allowed again
    expect(reloadOnceForChunkError(mockStorage, reloadFn, 20000)).toBe(true);
    expect(reloadFn).toHaveBeenCalledTimes(2);
  });

  it('handles vite:preloadError and removes listener on cleanup', () => {
    window.sessionStorage.clear();
    const reloadFn = jest.fn();
    const cleanup = installVitePreloadErrorHandler(window, reloadFn);
    const fakeEvent = new Event('vite:preloadError', { cancelable: true });

    window.dispatchEvent(fakeEvent);
    expect(reloadFn).toHaveBeenCalledTimes(1);
    expect(fakeEvent.defaultPrevented).toBe(true);

    cleanup();
    window.sessionStorage.clear();
    window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }));
    expect(reloadFn).toHaveBeenCalledTimes(1);
  });

  it('triggers reload once in lazyWithRecovery and surfaces error on repeat failure inside cooldown', async () => {
    window.sessionStorage.clear();
    const reloadFn = jest.fn();
    const BrokenLazy = lazyWithRecovery(
      () => Promise.reject(new TypeError('Failed to fetch dynamically imported module: /assets/NeuroMazeGame-old.js')),
      reloadFn
    );

    render(
      <ErrorBoundary>
        <Suspense fallback={<div>LOADING_MODULE</div>}>
          <BrokenLazy />
        </Suspense>
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(reloadFn).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('LOADING_MODULE')).toBeInTheDocument();

    const origConsoleError = console.error;
    console.error = jest.fn();
    try {
      const BrokenLazyRepeat = lazyWithRecovery(
        () => Promise.reject(new TypeError('Failed to fetch dynamically imported module: /assets/NeuroMazeGame-old.js')),
        reloadFn
      );
      render(
        <ErrorBoundary>
          <Suspense fallback={<div>LOADING_REPEAT</div>}>
            <BrokenLazyRepeat />
          </Suspense>
        </ErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText(/New Update Available or Module Failed to Load/i)).toBeInTheDocument();
      });
      expect(reloadFn).toHaveBeenCalledTimes(1);
    } finally {
      console.error = origConsoleError;
    }
  });
});

describe('ErrorBoundary chunk failure fallback', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('shows update guidance and Reload Page / Back to Training Hub actions on chunk errors', () => {
    const onReset = jest.fn();
    function BrokenLazyRoute() {
      throw new TypeError('Failed to fetch dynamically imported module: https://cognicore-workspace.vercel.app/assets/NeuroMazeGame-BHXgWgZI.js');
    }

    render(
      <ErrorBoundary onReset={onReset}>
        <BrokenLazyRoute />
      </ErrorBoundary>
    );

    expect(screen.getByText(/New Update Available or Module Failed to Load/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Back to Training Hub/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('retains generic component error heading for non-chunk runtime errors', () => {
    function BrokenWidget() {
      throw new Error('Unexpected null pointer');
    }

    render(
      <ErrorBoundary name="GameModule">
        <BrokenWidget />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Something went wrong in GameModule\./i)).toBeInTheDocument();
  });
});
