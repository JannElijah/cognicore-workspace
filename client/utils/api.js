/**
 * Central API configuration.
 * All backend URLs should be derived from this single source of truth.
 * Set VITE_API_URL in a .env file to override for production.
 */
export const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
