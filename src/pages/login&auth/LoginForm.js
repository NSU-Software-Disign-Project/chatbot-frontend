import React, { useState, useEffect } from 'react';
import './style.css';
import { useNavigate, Link } from 'react-router-dom';
import AnimatedLogo from '../Homepage/AnimatedLogo';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/me');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка авторизации');
      }
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      navigate('/me');
    } catch (err) {
      setError(err.message || 'Неверный email или пароль');
    }
  };

  return (
    <div className="auth-container">
      <div className="background-logo"><AnimatedLogo/></div>
      <div className="form-wrapper">
        <h2>Вход</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleLogin}>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Войти</button>
        </form>
        <p className="switch-link">
          Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginForm; 