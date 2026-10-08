import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Calendar, Dumbbell, Compass, Award, 
  Flame, Sparkles, Scale, ChevronRight
} from 'lucide-react';
import { api } from '../../services/api';

export default function MonthlyProgressView({ onOpenWeightTracker }) {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const months = [
    { num: 1, name: 'January' }, { num: 2, name: 'February' },
    { num: 3, name: 'March' }, { num: 4, name: 'April' },
    { num: 5, name: 'May' }, { num: 6, name: 'June' },
    { num: 7, name: 'July' }, { num: 8, name: 'August' },
    { num: 9, name: 'September' }, { num: 10, name: 'October' },
    { num: 11, name: 'November' }, { num: 12, name: 'December' }
  ];

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.getMonthlySummary(selectedMonth, selectedYear);
      setSummary(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth, selectedYear]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Header & Month Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px' }}>Monthly Progress</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Performance & Analytics</span>
        </div>

        {/* Month Dropdown */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            style={{
              background: 'var(--bg-input)',
              color: 'var(--text-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '6px 10px',
              fontSize: '13px',
              minHeight: '36px'
            }}
          >
            {months.map(m => (
              <option key={m.num} value={m.num}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 1. AI MONTHLY RECAP CARD */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 229, 153, 0.1) 100%)',
        border: '1px solid var(--border-active)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={18} style={{ color: 'var(--accent-cyan)' }} />
          <h3 style={{ fontSize: '16px' }}>AI Monthly Summary</h3>
        </div>
        <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-primary)' }}>
          {summary?.ai_summary || "Analyzing your monthly consistency and milestones..."}
        </p>
      </div>

      {/* 2. CONSISTENCY & ACTIVE DAYS GAUGE */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px' }}>Monthly Consistency</h3>
          <span className="badge badge-emerald">{summary?.consistency_pct || 0}% Consistent</span>
        </div>

        <div className="progress-bar-bg" style={{ height: '8px', marginBottom: '12px' }}>
          <div className="progress-bar-fill" style={{ width: `${summary?.consistency_pct || 0}%` }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <span>{summary?.days_logged || 0} active days logged</span>
          <span>Goal: 20+ days</span>
        </div>
      </div>

      {/* 3. KEY METRICS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        
        {/* Workouts */}
        <div className="card" style={{ background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
            <Dumbbell size={18} />
            <span style={{ fontSize: '12px', fontWeight: 700 }}>WORKOUTS</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900 }}>{summary?.workout_days || 0}</div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {summary?.workout_minutes || 0} total minutes
          </span>
        </div>

        {/* GPS Outdoor */}
        <div className="card" style={{ background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)', marginBottom: '8px' }}>
            <Compass size={18} />
            <span style={{ fontSize: '12px', fontWeight: 700 }}>DISTANCE</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900 }}>{summary?.distance_km || 0} <span style={{ fontSize: '14px' }}>km</span></div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {summary?.activities_count || 0} outdoor sessions
          </span>
        </div>

        {/* Nutrition Avg */}
        <div className="card" style={{ background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-coral)', marginBottom: '8px' }}>
            <Flame size={18} />
            <span style={{ fontSize: '12px', fontWeight: 700 }}>AVG INTAKE</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900 }}>{summary?.average_calories || 0} <span style={{ fontSize: '14px' }}>kcal</span></div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {summary?.average_protein_g || 0}g protein / day
          </span>
        </div>

        {/* Challenges & XP */}
        <div className="card" style={{ background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', marginBottom: '8px' }}>
            <Award size={18} />
            <span style={{ fontSize: '12px', fontWeight: 700 }}>MILESTONES</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 900 }}>{summary?.challenges_completed || 0}</div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Challenges finished
          </span>
        </div>
      </div>

      {/* 4. WEIGHT TRACKER JUMP */}
      <div 
        onClick={onOpenWeightTracker}
        className="card" 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          background: 'var(--bg-input)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(0, 240, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-cyan)'
          }}>
            <Scale size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px' }}>Body Weight Trend</div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Weight change this month: {summary?.weight_change_kg > 0 ? `+${summary?.weight_change_kg}` : summary?.weight_change_kg} kg
            </span>
          </div>
        </div>
        <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
      </div>

    </div>
  );
}
