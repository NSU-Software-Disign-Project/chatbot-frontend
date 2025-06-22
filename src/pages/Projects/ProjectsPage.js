import React, { useEffect, useState, useRef, useCallback } from 'react';
import './style.css';
import { useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import SharingModal from '../../components/SharingModal';
import ProjectMenuDropdown from '../../components/ProjectMenuDropdown';
import '../../components/ProjectMenuDropdown.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

const ProjectsPage = () => {
  const navigate = useNavigate();

  // Состояния
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuCoords, setMenuCoords] = useState({ top: 0, left: 0 });
  const [renameValue, setRenameValue] = useState("");
  const [shareProjectId, setShareProjectId] = useState(null);
  const [sharingUsers, setSharingUsers] = useState([]);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [sharingError, setSharingError] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("viewer");
  const [addLoading, setAddLoading] = useState(false);
  const menuRef = useRef();

  // Получить email пользователя по userId (можно кэшировать)
  const [userCache, setUserCache] = useState({});
  const fetchUserEmail = useCallback(async (userId) => {
    if (!userId || userCache[userId]) return userCache[userId];
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/user/${userId}`);
      if (!res.ok) return userId;
      const data = await res.json();
      setUserCache((prev) => ({ ...prev, [userId]: data.user?.email || userId }));
      return data.user?.email || userId;
    } catch {
      return userId;
    }
  }, [userCache]);

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
        await fetchProjects(token);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const fetchProjects = async (token) => {
    try {
      const projectsResponse = await fetch(`${backendUrl}/projects`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!projectsResponse.ok) throw new Error('Ошибка получения списка проектов');
      const projectsData = await projectsResponse.json();
      setProjects(projectsData.projects || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleProjectClick = (id) => {
    if (shareProjectId) return; // если открыт sharing, не переходить
    navigate(`/diagram/${id}`);
  };

  const handleCreateProject = () => {
    setShowCreate(true);
    setNewProjectName("");
    setCreateError("");
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      setCreateError("Введите название проекта");
      return;
    }
    setCreating(true);
    setCreateError("");
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${backendUrl}/projects/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newProjectName.trim() }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Ошибка создания проекта');
      }
      setShowCreate(false);
      setNewProjectName("");
      await fetchProjects(token);
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
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

  // Закрытие меню при клике вне
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleMenuOpen = (id, name, e) => {
    setMenuOpenId(id);
    setRenameValue(name);
    setShareProjectId(null);
    // Вычисляем координаты триггера
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuCoords({
      top: rect.bottom + window.scrollY + 2,
      left: rect.left + window.scrollX,
    });
  };

  const handleRename = async (project) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${backendUrl}/projects/${project.id || project._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: renameValue.trim() }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Ошибка переименования');
      }
      setMenuOpenId(null);
      await fetchProjects(token);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Удалить проект "${project.name}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${backendUrl}/projects/${project.id || project._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Ошибка удаления');
      }
      setMenuOpenId(null);
      await fetchProjects(token);
    } catch (err) {
      alert(err.message);
    }
  };

  // Загрузка sharedWith при открытии модалки
  useEffect(() => {
    const fetchSharing = async () => {
      if (!shareProjectId) return;
      setSharingLoading(true);
      setSharingError("");
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${backendUrl}/projects/${shareProjectId}/config`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Ошибка загрузки доступа');
        const data = await res.json();
        setSharingUsers(data.sharedWith || data.meta?.sharedWith || []);
      } catch (e) {
        setSharingError(e.message || 'Ошибка загрузки доступа');
      } finally {
        setSharingLoading(false);
      }
    };
    fetchSharing();
  }, [shareProjectId]);

  // Добавить пользователя в sharedWith
  const handleAddShare = async () => {
    if (!addEmail.trim()) return;
    setAddLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Получить userId по email
      const resUser = await fetch(`${backendUrl}/user/by-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: addEmail.trim() })
      });
      if (!resUser.ok) throw new Error('Пользователь не найден');
      const userData = await resUser.json();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Пользователь не найден');
      // Добавить в sharedWith
      const res = await fetch(`${backendUrl}/projects/${shareProjectId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, permission: addRole })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка добавления');
      }
      setAddEmail("");
      setAddRole("viewer");
      setSharingError("");
      setSharingLoading(true);
      // Обновить список
      const res2 = await fetch(`${backendUrl}/projects/${shareProjectId}/config`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data2 = await res2.json();
      setSharingUsers(data2.sharedWith || []);
    } catch (e) {
      setSharingError(e.message || 'Ошибка добавления');
    } finally {
      setAddLoading(false);
      setSharingLoading(false);
    }
  };

  // Удалить пользователя из sharedWith
  const handleRemoveShare = async (userId) => {
    if (!window.confirm('Удалить пользователя из доступа?')) return;
    setSharingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/projects/${shareProjectId}/share/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка удаления');
      }
      // Обновить список
      const res2 = await fetch(`${backendUrl}/projects/${shareProjectId}/config`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data2 = await res2.json();
      setSharingUsers(data2.sharedWith || []);
    } catch (e) {
      setSharingError(e.message || 'Ошибка удаления');
    } finally {
      setSharingLoading(false);
    }
  };

  // Изменить роль пользователя
  const handleChangeRole = async (userId, newRole) => {
    setSharingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/projects/${shareProjectId}/share`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, permission: newRole })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка изменения роли');
      }
      // Обновить список
      const res2 = await fetch(`${backendUrl}/projects/${shareProjectId}/config`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data2 = await res2.json();
      setSharingUsers(data2.sharedWith || []);
    } catch (e) {
      setSharingError(e.message || 'Ошибка изменения роли');
    } finally {
      setSharingLoading(false);
    }
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
      {showCreate && (
        <form className="create-project-form" onSubmit={handleCreateSubmit}>
          <input
            className="create-project-input"
            type="text"
            placeholder="Название проекта"
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
            autoFocus
            disabled={creating}
            onKeyDown={e => { if (e.key === 'Escape') setShowCreate(false); }}
          />
          <button className="create-project-save" type="submit" disabled={creating}>
            {creating ? 'Создание...' : 'Сохранить'}
          </button>
          <button type="button" className="create-project-cancel" onClick={() => setShowCreate(false)} disabled={creating}>
            Отмена
          </button>
          {createError && <div className="error" style={{marginTop: 8}}>{createError}</div>}
        </form>
      )}

      {projects.length > 0 ? (
        <div className="projects-list" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {projects
            .slice() // копия массива
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .map((project) => (
              <div
                key={project._id || project.id}
                className="project-card"
                onClick={() => handleProjectClick(project.id || project._id)}
                style={{ position: 'relative' }}
              >
                {/* Три точки и меню только если не viewer */}
                {project.role !== 'viewer' ? (
                  <>
                    <div
                      className="project-menu-trigger"
                      onClick={e => { e.stopPropagation(); handleMenuOpen(project.id || project._id, project.name, e); }}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        cursor: 'pointer',
                        zIndex: 2,
                        padding: '10px',
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s',
                      }}
                    >
                      <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>⋮</span>
                    </div>
                    <ProjectMenuDropdown
                      open={menuOpenId === (project.id || project._id)}
                      top={menuCoords.top}
                      left={menuCoords.left}
                      onClose={() => setMenuOpenId(null)}
                    >
                      <div style={{ marginBottom: 10 }}>
                        <input
                          type="text"
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #444', background: '#181834', color: '#fff' }}
                          onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); handleRename(project); } }}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                      <button
                        style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, marginBottom: 8, cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); handleRename(project); }}
                      >Переименовать</button>
                      {project.role === 'owner' && (
                        <button
                          style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#e53e3e', color: '#fff', fontWeight: 600, cursor: 'pointer', marginBottom: 8 }}
                          onClick={e => { e.stopPropagation(); handleDelete(project); }}
                        >Удалить</button>
                      )}
                      {project.role === 'owner' || project.role === 'manager' ? (
                        <button
                          style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#22c55e', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                          onClick={e => { e.stopPropagation(); setShareProjectId(project.id || project._id); setMenuOpenId(null); }}
                        >Поделиться</button>
                      ) : null}
                    </ProjectMenuDropdown>
                  </>
                ) : (
                  <>
                    <div
                      className="project-menu-trigger"
                      onClick={e => { e.stopPropagation(); handleMenuOpen(project.id || project._id, project.name, e); }}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        cursor: 'pointer',
                        zIndex: 2,
                        padding: '10px',
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s',
                      }}
                    >
                      <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>⋮</span>
                    </div>
                    <ProjectMenuDropdown
                      open={menuOpenId === (project.id || project._id)}
                      top={menuCoords.top}
                      left={menuCoords.left}
                      onClose={() => setMenuOpenId(null)}
                    >
                      <button
                        style={{ width: '100%', padding: 8, borderRadius: 4, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                        onClick={e => { e.stopPropagation(); setShareProjectId(project.id || project._id); setMenuOpenId(null); }}
                      >Поделиться</button>
                    </ProjectMenuDropdown>
                  </>
                )}
                {/* Модальное окно управления доступом */}
                <SharingModal
                  open={shareProjectId === (project.id || project._id)}
                  project={project}
                  onClose={() => {
                    setShareProjectId(null);
                    navigate('/me');
                  }}
                  role={project.role}
                />
                <h4>{project.name}</h4>
                <p className="last-edited">
                  Создан: {new Date(project.createdAt).toLocaleString()}<br/>
                  Изменён: {new Date(project.updatedAt).toLocaleString()}
                </p>
                <span className={`project-role role-${project.role}`}>{
                  project.role === 'owner' ? 'Владелец'
                  : project.role === 'manager' ? 'Менеджер'
                  : project.role === 'editor' ? 'Редактор'
                  : 'Только просмотр'
                }</span>
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