import React from 'react';
import { Home, Utensils, Dumbbell, Compass, TrendingUp, Menu } from 'lucide-react';

export default function Navigation({ activeTab, onSelectTab, onOpenMore }) {
  const tabs = [
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'diet', label: 'DIET', icon: Utensils },
    { id: 'workout', label: 'WORKOUT', icon: Dumbbell },
    { id: 'activity', label: 'ACTIVITY', icon: Compass },
    { id: 'progress', label: 'PROGRESS', icon: TrendingUp },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`nav-item ${isActive ? 'active' : ''}`}
            aria-label={tab.label}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span>{tab.label}</span>
          </button>
        );
      })}

      {/* More / Menu Drawer trigger */}
      <button
        onClick={onOpenMore}
        className="nav-item"
        aria-label="More"
        style={{ color: 'var(--text-muted)' }}
      >
        <Menu size={22} strokeWidth={2} />
        <span>MORE</span>
      </button>
    </nav>
  );
}
