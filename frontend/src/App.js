import React, { useState, useEffect } from 'react';
import './App.css';
import Chat from './components/Chat';
import ThemeToggle from './components/ThemeToggle';

function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    // Update the document body with the current theme
    document.body.classList.toggle('light-mode', !darkMode);
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`App ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <ThemeToggle darkMode={darkMode} toggleTheme={toggleTheme} />
      <Chat />
    </div>
  );
}

export default App; 