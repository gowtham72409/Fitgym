import React, { useState, useEffect } from 'react';
import { 
  Settings, Sun, Moon, Bell, Shield, Download, 
  Trash2, LogOut, ArrowLeft, Check, Smartphone, Eye, EyeOff, MapPin, Camera
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function SettingsView({ onBack }) {
  const { logout } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('fitquest_theme') || 'dark');
  const [units, setUnits] = useState('kg');
  const [distanceUnit, setDistanceUnit] = useState('km');
  const [widgets, setWidgets] = useState([
    { id: 'progress', title: "Today's Progress", enabled: true },
    { id: 'diet', title: "Today's Diet", enabled: true },
    { id: 'workout', title: "Today's Workout", enabled: true },
    { id: 'challenge', title: 'Daily Challenge', enabled: true },
    { id: 'activity', title: 'Outdoor Activity', enabled: true },
    { id: 'stats', title: 'Weight & BMI', enabled: true },
    { id: 'xp', title: 'XP & Level', enabled: true },
    { id: 'sara', title: 'Ask Sara AI', enabled: true }
  ]);
  const [savingNotice, setSavingNotice] = useState('');
  const [deletingConfirm, setDeletingConfirm] = useState(false);

  useEffect(() => {
    // Load remote preferences
    api.getSettings().then(res => {
      if (res.settings) {
        if (res.settings.units) setUnits(res.settings.units);
        if (res.settings.distance_unit) setDistanceUnit(res.settings.distance_unit);
      }
    }).catch(() => {});

    api.getDashboardPreferences().then(res => {
      if (res.preferences?.widgets) {
        setWidgets(res.preferences.widgets);
      }
    }).catch(() => {});
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('fitquest_theme', newTheme);
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const handleToggleWidget = async (widgetId) => {
    const updated = widgets.map(w => w.id === widgetId ? { ...w, enabled: !w.enabled } : w);
    setWidgets(updated);
    try {
      await api.updateDashboardPreferences({ widgets: updated });
      showNotice('Dashboard layout updated');
    } catch (e) {}
  };

  const handleSaveUnits = async (u, du) => {
    setUnits(u);
    setDistanceUnit(du);
    try {
      await api.updateSettings({ units: u, distance_unit: du });
      showNotice('Measurement units saved');
    } catch (e) {}
  };

  const showNotice = (msg) => {
    setSavingNotice(msg);
    setTimeout(() => setSavingNotice(''), 2500);
  };

  const handleExportData = async () => {
    try {
      const profile = await api.getProfile();
      const diet = await api.getDiet();
      const workout = await api.getWorkout();
      const summary = await api.getMonthlySummary();

      const blob = new Blob([JSON.stringify({ profile, diet, workout, summary }, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitquest-export-${Date.now()}.json`;
      a.click();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.deleteAccount();
      logout();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onBack && (
          <button onClick={onBack} className="btn btn-secondary btn-icon" style={{ width: '36px', height: '36px' }}>
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <h2 style={{ fontSize: '20px' }}>Settings & Customization</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Configure layout, theme & privacy</span>
        </div>
      </div>

      {savingNotice && (
        <div style={{
          background: 'rgba(0, 229, 153, 0.15)',
          color: 'var(--accent-emerald)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} />
          <span>{savingNotice}</span>
        </div>
      )}

      {/* 1. THEME SELECTION */}
      <div className="card">
        <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Appearance Theme</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={() => handleThemeChange('dark')}
            className={theme === 'dark' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding: '12px' }}
          >
            <Moon size={18} />
            Dark Mode
          </button>
          <button
            onClick={() => handleThemeChange('light')}
            className={theme === 'light' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding: '12px' }}
          >
            <Sun size={18} />
            Light Mode
          </button>
        </div>
      </div>

      {/* 2. UNITS SELECTION */}
      <div className="card">
        <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Units of Measurement</h3>
        
        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Weight</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {['kg', 'lb'].map(u => (
              <button
                key={u}
                onClick={() => handleSaveUnits(u, distanceUnit)}
                className={units === u ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ minHeight: '36px', height: '36px', padding: 0 }}
              >
                {u.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Distance</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {['km', 'miles'].map(du => (
              <button
                key={du}
                onClick={() => handleSaveUnits(units, du)}
                className={distanceUnit === du ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ minHeight: '36px', height: '36px', padding: 0 }}
              >
                {du.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. DASHBOARD WIDGETS CUSTOMIZATION */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px' }}>Dashboard Personalization</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Show or hide home widgets</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {widgets.map(w => (
            <div
              key={w.id}
              onClick={() => handleToggleWidget(w.id)}
              style={{
                background: 'var(--bg-input)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{w.title}</span>
              {w.enabled ? (
                <span className="badge badge-cyan" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Eye size={12} /> Shown
                </span>
              ) : (
                <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                  <EyeOff size={12} /> Hidden
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. PERMISSIONS & PRIVACY EXPLAINER */}
      <div className="card">
        <h3 style={{ fontSize: '16px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} style={{ color: 'var(--accent-cyan)' }} />
          Hardware & Privacy Disclosures
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: '8px' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <MapPin size={14} style={{ color: 'var(--accent-cyan)' }} /> Location Access
            </div>
            Used only during live outdoor runs/walks to measure distance and pace. Never recorded in the background.
          </div>

          <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: '8px' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Camera size={14} style={{ color: 'var(--accent-cyan)' }} /> Camera Access
            </div>
            Used strictly to capture meals for Vision AI nutrition analysis. Photos belong exclusively to your account.
          </div>
        </div>
      </div>

      {/* 5. DATA EXPORT & ACCOUNT ACTIONS */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={handleExportData} className="btn btn-secondary" style={{ width: '100%', gap: '8px' }}>
          <Download size={18} /> Export All Personal Data (JSON)
        </button>

        <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', gap: '8px' }}>
          <LogOut size={18} /> Sign Out of FitQuest
        </button>

        {deletingConfirm ? (
          <div style={{ background: 'rgba(255,94,94,0.15)', padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <p style={{ color: 'var(--accent-coral)', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
              Are you sure? This permanently deletes all your diet, workouts, food scans, and progress.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setDeletingConfirm(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button onClick={handleDeleteAccount} className="btn btn-danger" style={{ flex: 1 }}>
                Confirm Delete
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => setDeletingConfirm(true)} className="btn btn-danger" style={{ width: '100%', gap: '8px' }}>
            <Trash2 size={18} /> Delete Account & Wipe Data
          </button>
        )}
      </div>

    </div>
  );
}
