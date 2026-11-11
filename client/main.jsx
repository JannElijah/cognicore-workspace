import React from 'react';
import ReactDOM from 'react-dom/client';
import './games/gameModeManager';
import { installVitePreloadErrorHandler } from './utils/chunkRecovery.js';
import App from './App.jsx';
import './index.css';

installVitePreloadErrorHandler();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
