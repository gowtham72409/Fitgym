import React, { useState, useEffect } from "react";
import { Calendar, TrendingUp, Dumbbell, Utensils, Activity, Trophy, Sparkles, Loader2, Award } from "lucide-react";
import { api } from "../api";

export function MonthlyProgress() {
  const [selectedMonth, setSelectedMonth] = useState("October");
  const [selectedYear, setSelectedYear] = useState(2026);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    fetchSummary();
  }, [selectedMonth, selectedYear]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await api.getMonthlySummary(selectedMonth, selectedYear);
      setSummary(data);
    } catch (err) {
      console.error("Failed to load monthly summary:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", color: "var(--brand-purple)" }}>
        <Loader2 size={36} className="spin" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header with Month/Year Pickers */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
            <Calendar color="var(--brand-purple)" /> Monthly Progress & AI Report
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Comprehensive monthly analytics, workout logs, nutrition consistency, and AI insights.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: "130px" }}>
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} style={{ width: "90px" }}>
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      {/* AI SUMMARY BANNER */}
      {summary && (
        <div className="glass-card" style={{ padding: "24px", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(19, 25, 39, 0.9) 100%)", borderLeft: "4px solid var(--brand-purple)", display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Sparkles size={22} color="var(--brand-purple)" />
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-primary)" }}>
              AI Monthly Performance Insights ({summary.month} {summary.year})
            </h3>
          </div>
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
            "{summary.ai_summary}"
          </p>
        </div>
      )}

      {/* SECTION 1: MONTHLY OVERVIEW METRICS */}
      <div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-primary)", marginBottom: "14px" }}>MONTHLY OVERVIEW</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
          <div className="glass-card" style={{ padding: "18px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>DAYS LOGGED</span>
            <p style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--brand-green)", marginTop: "4px" }}>{summary?.days_logged} Days</p>
          </div>
          <div className="glass-card" style={{ padding: "18px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>WORKOUT SESSIONS</span>
            <p style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--brand-orange)", marginTop: "4px" }}>{summary?.workout_days} Workouts</p>
          </div>
          <div className="glass-card" style={{ padding: "18px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>CHALLENGES DONE</span>
            <p style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--brand-amber)", marginTop: "4px" }}>{summary?.challenges_completed}</p>
          </div>
          <div className="glass-card" style={{ padding: "18px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>XP EARNED</span>
            <p style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--brand-purple)", marginTop: "4px" }}>+{summary?.xp_earned} XP</p>
          </div>
          <div className="glass-card" style={{ padding: "18px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>TOTAL DISTANCE</span>
            <p style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--brand-cyan)", marginTop: "4px" }}>{summary?.activity_distance_km} km</p>
          </div>
          <div className="glass-card" style={{ padding: "18px" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>CONSISTENCY</span>
            <p style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--brand-green)", marginTop: "4px" }}>{summary?.consistency_percent}%</p>
          </div>
        </div>
      </div>

      {/* SECTION 2: WORKOUT & NUTRITION PROGRESS CHARTS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        {/* WORKOUT PROGRESS CHART */}
        <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--brand-orange)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Dumbbell size={20} /> WORKOUT PROGRESS
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Weekly workout frequency across four weeks of {summary?.month}</p>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "140px", paddingTop: "20px", borderBottom: "1px solid var(--border-color)" }}>
            {["Week 1", "Week 2", "Week 3", "Week 4"].map((wk, i) => {
              const h = [65, 80, 70, 85][i];
              return (
                <div key={wk} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "20%" }}>
                  <div style={{ width: "100%", height: `${h}%`, background: "var(--gradient-orange)", borderRadius: "6px 6px 0 0" }} />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{wk}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* NUTRITION PROGRESS CHART */}
        <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--brand-green)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Utensils size={20} /> NUTRITION & PROTEIN ADHERENCE
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>Daily calorie & protein target compliance</p>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: "140px", paddingTop: "20px", borderBottom: "1px solid var(--border-color)" }}>
            {["Week 1", "Week 2", "Week 3", "Week 4"].map((wk, i) => {
              const h = [75, 88, 82, 90][i];
              return (
                <div key={wk} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", width: "20%" }}>
                  <div style={{ width: "100%", height: `${h}%`, background: "var(--gradient-primary)", borderRadius: "6px 6px 0 0" }} />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{wk}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: ACHIEVEMENTS & BADGES */}
      <div className="glass-card" style={{ padding: "24px" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--brand-amber)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
          <Award size={20} /> MONTHLY ACHIEVEMENTS UNLOCKED
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <div style={{ background: "rgba(255,255,255,0.02)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "1.8rem" }}>🥇</span>
            <div>
              <h4 style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-primary)" }}>Consistency Master</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Logged over 80% of days this month.</p>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "1.8rem" }}>⚡</span>
            <div>
              <h4 style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-primary)" }}>Protein Champion</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Met protein target for 15+ consecutive days.</p>
            </div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.02)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "1.8rem" }}>🏃</span>
            <div>
              <h4 style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-primary)" }}>Distance Crusher</h4>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Completed 50+ km of tracked activities.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
