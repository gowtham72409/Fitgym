import React, { useState, useEffect } from "react";
import { 
  Flame, 
  Dumbbell, 
  Utensils, 
  Trophy, 
  Sparkles, 
  TrendingUp, 
  Activity, 
  CheckCircle, 
  Play, 
  Zap, 
  ArrowRight, 
  ChevronRight, 
  Target, 
  Scale, 
  Ruler, 
  Heart,
  Sliders,
  Edit3,
  X,
  Check,
  Loader2
} from "lucide-react";
import { api } from "../api";

const DAILY_MOTIVATION_QUOTES = [
  {
    quote: "Better Food\nBetter Energy\nBetter You 🌿",
    img: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?q=80&w=800&auto=format&fit=crop",
    category: "DAILY MOTIVATION"
  },
  {
    quote: "Small Daily Steps\nLead To Big Results ✨",
    img: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop",
    category: "MINDFULNESS"
  },
  {
    quote: "Push Harder Than Yesterday\nFor A Stronger Tomorrow 💪",
    img: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop",
    category: "STRENGTH & POWER"
  },
  {
    quote: "Fuel Your Body\nFuel Your Mind 🥑",
    img: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800&auto=format&fit=crop",
    category: "CLEAN NUTRITION"
  },
  {
    quote: "Consistency Is Key\nNever Give Up 🔥",
    img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop",
    category: "DAILY GRIND"
  },
  {
    quote: "Make Every Sweat Count\nBuild Your Dream ⚡",
    img: "https://images.unsplash.com/photo-1483721063344-93c30a473133?q=80&w=800&auto=format&fit=crop",
    category: "WORKOUT VIBES"
  },
  {
    quote: "Nourish To Flourish\nEat Good, Feel Good 🥗",
    img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop",
    category: "HEALTHY LIVING"
  },
  {
    quote: "Your Only Limit\nIs Your Mind 🧠✨",
    img: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=800&auto=format&fit=crop",
    category: "INNER FOCUS"
  },
  {
    quote: "Train Insane Or\nRemain The Same 🔥",
    img: "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=800&auto=format&fit=crop",
    category: "BEAST MODE"
  },
  {
    quote: "Eat Clean, Stay Fit\nAnd Have Patience 🍏",
    img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=800&auto=format&fit=crop",
    category: "PATIENCE & GROW"
  },
  {
    quote: "Believe You Can\nAnd You're Halfway There 🏔️",
    img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800&auto=format&fit=crop",
    category: "DAILY FOCUS"
  },
  {
    quote: "Sweat Today\nShine Tomorrow ✨⚡",
    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop",
    category: "FITNESS GOALS"
  },
  {
    quote: "Healthy Mind\nHealthy Body\nHappy Life 🌸",
    img: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop",
    category: "WELLNESS & VIBES"
  },
  {
    quote: "Focus On Progress\nNot Perfection 🎯",
    img: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=800&auto=format&fit=crop",
    category: "PROGRESSION"
  },
  {
    quote: "Discipline Over Motivation\nEvery Single Day 🏆",
    img: "https://images.unsplash.com/photo-1517935706615-2717063c2225?q=80&w=800&auto=format&fit=crop",
    category: "DISCIPLINE"
  }
];

function getDailyQuoteAndImage() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const index = dayOfYear % DAILY_MOTIVATION_QUOTES.length;
  return DAILY_MOTIVATION_QUOTES[index];
}

export function HomeDashboard({ profile, onUpdateProfile, onNavigate, onOpenSara }) {
  const [diet, setDiet] = useState(null);
  const [workout, setWorkout] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [weightData, setWeightData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Customize Goals state
  const [showCustomizeGoalsModal, setShowCustomizeGoalsModal] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);
  const [goalForm, setGoalForm] = useState({
    daily_burn_target_kcal: profile?.daily_burn_target_kcal || "",
    daily_calorie_target: profile?.daily_calorie_target || "",
    daily_protein_target: profile?.daily_protein_target || "",
    daily_carbs_target: profile?.daily_carbs_target || "",
    daily_fat_target: profile?.daily_fat_target || "",
    current_weight_kg: profile?.current_weight_kg || profile?.weight_kg || "",
    target_weight_kg: profile?.target_weight_kg || "",
    height_cm: profile?.height_cm || "",
    water_target_ml: profile?.water_target_ml || 3000,
    step_target: profile?.step_target || 8000
  });

  useEffect(() => {
    if (profile) {
      setGoalForm({
        daily_burn_target_kcal: profile.daily_burn_target_kcal || "",
        daily_calorie_target: profile.daily_calorie_target || "",
        daily_protein_target: profile.daily_protein_target || "",
        daily_carbs_target: profile.daily_carbs_target || "",
        daily_fat_target: profile.daily_fat_target || "",
        current_weight_kg: profile.current_weight_kg || profile.weight_kg || "",
        target_weight_kg: profile.target_weight_kg || "",
        height_cm: profile.height_cm || "",
        water_target_ml: profile.water_target_ml || 3000,
        step_target: profile.step_target || 8000
      });
    }
  }, [profile]);

  const handleSaveGoals = async (e) => {
    e.preventDefault();
    try {
      setSavingGoals(true);
      await api.updateProfile(goalForm);
      if (onUpdateProfile) await onUpdateProfile();
      await loadDashboardData();
      setShowCustomizeGoalsModal(false);
    } catch (err) {
      alert("Failed to update goals: " + err.message);
    } finally {
      setSavingGoals(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [d, w, c, wt, acts] = await Promise.all([
        api.getDiet().catch(() => null),
        api.getWorkout().catch(() => null),
        api.getChallenges().catch(() => []),
        (api.getWeight ? api.getWeight() : api.getWeightData ? api.getWeightData() : Promise.resolve(null)).catch(() => null),
        api.getActivities().catch(() => [])
      ]);
      setDiet(d);
      setWorkout(w);
      setChallenges(Array.isArray(c) ? c : []);
      setWeightData(wt);
      setActivities(Array.isArray(acts) ? acts : []);
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteChallenge = async (chId) => {
    try {
      await api.completeChallenge(chId);
      setChallenges((prev) =>
        Array.isArray(prev) ? prev.map((ch) => (ch.id === chId ? { ...ch, is_completed: true } : ch)) : []
      );
    } catch (err) {
      console.error("Error completing challenge:", err);
    }
  };

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = days[new Date().getDay()];

  const dietDays = Array.isArray(diet?.days) ? diet.days : [];
  const todayDiet = dietDays.find((d) => d && d.day === currentDayName) || dietDays[0];

  const workoutDays = Array.isArray(workout?.days) ? workout.days : [];
  const todayWorkoutPair = workoutDays.find((d) => d && d.day === currentDayName) || workoutDays[0];

  const safeChallenges = Array.isArray(challenges) ? challenges : [];

  const name = profile?.name || "gowtham";
  const heightCm = profile?.height_cm || null;
  const currentW = (profile?.current_weight_kg || profile?.weight_kg) ? Number(profile?.current_weight_kg || profile?.weight_kg) : null;
  const targetW = profile?.target_weight_kg ? Number(profile.target_weight_kg) : null;
  const remainingW = (currentW && targetW) ? Math.abs(+(currentW - targetW).toFixed(1)) : null;
  const bmiVal = (heightCm && currentW) ? +(currentW / ((heightCm / 100) ** 2)).toFixed(1) : (profile?.bmi || null);
  const bmiCat = bmiVal ? (bmiVal < 18.5 ? "Underweight" : bmiVal < 25 ? "Normal" : bmiVal < 30 ? "Overweight" : "Obese") : null;
  const level = profile?.level || 1;
  const xp = profile?.xp !== undefined ? profile.xp : 0;
  const nextLevelXp = 500;
  const xpPercent = Math.min(100, Math.round(((xp % 500) / 500) * 100));

  const dailyCal = profile?.daily_calorie_target || null;
  const dailyProt = profile?.daily_protein_target || null;
  const dailyCarbs = profile?.daily_carbs_target || null;
  const dailyFat = profile?.daily_fat_target || null;
  const dailyFiber = profile?.daily_fiber_target || null;

  // Calculate daily active burn calories needed
  const todayStr = new Date().toISOString().split("T")[0];
  const burnedToday = (activities || [])
    .filter((a) => a.created_at && a.created_at.startsWith(todayStr))
    .reduce((sum, a) => sum + (a.calories || 0), 0);

  const dailyBurnTarget = profile?.daily_burn_target_kcal || null;
  const burnProgressPct = dailyBurnTarget ? Math.min(100, Math.round((burnedToday / dailyBurnTarget) * 100)) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "40px" }}>
      
      {/* 1. HERO BANNER */}
      <div className="home-hero-banner" style={{
        position: "relative",
        borderRadius: "24px",
        overflow: "hidden",
        backgroundImage: "linear-gradient(135deg, rgba(88, 101, 242, 0.45) 0%, rgba(18, 22, 35, 0.95) 75%), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        padding: "clamp(18px, 4vw, 32px)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 12px 40px rgba(0,0,0,0.5)"
      }}>
        {/* Top Bar: Category Label + Streak Pill + Customize Goals */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: "800", letterSpacing: "2px", color: "#94a3b8", textTransform: "uppercase" }}>
            YOUR FITNESS WORLD
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => setShowCustomizeGoalsModal(true)}
              style={{
                background: "rgba(88, 101, 242, 0.25)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(88, 101, 242, 0.5)",
                borderRadius: "16px",
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                cursor: "pointer",
                color: "#ffffff",
                fontSize: "0.78rem",
                fontWeight: "800"
              }}
            >
              <Sliders size={13} color="#8c9eff" />
              <span>Customize Goals</span>
            </button>

            <div
              onClick={() => onNavigate("challenges")}
              style={{
                background: "rgba(18, 22, 35, 0.85)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "16px",
                padding: "6px 14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                flexShrink: 0
              }}
            >
              <Flame size={16} color="#ff334b" />
              <span style={{ fontSize: "0.8rem", fontWeight: "800", color: "#ffffff" }}>1 Day Streak</span>
              <ChevronRight size={14} color="#94a3b8" />
            </div>
          </div>
        </div>

        {/* User Name Greeting - Strictly Single Line */}
        <div style={{ width: "100%", minWidth: 0, overflow: "hidden" }}>
          <h1 style={{
            fontSize: "clamp(1.35rem, 5.5vw, 2.2rem)",
            fontWeight: "900",
            color: "#ffffff",
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: "1.25",
            width: "100%"
          }}>
            Hey {name} 👋
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#cbd5e1", margin: "4px 0 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            Your better self is just a few steps away!
          </p>
        </div>

        {/* Level and XP progress bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", flexWrap: "wrap", marginTop: "4px" }}>
          <span className="badge badge-purple" style={{ padding: "5px 12px", fontSize: "0.8rem", background: "rgba(88, 101, 242, 0.3)" }}>
            ⚡ Level {level}
          </span>
          <div style={{ flex: 1, minWidth: "120px", maxWidth: "240px", height: "8px", background: "rgba(255,255,255,0.15)", borderRadius: "10px", overflow: "hidden" }}>
            <div style={{ width: `${xpPercent}%`, height: "100%", background: "var(--gradient-purple)", borderRadius: "10px" }} />
          </div>
          <span style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: "700" }}>
            {xp} / {nextLevelXp} XP
          </span>
        </div>
      </div>

      {/* 2. BODY MEASUREMENT METRICS CARD ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
        {/* Height */}
        <div className="glass-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(6, 182, 212, 0.15)", border: "1px solid rgba(6, 182, 212, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand-cyan)" }}>
            <Ruler size={20} />
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "700" }}>Height</span>
            <p style={{ fontSize: "1.35rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>{heightCm ? `${heightCm} cm` : "--"}</p>
          </div>
        </div>

        {/* Current Weight */}
        <div className="glass-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(88, 101, 242, 0.15)", border: "1px solid rgba(88, 101, 242, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#5865f2" }}>
            <Scale size={20} />
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "700" }}>Current Weight</span>
            <p style={{ fontSize: "1.35rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>{currentW ? `${currentW.toFixed(1)} kg` : "--"}</p>
          </div>
        </div>

        {/* Target Weight */}
        <div className="glass-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981" }}>
            <Target size={20} />
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "700" }}>Target Weight</span>
            <p style={{ fontSize: "1.35rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>{targetW ? `${targetW.toFixed(1)} kg` : "--"}</p>
          </div>
        </div>

        {/* Target Diff / Remaining */}
        <div className="glass-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f43f5e" }}>
            <TrendingUp size={20} />
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "700" }}>Target Weight Diff</span>
            <p style={{ fontSize: "1.35rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>{remainingW !== null ? `${remainingW.toFixed(1)} kg` : "--"}</p>
          </div>
        </div>

        {/* BMI */}
        <div className="glass-card" style={{ padding: "18px", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(139, 92, 246, 0.15)", border: "1px solid rgba(139, 92, 246, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b5cf6" }}>
            <Zap size={20} />
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: "700" }}>BMI Score</span>
            <p style={{ fontSize: "1.35rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>{bmiVal || "--"}</p>
            <span style={{ fontSize: "0.68rem", color: bmiCat ? "var(--brand-amber)" : "var(--text-muted)", fontWeight: "700" }}>{bmiCat || "--"}</span>
          </div>
        </div>
      </div>

      {/* 2.5 DAILY CALORIE BURN TARGET CARD */}
      <div 
        className="glass-card" 
        style={{
          padding: "24px",
          background: "linear-gradient(135deg, rgba(229, 56, 79, 0.12) 0%, rgba(20, 24, 41, 0.98) 100%)",
          border: "1px solid rgba(229, 56, 79, 0.3)",
          borderRadius: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "14px",
              background: "rgba(229, 56, 79, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ff334b",
              boxShadow: "0 0 20px rgba(229, 56, 79, 0.35)",
              flexShrink: 0
            }}>
              <Flame size={26} />
            </div>
            <div>
              <span style={{ fontSize: "0.74rem", fontWeight: "800", color: "#ff334b", letterSpacing: "1.8px", textTransform: "uppercase" }}>
                DAILY CALORIE BURN TARGET (எரிக்க வேண்டிய கலோரிகள்)
              </span>
              <h3 style={{ fontSize: "1.55rem", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>
                {dailyBurnTarget ? (
                  <>{dailyBurnTarget} <span style={{ fontSize: "0.92rem", color: "#94a3b8", fontWeight: "600" }}>kcal to burn today</span></>
                ) : (
                  <>-- <span style={{ fontSize: "0.92rem", color: "#94a3b8", fontWeight: "600" }}>Set your burn target</span></>
                )}
              </h3>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => setShowCustomizeGoalsModal(true)}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.16)",
                color: "#ffffff",
                padding: "10px 14px",
                borderRadius: "12px",
                fontSize: "0.84rem",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.18s ease"
              }}
            >
              <Sliders size={14} color="#ff334b" />
              <span>Customize Burn Target</span>
            </button>

            <button
              onClick={() => onNavigate("activity")}
              style={{
                background: "#e5384f",
                border: "none",
                color: "#ffffff",
                padding: "10px 18px",
                borderRadius: "12px",
                fontSize: "0.88rem",
                fontWeight: "800",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                boxShadow: "0 4px 16px rgba(229, 56, 79, 0.4)",
                transition: "all 0.18s ease"
              }}
            >
              Start Burning <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* Progress Bar of Today's Burned vs Target */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "700", marginBottom: "8px", flexWrap: "wrap", gap: "4px" }}>
            <span style={{ color: "#cbd5e1" }}>
              Today's Active Burned: <strong style={{ color: "#ff334b" }}>{burnedToday} kcal</strong>
            </span>
            <span style={{ color: "#94a3b8" }}>
              {dailyBurnTarget ? `${burnProgressPct}% achieved (${Math.max(0, dailyBurnTarget - burnedToday)} kcal remaining)` : "--"}
            </span>
          </div>
          <div style={{ width: "100%", height: "10px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "10px", overflow: "hidden" }}>
            <div 
              style={{ 
                width: `${burnProgressPct}%`, 
                height: "100%", 
                background: "linear-gradient(90deg, #ff334b 0%, #f97316 100%)", 
                borderRadius: "10px",
                transition: "width 0.4s ease"
              }} 
            />
          </div>
        </div>

        {/* Breakdown Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px" }}>
          <div style={{ background: "rgba(255, 255, 255, 0.04)", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Active Burn Goal</span>
            <p style={{ fontSize: "1.05rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>{dailyBurnTarget ? `${dailyBurnTarget} kcal` : "--"}</p>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.04)", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Resting BMR</span>
            <p style={{ fontSize: "1.05rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>{currentW && heightCm ? `${Math.round(10 * currentW + 6.25 * heightCm - 5 * 25 + 5)} kcal` : "--"}</p>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.04)", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Estimated TDEE</span>
            <p style={{ fontSize: "1.05rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>{currentW && heightCm ? `${Math.round((10 * currentW + 6.25 * heightCm - 5 * 25 + 5) * 1.35)} kcal` : "--"}</p>
          </div>
          <div style={{ background: "rgba(255, 255, 255, 0.04)", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Recommended Plan</span>
            <p style={{ fontSize: "0.85rem", fontWeight: "800", color: "#34d399", marginTop: "2px" }}>{profile?.goal || "--"}</p>
          </div>
        </div>
      </div>

      {/* 3. CALCULATED DAILY NUTRITION & MACRO TARGETS ROW */}
      <div className="glass-card" style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "16px", background: "linear-gradient(135deg, rgba(88, 101, 242, 0.08) 0%, rgba(19, 25, 39, 0.95) 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "var(--brand-cyan)", letterSpacing: "1.5px" }}>CALCULATED TARGETS</span>
            <h4 style={{ fontSize: "1.1rem", fontWeight: "900", color: "#ffffff", marginTop: "2px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Utensils size={18} color="var(--brand-orange)" /> Daily Nutrition & Macro Targets
            </h4>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setShowCustomizeGoalsModal(true)}
              style={{
                background: "rgba(88, 101, 242, 0.2)",
                border: "1px solid rgba(88, 101, 242, 0.4)",
                color: "#ffffff",
                padding: "6px 12px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.78rem",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              <Sliders size={13} color="#8c9eff" />
              <span>Customize Macros</span>
            </button>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "4px 12px", borderRadius: "var(--radius-full)" }}>
              Calculated from profile
            </span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "14px" }}>
          {/* Daily Calories */}
          <div style={{ background: "rgba(249, 115, 22, 0.1)", border: "1px solid rgba(249, 115, 22, 0.25)", padding: "14px", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--brand-orange)", fontSize: "0.75rem", fontWeight: "700" }}>
              <Flame size={16} /> Daily Calories
            </div>
            <p style={{ fontSize: "1.45rem", fontWeight: "800", color: "#ffffff", marginTop: "4px" }}>{dailyCal !== null ? dailyCal : "--"} <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>kcal</span></p>
          </div>

          {/* Daily Protein */}
          <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.25)", padding: "14px", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--brand-green)", fontSize: "0.75rem", fontWeight: "700" }}>
              <Dumbbell size={16} /> Daily Protein
            </div>
            <p style={{ fontSize: "1.45rem", fontWeight: "800", color: "#ffffff", marginTop: "4px" }}>{dailyProt !== null ? dailyProt : "--"} <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>g</span></p>
          </div>

          {/* Daily Carbs */}
          <div style={{ background: "rgba(6, 182, 212, 0.1)", border: "1px solid rgba(6, 182, 212, 0.25)", padding: "14px", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--brand-cyan)", fontSize: "0.75rem", fontWeight: "700" }}>
              <Utensils size={16} /> Daily Carbs
            </div>
            <p style={{ fontSize: "1.45rem", fontWeight: "800", color: "#ffffff", marginTop: "4px" }}>{dailyCarbs !== null ? dailyCarbs : "--"} <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>g</span></p>
          </div>

          {/* Daily Fat */}
          <div style={{ background: "rgba(244, 63, 94, 0.1)", border: "1px solid rgba(244, 63, 94, 0.25)", padding: "14px", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--brand-rose)", fontSize: "0.75rem", fontWeight: "700" }}>
              <Heart size={16} /> Daily Fat
            </div>
            <p style={{ fontSize: "1.45rem", fontWeight: "800", color: "#ffffff", marginTop: "4px" }}>{dailyFat !== null ? dailyFat : "--"} <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>g</span></p>
          </div>

          {/* Daily Fiber */}
          <div style={{ background: "rgba(139, 92, 246, 0.1)", border: "1px solid rgba(139, 92, 246, 0.25)", padding: "14px", borderRadius: "var(--radius-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--brand-purple)", fontSize: "0.75rem", fontWeight: "700" }}>
              <Sparkles size={16} /> Daily Fiber
            </div>
            <p style={{ fontSize: "1.45rem", fontWeight: "800", color: "#ffffff", marginTop: "4px" }}>{dailyFiber !== null ? dailyFiber : "--"} <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>g</span></p>
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT GRID (LEFT 2/3 + RIGHT 1/3) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", gridColumn: "span 2" }}>
          
          {/* TODAY'S PLAN SECTION MATCHING SCREENSHOT 3 */}
          <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "var(--text-muted)", letterSpacing: "1.5px" }}>TODAY'S PLAN</span>
                <h3 style={{ fontSize: "1.4rem", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>{currentDayName}</h3>
              </div>
              <button onClick={() => onNavigate("diet")} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "0.85rem", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                View All <ArrowRight size={16} />
              </button>
            </div>

            {/* 2 Plan Cards side-by-side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {/* Diet Card */}
              <div
                onClick={() => onNavigate("diet")}
                style={{
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  height: "120px",
                  backgroundImage: "linear-gradient(to right, rgba(16, 20, 32, 0.95) 30%, rgba(16, 20, 32, 0.5) 100%), url('https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=600&auto=format&fit=crop')",
                  backgroundSize: "cover",
                  padding: "18px",
                  cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center"
                }}
              >
                <h4 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#ffffff" }}>Diet Plan</h4>
                <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "4px" }}>Your custom meals for today</p>
              </div>

              {/* Workout Card */}
              <div
                onClick={() => onNavigate("workout")}
                style={{
                  position: "relative",
                  borderRadius: "16px",
                  overflow: "hidden",
                  height: "120px",
                  backgroundImage: "linear-gradient(to right, rgba(16, 20, 32, 0.95) 30%, rgba(16, 20, 32, 0.5) 100%), url('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600&auto=format&fit=crop')",
                  backgroundSize: "cover",
                  padding: "18px",
                  cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center"
                }}
              >
                <h4 style={{ fontSize: "1.1rem", fontWeight: "800", color: "#ffffff" }}>Workout</h4>
                <p style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "4px" }}>Your custom workout for today</p>
              </div>
            </div>
          </div>

          {/* MIDDLE WORKOUT PLAN BANNER MATCHING SCREENSHOT 3 */}
          <div style={{
            position: "relative",
            borderRadius: "20px",
            overflow: "hidden",
            backgroundImage: "linear-gradient(to right, rgba(12, 15, 24, 0.96) 40%, rgba(12, 15, 24, 0.7) 100%), url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop')",
            backgroundSize: "cover",
            padding: "28px",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "var(--brand-purple)", letterSpacing: "1.5px" }}>YOUR WORKOUT PLAN</span>
                <h3 style={{ fontSize: "1.6rem", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>
                  1.30 Hours • Gym & Home
                </h3>
              </div>

              <button
                onClick={() => onNavigate("workout")}
                className="purple-btn"
                style={{ padding: "12px 24px" }}
              >
                Customize Workout
              </button>
            </div>

            {/* Timeline steps matching Screenshot 3 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "16px" }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700" }}>Warm Up</span>
                <p style={{ fontSize: "0.85rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>15 min</p>
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700" }}>Main Workout</span>
                <p style={{ fontSize: "0.85rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>60 min</p>
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700" }}>Cardio</span>
                <p style={{ fontSize: "0.85rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>10 min</p>
              </div>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: "700" }}>Cool Down</span>
                <p style={{ fontSize: "0.85rem", fontWeight: "800", color: "#ffffff", marginTop: "2px" }}>5 min</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (1/3) MATCHING SCREENSHOT 3 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* NUTRITION & MOTIVATION BANNER (DYNAMIC DAILY QUOTE & IMAGE) */}
          {(() => {
            const daily = getDailyQuoteAndImage();
            return (
              <div style={{
                borderRadius: "20px",
                overflow: "hidden",
                height: "170px",
                backgroundImage: `linear-gradient(to top, rgba(12, 15, 24, 0.95) 0%, rgba(12, 15, 24, 0.25) 100%), url('${daily.img}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                border: "1px solid rgba(255,255,255,0.12)",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                transition: "all 0.3s ease"
              }}>
                <span className="badge badge-green" style={{ alignSelf: "flex-start", fontSize: "0.68rem", letterSpacing: "1px", padding: "4px 10px", background: "rgba(16, 185, 129, 0.25)", border: "1px solid rgba(16, 185, 129, 0.4)" }}>
                  🌟 {daily.category}
                </span>
                <h4 style={{ fontSize: "1.15rem", fontWeight: "900", color: "#ffffff", lineHeight: "1.35", textShadow: "0 2px 10px rgba(0,0,0,0.8)" }}>
                  {daily.quote.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {line}<br />
                    </React.Fragment>
                  ))}
                </h4>
              </div>
            );
          })()}

          {/* DAILY CHALLENGES WIDGET MATCHING SCREENSHOT 3 */}
          <div className="glass-card" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ fontSize: "0.95rem", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "6px" }}>
                <Trophy size={16} color="var(--brand-amber)" /> DAILY CHALLENGES
              </h4>
              <button onClick={() => onNavigate("challenges")} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer" }}>
                View All
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {safeChallenges.slice(0, 4).map((ch) => (
                <div
                  key={ch.id}
                  onClick={() => handleCompleteChallenge(ch.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: "12px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      border: ch.is_completed ? "none" : "2px solid rgba(255,255,255,0.3)",
                      background: ch.is_completed ? "var(--brand-green)" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff"
                    }}>
                      {ch.is_completed && <CheckCircle size={14} />}
                    </div>
                    <div>
                      <p style={{ fontSize: "0.82rem", fontWeight: "700", color: "#ffffff" }}>{ch.title}</p>
                      <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{ch.description}</p>
                    </div>
                  </div>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--brand-purple)" }}>
                    +{ch.xp_reward} XP
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* CUSTOMIZE GOALS & TARGETS MODAL */}
      {showCustomizeGoalsModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(88, 101, 242, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#8c9eff" }}>
                  <Sliders size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: "900", color: "#ffffff", margin: 0 }}>
                    Customize Goals & Targets
                  </h3>
                  <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "2px 0 0 0" }}>
                    Personalize your daily burn, calorie, macro and body targets
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowCustomizeGoalsModal(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveGoals} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Daily Calorie Burn Target */}
              <div style={{ background: "rgba(229, 56, 79, 0.08)", border: "1px solid rgba(229, 56, 79, 0.25)", padding: "14px", borderRadius: "14px" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: "800", color: "#ff334b", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Flame size={16} /> Daily Active Burn Target (kcal)
                </label>
                <input
                  type="number"
                  min="100"
                  max="3000"
                  step="10"
                  value={goalForm.daily_burn_target_kcal}
                  onChange={(e) => setGoalForm({ ...goalForm, daily_burn_target_kcal: parseInt(e.target.value) || 0 })}
                  style={{ width: "100%", marginTop: "8px", padding: "10px 14px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff", fontWeight: "700" }}
                  required
                />
              </div>

              {/* Nutrition Targets */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#cbd5e1" }}>Daily Calorie Intake (kcal)</label>
                  <input
                    type="number"
                    min="800"
                    max="6000"
                    step="50"
                    value={goalForm.daily_calorie_target}
                    onChange={(e) => setGoalForm({ ...goalForm, daily_calorie_target: parseInt(e.target.value) || 0 })}
                    style={{ width: "100%", marginTop: "6px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#cbd5e1" }}>Daily Protein (g)</label>
                  <input
                    type="number"
                    min="30"
                    max="400"
                    value={goalForm.daily_protein_target}
                    onChange={(e) => setGoalForm({ ...goalForm, daily_protein_target: parseInt(e.target.value) || 0 })}
                    style={{ width: "100%", marginTop: "6px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#cbd5e1" }}>Daily Carbs (g)</label>
                  <input
                    type="number"
                    min="20"
                    max="600"
                    value={goalForm.daily_carbs_target}
                    onChange={(e) => setGoalForm({ ...goalForm, daily_carbs_target: parseInt(e.target.value) || 0 })}
                    style={{ width: "100%", marginTop: "6px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#cbd5e1" }}>Daily Fat (g)</label>
                  <input
                    type="number"
                    min="15"
                    max="200"
                    value={goalForm.daily_fat_target}
                    onChange={(e) => setGoalForm({ ...goalForm, daily_fat_target: parseInt(e.target.value) || 0 })}
                    style={{ width: "100%", marginTop: "6px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                  />
                </div>
              </div>

              {/* Body Measurements & Targets */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#94a3b8" }}>Current Wt (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={goalForm.current_weight_kg}
                    onChange={(e) => setGoalForm({ ...goalForm, current_weight_kg: parseFloat(e.target.value) || 0 })}
                    style={{ width: "100%", marginTop: "6px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#94a3b8" }}>Target Wt (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={goalForm.target_weight_kg}
                    onChange={(e) => setGoalForm({ ...goalForm, target_weight_kg: parseFloat(e.target.value) || 0 })}
                    style={{ width: "100%", marginTop: "6px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#94a3b8" }}>Height (cm)</label>
                  <input
                    type="number"
                    value={goalForm.height_cm}
                    onChange={(e) => setGoalForm({ ...goalForm, height_cm: parseInt(e.target.value) || 0 })}
                    style={{ width: "100%", marginTop: "6px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                  />
                </div>
              </div>

              {/* Water & Step Goals */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#94a3b8" }}>Daily Water (ml)</label>
                  <input
                    type="number"
                    step="100"
                    value={goalForm.water_target_ml}
                    onChange={(e) => setGoalForm({ ...goalForm, water_target_ml: parseInt(e.target.value) || 0 })}
                    style={{ width: "100%", marginTop: "6px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#94a3b8" }}>Daily Steps</label>
                  <input
                    type="number"
                    step="500"
                    value={goalForm.step_target}
                    onChange={(e) => setGoalForm({ ...goalForm, step_target: parseInt(e.target.value) || 0 })}
                    style={{ width: "100%", marginTop: "6px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCustomizeGoalsModal(false)}
                  style={{ flex: 1, padding: "12px", background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", borderRadius: "10px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingGoals}
                  style={{ flex: 1, padding: "12px", background: "var(--brand-purple)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "800", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                >
                  {savingGoals ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                  <span>Save Custom Goals</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
