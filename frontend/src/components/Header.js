import React, { useState } from 'react';
import { FaArrowLeft, FaUserCircle } from 'react-icons/fa';
import ProfileDropdown from './ProfileDropdown';
import './Header.css';

const Header = () => {
  const [isDropdownVisible, setDropdownVisible] = useState(false);

  const handleBackClick = () => {
    // You can implement navigation logic here, e.g., using react-router-dom's useNavigate
    console.log("Back arrow clicked");
    window.history.back();
  };

  const toggleDropdown = () => {
    setDropdownVisible(!isDropdownVisible);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <FaArrowLeft className="icon back-arrow" onClick={handleBackClick} />
      </div>
      <h1>Resume Analyzer & Generator (RAG)</h1>
      <div className="header-right">
        <FaUserCircle
          className="icon profile-icon"
          onClick={toggleDropdown}
        />
        {isDropdownVisible && <ProfileDropdown />}
      </div>
    </header>
  );
};

export default Header;