import React from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import './Header.css';

const Header = ({ onTitleClick }) => {
  const handleBackClick = () => {
    window.history.back();
  };

  const handleSignOut = () => {
    // Placeholder for sign-out logic
    // You can replace this with your actual sign-out implementation
    console.log("Sign Out clicked");
    alert("Sign Out functionality not yet implemented.");
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <FaArrowLeft className="icon back-arrow" onClick={handleBackClick} />
      </div>
      <h1 onClick={onTitleClick} style={{ cursor: 'pointer' }}>JDMatch</h1>
      <div className="header-right">
        <div className="profile-name">
          Paladi Preetham
        </div>
        <button onClick={handleSignOut} className="sign-out-button">
          Sign Out
        </button>
      </div>
    </header>
  );
};

export default Header;