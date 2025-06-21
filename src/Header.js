import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import logo from './logo.svg';

function Header() {
  const navigate = useNavigate();
  return (
    <div className="header-logo-btn" onClick={() => navigate('/')}
      title="На главную">
      <img src={logo} alt="logo" className="header-logo-img" />
    </div>
  );
}

export default Header; 