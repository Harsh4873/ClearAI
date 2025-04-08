import React from 'react';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import '../styles/layout.css';

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <LeftSidebar />
      <main className="main-content">
        {children}
      </main>
      <RightSidebar />
    </div>
  );
}