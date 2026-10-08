import React, { useState, useEffect } from 'react';
import { Scale, TrendingDown, TrendingUp, Plus, Calendar, ArrowLeft } from 'lucide-react';
import { api } from '../../services/api';

export default function WeightTrackerView({ onBack, onWeightLogged }) {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    starting_weight_kg: 75,
    current_weight_kg: 72,
    target_weight_kg: 68,
    progress_pct: 42,
    metrics: {}
  });
  const [newWeight, setNewWeight] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchWeightData = async () => {
    setLoading(true);
    try {
      const res = await api.getWeightHistory();
      setHistory(res.history || []);
      setStats({
        starting_weight_kg: res.starting_weight_kg,
        current_weight_kg: res.current_weight_kg,
        target_weight_kg: res.target_weight_kg,
        progress_pct: res.progress_pct,
        metrics: res.metrics || {}
      });
      setNewWeight(res.current_weight_kg?.toString() || '');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeightData();
  }, []);

  const handleLogWeight = async (e) => {
    e.preventDefault();
    const val = parseFloat(newWeight);
    if (!val || val <= 0) return;

    setSaving(true);
    try {
      await api.logWeight({ weight_kg: val });
      fetchWeightData();
      if (onWeightLogged) onWeightLogged();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Generate SVG points for Weight History Chart
  const renderChart = () => {
    if (history.length < 2) {
      return (
        <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          Log at least 2 weight entries to visualize your progress curve.
        </div>
      );
    }

    const weights = history.map(h => h.weight_kg);
    const minW = Math.min(...weights) - 1;
    const maxW = Math.max(...weights) + 1;
    const rangeW = maxW - minW || 1;

    const width = 320;
    const height = 120;
    const padding = 15;

    const points = history.map((item, idx) => {
      const x = padding + (idx / (history.length - 1)) * (width - padding * 2);
      const y = height - padding - ((item.weight_kg - minW) / rangeW) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '140px', overflow: 'visible' }}>
          {/* Subtle grid lines */}
          <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />
          
          {/* Polyline line */}
          <polyline
            fill="none"
            stroke="var(--accent-cyan)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Dots */}
          {history.map((item, idx) => {
            const x = padding + (idx / (history.length - 1)) * (width - padding * 2);
            const y = height - padding - ((item.weight_kg - minW) / rangeW) * (height - padding * 2);
            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="4.5"
                fill="#0A0D14"
                stroke="var(--accent-cyan)"
                strokeWidth="2.5"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  const totalLost = (stats.starting_weight_kg - stats.current_weight_kg).toFixed(1);

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
          <h2 style={{ fontSize: '20px' }}>Weight & Body Composition</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Track progress and BMI milestones</span>
        </div>
      </div>

      {/* 1. PROGRESS HUD */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(18, 24, 38, 0.95) 0%, rgba(12, 16, 26, 0.95) 100%)',
        border: '1px solid var(--border-active)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CURRENT WEIGHT</span>
            <div style={{ fontSize: '32px', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {stats.current_weight_kg} <span style={{ fontSize: '16px', color: 'var(--accent-cyan)' }}>kg</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-emerald" style={{ marginBottom: '4px' }}>
              {parseFloat(totalLost) >= 0 ? `-${totalLost} kg` : `+${Math.abs(totalLost)} kg`}
            </span>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Target: {stats.target_weight_kg} kg
            </div>
          </div>
        </div>

        {/* Progress percentage bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Goal Progress</span>
            <span style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{stats.progress_pct}% Completed</span>
          </div>
          <div className="progress-bar-bg" style={{ height: '8px' }}>
            <div className="progress-bar-fill" style={{ width: `${stats.progress_pct}%` }} />
          </div>
        </div>
      </div>

      {/* 2. LOG NEW WEIGHT */}
      <div className="card">
        <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scale size={18} style={{ color: 'var(--accent-cyan)' }} />
          Log Today's Weight (+10 XP)
        </h3>

        <form onSubmit={handleLogWeight} style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="number"
              step="0.1"
              placeholder="e.g. 72.5"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              required
              style={{ paddingRight: '40px', fontSize: '16px' }}
            />
            <span style={{ position: 'absolute', right: '14px', top: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>
              kg
            </span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '0 20px', minWidth: '100px' }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>

      {/* 3. INTERACTIVE PROGRESS CURVE CHART */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px' }}>Weight Trend Curve</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Chronological</span>
        </div>

        {renderChart()}
      </div>

      {/* 4. RECENT HISTORY TABLE */}
      <div className="card">
        <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Weight Logs</h3>
        {history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '12px 0' }}>
            No weight entries logged yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[...history].reverse().slice(0, 7).map((entry, idx) => (
              <div
                key={entry.id || idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-input)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>{entry.date_str}</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>
                  {entry.weight_kg} kg
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
