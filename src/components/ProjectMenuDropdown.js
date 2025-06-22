import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';

export default function ProjectMenuDropdown({ open, top, left, onClose, children }) {
  const ref = useRef();
  const [isMounted, setIsMounted] = useState(open);
  const [showOpen, setShowOpen] = useState(false);
  const [coords, setCoords] = useState({ top, left });
  const [measured, setMeasured] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      setMeasured(false);
    } else {
      setShowOpen(false);
      const timeout = setTimeout(() => setIsMounted(false), 180);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  useEffect(() => {
    if (!isMounted || !open || measured) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let newLeft = left;
    let newTop = top;
    if (rect.width > 0 && (left + rect.width > window.innerWidth - 8)) {
      newLeft = Math.max(8, window.innerWidth - rect.width - 8);
    }
    if (rect.height > 0 && (top + rect.height > window.innerHeight - 8)) {
      newTop = Math.max(8, window.innerHeight - rect.height - 8);
    }
    setCoords({ left: newLeft, top: newTop });
    setMeasured(true);
    setTimeout(() => setShowOpen(true), 0);
  }, [isMounted, open, left, top, measured]);

  if (!isMounted) return null;

  const style = !measured ? {
    left: -9999,
    top: -9999,
    opacity: 0,
    pointerEvents: 'none',
    transition: 'none',
  } : {
    top: coords.top,
    left: coords.left,
    opacity: showOpen ? 1 : 0,
    transform: showOpen ? 'translateY(0)' : 'translateY(10px)',
    pointerEvents: open ? 'auto' : 'none',
    transition: 'opacity 0.18s, transform 0.18s',
  };

  return ReactDOM.createPortal(
    <div
      ref={ref}
      className={`project-menu-dropdown-portal${showOpen ? ' project-menu-dropdown-portal-open' : ''}`}
      style={style}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
} 