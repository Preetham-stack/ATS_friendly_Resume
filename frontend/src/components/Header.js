import React from 'react';
import './Header.css';

function Header({ onTitleClick }) {
  return (
    <header className="app-header">
      <h1 onClick={onTitleClick} style={{ cursor: 'pointer' }}>RAG</h1>
    </header>
  );
}

export default Header;