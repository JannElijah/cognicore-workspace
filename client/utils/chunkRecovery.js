import { lazy } from 'react';

const CHUNK_RELOAD_STORAGE_KEY = 'cognicore_chunk_reload_at';
const CHUNK_RELOAD_COOLDOWN_MS = 15000;

const CHUNK_ERROR_PATTERNS = [
  'failed to fetch dynamically imported module',
  'importing a module script failed',
  'error loading dynamically imported module',
  'loading chunk',
  'loading css chunk'
];

/**
 * Return true when an error indicates a stale or unreachable dynamic ES module/chunk.
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  if (error.name === 'ChunkLoadError') return true;
  const message = String(error.message || error).toLowerCase();
  return CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

const getSessionStorage = () => (typeof window !== 'undefined' ? window.sessionStorage : null);
const getDefaultReload = () => (typeof window !== 'undefined' ? () => window.location.reload() : null);

/**
 * Trigger a single page reload to fetch the latest deployment manifest/chunks,
 * bounded by a cooldown window in sessionStorage to avoid infinite reload loops.
 */
export function reloadOnceForChunkError(
  storage = getSessionStorage(),
  reloadFn = getDefaultReload(),
  now = Date.now()
) {
  if (!reloadFn) return false;
  try {
    const lastReloadRaw = storage?.getItem?.(CHUNK_RELOAD_STORAGE_KEY);
    const lastReloadAt = lastReloadRaw ? Number(lastReloadRaw) : 0;
    if (Number.isFinite(lastReloadAt) && lastReloadAt > 0 && now - lastReloadAt < CHUNK_RELOAD_COOLDOWN_MS) {
      return false;
    }
    storage?.setItem?.(CHUNK_RELOAD_STORAGE_KEY, String(now));
  } catch {
    // Ignore storage access errors in restricted browsing contexts.
  }

  reloadFn();
  return true;
}

/**
 * Wrap React.lazy so a stale chunk error after a deployment automatically
 * reloads once instead of crashing the lazy route immediately.
 */
export function lazyWithRecovery(importer, reloadFn = getDefaultReload()) {
  return lazy(async () => {
    try {
      return await importer();
    } catch (error) {
      if (isChunkLoadError(error) && reloadOnceForChunkError(getSessionStorage(), reloadFn)) {
        // Keep Suspense pending while the browser performs a full reload.
        return new Promise(() => {});
      }
      throw error;
    }
  });
}

/**
 * Listen for Vite's asset preload failures across deployments and recover once cleanly.
 */
export function installVitePreloadErrorHandler(
  target = typeof window !== 'undefined' ? window : null,
  reloadFn = getDefaultReload()
) {
  if (!target?.addEventListener) return () => {};
  const onPreloadError = (event) => {
    const didReload = reloadOnceForChunkError(getSessionStorage(), reloadFn);
    if (didReload && typeof event?.preventDefault === 'function') {
      event.preventDefault();
    }
  };
  target.addEventListener('vite:preloadError', onPreloadError);
  return () => target.removeEventListener?.('vite:preloadError', onPreloadError);
}
