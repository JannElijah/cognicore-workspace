import React from 'react';
import ReactDOM from 'react-dom/client';
import './games/gameModeManager';
import App from './App.jsx';
import './index.css';
import useCogniStore from './store/useCogniStore';

// Global fetch interceptor to automatically inject JWT tokens for backend API calls
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (typeof resource === 'string' && resource.includes('/api/')) {
    const token = useCogniStore.getState().token;
    if (token) {
      config = config || {};
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
      args[1] = config;
    }
  }
  return originalFetch(...args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
