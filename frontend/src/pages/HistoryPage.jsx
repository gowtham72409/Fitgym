import React, { useState, useEffect } from "react";
import { History as HistoryIcon, Utensils, Dumbbell, Camera, Activity, Trophy, Scale, Trash2, Loader2 } from "lucide-react";
import { api } from "../api";

export function HistoryPage() {
  const [activeTab, setActiveTab] = useState("nutrition"); // daily_plans, workouts, nutrition, activities, challenges, weight
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getFullHistory();
      setHistoryData(data);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNutrition = async (id) => {
    if (!window.confirm("Delete this food scan record?")) return;
    try {
      await api.deleteNutritionScan(id);
      fetchHistory();
    } catch (err) {
      alert("Error deleting record: " + err.message);
    }
  };

  const tabs = [
    { id: "nutrition", label: "Nutrition Scans", icon: Camera },
    { id: "activities", label: "Activities", icon: Activity },
    { id: "challenges", label: "Challenges", icon: Trophy },
    { id: "weight", label: "Weight Logs", icon: Scale },
    { id: "daily_plans", label: "Diet Plans", icon: Utensils },
    { id: "workouts", label: "Workout Plans", icon: Dumbbell },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", color: "var(--brand-green)" }}>
        <Loader2 size={36} className="spin" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
          <HistoryIcon color="var(--brand-green)" /> Fitness & Activity History
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
          Persistent historical records for your nutrition scans, workout logs, activities, challenges, and weight changes.
        </p>
      </div>

      {/* TABS HEADER */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px", borderBottom: "1px solid var(--border-color)" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 18px",
                borderRadius: "var(--radius-md)",
                border: "none",
                background: isSel ? "var(--gradient-primary)" : "var(--bg-card)",
                color: isSel ? "#fff" : "var(--text-secondary)",
                fontWeight: isSel ? "700" : "600",
                fontSize: "0.88rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: NUTRITION SCANS */}
      {activeTab === "nutrition" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {historyData?.nutrition?.length === 0 ? (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              No food scans logged yet. Use the Food AI Scanner to analyze meals!
            </div>
          ) : (
            historyData?.nutrition?.map((item) => (
              <div key={item.id} className="glass-card" style={{ padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(item.created_at).toLocaleString()}</span>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)" }}>{item.food_name} ({item.quantity_kg} kg)</h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Protein: {item.protein_g}g | Carbs: {item.carbs_g}g | Fat: {item.fat_g}g | Fiber: {item.fiber_g}g
                  </p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--brand-green)" }}>{item.calories} kcal</span>
                  <button onClick={() => handleDeleteNutrition(item.id)} style={{ background: "rgba(244, 63, 94, 0.15)", border: "none", color: "var(--brand-rose)", padding: "8px", borderRadius: "8px", cursor: "pointer" }} title="Delete scan record">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: ACTIVITIES */}
      {activeTab === "activities" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {historyData?.activities?.length === 0 ? (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              No outdoor or indoor activities tracked yet. Start your first session under Activity Track!
            </div>
          ) : (
            historyData?.activities?.map((item) => (
              <div key={item.id} className="glass-card" style={{ padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{new Date(item.created_at).toLocaleString()}</span>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--brand-cyan)" }}>{item.activity_type} Session</h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                    Distance: {item.distance_km} km | Duration: {Math.floor(item.duration_sec / 60)} min | Avg Speed: {item.avg_speed_kmh} km/h
                  </p>
                </div>
                <span style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--brand-orange)" }}>{item.calories} kcal burned</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: CHALLENGES */}
      {activeTab === "challenges" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {historyData?.challenges?.length === 0 ? (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              No daily challenges completed yet. Complete your first challenge to earn XP!
            </div>
          ) : (
            historyData?.challenges?.map((item) => (
              <div key={item.id} className="glass-card" style={{ padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.completed_date}</span>
                  <h4 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-primary)" }}>{item.title}</h4>
                </div>
                <span className="badge badge-amber">+{item.xp_earned} XP</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: WEIGHT LOGS */}
      {activeTab === "weight" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {historyData?.weight?.length === 0 ? (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              No weight logs recorded yet. Log your weight under Weight & BMI!
            </div>
          ) : (
            historyData?.weight?.map((item) => (
              <div key={item.id} className="glass-card" style={{ padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{item.log_date}</span>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--brand-green)" }}>{item.weight_kg} kg</h4>
                  {item.notes && <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{item.notes}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB CONTENT: PLANS */}
      {(activeTab === "daily_plans" || activeTab === "workouts") && (
        <div className="glass-card" style={{ padding: "24px" }}>
          <h4 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "8px" }}>Active AI Generated Program</h4>
          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Your 7-day program is continuously synced and accessible directly from the Diet and Workout tabs.
          </p>
        </div>
      )}
    </div>
  );
}
