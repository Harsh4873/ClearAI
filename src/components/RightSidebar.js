'use client';

import React, { useState } from 'react';

export default function RightSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [comprehensionLevel, setComprehensionLevel] = useState('college');
  
  return (
    <div className={`sidebar right-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <button 
        className="collapse-button" 
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? '←' : '→'}
      </button>
      
      {!isCollapsed && (
        <div className="sidebar-content">
          <h2>Text Options</h2>
          
          <div className="sidebar-section">
            <h3>Summarization</h3>
            <label>
              <input type="checkbox" name="summarize" />
              Enable summarization
            </label>
          </div>
          
          <div className="sidebar-section">
            <h3>Comprehension Level</h3>
            <div className="radio-group">
              <label>
                <input 
                  type="radio" 
                  name="comprehension" 
                  value="elementary" 
                  checked={comprehensionLevel === 'elementary'}
                  onChange={() => setComprehensionLevel('elementary')}
                />
                Elementary Student
              </label>
              <label>
                <input 
                  type="radio" 
                  name="comprehension" 
                  value="highschool" 
                  checked={comprehensionLevel === 'highschool'}
                  onChange={() => setComprehensionLevel('highschool')}
                />
                High School Student
              </label>
              <label>
                <input 
                  type="radio" 
                  name="comprehension" 
                  value="college" 
                  checked={comprehensionLevel === 'college'}
                  onChange={() => setComprehensionLevel('college')}
                />
                College Student
              </label>
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>Length</h3>
            <select className="sidebar-select">
              <option value="main-ideas">Main Ideas Only</option>
              <option value="average">Average</option>
              <option value="more-than-average">More than average</option>
            </select>
          </div>
          
          <div className="sidebar-section">
            <h3>Additional Features</h3>
            <label>
              <input type="checkbox" name="provide-definitions" />
              Provide Definitions
            </label>
            <label>
              <input type="checkbox" name="link-related" />
              Link to Related Works
            </label>
          </div>
        </div>
      )}
    </div>
  );
}