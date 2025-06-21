import React, { useState } from 'react';
import './style.css';
import { useNavigate } from 'react-router-dom';
import AnimatedLogo from "../Homepage/AnimatedLogo";

function AuthForm() {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Только для регистрации
  const [error, setError] = useState(''); // Для отображения ошибок
  const navigate = useNavigate();

  const toggleForm = () => {
    setIsLogin((prev) => !prev);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:8080/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Ошибка авторизации');
      }

      const data = await response.json();
      console.log('Вход успешен:', data);

      // Сохраняем токен в localStorage (если приходит)
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      navigate('/me');
    } catch (err) {
      setError('Неверный email или пароль');
      console.error(err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:8080/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Регистрация не удалась');
      }

      const data = await response.json();
      console.log('Регистрация успешна:', data);

      // Автоматически переключаемся на форму входа после регистрации
      navigate('/me');
    } catch (err) {
      setError(err.message || 'Произошла ошибка');
      console.error(err);
    }
  };

  return (
    <div className="auth-container">
      {/* Фон с логотипом */}
      <div className="background-logo">
        <AnimatedLogo/>
      </div>

      {/* Форма поверх фона */}
      <div className="form-wrapper">
        <h2>{isLogin ? 'Войти' : 'Регистрация'}</h2>
        {error && <p className="error-message">{error}</p>}

        <form onSubmit={isLogin ? handleLogin : handleRegister}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {!isLogin && (
            <input
              placeholder="Login"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">{isLogin ? 'Войти' : 'Зарегистрироваться'}</button>
        </form>

        <p className="switch-link" onClick={toggleForm}>
          {isLogin ? 'Нет аккаунта? Зарегистрируйтесь' : 'Уже есть аккаунт? Войдите'}
        </p>
      </div>
    </div>

  );
}

export default AuthForm;