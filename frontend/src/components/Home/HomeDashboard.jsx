import React, { useState } from 'react';
import { 
  Flame, Droplets, Dumbbell, Compass, Award, 
  ChevronRight, Play, CheckCircle2, Sparkles, Plus, RefreshCw, Bot
} from 'lucide-react';
import { api } from '../../services/api';

export default function HomeDashboard({ 
  dayData, 
  onRefresh, 
  onNavigateTab, 
  onStartWorkout, 
  onStartActivity,
  onOpenSara,
  onOpenCheckin,
  onOpenScanner
}) {
  const [completingChallenge, setCompletingChallenge] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState('Home'); // Home vs Gym switcher

  const progress = dayData?.today_progress || {};
  const metrics = dayData?.metrics || {};
  const user = dayData?.user || {};
  const challenge = dayData?.today_challenge;
  const todayWorkout = dayData?.today_workout;
  const todayMeals = dayData?.today_meals || [];

  const xp = user?.xp || 0;
  const level = user?.level || 1;
  const xpCurrentInLevel = xp % 1000;
  const xpRemaining = 1000 - xpCurrentInLevel;
  const levelProgressPct = Math.min(100, Math.round((xpCurrentInLevel / 1000) * 100));

  const handleCompleteChallenge = async () => {
    if (!challenge || challenge.completed || completingChallenge) return;
    setCompletingChallenge(true);
    try {
      await api.completeChallenge(challenge.id);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setCompletingChallenge(false);
    }
  };

  const activeWorkoutObj = selectedEnv === 'Home' 
    ? todayWorkout?.home_workout 
    : todayWorkout?.gym_workout;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 1. XP / LEVEL HERO CARD */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(18, 24, 38, 0.95) 0%, rgba(12, 16, 26, 0.95) 100%)',
        border: '1px solid var(--border-active)',
        boxShadow: 'var(--shadow-glow-cyan)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'var(--gradient-brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0A0D14',
              fontWeight: 900,
              fontSize: '18px'
            }}>
              L{level}
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>ATHLETE LEVEL</div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
                {level === 1 ? 'Challenger' : level === 2 ? 'Warrior' : level === 3 ? 'Master Athlete' : 'Elite Champion'}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {xp} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>XP</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{xpRemaining} XP to Level {level + 1}</div>
          </div>
        </div>

        <div className="progress-bar-bg" style={{ height: '7px' }}>
          <div className="progress-bar-fill" style={{ width: `${levelProgressPct}%` }} />
        </div>
      </div>

      {/* 2. TODAY'S PROGRESS OVERVIEW */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Flame size={18} style={{ color: 'var(--accent-coral)' }} />
            Today's Progress
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', cursor: 'pointer' }} onClick={() => onNavigateTab('progress')}>
            Details
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          {/* Calories Ring/Box */}
          <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              <span>Calories</span>
              <span>{progress.calories_target || 2000} kcal</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {progress.calories_consumed || 0}
            </div>
            <div className="progress-bar-bg" style={{ height: '4px', marginTop: '6px' }}>
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${Math.min(100, Math.round(((progress.calories_consumed || 0) / (progress.calories_target || 2000)) * 100))}%`,
                  background: 'var(--gradient-flame)'
                }} 
              />
            </div>
          </div>

          {/* Protein Box */}
          <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              <span>Protein</span>
              <span>{progress.protein_target_g || 130}g</span>
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
              {progress.protein_consumed_g || 0} <span style={{ fontSize: '12px' }}>g</span>
            </div>
            <div className="progress-bar-bg" style={{ height: '4px', marginTop: '6px' }}>
              <div 
                className="progress-bar-fill" 
                style={{ 
                  width: `${Math.min(100, Math.round(((progress.protein_consumed_g || 0) / (progress.protein_target_g || 130)) * 100))}%`,
                  background: 'var(--gradient-brand)'
                }} 
              />
            </div>
          </div>
        </div>

        {/* Quick Toggles: Water & Workout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div 
            onClick={onOpenCheckin}
            style={{
              background: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid rgba(0, 240, 255, 0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Droplets size={18} style={{ color: 'var(--accent-cyan)' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Water Log</div>
                <div style={{ fontSize: '14px', fontWeight: 700 }}>{progress.water_ml || 0} ml</div>
              </div>
            </div>
            <Plus size={16} style={{ color: 'var(--accent-cyan)' }} />
          </div>

          <div 
            onClick={() => onNavigateTab('workout')}
            style={{
              background: progress.workout_completed ? 'rgba(0, 229, 153, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              border: progress.workout_completed ? '1px solid rgba(0, 229, 153, 0.3)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Dumbbell size={18} style={{ color: progress.workout_completed ? 'var(--accent-emerald)' : 'var(--text-secondary)' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Training</div>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>
                  {progress.workout_completed ? 'Done (+100 XP)' : 'Pending'}
                </div>
              </div>
            </div>
            {progress.workout_completed ? <CheckCircle2 size={16} style={{ color: 'var(--accent-emerald)' }} /> : <Play size={14} />}
          </div>
        </div>
      </div>

      {/* 3. TODAY'S WORKOUT CARD */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px' }}>Today's Workout</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {todayWorkout?.focus || "Daily Strength & Conditioning"}
            </span>
          </div>

          {/* Home vs Gym Switcher */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-full)',
            padding: '3px'
          }}>
            <button
              onClick={() => setSelectedEnv('Home')}
              style={{
                minHeight: '28px',
                height: '28px',
                padding: '0 12px',
                fontSize: '12px',
                borderRadius: 'var(--radius-full)',
                background: selectedEnv === 'Home' ? 'var(--gradient-brand)' : 'transparent',
                color: selectedEnv === 'Home' ? '#0A0D14' : 'var(--text-secondary)'
              }}
            >
              Home
            </button>
            <button
              onClick={() => setSelectedEnv('Gym')}
              style={{
                minHeight: '28px',
                height: '28px',
                padding: '0 12px',
                fontSize: '12px',
                borderRadius: 'var(--radius-full)',
                background: selectedEnv === 'Gym' ? 'var(--gradient-brand)' : 'transparent',
                color: selectedEnv === 'Gym' ? '#0A0D14' : 'var(--text-secondary)'
              }}
            >
              Gym
            </button>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-input)',
          borderRadius: 'var(--radius-md)',
          padding: '14px',
          marginBottom: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>
              {selectedEnv} Workout Routine
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Target: ~{activeWorkoutObj?.duration_minutes || 90} mins • 6 Modules (Warmup to Cooldown)
            </div>
          </div>

          <span className="badge badge-cyan">
            {activeWorkoutObj?.strength?.length || 3} Exercises
          </span>
        </div>

        <button
          onClick={() => onStartWorkout(todayWorkout, selectedEnv)}
          className="btn btn-primary"
          style={{ width: '100%', gap: '10px' }}
        >
          <Play size={18} fill="#0A0D14" />
          Start {selectedEnv} Workout (+100 XP)
        </button>
      </div>

      {/* 4. TODAY'S DIET PREVIEW */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px' }}>Today's Diet</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>4 Balanced High-Protein Meals</span>
          </div>
          <button
            onClick={() => onNavigateTab('diet')}
            className="btn btn-icon"
            style={{ width: '32px', height: '32px', background: 'transparent', color: 'var(--accent-cyan)' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {todayMeals.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {todayMeals.slice(0, 3).map((m, idx) => (
              <div
                key={idx}
                onClick={() => onNavigateTab('diet')}
                style={{
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-md)',
                  padding: '10px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {m.meal}
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{m.food_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{m.quantity}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: 700 }}>{m.calories} <span style={{ fontSize: '10px' }}>kcal</span></div>
                  <div style={{ fontSize: '11px', color: 'var(--accent-emerald)' }}>{m.protein_g}g protein</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '10px' }}>No meals generated yet</p>
            <button onClick={() => onNavigateTab('diet')} className="btn btn-outline" style={{ fontSize: '13px' }}>
              Create My Diet Plan
            </button>
          </div>
        )}

        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
          <button
            onClick={onOpenScanner}
            className="btn btn-secondary"
            style={{ flex: 1, fontSize: '13px' }}
          >
            <Plus size={16} /> Scan Meal with Camera
          </button>
        </div>
      </div>

      {/* 5. DAILY CHALLENGE */}
      {challenge && (
        <div className="card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <span className="badge badge-gold" style={{ marginBottom: '6px' }}>Daily Challenge</span>
              <h3 style={{ fontSize: '16px' }}>{challenge.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>{challenge.description}</p>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-gold)' }}>
              +{challenge.xp_reward || 50} XP
            </span>
          </div>

          <button
            onClick={handleCompleteChallenge}
            disabled={challenge.completed || completingChallenge}
            className={challenge.completed ? 'btn btn-secondary' : 'btn btn-primary'}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {challenge.completed ? (
              <>
                <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)' }} />
                Completed
              </>
            ) : completingChallenge ? 'Claiming Reward...' : 'Mark Complete'}
          </button>
        </div>
      )}

      {/* 6. OUTDOOR ACTIVITY LAUNCHER */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={18} style={{ color: 'var(--accent-cyan)' }} />
            Outdoor GPS Activity
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', cursor: 'pointer' }} onClick={() => onNavigateTab('activity')}>
            GPS Tracker
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
          {['Walking', 'Running', 'Cycling', 'Hiking'].map(act => (
            <button
              key={act}
              onClick={() => onStartActivity(act)}
              className="btn btn-secondary"
              style={{
                flexDirection: 'column',
                padding: '12px 4px',
                fontSize: '12px',
                fontWeight: 700,
                gap: '4px',
                background: 'var(--bg-input)'
              }}
            >
              <span>{act === 'Walking' ? '🚶' : act === 'Running' ? '🏃' : act === 'Cycling' ? '🚴' : '🥾'}</span>
              <span>{act}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 7. PROGRESS & BODY STATS */}
      {metrics && metrics.bmi && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px' }}>Body Metrics</h3>
            <span className="badge badge-cyan">{metrics.bmi_category}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
            <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BMI</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-cyan)' }}>{metrics.bmi}</div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BMR</div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>{metrics.bmr} <span style={{ fontSize: '10px' }}>kcal</span></div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Target Diff</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-emerald)' }}>{metrics.weight_diff_kg} <span style={{ fontSize: '10px' }}>kg</span></div>
            </div>
          </div>
        </div>
      )}

      {/* 8. SARA AI ASSISTANT CARD */}
      <div 
        onClick={onOpenSara}
        className="card" 
        style={{
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 229, 153, 0.1) 100%)',
          border: '1px solid var(--border-active)',
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0A0D14',
            boxShadow: 'var(--shadow-glow-cyan)'
          }}>
            <Bot size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h4 style={{ fontSize: '16px' }}>Chat with Sara AI</h4>
              <Sparkles size={14} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              "What should I eat today?" or "Switch my workout"
            </p>
          </div>
          <ChevronRight size={20} style={{ color: 'var(--accent-cyan)' }} />
        </div>
      </div>

    </div>
  );
}
