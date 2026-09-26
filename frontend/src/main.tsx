import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app/App'

// Ensure theme brand colors are initialized before DOM renders
const colorThemes: Record<string, { primary: string; hover: string; bgLight: string; text: string }> = {
  green: { primary: '#10b981', hover: '#059669', bgLight: '#ecfdf5', text: '#047857' },
  sage: { primary: '#0d9488', hover: '#0f766e', bgLight: '#f0fdfa', text: '#0f766e' },
  rose: { primary: '#f43f5e', hover: '#e11d48', bgLight: '#fff1f2', text: '#be123c' },
  lavender: { primary: '#c084fc', hover: '#a855f7', bgLight: '#faf5ff', text: '#6b21a8' },
  peach: { primary: '#fbbf24', hover: '#f59e0b', bgLight: '#fffbeb', text: '#b45309' },
  sky: { primary: '#38bdf8', hover: '#0ea5e9', bgLight: '#f0f9ff', text: '#0369a1' },
  indigo: { primary: '#6366f1', hover: '#4f46e5', bgLight: '#e0e7ff', text: '#3730a3' }
};

const isCustomized = localStorage.getItem('brand_color_customized') === 'true';
const saved = localStorage.getItem('brand_color');
const brand = (isCustomized && saved && colorThemes[saved]) ? saved : 'green';
const currentTheme = colorThemes[brand];
document.documentElement.style.setProperty('--brand-primary', currentTheme.primary);
document.documentElement.style.setProperty('--brand-primary-hover', currentTheme.hover);
document.documentElement.style.setProperty('--brand-primary-light', currentTheme.bgLight);
document.documentElement.style.setProperty('--brand-primary-text', currentTheme.text);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
