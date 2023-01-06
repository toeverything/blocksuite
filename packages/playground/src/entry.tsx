import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import './style.css';

const container = document.getElementById('app') as HTMLDivElement;

const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
