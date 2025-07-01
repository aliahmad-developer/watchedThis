"use client";
import { useTheme } from 'next-themes';

export default function Toggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button 
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
       className="fixed top-4 right-4 p-2 bg-light-btn-bg rounded-lg z-50 dark:bg-dark-btn-bg hover:bg-dark-btn-hover-bg"
    >
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}