import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import logo from './logo.svg';

function Header() {
  const navigate = useNavigate();

  // Проверка валидности токена
  const checkTokenValid = async (token) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080'}/user/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const handleLogoClick = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      const valid = await checkTokenValid(token);
      if (valid) {
        navigate('/me');
      } else {
        localStorage.removeItem('token');
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div
      className="header-logo-btn"
      onClick={handleLogoClick}
      title="На главную"
    >
      <img src={logo} alt="logo" className="header-logo-img" />
    </div>
  );
}

export default Header; 