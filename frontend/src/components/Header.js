import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import './Header.css';

const Header = ({ onTitleClick }) => { // Assuming onTitleClick is passed for reset
  const handleBackClick = () => {
    // You can implement navigation logic here, e.g., using react-router-dom's useNavigate
    console.log("Back arrow clicked");
    window.history.back();
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <FaArrowLeft className="icon back-arrow" onClick={handleBackClick} />
      </div>
      <h1 onClick={onTitleClick} style={{ cursor: 'pointer' }}>Resume Analyzer & Generator (RAG)</h1>
      <div className="header-right">
        <div className="profile-name">
          Paladi Preetham
        </div>
      </div>
    </header>
  );
};

export default Header;