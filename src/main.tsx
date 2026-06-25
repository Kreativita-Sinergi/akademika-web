import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Terapkan tema (gelap/terang) sebelum render agar tak ada kedipan.
if (localStorage.getItem('akademika-theme') === 'dark') {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
