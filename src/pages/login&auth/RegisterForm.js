import React, { useState, useEffect } from 'react';
import './style.css';
import { useNavigate, Link } from 'react-router-dom';
import AnimatedLogo from '../Homepage/AnimatedLogo';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

function RegisterForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userResponse = await fetch(`${backendUrl}/user/me`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (!userResponse.ok) {
            localStorage.removeItem('token');
            navigate('/register'); // Перенаправляем, если токен невалиден
          }
        } catch (err) {
          console.error(err);
        }
      } else {
        navigate('/register');
      }
    };

    checkAuth();
  }, [navigate]);


  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${backendUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Ошибка регистрации';

        const rawErrors = errorMessage.replace(/^[^:]+:\s*/, '').split(';');

        const cleanedErrors = rawErrors
          .map((err) => {
            const parts = err.split(':');
            if (parts.length > 1) {
              return parts.slice(1).join(':').trim(); // Соединяем обратно, если было несколько ":"
            }
            return err.trim(); // Если формат ошибки непредсказуем
          })
          .filter(Boolean); // Убираем пустые строки

        const finalMessage = cleanedErrors.join('\n'); // Или "\n" для отображения на разных строках

        throw new Error(finalMessage);
      }
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      navigate('/me');
    } catch (err) {
      setError(err.message || 'Ошибка регистрации');
    }
  };

  return (
    <div className="auth-container">
      <div className="background-logo"><AnimatedLogo/></div>
      <div className="form-wrapper">
        <h2>Регистрация</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleRegister}>
          <input placeholder="Имя" value={name} onChange={e => setName(e.target.value)} required />
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit">Зарегистрироваться</button>
        </form>
        <p className="switch-link">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterForm; 