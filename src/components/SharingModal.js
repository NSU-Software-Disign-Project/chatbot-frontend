import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { FaTrash } from 'react-icons/fa';
import './SharingModal.css';

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080';

export default function SharingModal({ open, project, onClose, role }) {
  const [sharingUsers, setSharingUsers] = useState([]);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [sharingError, setSharingError] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("viewer");
  const [addLoading, setAddLoading] = useState(false);
  const [ownerId, setOwnerId] = useState(null);
  const [ownerEmail, setOwnerEmail] = useState(null);
  const modalRef = useRef();
  // --- animation state ---
  const [isMounted, setIsMounted] = useState(open);
  const [showOpen, setShowOpen] = useState(false);
  useEffect(() => {
    if (open) {
      setIsMounted(true);
      // Даем браузеру применить начальное состояние, затем включаем open-класс
      requestAnimationFrame(() => setShowOpen(true));
    } else {
      setShowOpen(false);
      const timeout = setTimeout(() => setIsMounted(false), 220);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  // Fetch sharing users on open
  useEffect(() => {
    if (!open || !project) return;
    setSharingLoading(true);
    setSharingError("");
    const fetchSharing = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${backendUrl}/projects/${project.id}/sharing`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Ошибка загрузки доступа');
        const data = await res.json();
        setSharingUsers(data.sharedWith || []);
        setOwnerId(data.ownerId);
        setOwnerEmail(data.ownerEmail || null);
      } catch (e) {
        setSharingError(e.message || 'Ошибка загрузки доступа');
      } finally {
        setSharingLoading(false);
      }
    };
    fetchSharing();
  }, [open, project]);

  // Add user to sharedWith
  const handleAddShare = async () => {
    if (!addEmail.trim()) return;
    setAddLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Get userId by email
      const resUser = await fetch(`${backendUrl}/user/by-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ email: addEmail.trim() })
      });
      if (!resUser.ok) throw new Error('Пользователь не найден');
      const userData = await resUser.json();
      const userId = userData.user?.id;
      if (!userId) throw new Error('Пользователь не найден');
      // Add to sharedWith
      const res = await fetch(`${backendUrl}/projects/${project.id}/share`, {
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
      // Refresh list
      const res2 = await fetch(`${backendUrl}/projects/${project.id}/config`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data2 = await res2.json();
      setSharingUsers(data2.sharedWith || []);
    } catch (e) {
      setSharingError(e.message || 'Ошибка добавления');
    } finally {
      setAddLoading(false);
      setSharingLoading(false);
    }
  };

  // Remove user from sharedWith
  const handleRemoveShare = async (userId) => {
    if (!window.confirm('Удалить пользователя из доступа?')) return;
    setSharingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/projects/${project.id}/share/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка удаления');
      }
      // Refresh list
      const res2 = await fetch(`${backendUrl}/projects/${project.id}/config`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data2 = await res2.json();
      setSharingUsers(data2.sharedWith || []);
    } catch (e) {
      setSharingError(e.message || 'Ошибка удаления');
    } finally {
      setSharingLoading(false);
    }
  };

  // Change user role
  const handleChangeRole = async (userId, newRole) => {
    setSharingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${backendUrl}/projects/${project.id}/share`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ userId, permission: newRole })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Ошибка изменения роли');
      }
      // Refresh list
      const res2 = await fetch(`${backendUrl}/projects/${project.id}/config`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data2 = await res2.json();
      setSharingUsers(data2.sharedWith || []);
    } catch (e) {
      setSharingError(e.message || 'Ошибка изменения роли');
    } finally {
      setSharingLoading(false);
    }
  };

  // Close on overlay click or Esc
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!isMounted) return null;

  return ReactDOM.createPortal(
    <div
      className={`sharing-modal-overlay${showOpen ? ' sharing-modal-overlay-open' : ''}`}
      style={{
        opacity: showOpen ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className={`sharing-modal-window${showOpen ? ' sharing-modal-window-open' : ''}`}
        style={{
          opacity: showOpen ? 1 : 0,
          transform: showOpen ? 'scale(1) translateY(0)' : 'scale(0.96) translateY(40px)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ color: '#fff', marginBottom: 18 }}>Управление доступом</h2>
        <div style={{ marginBottom: 18, color: '#aaa', fontSize: 15 }}>
          <b>Доступ имеют:</b>
          <ul style={{ margin: '10px 0 0 0', padding: 0, listStyle: 'none', maxHeight: 320, overflowY: 'auto' }}>
            {/* Владелец всегда первый */}
            {ownerId && (
              <li key={ownerId} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, background: '#181834', borderRadius: 8, padding: '8px 12px' }}>
                <span style={{ color: '#fff', fontWeight: 500 }}>
                  {ownerEmail || 'Неизвестно'}
                </span>
                <span style={{ color: '#4f46e5', fontWeight: 700, marginLeft: 8 }}>Владелец</span>
              </li>
            )}
            {role !== 'viewer' && sharingUsers.filter(u => u.userId !== ownerId).length === 0 && !ownerId && (
              <li style={{ color: '#888' }}>Только вы</li>
            )}
            {role !== 'viewer' && sharingUsers.filter(u => u.userId !== ownerId).map((u, idx) => (
              <li key={u.userId || idx} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, background: '#181834', borderRadius: 8, padding: '8px 12px' }}>
                <span style={{ color: '#fff', fontWeight: 500 }}>
                  {u.email || 'Неизвестно'}
                </span>
                <select
                  value={u.permission}
                  disabled={u.userId === ownerId}
                  onChange={e => handleChangeRole(u.userId, e.target.value)}
                  style={{ fontSize: 14, borderRadius: 6, padding: '2px 8px', background: u.permission === 'editor' ? '#22c55e' : u.permission === 'manager' ? '#f59e42' : '#64748b', color: '#fff', border: 'none', fontWeight: 600 }}
                >
                  <option value="viewer">Только просмотр</option>
                  <option value="editor">Редактор</option>
                  {role === 'owner' && <option value="manager">Менеджер</option>}
                </select>
                {u.userId !== ownerId && (
                  <button
                    style={{ background: 'none', border: 'none', color: '#e53e3e', fontSize: 18, cursor: 'pointer', marginLeft: 'auto' }}
                    title="Удалить пользователя"
                    onClick={() => handleRemoveShare(u.userId)}
                  >
                    <FaTrash />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
        {role === 'owner' || role === 'manager' ? (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 18 }}>
            <input
              type="email"
              placeholder="Email пользователя"
              value={addEmail}
              onChange={e => setAddEmail(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #444', background: '#181834', color: '#fff', fontSize: 15, minWidth: 180 }}
              disabled={addLoading}
            />
            <select
              value={addRole}
              onChange={e => setAddRole(e.target.value)}
              style={{ fontSize: 15, borderRadius: 6, padding: '6px 12px', background: addRole === 'editor' ? '#22c55e' : addRole === 'manager' ? '#f59e42' : '#64748b', color: '#fff', border: 'none', fontWeight: 600 }}
              disabled={addLoading}
            >
              <option value="viewer">Только просмотр</option>
              <option value="editor">Редактор</option>
              {role === 'owner' && <option value="manager">Менеджер</option>}
            </select>
            <button
              style={{ padding: '8px 18px', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: 15, marginLeft: 0 }}
              onClick={handleAddShare}
              disabled={addLoading || !addEmail.trim()}
            >{addLoading ? 'Добавление...' : 'Добавить'}</button>
          </div>
        ) : null}
        {sharingError && <div style={{ color: 'red', marginBottom: 8 }}>{sharingError}</div>}
      </div>
    </div>,
    document.body
  );
} 