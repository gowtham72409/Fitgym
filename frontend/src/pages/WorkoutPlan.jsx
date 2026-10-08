import React, { useState, useEffect } from "react";
import { Dumbbell, Home, Building2, RefreshCw, Settings, Clock, Flame, ChevronDown, ChevronUp, Loader2, Check, X, Plus, Trash2, Edit3, Sliders, HeartPulse, Zap, Activity } from "lucide-react";
import { api } from "../api";

const DEFAULT_CARDIO_EXERCISES = [
  {
    name: "Treadmill Incline Interval Run",
    duration: "15 min",
    intensity: "High (HIIT)",
    calories_burn: "180 kcal",
    target_hr: "150–165 BPM",
    equipment: "Treadmill",
    instructions: "Alternate 1 min fast jog at 8% incline with 1 min brisk recovery walk at 4% incline."
  },
  {
    name: "Stationary Cycling Sprint Intervals",
    duration: "12 min",
    intensity: "High (HIIT)",
    calories_burn: "140 kcal",
    target_hr: "140–160 BPM",
    equipment: "Stationary Bike",
    instructions: "Push maximum RPM for 30 seconds against medium resistance, followed by 30 seconds easy pedaling."
  },
  {
    name: "Jump Rope Speed Drills",
    duration: "8 min",
    intensity: "Moderate–High",
    calories_burn: "95 kcal",
    target_hr: "135–155 BPM",
    equipment: "Jump Rope",
    instructions: "Stay light on balls of feet, keep wrists relaxed and maintain continuous skipping tempo."
  },
  {
    name: "Rowing Machine 500m Power Intervals",
    duration: "10 min",
    intensity: "High Intensity",
    calories_burn: "120 kcal",
    target_hr: "145–165 BPM",
    equipment: "Rowing Machine",
    instructions: "Drive powerfully with legs first, swing hips, and pull handle to sternum with smooth cadence."
  },
  {
    name: "Burpee & Mountain Climber Circuit",
    duration: "8 min",
    intensity: "Max Effort",
    calories_burn: "110 kcal",
    target_hr: "155–170 BPM",
    equipment: "Bodyweight",
    instructions: "Perform 5 burpees followed by 20 rapid mountain climbers back-to-back for 45 seconds."
  },
  {
    name: "Stair Climber Fat Incinerator",
    duration: "10 min",
    intensity: "Moderate",
    calories_burn: "115 kcal",
    target_hr: "130–150 BPM",
    equipment: "Stair Climber",
    instructions: "Keep posture upright without leaning heavily on handrails to maximize glute and quad activation."
  }
];

export function WorkoutPlan() {
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [selectedDay, setSelectedDay] = useState(() => daysOfWeek[new Date().getDay()]);
  const [activeMode, setActiveMode] = useState("Gym");
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // Customize Workout Form
  const [customForm, setCustomForm] = useState({
    workout_preference: "Both",
    training_days: 5,
    duration_min: 90,
    difficulty: "Intermediate",
    available_equipment: ["Dumbbells", "Resistance Bands", "Barbell", "Bench"],
    target_muscle_groups: ["Full body", "Chest", "Back", "Legs", "Core"]
  });
  const [savingCustom, setSavingCustom] = useState(false);

  // Customize Individual Exercise Form
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [exerciseForm, setExerciseForm] = useState({
    action: "add",
    section: "main_strength",
    exercise_index: null,
    name: "",
    sets: 3,
    reps: "10-12",
    duration: "15 min",
    intensity: "High (HIIT)",
    calories_burn: "150 kcal",
    target_hr: "140–165 BPM",
    equipment: "Treadmill",
    muscle_group: "Full body",
    difficulty: "Intermediate",
    rest_sec: 60,
    instructions: ""
  });
  const [savingExercise, setSavingExercise] = useState(false);

  useEffect(() => {
    fetchWorkoutPlan();
  }, []);

  const fetchWorkoutPlan = async () => {
    try {
      setLoading(true);
      const data = await api.getWorkout();
      setWorkoutPlan(data);
    } catch (err) {
      console.error("Failed to load workout plan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const data = await api.generateWorkout();
      setWorkoutPlan(data);
    } catch (err) {
      alert("Failed to regenerate workout plan: " + err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const handleSaveCustomize = async (e) => {
    e.preventDefault();
    try {
      setSavingCustom(true);
      const res = await api.customizeWorkout(customForm);
      setWorkoutPlan(res.plan_data);
      setShowCustomizeModal(false);
    } catch (err) {
      alert("Customization error: " + err.message);
    } finally {
      setSavingCustom(false);
    }
  };

  const openAddExerciseModal = (sectionKey) => {
    setExerciseForm({
      action: "add",
      section: sectionKey,
      exercise_index: null,
      name: "",
      sets: 3,
      reps: "10-12",
      duration: "5 min",
      intensity: "Moderate",
      calories_burn: "80 kcal",
      target_hr: "120–140 BPM",
      equipment: "Bodyweight",
      muscle_group: "Chest & Arms",
      difficulty: "Intermediate",
      rest_sec: 60,
      instructions: "Perform with full range of motion and strict form."
    });
    setShowExerciseModal(true);
  };

  const openEditExerciseModal = (secKey, ex, idx) => {
    setExerciseForm({
      action: "edit",
      section: secKey,
      exercise_index: idx,
      name: ex.exercise_name || ex.name || "",
      sets: ex.sets || 3,
      reps: ex.reps || "10-12",
      duration: ex.duration || "5 min",
      intensity: ex.intensity || "Moderate",
      calories_burn: ex.calories_burn || "80 kcal",
      target_hr: ex.target_hr || "120–140 BPM",
      equipment: ex.equipment || "Bodyweight",
      muscle_group: ex.muscle_group || ex.target_muscle || "Full body",
      difficulty: ex.difficulty || "Intermediate",
      rest_sec: ex.rest_sec || 60,
      instructions: ex.instructions || ""
    });
    setShowExerciseModal(true);
  };

  const openAddCardioModal = () => {
    setExerciseForm({
      action: "add",
      section: "exercises",
      exercise_index: null,
      name: "",
      sets: 3,
      reps: "Intervals",
      duration: "15 min",
      intensity: "High (HIIT)",
      calories_burn: "160 kcal",
      target_hr: "145–165 BPM",
      equipment: "Treadmill",
      muscle_group: "Cardio & Full body",
      difficulty: "Intermediate",
      rest_sec: 45,
      instructions: "Maintain strong steady rhythm, push speed during sprint intervals."
    });
    setShowExerciseModal(true);
  };

  const openEditCardioModal = (ex, idx) => {
    setExerciseForm({
      action: "edit",
      section: "exercises",
      exercise_index: idx,
      name: ex.name || ex.exercise_name || "",
      sets: ex.sets || 3,
      reps: ex.reps || "Intervals",
      duration: ex.duration || "15 min",
      intensity: ex.intensity || "Moderate",
      calories_burn: ex.calories_burn || "150 kcal",
      target_hr: ex.target_hr || "135–160 BPM",
      equipment: ex.equipment || "Bodyweight",
      muscle_group: ex.muscle_group || ex.target_muscle || "Cardio & Full body",
      difficulty: ex.difficulty || "Intermediate",
      rest_sec: ex.rest_sec || 45,
      instructions: ex.instructions || ""
    });
    setShowExerciseModal(true);
  };

  const handleDeleteExercise = async (secKey, ex, idx) => {
    const exName = ex.exercise_name || ex.name || "exercise";
    if (!window.confirm(`Delete "${exName}" from today's plan?`)) return;
    try {
      setLoading(true);
      const res = await api.customizeWorkoutExercise({
        action: "delete",
        day: selectedDay,
        mode: activeMode,
        section: secKey,
        exercise_index: idx,
        exercise: { name: exName }
      });
      setWorkoutPlan(res.plan_data);
    } catch (err) {
      alert("Failed to delete exercise: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExercise = async (e) => {
    e.preventDefault();
    try {
      setSavingExercise(true);
      const res = await api.customizeWorkoutExercise({
        action: exerciseForm.action,
        day: selectedDay,
        mode: activeMode,
        section: exerciseForm.section,
        exercise_index: exerciseForm.exercise_index,
        exercise: {
          exercise_name: exerciseForm.name,
          name: exerciseForm.name,
          sets: exerciseForm.sets,
          reps: exerciseForm.reps,
          duration: exerciseForm.duration,
          intensity: exerciseForm.intensity,
          calories_burn: exerciseForm.calories_burn,
          target_hr: exerciseForm.target_hr,
          equipment: exerciseForm.equipment,
          muscle_group: exerciseForm.muscle_group,
          difficulty: exerciseForm.difficulty,
          rest_sec: exerciseForm.rest_sec,
          instructions: exerciseForm.instructions
        }
      });
      setWorkoutPlan(res.plan_data);
      setShowExerciseModal(false);
    } catch (err) {
      alert("Failed to save exercise: " + err.message);
    } finally {
      setSavingExercise(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", color: "var(--brand-orange)" }}>
        <Loader2 size={36} className="spin" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const currentDayPair = workoutPlan?.days?.find((d) => d.day === selectedDay) || workoutPlan?.days?.[0];
  const workoutObj = activeMode === "Home" ? currentDayPair?.home_workout : currentDayPair?.gym_workout;

  const sections = [
    { title: "1. Warm-up (10 Min)", key: "warmup", color: "var(--brand-amber)" },
    { title: "2. Mobility & Dynamic Movement", key: "mobility", color: "var(--brand-cyan)" },
    { title: "3. Main Strength Training", key: "main_strength", color: "var(--brand-orange)" },
    { title: "4. Conditioning & Cardio HIIT", key: "conditioning", color: "var(--brand-rose)" },
    { title: "5. Core & Abdominal Focus", key: "core", color: "var(--brand-purple)" },
    { title: "6. Cool-down & Static Stretching", key: "cooldown", color: "var(--brand-green)" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
            <Dumbbell color="var(--brand-orange)" /> 90-Min Sunday–Saturday Workout Plan
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
            {workoutPlan?.summary || "Comprehensive 6-phase workout structure with separate Home & Gym modes for every day."}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => setShowCustomizeModal(true)}
            style={{
              background: "rgba(249, 115, 22, 0.15)",
              border: "1px solid var(--brand-orange)",
              color: "var(--brand-orange)",
              padding: "10px 16px",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "0.88rem",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Settings size={16} /> Customize Workout
          </button>

          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="gradient-btn"
            style={{ background: "var(--gradient-orange)" }}
          >
            {regenerating ? <Loader2 size={16} className="spin" style={{ animation: "spin 1s linear infinite" }} /> : <RefreshCw size={16} />}
            <span>Regenerate Plan</span>
          </button>
        </div>
      </div>

      {/* WEEKLY TABS */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>
        {daysOfWeek.map((day) => {
          const isSel = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                padding: "10px 20px",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: isSel ? "var(--gradient-orange)" : "var(--bg-card)",
                color: isSel ? "#fff" : "var(--text-secondary)",
                fontWeight: isSel ? "700" : "600",
                fontSize: "0.9rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease"
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* MODE TOGGLE: HOME vs GYM vs CARDIO */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", background: "rgba(255,255,255,0.02)", padding: "14px", borderRadius: "var(--radius-md)" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => setActiveMode("Home")}
            style={{
              padding: "10px 18px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: activeMode === "Home" ? "var(--brand-green)" : "rgba(255,255,255,0.05)",
              color: "#fff",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
          >
            <Home size={18} /> Home Workout
          </button>
          <button
            onClick={() => setActiveMode("Gym")}
            style={{
              padding: "10px 18px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: activeMode === "Gym" ? "var(--brand-orange)" : "rgba(255,255,255,0.05)",
              color: "#fff",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s"
            }}
          >
            <Building2 size={18} /> Gym Workout
          </button>
          <button
            onClick={() => setActiveMode("Cardio")}
            style={{
              padding: "10px 18px",
              borderRadius: "var(--radius-md)",
              border: "none",
              background: activeMode === "Cardio" ? "linear-gradient(135deg, #ff334b, #f97316)" : "rgba(255,255,255,0.05)",
              color: "#fff",
              fontWeight: "800",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: activeMode === "Cardio" ? "0 4px 16px rgba(255, 51, 75, 0.4)" : "none",
              transition: "all 0.2s"
            }}
          >
            <Flame size={18} /> Cardio Session
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.88rem", color: "var(--text-secondary)", flexWrap: "wrap" }}>
          <span>⏱️ Duration: <strong>{activeMode === "Cardio" ? "45 Min" : `${workoutObj?.duration_min || 90} Min`}</strong></span>
          <span>🔥 Est. Burn: <strong>{activeMode === "Cardio" ? "450–600 kcal" : "550–700 kcal"}</strong></span>
          {activeMode === "Cardio" && (
            <span>💓 Target HR: <strong style={{ color: "#ff6b6b" }}>135–165 BPM</strong></span>
          )}
        </div>
      </div>

      {/* DEDICATED CARDIO VIEW OR 6-PHASE STRENGTH VIEW */}
      {activeMode === "Cardio" ? (
        <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "14px", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h3 style={{ fontSize: "1.25rem", fontWeight: "900", color: "#ff334b", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <Flame color="#ff334b" /> {selectedDay} Cardio Conditioning
              </h3>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "4px 0 0" }}>
                Targeted fat incineration, aerobic stamina, heart rate intervals, and metabolic conditioning.
              </p>
            </div>

            <button
              onClick={openAddCardioModal}
              style={{
                background: "linear-gradient(135deg, #ff334b, #f97316)",
                border: "none",
                color: "#ffffff",
                padding: "8px 16px",
                borderRadius: "var(--radius-full)",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 14px rgba(255, 51, 75, 0.4)"
              }}
            >
              <Plus size={15} /> Add Cardio Exercise
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {(currentDayPair?.cardio_workout?.exercises?.length > 0 ? currentDayPair.cardio_workout.exercises : DEFAULT_CARDIO_EXERCISES).map((ex, idx) => (
              <div
                key={idx}
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h4 style={{ fontSize: "1.05rem", fontWeight: "800", color: "#ffffff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                      🏃 {ex.name || ex.exercise_name}
                    </h4>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "8px" }}>
                      <span className="badge" style={{ background: "rgba(255, 51, 75, 0.15)", color: "#ff6b6b", border: "1px solid rgba(255, 51, 75, 0.3)" }}>
                        ⏱️ {ex.duration || "15 min"}
                      </span>
                      <span className="badge" style={{ background: "rgba(249, 115, 22, 0.15)", color: "#fb923c", border: "1px solid rgba(249, 115, 22, 0.3)" }}>
                        🔥 {ex.calories_burn || "150 kcal"}
                      </span>
                      <span className="badge" style={{ background: "rgba(139, 92, 246, 0.15)", color: "#c084fc", border: "1px solid rgba(139, 92, 246, 0.3)" }}>
                        ⚡ {ex.intensity || "High (HIIT)"}
                      </span>
                      <span className="badge" style={{ background: "rgba(6, 182, 212, 0.15)", color: "#38bdf8", border: "1px solid rgba(6, 182, 212, 0.3)" }}>
                        💓 {ex.target_hr || "140–165 BPM"}
                      </span>
                      {ex.equipment && (
                        <span className="badge" style={{ background: "rgba(255, 255, 255, 0.08)", color: "#e2e8f0" }}>
                          👟 {ex.equipment}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      onClick={() => openEditCardioModal(ex, idx)}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#ffffff",
                        padding: "6px 12px",
                        borderRadius: "var(--radius-full)",
                        cursor: "pointer",
                        fontSize: "0.78rem",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteExercise("exercises", ex, idx)}
                      style={{
                        background: "rgba(244, 63, 94, 0.12)",
                        border: "1px solid rgba(244, 63, 94, 0.25)",
                        color: "var(--brand-rose)",
                        padding: "6px 10px",
                        borderRadius: "var(--radius-full)",
                        cursor: "pointer",
                        fontSize: "0.78rem",
                        fontWeight: "700"
                      }}
                      title="Delete Cardio Exercise"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {ex.instructions && (
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "4px 0 0", lineHeight: "1.45" }}>
                    💡 <strong>Instructions & Rhythm:</strong> {ex.instructions}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 6-PHASE WORKOUT EXERCISE LIST */
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {sections.map((sec) => {
          const exercises = workoutObj?.[sec.key] || [];

          return (
            <div key={sec.key} className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: sec.color, margin: 0 }}>
                  {sec.title}
                </h3>

                <button
                  onClick={() => openAddExerciseModal(sec.key)}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#ffffff",
                    padding: "6px 12px",
                    borderRadius: "var(--radius-full)",
                    cursor: "pointer",
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                  }}
                >
                  <Plus size={13} /> Add Exercise
                </button>
              </div>

              {exercises.length === 0 ? (
                <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "4px 0" }}>
                  No exercises added to this phase yet. Click "+ Add Exercise" to customize.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {exercises.map((ex, idx) => (
                    <div key={idx} style={{ background: "rgba(255,255,255,0.02)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                        <div>
                          <h4 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                            {ex.exercise_name || ex.name}
                          </h4>
                          <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                            <span className="badge badge-amber">{ex.difficulty || "Intermediate"}</span>
                            <span className="badge badge-cyan">{ex.muscle_group || ex.target_muscle || "Full body"}</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                          <button
                            onClick={() => openEditExerciseModal(sec.key, ex, idx)}
                            style={{
                              background: "rgba(255,255,255,0.06)",
                              border: "1px solid rgba(255,255,255,0.12)",
                              color: "#ffffff",
                              padding: "6px 12px",
                              borderRadius: "var(--radius-full)",
                              cursor: "pointer",
                              fontSize: "0.78rem",
                              fontWeight: "700",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <Edit3 size={12} /> Edit
                          </button>

                          <button
                            onClick={() => handleDeleteExercise(sec.key, ex, idx)}
                            style={{
                              background: "rgba(239, 68, 68, 0.1)",
                              border: "1px solid rgba(239, 68, 68, 0.25)",
                              color: "#ef4444",
                              padding: "6px 10px",
                              borderRadius: "var(--radius-full)",
                              cursor: "pointer",
                              fontSize: "0.78rem",
                              fontWeight: "700",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            title="Delete Exercise"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "16px", fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: "600", flexWrap: "wrap" }}>
                        <span>Sets: <strong style={{ color: "var(--text-primary)" }}>{ex.sets || 3}</strong></span>
                        <span>Reps / Duration: <strong style={{ color: "var(--text-primary)" }}>{ex.reps || ex.duration || "10-12"}</strong></span>
                        <span>Rest: <strong style={{ color: "var(--text-primary)" }}>{ex.rest_sec || 60}s</strong></span>
                      </div>

                      <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                        💡 {ex.instructions || "Focus on technique, control and breathing."}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}

      {/* CUSTOMIZE WORKOUT MODAL */}
      {showCustomizeModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text-primary)" }}>
                Customize Workout Program
              </h3>
              <button onClick={() => setShowCustomizeModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomize} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>Location Preference</label>
                <select value={customForm.workout_preference} onChange={(e) => setCustomForm({ ...customForm, workout_preference: e.target.value })}>
                  <option value="Home">Home Workout</option>
                  <option value="Gym">Gym Workout</option>
                  <option value="Both">Both Home & Gym</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)" }}>Training Days / Week</label>
                  <input type="number" min={1} max={7} value={customForm.training_days} onChange={(e) => setCustomForm({ ...customForm, training_days: parseInt(e.target.value) || 5 })} />
                </div>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)" }}>Duration (Minutes)</label>
                  <input type="number" min={30} max={120} value={customForm.duration_min} onChange={(e) => setCustomForm({ ...customForm, duration_min: parseInt(e.target.value) || 90 })} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>Difficulty Level</label>
                <select value={customForm.difficulty} onChange={(e) => setCustomForm({ ...customForm, difficulty: e.target.value })}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowCustomizeModal(false)} style={{ flex: 1, padding: "12px", background: "none", border: "1px solid var(--border-color)", color: "var(--text-primary)", borderRadius: "var(--radius-md)", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingCustom} className="gradient-btn" style={{ flex: 1, padding: "12px", background: "var(--gradient-orange)" }}>
                  {savingCustom ? <Loader2 size={16} className="spin" style={{ animation: "spin 1s linear infinite" }} /> : <Check size={16} />}
                  <span>Save Custom Workout</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INDIVIDUAL EXERCISE CUSTOMIZE MODAL */}
      {showExerciseModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "900", color: activeMode === "Cardio" ? "#ff334b" : "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  {activeMode === "Cardio" && <Flame size={20} color="#ff334b" />}
                  {exerciseForm.action === "add" 
                    ? (activeMode === "Cardio" ? `Add Cardio Exercise to ${selectedDay}` : `Add Exercise to ${selectedDay}`) 
                    : (activeMode === "Cardio" ? `Edit Cardio Exercise` : `Edit Exercise`)}
                </h3>
                <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                  {activeMode === "Cardio" ? "Customize aerobic & endurance intervals" : `${activeMode} Workout Phase`}
                </p>
              </div>
              <button onClick={() => setShowExerciseModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* QUICK PRESETS FOR CARDIO */}
            {activeMode === "Cardio" && (
              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "0.76rem", fontWeight: "700", color: "#94a3b8", display: "block", marginBottom: "8px" }}>
                  ⚡ Quick Cardio Presets (Tap to Autofill):
                </label>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {[
                    { name: "Treadmill Incline Sprints", duration: "15 min", burn: "180 kcal", hr: "150–165 BPM", equip: "Treadmill", int: "High (HIIT)", desc: "1 min fast run at 8% incline / 1 min brisk walk." },
                    { name: "Stationary Bike Sprint Drills", duration: "12 min", burn: "140 kcal", hr: "140–160 BPM", equip: "Stationary Bike", int: "High (HIIT)", desc: "30s high cadence sprint / 30s light recovery pedal." },
                    { name: "Jump Rope Speed Drills", duration: "8 min", burn: "95 kcal", hr: "135–155 BPM", equip: "Jump Rope", int: "Moderate–High", desc: "Fast continuous skipping with tight core and loose wrists." },
                    { name: "Rowing Machine 500m Intervals", duration: "10 min", burn: "120 kcal", hr: "145–165 BPM", equip: "Rowing Machine", int: "High Intensity", desc: "Explosive leg drive and strong hip hinge pull." },
                    { name: "Burpee & Mountain Climbers", duration: "8 min", burn: "110 kcal", hr: "155–170 BPM", equip: "Bodyweight", int: "Max Effort", desc: "Tabata intervals: 20s max effort, 10s rest." },
                    { name: "Stair Climber Fat Burner", duration: "10 min", burn: "115 kcal", hr: "130–150 BPM", equip: "Stair Climber", int: "Moderate", desc: "Upright posture with full foot placement to engage glutes." },
                  ].map((preset, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => {
                        setExerciseForm((prev) => ({
                          ...prev,
                          name: preset.name,
                          duration: preset.duration,
                          calories_burn: preset.burn,
                          target_hr: preset.hr,
                          equipment: preset.equip,
                          intensity: preset.int,
                          instructions: preset.desc
                        }));
                      }}
                      style={{
                        background: "rgba(255, 51, 75, 0.1)",
                        border: "1px solid rgba(255, 51, 75, 0.25)",
                        color: "#ff8595",
                        borderRadius: "16px",
                        padding: "5px 10px",
                        fontSize: "0.74rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      + {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveExercise} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {activeMode !== "Cardio" && (
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>Phase Section</label>
                  <select
                    value={exerciseForm.section}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, section: e.target.value })}
                    style={{ width: "100%", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                  >
                    <option value="warmup">1. Warm-up (10 Min)</option>
                    <option value="mobility">2. Mobility & Dynamic Movement</option>
                    <option value="main_strength">3. Main Strength Training</option>
                    <option value="conditioning">4. Conditioning & Cardio HIIT</option>
                    <option value="core">5. Core & Abdominal Focus</option>
                    <option value="cooldown">6. Cool-down & Static Stretching</option>
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                  {activeMode === "Cardio" ? "Cardio Exercise Name" : "Exercise Name"}
                </label>
                <input
                  type="text"
                  placeholder={activeMode === "Cardio" ? "e.g. Treadmill Incline Sprints" : "e.g. Incline Dumbbell Press"}
                  value={exerciseForm.name}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                  style={{ width: "100%", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                  required
                />
              </div>

              {activeMode === "Cardio" ? (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>Duration</label>
                      <input
                        type="text"
                        placeholder="e.g. 15 min"
                        value={exerciseForm.duration}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, duration: e.target.value })}
                        style={{ width: "100%", marginTop: "4px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>Est. Calories Burn</label>
                      <input
                        type="text"
                        placeholder="e.g. 180 kcal"
                        value={exerciseForm.calories_burn}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, calories_burn: e.target.value })}
                        style={{ width: "100%", marginTop: "4px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>Intensity Level</label>
                      <select
                        value={exerciseForm.intensity}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, intensity: e.target.value })}
                        style={{ width: "100%", marginTop: "4px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                      >
                        <option value="High (HIIT)">High (HIIT)</option>
                        <option value="Moderate (Fat Burn)">Moderate (Fat Burn Zone)</option>
                        <option value="Max Effort">Max Effort (Tabata)</option>
                        <option value="Low (Aerobic Recovery)">Low (Aerobic Recovery)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>Target Heart Rate</label>
                      <input
                        type="text"
                        placeholder="e.g. 145–165 BPM"
                        value={exerciseForm.target_hr}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, target_hr: e.target.value })}
                        style={{ width: "100%", marginTop: "4px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>Equipment / Machine</label>
                    <input
                      type="text"
                      placeholder="e.g. Treadmill, Stationary Bike, Jump Rope, Bodyweight"
                      value={exerciseForm.equipment}
                      onChange={(e) => setExerciseForm({ ...exerciseForm, equipment: e.target.value })}
                      style={{ width: "100%", marginTop: "4px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>Sets</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={exerciseForm.sets}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, sets: parseInt(e.target.value) || 3 })}
                        style={{ width: "100%", marginTop: "4px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>Reps / Time</label>
                      <input
                        type="text"
                        placeholder="10-12 reps"
                        value={exerciseForm.reps}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })}
                        style={{ width: "100%", marginTop: "4px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>Rest (Sec)</label>
                      <input
                        type="number"
                        step="15"
                        min="0"
                        max="300"
                        value={exerciseForm.rest_sec}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, rest_sec: parseInt(e.target.value) || 60 })}
                        style={{ width: "100%", marginTop: "4px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>Target Muscle</label>
                      <input
                        type="text"
                        placeholder="e.g. Upper Chest"
                        value={exerciseForm.muscle_group}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, muscle_group: e.target.value })}
                        style={{ width: "100%", marginTop: "4px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>Difficulty</label>
                      <select
                        value={exerciseForm.difficulty}
                        onChange={(e) => setExerciseForm({ ...exerciseForm, difficulty: e.target.value })}
                        style={{ width: "100%", marginTop: "4px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>
                  {activeMode === "Cardio" ? "Interval Protocol & Form Instructions" : "Instructions & Form Tips"}
                </label>
                <textarea
                  rows="3"
                  placeholder={activeMode === "Cardio" ? "e.g. Alternate 1 min sprint with 1 min recovery walk. Maintain upright torso." : "e.g. Keep shoulder blades pinched, press smoothly without locking elbows."}
                  value={exerciseForm.instructions}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, instructions: e.target.value })}
                  style={{ width: "100%", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowExerciseModal(false)} style={{ flex: 1, padding: "12px", background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px", cursor: "pointer" }}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={savingExercise} 
                  className="gradient-btn" 
                  style={{ 
                    flex: 1, 
                    padding: "12px", 
                    background: activeMode === "Cardio" ? "linear-gradient(135deg, #ff334b, #f97316)" : "var(--gradient-orange)", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    gap: "8px" 
                  }}
                >
                  {savingExercise ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                  <span>{exerciseForm.action === "add" ? (activeMode === "Cardio" ? "Add Cardio Exercise" : "Add Exercise") : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
