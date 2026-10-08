import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, X, CheckCircle, 
  Flame, Award, Timer, Volume2
} from 'lucide-react';
import { api } from '../../services/api';

// Web Audio API chime generator for rest timer completion
function playChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  } catch (e) {}

  if ('vibrate' in navigator) {
    navigator.vibrate([100, 50, 100]);
  }
}

export default function WorkoutPlayer({ workoutData, environment = 'Home', onClose, onComplete }) {
  const activeProgram = environment === 'Home' 
    ? workoutData?.home_workout 
    : workoutData?.gym_workout;

  // Flatten exercises across 6 sections
  const sections = ['warmup', 'mobility', 'strength', 'cardio', 'core', 'cooldown'];
  const allExercises = [];
  sections.forEach(sec => {
    const list = activeProgram?.[sec] || [];
    list.forEach(item => {
      allExercises.push({ ...item, section: sec.toUpperCase() });
    });
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);

  // Rest Timer state
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [isResting, setIsResting] = useState(false);

  // Set counter
  const [completedSets, setCompletedSets] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);

  const currentExercise = allExercises[currentIndex] || {
    name: 'Push-ups',
    sets: 3,
    reps: '12 reps',
    rest_seconds: 45,
    instructions: 'Maintain rigid plank posture.'
  };

  // Workout duration stopwatch
  useEffect(() => {
    if (isFinished || isPaused) return;
    const interval = setInterval(() => {
      setTotalSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isFinished, isPaused]);

  // Rest timer countdown
  useEffect(() => {
    if (!isResting || isPaused) return;
    if (restSecondsLeft <= 0) {
      setIsResting(false);
      playChime();
      return;
    }
    const interval = setInterval(() => {
      setRestSecondsLeft(s => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isResting, restSecondsLeft, isPaused]);

  const handleNextSet = () => {
    const targetSets = currentExercise.sets || 3;
    if (completedSets + 1 < targetSets) {
      setCompletedSets(c => c + 1);
      // Start rest timer
      setRestSecondsLeft(currentExercise.rest_seconds || 45);
      setIsResting(true);
    } else {
      // Move to next exercise
      handleNextExercise();
    }
  };

  const handleNextExercise = () => {
    setCompletedSets(0);
    setIsResting(false);
    if (currentIndex + 1 < allExercises.length) {
      setCurrentIndex(i => i + 1);
    } else {
      finishWorkoutSession();
    }
  };

  const handlePrevExercise = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setCompletedSets(0);
      setIsResting(false);
    }
  };

  const finishWorkoutSession = async () => {
    setIsFinished(true);
    const caloriesBurned = Math.round((totalSeconds / 60) * 7.5);
    try {
      const res = await api.completeWorkout({
        duration_seconds: totalSeconds,
        exercises_completed: allExercises.length,
        calories_estimate: caloriesBurned,
        workout_name: `${environment} ${workoutData?.focus || 'Workout'}`,
        environment
      });
      setCompletionResult(res);
      playChime();
    } catch (e) {
      setCompletionResult({
        xp_awarded: 100,
        calories: caloriesBurned,
        duration_seconds: totalSeconds
      });
    }
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Completion Summary Screen
  if (isFinished) {
    return (
      <div className="modal-overlay" style={{ background: 'var(--bg-primary)' }}>
        <div className="bottom-sheet" style={{ height: '95vh', maxHeight: '95vh', textAlign: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'var(--gradient-brand)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0A0D14',
            margin: '0 auto 20px auto',
            boxShadow: 'var(--shadow-glow-cyan)'
          }}>
            <Award size={44} />
          </div>

          <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>Workout Smashed!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Incredible effort. You've made solid progress today.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
            <div className="card" style={{ background: 'var(--bg-input)', padding: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Duration</span>
              <div style={{ fontSize: '22px', fontWeight: 800 }}>{formatTimer(totalSeconds)}</div>
            </div>
            <div className="card" style={{ background: 'var(--bg-input)', padding: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Burned</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-coral)' }}>
                {completionResult?.calories || Math.round((totalSeconds/60)*7.5)} kcal
              </div>
            </div>
            <div className="card" style={{ background: 'var(--bg-input)', padding: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Exercises</span>
              <div style={{ fontSize: '22px', fontWeight: 800 }}>{allExercises.length}</div>
            </div>
            <div className="card" style={{ background: 'var(--bg-input)', padding: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reward</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                +{completionResult?.xp_awarded || 100} XP
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (onComplete) onComplete();
              onClose();
            }}
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '17px', padding: '14px' }}
          >
            Claim XP & Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" style={{ background: 'var(--bg-primary)' }}>
      <div 
        className="bottom-sheet" 
        style={{ height: '96vh', maxHeight: '96vh', padding: '16px 20px calc(var(--sab) + 20px) 20px', display: 'flex', flexDirection: 'column' }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <span className="badge badge-cyan">{environment} Training</span>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Exercise {currentIndex + 1} of {allExercises.length}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: 'var(--bg-input)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 700
            }}>
              <Timer size={14} style={{ color: 'var(--accent-cyan)' }} />
              <span>{formatTimer(totalSeconds)}</span>
            </div>

            <button onClick={onClose} className="btn btn-icon" style={{ width: '36px', height: '36px', background: 'var(--bg-input)' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Progress Bar across all exercises */}
        <div className="progress-bar-bg" style={{ height: '5px', marginBottom: '16px' }}>
          <div 
            className="progress-bar-fill" 
            style={{ width: `${Math.round(((currentIndex + 1) / allExercises.length) * 100)}%` }} 
          />
        </div>

        {/* REST TIMER BANNER (If resting) */}
        {isResting && (
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(0, 229, 153, 0.2) 100%)',
            border: '2px solid var(--accent-cyan)',
            textAlign: 'center',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.06em' }}>
              REST INTERVAL
            </span>
            <div style={{ fontSize: '42px', fontWeight: 900, fontFamily: 'var(--font-display)', margin: '4px 0' }}>
              {restSecondsLeft}s
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Catch your breath and hydrate!</p>
            <button 
              onClick={() => setIsResting(false)} 
              className="btn btn-secondary" 
              style={{ marginTop: '10px', fontSize: '12px', minHeight: '32px', height: '32px' }}
            >
              Skip Rest
            </button>
          </div>
        )}

        {/* MAIN EXERCISE CARD */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span className="badge badge-emerald">{currentExercise.section}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Difficulty: {currentExercise.difficulty || 'All'}</span>
            </div>

            <h2 style={{ fontSize: '24px', lineHeight: '1.2', marginBottom: '14px' }}>
              {currentExercise.name}
            </h2>

            {/* Set & Rep Badges */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <div style={{ background: 'var(--bg-input)', padding: '8px 14px', borderRadius: '10px', flex: 1, textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Sets</span>
                <span style={{ fontSize: '18px', fontWeight: 800 }}>
                  Set {completedSets + 1} / {currentExercise.sets || 3}
                </span>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '8px 14px', borderRadius: '10px', flex: 1, textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Target</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-cyan)' }}>
                  {currentExercise.reps || '12 reps'}
                </span>
              </div>
            </div>

            {/* Step-by-step instructions */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: 'var(--radius-md)', fontSize: '13px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>How to perform:</strong>
              {currentExercise.instructions}
            </div>
          </div>

          {/* Complete Set / Next Button */}
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={handleNextSet}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '17px', padding: '14px', gap: '10px' }}
            >
              <CheckCircle size={20} />
              {completedSets + 1 >= (currentExercise.sets || 3) ? 'Complete Exercise' : `Finish Set ${completedSets + 1}`}
            </button>
          </div>
        </div>

        {/* BOTTOM CONTROLS BAR: Prev, Pause, Skip, Finish */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '16px',
          gap: '8px'
        }}>
          <button 
            onClick={handlePrevExercise} 
            disabled={currentIndex === 0} 
            className="btn btn-secondary btn-icon"
            style={{ width: '46px', height: '46px' }}
          >
            <SkipBack size={20} />
          </button>

          <button 
            onClick={() => setIsPaused(!isPaused)} 
            className="btn btn-secondary"
            style={{ flex: 1, height: '46px' }}
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          <button 
            onClick={handleNextExercise} 
            className="btn btn-secondary btn-icon"
            style={{ width: '46px', height: '46px' }}
          >
            <SkipForward size={20} />
          </button>

          <button 
            onClick={finishWorkoutSession} 
            className="btn btn-outline"
            style={{ height: '46px', fontSize: '13px', borderColor: 'var(--accent-coral)', color: 'var(--accent-coral)' }}
          >
            Finish
          </button>
        </div>

      </div>
    </div>
  );
}
