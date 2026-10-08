import React, { useState, useEffect } from "react";
import { 
  Check, Loader2, Plus, Edit3, Trash2, RotateCcw, X, Sparkles, Award
} from "lucide-react";
import { api } from "../api";

export function DailyChallenges({ profile, onUpdateProfile }) {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingChallengeId, setEditingChallengeId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    xp_reward: 30,
    category: "General",
    icon: "⚡"
  });
  const [saving, setSaving] = useState(false);

  const openAddModal = () => {
    setEditingChallengeId(null);
    setFormData({ title: "", description: "", xp_reward: 30, category: "General", icon: "⚡" });
    setShowModal(true);
  };

  const openEditModal = (ch) => {
    setEditingChallengeId(ch.id);
    setFormData({
      title: ch.title,
      description: ch.description,
      xp_reward: ch.xp_reward || 30,
      category: ch.category || "General",
      icon: ch.icon || "⚡"
    });
    setShowModal(true);
  };

  const handleDeleteChallenge = async (ch) => {
    if (!window.confirm(`Delete challenge "${ch.title}"?`)) return;
    try {
      await api.deleteChallenge(ch.id);
      setChallenges((prev) => prev.filter((c) => c.id !== ch.id));
    } catch (err) {
      alert("Failed to delete challenge: " + err.message);
    }
  };

  const handleSaveChallenge = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setSaving(true);
    try {
      if (editingChallengeId) {
        await api.updateChallenge(editingChallengeId, formData);
        setChallenges((prev) =>
          prev.map((c) => (c.id === editingChallengeId ? { ...c, ...formData } : c))
        );
      } else {
        const created = await api.createChallenge(formData);
        setChallenges((prev) => [...prev, created]);
      }
      setShowModal(false);
      setEditingChallengeId(null);
      setFormData({ title: "", description: "", xp_reward: 30, category: "General", icon: "⚡" });
    } catch (err) {
      console.warn("Save error fallback:", err);
      if (editingChallengeId) {
        setChallenges((prev) =>
          prev.map((c) => (c.id === editingChallengeId ? { ...c, ...formData } : c))
        );
      } else {
        const localCh = {
          id: "custom-" + Date.now(),
          ...formData,
          is_completed: false
        };
        setChallenges((prev) => [...prev, localCh]);
      }
      setShowModal(false);
      setEditingChallengeId(null);
    } finally {
      setSaving(false);
    }
  };

  // Default missions matching the exact reference screenshots
  const defaultMissions = [
    {
      id: "mission-workout-90",
      title: "Complete 90 min Workout",
      description: "Finish your 90-minute workout quest.",
      xp_reward: 50,
      icon: "🏋️",
      image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop",
      is_completed: false
    },
    {
      id: "mission-eat-healthy",
      title: "Eat 5 Healthy Meals",
      description: "Complete five balanced meals from your plan.",
      xp_reward: 30,
      icon: "🥗",
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
      is_completed: false
    },
    {
      id: "mission-drink-water",
      title: "Drink 3L Water",
      description: "Stay hydrated through the day.",
      xp_reward: 20,
      icon: "💧",
      is_completed: false
    },
    {
      id: "mission-walk-steps",
      title: "Walk 8,000 Steps",
      description: "Build your movement streak.",
      xp_reward: 20,
      icon: "🚶",
      is_completed: false
    }
  ];

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const data = await api.getChallenges();
      if (data && data.length > 0) {
        // Merge image banners for the first two default missions if not already set
        const mapped = data.map((item, idx) => {
          if (idx === 0 && !item.image) {
            return {
              ...item,
              icon: item.icon || "🏋️",
              image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop"
            };
          }
          if (idx === 1 && !item.image) {
            return {
              ...item,
              icon: item.icon || "🥗",
              image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop"
            };
          }
          if (idx === 2 && !item.icon) return { ...item, icon: "💧" };
          if (idx === 3 && !item.icon) return { ...item, icon: "🚶" };
          return item;
        });
        setChallenges(mapped);
      } else {
        setChallenges(defaultMissions);
      }
    } catch (err) {
      console.warn("Challenges fetch error, using default missions:", err);
      setChallenges(defaultMissions);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (ch) => {
    try {
      setCompletingId(ch.id);
      try {
        await api.completeChallenge(ch.id);
      } catch (e) {
        // Fallback local update if network error
        console.warn("API completion fallback:", e);
      }
      setChallenges((prev) =>
        prev.map((c) => (c.id === ch.id ? { ...c, is_completed: true } : c))
      );
      if (onUpdateProfile) onUpdateProfile();
    } catch (err) {
      alert("Error completing challenge: " + err.message);
    } finally {
      setCompletingId(null);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm("Reset all missions back to daily recommended defaults?")) return;
    try {
      await api.resetChallenges();
    } catch (e) {
      console.warn("Reset error:", e);
    }
    setChallenges(defaultMissions);
    setShowModal(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        maxWidth: "1080px",
        margin: "0 auto",
        padding: "10px 0 60px 0",
        color: "#ffffff"
      }}
    >
      {/* Header with Title & Customize Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px"
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.78rem",
              fontWeight: "800",
              letterSpacing: "2.5px",
              color: "#8c9eff",
              textTransform: "uppercase",
              marginBottom: "8px"
            }}
          >
            DAILY CHALLENGES
          </p>
          <h1
            style={{
              fontSize: "clamp(2rem, 3.5vw, 2.7rem)",
              fontWeight: "900",
              letterSpacing: "-0.8px",
              lineHeight: "1.15",
              marginBottom: "8px",
              color: "#ffffff"
            }}
          >
            Today's missions
          </h1>
          <p style={{ fontSize: "1rem", color: "#94a3b8", fontWeight: "500" }}>
            Finish your quests, earn XP and keep your streak. Completion resets automatically tomorrow.
          </p>
        </div>

        <button
          onClick={openAddModal}
          style={{
            backgroundColor: "#5865f2",
            color: "#ffffff",
            border: "none",
            borderRadius: "12px",
            padding: "12px 24px",
            fontSize: "0.95rem",
            fontWeight: "800",
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(88, 101, 242, 0.35)",
            transition: "all 0.18s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Plus size={16} /> Customize Challenges
        </button>
      </div>

      {/* 2x2 Grid of Mission Cards */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "#8c9eff" }}>
          <Loader2 size={36} className="spin" />
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
            gap: "20px"
          }}
        >
          {challenges.map((ch, idx) => {
            const isCompleted = !!ch.is_completed;
            const hasImage = !!ch.image;
            const isProcessing = completingId === ch.id;

            return (
              <div
                key={ch.id || idx}
                style={{
                  backgroundColor: "#141829",
                  borderRadius: "20px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease"
                }}
              >
                {/* Optional Top Image Banner */}
                {hasImage && (
                  <div style={{ width: "100%", height: "180px", overflow: "hidden", position: "relative" }}>
                    <img
                      src={ch.image}
                      alt={ch.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block"
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "linear-gradient(to top, #141829 0%, transparent 60%)"
                      }}
                    />
                  </div>
                )}

                {/* Card Body Content */}
                <div
                  style={{
                    padding: hasImage ? "16px 24px 24px 24px" : "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                    flex: 1,
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "1.6rem" }}>
                        {ch.icon || (idx === 0 ? "🏋️" : idx === 1 ? "🥗" : idx === 2 ? "💧" : "🚶")}
                      </div>

                      {/* Customize Actions (Edit & Delete) */}
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          onClick={() => openEditModal(ch)}
                          style={{
                            background: "rgba(255,255,255,0.06)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            color: "#94a3b8",
                            padding: "6px 10px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "0.78rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                          title="Edit mission"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleDeleteChallenge(ch)}
                          style={{
                            background: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.2)",
                            color: "#ef4444",
                            padding: "6px 8px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "0.78rem"
                          }}
                          title="Delete mission"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: "1.25rem", fontWeight: "900", color: "#ffffff", lineHeight: "1.25", marginTop: "4px" }}>
                      {ch.title}
                    </h3>
                    {/* XP & Description */}
                    <p style={{ fontSize: "0.85rem", color: "#94a3b8", fontWeight: "500" }}>
                      +{ch.xp_reward || 20} XP • {ch.description}
                    </p>
                  </div>

                  {/* Complete Challenge Button */}
                  <button
                    onClick={() => !isCompleted && handleComplete(ch)}
                    disabled={isCompleted || isProcessing}
                    style={{
                      width: "100%",
                      backgroundColor: isCompleted ? "#181d33" : "#5865f2",
                      color: isCompleted ? "#10b981" : "#ffffff",
                      border: isCompleted ? "1px solid #10b981" : "none",
                      borderRadius: "12px",
                      padding: "14px 20px",
                      fontSize: "0.95rem",
                      fontWeight: "800",
                      cursor: isCompleted ? "default" : "pointer",
                      boxShadow: isCompleted ? "none" : "0 4px 16px rgba(88, 101, 242, 0.35)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "all 0.18s ease"
                    }}
                  >
                    {isProcessing ? (
                      <Loader2 size={18} className="spin" />
                    ) : isCompleted ? (
                      <>
                        <Check size={18} /> Completed
                      </>
                    ) : (
                      "Complete Challenge"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Section: HISTORY READY */}
      <div
        style={{
          backgroundColor: "#141829",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "26px 30px",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}
      >
        <p
          style={{
            fontSize: "0.74rem",
            fontWeight: "800",
            letterSpacing: "2.2px",
            color: "#8c9eff",
            textTransform: "uppercase"
          }}
        >
          HISTORY READY
        </p>
        <h3 style={{ fontSize: "1.4rem", fontWeight: "900", color: "#ffffff" }}>
          Today is saved automatically
        </h3>
        <p style={{ fontSize: "0.9rem", color: "#94a3b8", lineHeight: "1.5" }}>
          Your challenges, completion status, XP earned, diet plan and workout plan are stored under today's date and appear in History.
        </p>
      </div>

      {/* Customize Challenges Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 1000
          }}
        >
          <div
            style={{
              backgroundColor: "#141829",
              borderRadius: "20px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "28px",
              maxWidth: "480px",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "900", color: "#ffffff" }}>
                {editingChallengeId ? "Edit Mission Quest" : "Customize / Add Mission"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveChallenge} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#94a3b8" }}>Mission Title</label>
                <input
                  type="text"
                  placeholder="e.g. 100 Pushups"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: "100%",
                    marginTop: "6px",
                    padding: "12px",
                    backgroundColor: "#1b2138",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    color: "#ffffff"
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#94a3b8" }}>Description</label>
                <input
                  type="text"
                  placeholder="e.g. Finish 10 sets of 10 throughout the day"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: "100%",
                    marginTop: "6px",
                    padding: "12px",
                    backgroundColor: "#1b2138",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "10px",
                    color: "#ffffff"
                  }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#94a3b8" }}>XP Reward</label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    value={formData.xp_reward}
                    onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) || 20 })}
                    style={{
                      width: "100%",
                      marginTop: "6px",
                      padding: "12px",
                      backgroundColor: "#1b2138",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "10px",
                      color: "#ffffff"
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#94a3b8" }}>Icon</label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    style={{
                      width: "100%",
                      marginTop: "6px",
                      padding: "12px",
                      backgroundColor: "#1b2138",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "10px",
                      color: "#ffffff"
                    }}
                  >
                    <option value="🏋️">🏋️ Workout</option>
                    <option value="🥗">🥗 Nutrition</option>
                    <option value="💧">💧 Water</option>
                    <option value="🚶">🚶 Steps / Walking</option>
                    <option value="⚡">⚡ Energy</option>
                    <option value="🔥">🔥 Burn</option>
                    <option value="🧘">🧘 Mindfulness</option>
                    <option value="🚴">🚴 Cycling</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    flex: 1,
                    backgroundColor: "#5865f2",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "12px",
                    fontWeight: "800",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  {saving ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                  <span>{editingChallengeId ? "Save Mission" : "Add Mission"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  style={{
                    backgroundColor: "#1b2138",
                    color: "#f1f5f9",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "10px",
                    padding: "12px 18px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Reset Defaults
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
