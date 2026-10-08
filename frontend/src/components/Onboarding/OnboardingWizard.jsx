import React, { useState } from 'react';
import { 
  ChevronRight, ChevronLeft, Sparkles, Check, 
  MapPin, Bell, Scale, Dumbbell, Utensils, Heart, Activity, CheckCircle2
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function OnboardingWizard({ onComplete }) {
  const { currentUser, setOnboardingCompleted } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [generationStatus, setGenerationStatus] = useState('');

  // 17-step form state
  const [formData, setFormData] = useState({
    // Step 1
    name: currentUser?.name || '',
    // Step 2
    age: 26,
    gender: 'Male',
    // Step 3
    height_cm: 175,
    weight_kg: 76,
    target_weight_kg: 70,
    // Step 4
    goal: 'Weight loss',
    // Step 5
    activity_level: 'Moderate',
    // Step 6
    fitness_level: 'Beginner',
    // Step 7
    workout_environment: 'Both',
    // Step 8
    workout_days_per_week: 5,
    // Step 9
    workout_duration_minutes: 60,
    // Step 10
    food_preference: 'Non-vegetarian',
    // Step 11
    budget: 'Moderate',
    // Step 12
    allergies: 'None',
    // Step 13
    dislikes: 'Bitter gourd, liver',
    // Step 14
    cuisines: 'Mixed',
    // Step 15
    location_acknowledged: true,
    // Step 16
    notifications_enabled: true,
    // Step 17
    units: 'kg',
    distance_unit: 'km'
  });

  const totalSteps = 17;

  const update = (key, val) => {
    setFormData(prev => ({ ...prev, [key]: val }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(s => s + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(s => s - 1);
    }
  };

  const finishOnboarding = async () => {
    setSubmitting(true);
    setGenerationStatus('Saving your fitness profile...');
    try {
      // 1. Save profile to Firestore
      await api.updateProfile({
        ...formData,
        onboarding_completed: true
      });

      // 2. Generate personalized 7-day Diet & 7-day Workout
      setGenerationStatus('Creating your AI nutrition & workout plans...');
      await api.generatePlans();

      setOnboardingCompleted(true);
      if (onComplete) onComplete();
    } catch (err) {
      console.error("Onboarding setup error:", err);
      // Fallback: still mark completed to let user in
      setOnboardingCompleted(true);
      if (onComplete) onComplete();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-primary)',
      padding: 'max(16px, var(--sat)) 20px max(24px, var(--sab)) 20px'
    }}>
      {/* Top Header & Progress */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          {currentStep > 1 ? (
            <button onClick={handleBack} className="btn btn-secondary btn-icon" style={{ width: '38px', height: '38px' }}>
              <ChevronLeft size={20} />
            </button>
          ) : <div style={{ width: '38px' }} />}

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent-cyan)', letterSpacing: '0.05em' }}>
              STEP {currentStep} OF {totalSteps}
            </span>
          </div>

          <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
            {Math.round((currentStep / totalSteps) * 100)}%
          </span>
        </div>

        {/* Visual Progress Bar */}
        <div className="progress-bar-bg" style={{ height: '6px' }}>
          <div className="progress-bar-fill" style={{ width: `${(currentStep / totalSteps) * 100}%` }} />
        </div>
      </div>

      {/* Main Step Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {submitting ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--gradient-brand)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0A0D14',
              marginBottom: '20px',
              boxShadow: 'var(--shadow-glow-cyan)'
            }}>
              <Sparkles size={36} />
            </div>
            <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>FitQuest AI is building your journey</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>{generationStatus}</p>
          </div>
        ) : (
          <>
            {/* STEP 1: Name */}
            {currentStep === 1 && (
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Welcome</span>
                <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>What should we call you?</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Your name will personalize your coaching with Sara.</p>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => update('name', e.target.value)}
                  autoFocus
                  style={{ fontSize: '18px', padding: '14px 18px' }}
                />
              </div>
            )}

            {/* STEP 2: Age & Gender */}
            {currentStep === 2 && (
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Biological Metrics</span>
                <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>Age & Gender</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Used to accurately calculate your BMR and metabolic rates.</p>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Your Age (Years)</label>
                  <input
                    type="number"
                    min="14"
                    max="100"
                    value={formData.age}
                    onChange={(e) => update('age', parseInt(e.target.value) || 25)}
                    style={{ fontSize: '18px' }}
                  />
                </div>

                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Gender</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {['Male', 'Female', 'Other'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => update('gender', g)}
                      className={formData.gender === g ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{ padding: '12px 0' }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3: Height, Current Weight, Target Weight */}
            {currentStep === 3 && (
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Body Dimensions</span>
                <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>Height & Weights</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Enables precise calorie deficit/surplus calibration.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Height (cm)</label>
                    <input
                      type="number"
                      value={formData.height_cm}
                      onChange={(e) => update('height_cm', parseFloat(e.target.value) || 170)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Current Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.weight_kg}
                      onChange={(e) => update('weight_kg', parseFloat(e.target.value) || 70)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Target Weight (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.target_weight_kg}
                      onChange={(e) => update('target_weight_kg', parseFloat(e.target.value) || 65)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Fitness Goal */}
            {currentStep === 4 && (
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Objective</span>
                <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>What is your primary goal?</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Your AI workouts and nutrition adapt directly to this.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    'Weight loss', 'Fat loss', 'Muscle gain', 
                    'Maintenance', 'General fitness', 'Improve endurance', 'Improve strength'
                  ].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => update('goal', g)}
                      className={formData.goal === g ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{ justifyContent: 'flex-start', padding: '12px 18px', textAlign: 'left' }}
                    >
                      <CheckCircle2 size={18} style={{ opacity: formData.goal === g ? 1 : 0.2 }} />
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 5: Activity Level */}
            {currentStep === 5 && (
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Daily Lifestyle</span>
                <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>How active are you?</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Outside of scheduled gym workouts.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Sedentary', desc: 'Little to no exercise, desk job' },
                    { label: 'Light', desc: 'Light exercise / brisk walks 1-3 days/wk' },
                    { label: 'Moderate', desc: 'Moderate activity or training 3-5 days/wk' },
                    { label: 'Active', desc: 'Heavy sports or physical job 6-7 days/wk' },
                    { label: 'Very active', desc: 'Intense training twice a day or endurance athlete' }
                  ].map(item => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => update('activity_level', item.label)}
                      className={formData.activity_level === item.label ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '12px 16px', gap: '2px' }}
                    >
                      <span style={{ fontWeight: 700 }}>{item.label}</span>
                      <span style={{ fontSize: '12px', opacity: 0.8, fontWeight: 400 }}>{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6: Fitness Experience */}
            {currentStep === 6 && (
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Experience</span>
                <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>Your training level</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Tailors exercise complexity and rest intervals.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {['Beginner', 'Intermediate', 'Advanced'].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => update('fitness_level', lvl)}
                      className={formData.fitness_level === lvl ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{ padding: '16px', fontSize: '17px' }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 7: Workout Environment */}
            {currentStep === 7 && (
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Training Space</span>
                <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>Where do you train?</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>FitQuest provides dual plans for both environments.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {['Home', 'Gym', 'Both'].map(env => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => update('workout_environment', env)}
                      className={formData.workout_environment === env ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{ padding: '20px 0', flexDirection: 'column', gap: '8px' }}
                    >
                      <Dumbbell size={24} />
                      {env}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 8: Workout Days */}
            {currentStep === 8 && (
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Schedule</span>
                <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>Days available per week</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>How many days do you want to train?</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                  {[1, 2, 3, 4, 5, 6, 7].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => update('workout_days_per_week', d)}
                      className={formData.workout_days_per_week === d ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{ padding: '16px 0', fontSize: '18px' }}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 9: Workout Duration */}
            {currentStep === 9 && (
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Duration</span>
                <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>Preferred session length</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Default is ~90 min, fully customizable anytime.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[30, 45, 60, 75, 90].map(dur => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => update('workout_duration_minutes', dur)}
                      className={formData.workout_duration_minutes === dur ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{ padding: '14px' }}
                    >
                      {dur} mins
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 10: Food Preference */}
            {currentStep === 10 && (
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Diet Type</span>
                <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>Food preference</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Recipes will strictly follow this preference.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['Vegetarian', 'Non-vegetarian', 'Vegan', 'Eggetarian'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => update('food_preference', p)}
                      className={formData.food_preference === p ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{ padding: '14px', fontSize: '16px' }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 11: Food Budget */}
            {currentStep === 11 && (
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Groceries</span>
                <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>Food budget</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Meal ingredients will be chosen to match your budget.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['Low', 'Moderate', 'Flexible'].map(b => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => update('budget', b)}
                      className={formData.budget === b ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{ padding: '14px', fontSize: '16px' }}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 12: Food Allergies */}
            {currentStep === 12 && (
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Safety</span>
                <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>Food allergies</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Items to strictly exclude from recipes (e.g. peanuts, dairy).</p>
                <input
                  type="text"
                  placeholder="e.g. peanuts, milk, eggs, seafood or none"
                  value={formData.allergies}
                  onChange={(e) => update('allergies', e.target.value)}
                  style={{ fontSize: '16px', padding: '14px' }}
                />
              </div>
            )}

            {/* STEP 13: Foods Disliked */}
            {currentStep === 13 && (
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Taste</span>
                <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>Foods you dislike</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>AI will not include these in your weekly meal rotations.</p>
                <input
                  type="text"
                  placeholder="e.g. mushrooms, broccoli, eggplant"
                  value={formData.dislikes}
                  onChange={(e) => update('dislikes', e.target.value)}
                  style={{ fontSize: '16px', padding: '14px' }}
                />
              </div>
            )}

            {/* STEP 14: Preferred Cuisines */}
            {currentStep === 14 && (
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Flavor Profile</span>
                <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>Preferred cuisines</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Choose the flavor profiles you love cooking.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {['South Indian', 'North Indian', 'Indian', 'Western', 'Mediterranean', 'Mixed'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => update('cuisines', c)}
                      className={formData.cuisines === c ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{ padding: '12px', fontSize: '14px' }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 15: Location Permission Explanation */}
            {currentStep === 15 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(0, 240, 255, 0.15)',
                  color: 'var(--accent-cyan)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}>
                  <MapPin size={32} />
                </div>
                <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Location Privacy</h2>
                <div className="card" style={{ textAlign: 'left', marginBottom: '20px', lineHeight: '1.6' }}>
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '6px' }}>
                    "Location is used only for outdoor activity tracking."
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    FitQuest AI never tracks your background location when you are not actively running or walking. You can use all diet, workout, and scanner features even if GPS is disabled.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => update('location_acknowledged', true)}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  I Understand
                </button>
              </div>
            )}

            {/* STEP 16: Notifications */}
            {currentStep === 16 && (
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Habits</span>
                <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>Notification Reminders</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Stay consistent with daily nudges for training and hydration.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['Workout reminders', 'Meal reminders', 'Water reminders', 'Daily check-in'].map(n => (
                    <div key={n} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}>
                      <span style={{ fontWeight: 600 }}>{n}</span>
                      <span className="badge badge-emerald">Enabled</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 17: Units */}
            {currentStep === 17 && (
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Final Step</span>
                <h2 style={{ fontSize: '26px', marginBottom: '8px' }}>Preferred Units</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Select measurement standards.</p>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Weight Unit</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {['kg', 'lb'].map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => update('units', u)}
                        className={formData.units === u ? 'btn btn-primary' : 'btn btn-secondary'}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Distance Unit</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {['km', 'miles'].map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => update('distance_unit', u)}
                        className={formData.distance_unit === u ? 'btn btn-primary' : 'btn btn-secondary'}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Action Button */}
      {!submitting && (
        <div style={{ marginTop: '24px' }}>
          <button
            onClick={handleNext}
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '17px', padding: '14px' }}
          >
            {currentStep === totalSteps ? 'Complete & Generate AI Plan' : 'Continue'}
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
