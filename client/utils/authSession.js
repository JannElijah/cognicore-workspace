const USER_KEY = 'cognicore_user';
const TOKEN_KEY = 'token';
const CUSTOM_PRESCRIBED_KEY = 'cognicore_custom_prescribed';

function safeGetStorage(kind) {
  if (typeof window === 'undefined') return null;
  try {
    return window[kind] || null;
  } catch (_) {
    return null;
  }
}

function isSupabaseAuthKey(key) {
  return typeof key === 'string' && (key.startsWith('sb-') || key.includes('supabase'));
}

function removeAuthKeysFrom(storage) {
  if (!storage) return;
  try {
    storage.removeItem(USER_KEY);
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(CUSTOM_PRESCRIBED_KEY);
    Object.keys(storage).forEach((key) => {
      if (isSupabaseAuthKey(key)) {
        storage.removeItem(key);
      }
    });
  } catch (_) {}
}

/**
 * Purge legacy localStorage auth keys so opening the app in a new tab/visit
 * never auto-logs into a leftover user session while keeping UI/accessibility prefs.
 */
export function clearLegacyLocalAuth() {
  removeAuthKeysFrom(safeGetStorage('localStorage'));
}

export function getStoredUser() {
  try {
    return safeGetStorage('sessionStorage')?.getItem(USER_KEY) || '';
  } catch (_) {
    return '';
  }
}

export function setStoredUser(username) {
  const storage = safeGetStorage('sessionStorage');
  if (!storage) return;
  try {
    if (username) {
      storage.setItem(USER_KEY, username);
    } else {
      storage.removeItem(USER_KEY);
    }
  } catch (_) {}
}

export function getStoredToken() {
  try {
    return safeGetStorage('sessionStorage')?.getItem(TOKEN_KEY) || null;
  } catch (_) {
    return null;
  }
}

export function setStoredToken(token) {
  const storage = safeGetStorage('sessionStorage');
  if (!storage) return;
  try {
    if (token) {
      storage.setItem(TOKEN_KEY, token);
    } else {
      storage.removeItem(TOKEN_KEY);
    }
  } catch (_) {}
}

export function getCustomPrescribedGame() {
  try {
    return safeGetStorage('sessionStorage')?.getItem(CUSTOM_PRESCRIBED_KEY) || '';
  } catch (_) {
    return '';
  }
}

export function setCustomPrescribedGame(gameId) {
  const storage = safeGetStorage('sessionStorage');
  if (!storage) return;
  try {
    if (gameId) {
      storage.setItem(CUSTOM_PRESCRIBED_KEY, gameId);
    } else {
      storage.removeItem(CUSTOM_PRESCRIBED_KEY);
    }
  } catch (_) {}
}

export function clearSessionAuth() {
  removeAuthKeysFrom(safeGetStorage('sessionStorage'));
  clearLegacyLocalAuth();
}
