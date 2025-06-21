import React, { useEffect, useState } from 'react';
import './style.css';
import { useNavigate } from 'react-router-dom';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const ProjectsPage = () => {
  const navigate = useNavigate();

  // Состояния
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка данных
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login'); // Перенаправляем на авторизацию, если токена нет
        return;
      }

      try {
        // Получаем информацию о пользователе
        const userResponse = await fetch(`${backendUrl}/user/me`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!userResponse.ok) throw new Error('Ошибка получения данных пользователя');

        const userData = await userResponse.json();
        console.log(userData);
        setUser(userData.user);
        console.log(user);

        // Получаем список проектов
        const projectsResponse = await fetch(`${backendUrl}/user/my-projects`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });


        if (!projectsResponse.ok) throw new Error('Ошибка получения списка проектов');

        const projectsData = await projectsResponse.json();
        console.log(projectsData);
        setProjects(projectsData);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleProjectClick = (id) => {
    navigate(`/Diagram`);
  };

  const handleCreateProject = () => {
    alert('Создать новый проект');
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`${backendUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      } catch (e) {
        // ignore
      }
      localStorage.removeItem('token');
    }
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error">Ошибка: {error}</div>;
  }

  return (
    <div className="projects-container">
      <div className="user-info">
        <div className="user-info-row">
          <h2>Привет, {user.name || 'Пользователь'} 👋</h2>
          <span className="email">{user.email}</span>
          <button className="logout-button" onClick={handleLogout}>Выйти</button>
        </div>
      </div>

      <div className="projects-header">
        <h3>Ваши проекты</h3>
        <button className="create-button" onClick={handleCreateProject}>
          + Новый проект
        </button>
      </div>

      {projects.length > 0 ? (
        <div className="projects-list">
          {projects.map((project) => (
            <div
              key={project._id || project.id}
              className="project-card"
              onClick={() => handleProjectClick(project._id || project.id)}
            >
              <h4>{project.name}</h4>
              <p className="last-edited">
                Последнее изменение: {new Date(project.updatedAt || project.lastEdited).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p>Нет доступных проектов</p>

      )}
    </div>
  );
};

export default ProjectsPage;