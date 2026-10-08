import React, { useState, useEffect } from "react";
import { TrendingUp, Scale, HeartPulse, Calendar, Plus, Check, Loader2, Smile } from "lucide-react";
import { api } from "../api";

export function Progress({ profile }) {
  const [weightData, setWeightData] = useState(null);
  const [newWeight, setNewWeight] = useState("");
  const [weightNotes, setWeightNotes] = useState("");
  const [loggingWeight, setLoggingWeight] = useState(false);
  
  // Daily check-in form state
  const [checkinForm, setCheckinForm] = useState({
    mood: "Good",
    weight_kg: profile?.current_weight_kg || 78,
    sleep_hours: 7.5,
    water_ml: 2500,
    energy_level: 8,
    notes: ""
  });
  const [submittingCheckin, setSubmittingCheckin] = useState(false);
  const [checkinSuccess, setCheckinSuccess] = useState(false);

  useEffect(() => {
    fetchWeight();
  }, []);

  const fetchWeight = async () => {
    try {
      const data = await api.getWeightData();
      setWeightData(data);
    } catch (err) {
      console.error("Error fetching weight logs:", err);
    }
  };

  const handleLogWeight = async (e) => {
    e.preventDefault();
    if (!newWeight || parseFloat(newWeight) <= 0) return;
    setLoggingWeight(true);

    try {
      await api.logWeight({ weight_kg: parseFloat(newWeight), notes: weightNotes, log_date: new Date().toISOString().split("T")[0] });
      setNewWeight("");
      setWeightNotes("");
      fetchWeight();
    } catch (err) {
      alert("Error logging weight: " + err.message);
    } finally {
      setLoggingWeight(false);
    }
  };

  const handleSubmitCheckin = async (e) => {
    e.preventDefault();
    setSubmittingCheckin(true);

    try {
      await api.submitCheckin({
        ...checkinForm,
        checkin_date: new Date().toISOString().split("T")[0]
      });
      setCheckinSuccess(true);
      fetchWeight();
      setTimeout(() => setCheckinSuccess(false), 4000);
    } catch (err) {
      alert("Check-in failed: " + err.message);
    } finally {
      setSubmittingCheckin(false);
    }
  };

  const currentW = weightData?.current_weight_kg || profile?.current_weight_kg || 78;
  const targetW = weightData?.target_weight_kg || profile?.target_weight_kg || 70;
  const startW = weightData?.starting_weight_kg || 82;
  const progressPct = weightData?.progress_percent || 65;
  const logs = weightData?.logs || [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
          <TrendingUp color="var(--brand-green)" /> Weight, BMI & Daily Check-In
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
          Monitor body composition progress, BMI health categories, and record daily wellness logs.
        </p>
      </div>

      {/* TOP METRIC CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        <div className="glass-card" style={{ padding: "20px" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "700" }}>CURRENT WEIGHT</span>
          <p style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--brand-green)", marginTop: "4px" }}>{currentW} kg</p>
        </div>
        <div className="glass-card" style={{ padding: "20px" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "700" }}>TARGET WEIGHT</span>
          <p style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--brand-cyan)", marginTop: "4px" }}>{targetW} kg</p>
        </div>
        <div className="glass-card" style={{ padding: "20px" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "700" }}>STARTING WEIGHT</span>
          <p style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--brand-amber)", marginTop: "4px" }}>{startW} kg</p>
        </div>
        <div className="glass-card" style={{ padding: "20px" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: "700" }}>GOAL PROGRESS</span>
          <p style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--brand-purple)", marginTop: "4px" }}>{progressPct}%</p>
        </div>
      </div>

      {/* BMI CARD & WEIGHT GRAPH GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        
        {/* BMI CARD */}
        <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Scale size={20} color="var(--brand-cyan)" /> BMI Analysis
            </h3>
            <span className="badge badge-cyan">{profile?.bmi_category || "Healthy Weight"}</span>
          </div>

          <div style={{ textAlign: "center", background: "rgba(255,255,255,0.02)", padding: "18px", borderRadius: "var(--radius-md)" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Body Mass Index</span>
            <h2 style={{ fontSize: "2.5rem", fontWeight: "800", color: "var(--brand-cyan)", margin: "6px 0" }}>
              {profile?.bmi || 24.2}
            </h2>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Your BMI reflects a balanced weight range for your height. Continued exercise and high-protein nutrition support your ideal body composition.
            </p>
          </div>

          {/* LOG WEIGHT FORM */}
          <form onSubmit={handleLogWeight} style={{ display: "flex", flexDirection: "column", gap: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
            <h4 style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-primary)" }}>Log New Weight</h4>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="number"
                step="0.1"
                placeholder="Weight in kg (e.g. 75.5)"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                required
              />
              <button type="submit" disabled={loggingWeight} className="gradient-btn" style={{ padding: "10px 18px", whiteSpace: "nowrap" }}>
                {loggingWeight ? <Loader2 size={16} className="spin" style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={16} />}
                <span>Log (+15 XP)</span>
              </button>
            </div>
          </form>
        </div>

        {/* WEIGHT PROGRESS GRAPH (SVG) */}
        <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-primary)" }}>
            Weight Trend Graph
          </h3>
          <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-md)", padding: "16px", height: "200px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="100%" height="160" viewBox="0 0 350 140" style={{ overflow: "visible" }}>
              {/* Grid Lines */}
              <line x1="20" y1="20" x2="330" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <line x1="20" y1="60" x2="330" y2="60" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />
              <line x1="20" y1="100" x2="330" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="4" />

              {/* Target Line */}
              <line x1="20" y1="110" x2="330" y2="110" stroke="var(--brand-cyan)" strokeWidth="2" strokeDasharray="4" />

              {/* Weight Curve */}
              <path
                d="M 20 30 Q 90 40, 160 65 T 330 90"
                fill="none"
                stroke="var(--brand-green)"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Data points */}
              <circle cx="20" cy="30" r="5" fill="var(--brand-green)" />
              <circle cx="160" cy="65" r="5" fill="var(--brand-green)" />
              <circle cx="330" cy="90" r="5" fill="var(--brand-green)" />

              <text x="20" y="20" fill="var(--text-muted)" fontSize="10">{startW}kg</text>
              <text x="300" y="80" fill="var(--brand-green)" fontSize="10">{currentW}kg</text>
              <text x="300" y="125" fill="var(--brand-cyan)" fontSize="10">Target {targetW}kg</text>
            </svg>
          </div>
        </div>
      </div>

      {/* DAILY CHECK-IN FORM CARD */}
      <div className="glass-card" style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <HeartPulse size={22} color="var(--brand-rose)" /> Daily Wellness Check-In
            </h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
              Log how you feel, sleep duration, and energy level for holistic tracking.
            </p>
          </div>
          <span className="badge badge-amber">+20 XP Reward</span>
        </div>

        {checkinSuccess && (
          <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid var(--brand-green)", color: "var(--brand-green)", padding: "12px", borderRadius: "var(--radius-md)", fontSize: "0.88rem", fontWeight: "700" }}>
            ✓ Daily check-in logged successfully! +20 XP awarded!
          </div>
        )}

        <form onSubmit={handleSubmitCheckin} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "18px" }}>
          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>
              How do you feel today?
            </label>
            <select value={checkinForm.mood} onChange={(e) => setCheckinForm({ ...checkinForm, mood: e.target.value })}>
              <option value="Excellent">😄 Excellent</option>
              <option value="Good">🙂 Good</option>
              <option value="Okay">😐 Okay</option>
              <option value="Tired">😴 Tired</option>
              <option value="Stressed">😫 Stressed</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>
              Sleep Hours
            </label>
            <input type="number" step="0.5" value={checkinForm.sleep_hours} onChange={(e) => setCheckinForm({ ...checkinForm, sleep_hours: parseFloat(e.target.value) || 0 })} />
          </div>

          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>
              Water Intake (ml)
            </label>
            <input type="number" step="100" value={checkinForm.water_ml} onChange={(e) => setCheckinForm({ ...checkinForm, water_ml: parseInt(e.target.value) || 0 })} />
          </div>

          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>
              Energy Level (1–10)
            </label>
            <input type="number" min={1} max={10} value={checkinForm.energy_level} onChange={(e) => setCheckinForm({ ...checkinForm, energy_level: parseInt(e.target.value) || 5 })} />
          </div>

          <div style={{ gridColumn: "1 / -1" }}>
            <button type="submit" disabled={submittingCheckin} className="gradient-btn" style={{ width: "100%", padding: "14px" }}>
              {submittingCheckin ? <Loader2 size={18} className="spin" style={{ animation: "spin 1s linear infinite" }} /> : <Check size={18} />}
              <span>Submit Daily Check-In (+20 XP)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
