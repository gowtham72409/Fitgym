import React, { useState, useEffect } from 'react';
import { Award, CheckCircle2, RefreshCw, Sparkles, ArrowLeft, Check, Trophy } from 'lucide-react';
import { api } from '../../services/api';

export default function ChallengesView({ onBack, onChallengeCompleted }) {
  const [todayChallenge, setTodayChallenge] = useState(null);
  const [history, setHistory] = useState([]);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const res = await api.getChallenges();
      setTodayChallenge(res.today_challenge);
      setHistory(res.history || []);
      setPresets(res.available_presets || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleComplete = async () => {
    if (!todayChallenge || todayChallenge.completed || completing) return;
    setCompleting(true);
    try {
      const res = await api.completeChallenge(todayChallenge.id);
      setTodayChallenge(res.challenge);
      fetchChallenges();
      if (onChallengeCompleted) onChallengeCompleted();
    } catch (e) {
      console.error(e);
    } finally {
      setCompleting(false);
    }
  };

  const handlePickPreset = async (preset) => {
    try {
      const res = await api.customizeChallenge({
        title: preset.title,
        description: preset.description,
        difficulty: preset.difficulty
      });
      setTodayChallenge(res.challenge);
      setShowPresets(false);
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
          <h2 style={{ fontSize: '20px' }}>Daily Challenges</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>AI-personalized discipline builder</span>
        </div>
      </div>

      {/* 1. TODAY'S ACTIVE CHALLENGE */}
      {todayChallenge && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(18, 24, 38, 0.95) 0%, rgba(12, 16, 26, 0.95) 100%)',
          border: '1px solid var(--accent-gold)',
          boxShadow: '0 0 24px rgba(255, 184, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <span className="badge badge-gold" style={{ marginBottom: '6px' }}>
                {todayChallenge.difficulty} • {todayChallenge.date_str || 'Today'}
              </span>
              <h3 style={{ fontSize: '20px', lineHeight: '1.2' }}>{todayChallenge.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {todayChallenge.description}
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '20px', fontWeight: 900, color: 'var(--accent-gold)' }}>
                +{todayChallenge.xp_reward || 50}
              </span>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>XP REWARD</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              onClick={handleComplete}
              disabled={todayChallenge.completed || completing}
              className={todayChallenge.completed ? 'btn btn-secondary' : 'btn btn-primary'}
              style={{ flex: 1, padding: '14px', fontSize: '15px' }}
            >
              {todayChallenge.completed ? (
                <>
                  <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} />
                  Completed (+{todayChallenge.xp_reward} XP)
                </>
              ) : completing ? 'Claiming...' : 'Complete Challenge'}
            </button>

            {!todayChallenge.completed && (
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="btn btn-secondary"
                style={{ padding: '0 16px' }}
                title="Swap challenge"
              >
                <RefreshCw size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. CHOOSE ANOTHER CHALLENGE MODAL / DRAWER */}
      {showPresets && (
        <div className="card" style={{ border: '1px solid var(--border-active)' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Choose Alternative Challenge</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {presets.map((p, idx) => (
              <div
                key={idx}
                onClick={() => handlePickPreset(p)}
                style={{
                  background: 'var(--bg-input)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{p.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{p.description}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${p.difficulty === 'Easy' ? 'badge-emerald' : p.difficulty === 'Hard' ? 'badge-coral' : 'badge-gold'}`}>
                    {p.difficulty}
                  </span>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginTop: '2px', color: 'var(--accent-gold)' }}>
                    +{p.xp} XP
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. CHALLENGE HISTORY */}
      <div className="card">
        <h3 style={{ fontSize: '16px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={18} style={{ color: 'var(--accent-gold)' }} />
          Completed Challenges
        </h3>

        {history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
            No challenges completed yet. Conquer today's challenge above!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {history.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--bg-input)',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{item.challenge_title}</div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.date_str}</span>
                </div>
                <span className="badge badge-gold">+{item.xp_reward || 50} XP</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
