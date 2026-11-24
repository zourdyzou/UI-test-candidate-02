import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { AppProviders } from './app/AppProviders';
import './app/agGrid';
import './app/styles.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>
);
