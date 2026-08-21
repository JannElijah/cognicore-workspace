import useCogniStore from '../store/useCogniStore';

export const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`;

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function handleResponse(response) {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = await response.text();
    }
    throw new ApiError(
      errorData?.message || `API request failed with status ${response.status}`,
      response.status,
      errorData
    );
  }
  
  if (response.status === 204) {
    return {};
  }
  
  return await response.json();
}

/**
 * Standardized fetch wrapper that optionally injects an auth token.
 */
export async function apiClient(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const token = useCogniStore.getState().token;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, fetchOptions);
    return await handleResponse(response);
  } catch (error) {
    console.error(`[API Error] ${options.method || 'GET'} ${url}`, error);
    throw error;
  }
}
