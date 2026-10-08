import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Home, Play, RefreshCw, Clock, 
  Trash2, Sparkles, ChevronDown, ChevronUp, Check, Plus
} from 'lucide-react';
import { api } from '../../services/api';

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DURATIONS = [30, 45, 60, 75, 90];

export default function WorkoutView({ onLaunchPlayer }) {
  const [selectedDay, setSelectedDay] = useState(
    new Date().toLocaleDateString('en-US', { weekday: 'long' })
  );
  const [environment, setEnvironment] = useState('Home'); // Home vs Gym
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDuration, setSelectedDuration] = useState(90);

  // Exercise replacement modal
  const [replacingExercise, setReplacingExercise] = useState(null);
  const [replacementName, setReplacementName] = useState('');

  const fetchWorkout = async () => {
    setLoading(true);
    try {
      const res = await api.getWorkout();
      setWorkoutPlan(res.workout);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkout();
  }, []);

  const currentDayData = workoutPlan?.days?.find(
    d => d.day.toLowerCase() === selectedDay.toLowerCase()
  ) || workoutPlan?.days?.[0];

  const activeWorkoutObj = environment === 'Home' 
    ? currentDayData?.home_workout 
    : currentDayData?.gym_workout;

  const handleDurationChange = async (dur) => {
    setSelectedDuration(dur);
    setLoading(true);
    try {
      const res = await api.regenerateWorkout({ duration_minutes: dur });
      setWorkoutPlan(res.workout);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const res = await api.regenerateWorkout({ duration_minutes: selectedDuration });
      setWorkoutPlan(res.workout);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExercise = async (sectionKey, exIndex) => {
    if (!workoutPlan) return;
    const updatedDays = workoutPlan.days.map(d => {
      if (d.day.toLowerCase() === selectedDay.toLowerCase()) {
        const targetObj = environment === 'Home' ? { ...d.home_workout } : { ...d.gym_workout };
        const updatedList = [...(targetObj[sectionKey] || [])];
        updatedList.splice(exIndex, 1);
        targetObj[sectionKey] = updatedList;

        return environment === 'Home' 
          ? { ...d, home_workout: targetObj } 
          : { ...d, gym_workout: targetObj };
      }
      return d;
    });

    const updatedPlan = { ...workoutPlan, days: updatedDays };
    setWorkoutPlan(updatedPlan);
    await api.updateWorkout(updatedPlan);
  };

  const handleReplaceExerciseSubmit = async () => {
    if (!replacingExercise || !replacementName.trim()) return;

    const { sectionKey, index } = replacingExercise;
    const updatedDays = workoutPlan.days.map(d => {
      if (d.day.toLowerCase() === selectedDay.toLowerCase()) {
        const targetObj = environment === 'Home' ? { ...d.home_workout } : { ...d.gym_workout };
        const updatedList = [...(targetObj[sectionKey] || [])];
        updatedList[index] = {
          ...updatedList[index],
          name: replacementName.trim()
        };
        targetObj[sectionKey] = updatedList;

        return environment === 'Home' 
          ? { ...d, home_workout: targetObj } 
          : { ...d, gym_workout: targetObj };
      }
      return d;
    });

    const updatedPlan = { ...workoutPlan, days: updatedDays };
    setWorkoutPlan(updatedPlan);
    setReplacingExercise(null);
    setReplacementName('');
    await api.updateWorkout(updatedPlan);
  };

  const sections = [
    { key: 'warmup', title: '1. Warm-up', desc: 'Raise core temp & joint lubrication' },
    { key: 'mobility', title: '2. Mobility', desc: 'Dynamic range of motion & activation' },
    { key: 'strength', title: '3. Strength', desc: 'Hypertrophy & progressive resistance' },
    { key: 'cardio', title: '4. Cardio Conditioning', desc: 'High-intensity anaerobic/aerobic' },
    { key: 'core', title: '5. Core Power', desc: 'Midsection stability & posture' },
    { key: 'cooldown', title: '6. Cool-down', desc: 'Parasympathetic recovery & stretching' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Header & Day Selector */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '20px' }}>7-Day Dual Workout</h2>
          <button onClick={handleRegenerate} className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}>
            <RefreshCw size={14} /> Regenerate
          </button>
        </div>

        {/* Days Scroll */}
        <div className="scroll-tabs">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`tab-chip ${selectedDay.toLowerCase() === day.toLowerCase() ? 'active' : ''}`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Environment & Duration HUD */}
      <div className="card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          {/* Home vs Gym Pills */}
          <div style={{
            display: 'flex',
            background: 'var(--bg-input)',
            borderRadius: 'var(--radius-full)',
            padding: '4px'
          }}>
            <button
              onClick={() => setEnvironment('Home')}
              style={{
                minHeight: '32px',
                height: '32px',
                padding: '0 16px',
                borderRadius: 'var(--radius-full)',
                background: environment === 'Home' ? 'var(--gradient-brand)' : 'transparent',
                color: environment === 'Home' ? '#0A0D14' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '13px'
              }}
            >
              Home Workout
            </button>
            <button
              onClick={() => setEnvironment('Gym')}
              style={{
                minHeight: '32px',
                height: '32px',
                padding: '0 16px',
                borderRadius: 'var(--radius-full)',
                background: environment === 'Gym' ? 'var(--gradient-brand)' : 'transparent',
                color: environment === 'Gym' ? '#0A0D14' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '13px'
              }}
            >
              Gym Workout
            </button>
          </div>

          <span className="badge badge-cyan">
            {activeWorkoutObj?.duration_minutes || selectedDuration} Mins
          </span>
        </div>

        {/* Duration selector chips */}
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            SESSION DURATION
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            {DURATIONS.map(dur => (
              <button
                key={dur}
                onClick={() => handleDurationChange(dur)}
                style={{
                  flex: 1,
                  minHeight: '32px',
                  height: '32px',
                  padding: 0,
                  fontSize: '12px',
                  borderRadius: 'var(--radius-sm)',
                  background: selectedDuration === dur ? 'rgba(0, 240, 255, 0.15)' : 'var(--bg-input)',
                  border: selectedDuration === dur ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  color: selectedDuration === dur ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: 600
                }}
              >
                {dur}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* START WORKOUT CTA BUTTON */}
      <button
        onClick={() => onLaunchPlayer(currentDayData, environment)}
        className="btn btn-primary"
        style={{ width: '100%', fontSize: '16px', padding: '14px' }}
      >
        <Play size={20} fill="#0A0D14" />
        Start {environment} Workout (+100 XP)
      </button>

      {/* 6 WORKOUT SECTIONS: Warmup -> Cooldown */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
          <Sparkles size={28} className="spin-animation" style={{ color: 'var(--accent-cyan)', marginBottom: '8px' }} />
          <p>Preparing workout plan...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {sections.map(sec => {
            const list = activeWorkoutObj?.[sec.key] || [];
            if (list.length === 0) return null;

            return (
              <div key={sec.key} className="card">
                <div style={{ marginBottom: '10px' }}>
                  <h3 style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{sec.title}</h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sec.desc}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {list.map((ex, exIdx) => (
                    <div
                      key={exIdx}
                      style={{
                        background: 'var(--bg-input)',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700 }}>{ex.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--accent-cyan)', marginTop: '2px' }}>
                            {ex.sets} sets • {ex.reps} • {ex.rest_seconds || 45}s rest
                          </div>
                        </div>

                        {/* Action buttons: Replace or Remove */}
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => {
                              setReplacingExercise({ sectionKey: sec.key, index: exIdx, name: ex.name });
                              setReplacementName(ex.name);
                            }}
                            className="btn btn-icon"
                            title="Replace exercise"
                            style={{ width: '28px', height: '28px', background: 'transparent', color: 'var(--text-secondary)' }}
                          >
                            <Sparkles size={14} />
                          </button>
                          <button
                            onClick={() => handleRemoveExercise(sec.key, exIdx)}
                            className="btn btn-icon"
                            title="Remove"
                            style={{ width: '28px', height: '28px', background: 'transparent', color: 'var(--accent-coral)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {ex.instructions && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                          {ex.instructions}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* REPLACE EXERCISE MODAL */}
      {replacingExercise && (
        <div className="modal-overlay" onClick={() => setReplacingExercise(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>Replace Exercise</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '14px' }}>
              Replace "{replacingExercise.name}" with a preferred variation:
            </p>

            <input
              type="text"
              value={replacementName}
              onChange={(e) => setReplacementName(e.target.value)}
              placeholder="e.g. Bulgarian Split Squats, Dumbbell Press"
              style={{ fontSize: '16px', marginBottom: '16px' }}
              autoFocus
            />

            <button onClick={handleReplaceExerciseSubmit} className="btn btn-primary" style={{ width: '100%' }}>
              Save Replacement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
