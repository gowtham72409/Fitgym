import React from 'react';
import { Camera, Award, History, User, Settings, LogOut, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function MoreSheet({ isOpen, onClose, onSelectAction }) {
  const { logout, currentUser } = useAuth();

  if (!isOpen) return null;

  const menuItems = [
    { id: 'scanner', label: 'Food Scanner (AI Camera)', icon: Camera, color: 'var(--accent-cyan)' },
    { id: 'challenges', label: 'Daily Challenges', icon: Award, color: 'var(--accent-gold)' },
    { id: 'history', label: 'Workout & Activity History', icon: History, color: 'var(--accent-emerald)' },
    { id: 'profile', label: 'Personal Fitness Profile', icon: User, color: 'var(--accent-purple)' },
    { id: 'settings', label: 'Settings & Dashboard Customization', icon: Settings, color: 'var(--text-secondary)' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px' }}>FitQuest Menu</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{currentUser?.email}</span>
          </div>
          <button onClick={onClose} className="btn btn-icon" style={{ background: 'var(--bg-input)', width: '36px', height: '36px' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectAction(item.id);
                  onClose();
                }}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: 'var(--bg-input)',
                  cursor: 'pointer',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: item.color
                  }}>
                    <Icon size={20} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '15px' }}>{item.label}</span>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            logout();
            onClose();
          }}
          className="btn btn-danger"
          style={{ width: '100%', gap: '8px' }}
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
