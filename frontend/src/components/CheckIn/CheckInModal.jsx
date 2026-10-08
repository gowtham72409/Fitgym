import React, { useState } from 'react';
import { Droplets, Moon, Zap, Smile, X, Plus, Minus, Check } from 'lucide-react';
import { api } from '../../services/api';

export default function CheckInModal({ isOpen, onClose, onLogged }) {
  const [mood, setMood] = useState('Good');
  const [sleepHours, setSleepHours] = useState(7.5);
  const [waterMl, setWaterMl] = useState(1500);
  const [energy, setEnergy] = useState(8);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const moods = [
    { label: 'Excellent', emoji: '🤩' },
    { label: 'Good', emoji: '😊' },
    { label: 'Okay', emoji: '😐' },
    { label: 'Tired', emoji: '🥱' },
    { label: 'Stressed', emoji: '😓' }
  ];

  const handleAddWater = (amount) => {
    setWaterMl(w => Math.max(0, w + amount));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await api.logCheckin({
        mood,
        sleep_hours: sleepHours,
        water_ml: waterMl,
        energy
      });
      if (onLogged) onLogged();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '18px' }}>Daily Check-in & Water</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Log your daily wellness habits (+10 XP)</span>
          </div>
          <button onClick={onClose} className="btn btn-icon" style={{ background: 'var(--bg-input)', width: '36px', height: '36px' }}>
            <X size={18} />
          </button>
        </div>

        {/* 1. MOOD / FEELING */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            How are you feeling today?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {moods.map(m => (
              <button
                key={m.label}
                type="button"
                onClick={() => setMood(m.label)}
                className={mood === m.label ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ flexDirection: 'column', padding: '10px 0', gap: '4px', minHeight: '52px' }}
              >
                <span style={{ fontSize: '20px' }}>{m.emoji}</span>
                <span style={{ fontSize: '10px' }}>{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. WATER TRACKER */}
        <div className="card" style={{ background: 'var(--bg-input)', marginBottom: '16px', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Droplets size={20} style={{ color: 'var(--accent-cyan)' }} />
              <div>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>Water Intake</span>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target: 3,000 ml</div>
              </div>
            </div>
            <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {waterMl} <span style={{ fontSize: '12px' }}>ml</span>
            </span>
          </div>

          {/* Quick Glass add buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleAddWater(250)}
              className="btn btn-secondary"
              style={{ flex: 1, minHeight: '34px', height: '34px', fontSize: '12px' }}
            >
              <Plus size={14} /> 1 Glass (250ml)
            </button>
            <button
              onClick={() => handleAddWater(500)}
              className="btn btn-secondary"
              style={{ flex: 1, minHeight: '34px', height: '34px', fontSize: '12px' }}
            >
              <Plus size={14} /> 1 Bottle (500ml)
            </button>
            <button
              onClick={() => handleAddWater(-250)}
              className="btn btn-secondary"
              style={{ width: '40px', minHeight: '34px', height: '34px', padding: 0 }}
            >
              <Minus size={14} />
            </button>
          </div>
        </div>

        {/* 3. SLEEP HOURS */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Sleep Duration</span>
            <span style={{ fontSize: '14px', fontWeight: 700 }}>{sleepHours} Hours</span>
          </div>
          <input
            type="range"
            min="3"
            max="12"
            step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-cyan)' }}
          />
        </div>

        {/* 4. ENERGY LEVEL */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Energy Level</span>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent-emerald)' }}>{energy} / 10</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            value={energy}
            onChange={(e) => setEnergy(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--accent-emerald)' }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="btn btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '16px' }}
        >
          {saving ? 'Saving...' : 'Save Daily Check-in'}
        </button>
      </div>
    </div>
  );
}
