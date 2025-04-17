import React from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';
import './ThemeToggle.css';

const ThemeToggle = ({ darkMode, toggleTheme }) => {
  return (
    <button 
      className="theme-toggle-btn" 
      onClick={toggleTheme}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? (
        <FiSun className="theme-icon" />
      ) : (
        <FiMoon className="theme-icon" />
      )}
    </button>
  );
};

export default ThemeToggle; 