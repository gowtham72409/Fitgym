import React, { useState } from "react";
import { User, Target, Shield, Settings, Trash2, Key, Bell, Globe, Edit3, Check, Loader2, AlertTriangle, Scale, MapPin } from "lucide-react";
import { api } from "../api";
import { getResolvedUserName } from "../utils/userHelper";

export function Profile({ profile, onUpdateProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("fitness"); // "fitness" | "account"
  
  const [formData, setFormData] = useState({
    name: getResolvedUserName(profile),
    age: profile?.age || 26,
    gender: profile?.gender || "Male",
    height_cm: profile?.height_cm || 175,
    current_weight_kg: profile?.current_weight_kg || 78,
    target_weight_kg: profile?.target_weight_kg || 70,
    goal: profile?.goal || "Weight loss",
    activity_level: profile?.activity_level || "Moderate",
    fitness_experience: profile?.fitness_experience || "Beginner",
    workout_preference: profile?.workout_preference || "Both",
    workout_days_per_week: profile?.workout_days_per_week || 5,
    preferred_duration_min: profile?.preferred_duration_min || 90,
    food_preference: profile?.food_preference || "Non-vegetarian",
    budget: profile?.budget || "Moderate budget",
    food_restrictions: profile?.food_restrictions || ""
  });

  // Account Management Preferences State
  const [unitPreferences, setUnitPreferences] = useState({
    weight_unit: "kg",
    distance_unit: "km",
    notifications_enabled: true
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ["age", "height_cm", "current_weight_kg", "target_weight_kg", "workout_days_per_week", "preferred_duration_min"].includes(name)
        ? parseFloat(value) || 0
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await api.updateProfile(formData);
      if (formData.name && formData.name.trim()) {
        localStorage.setItem("fitquest_user_name", formData.name.trim());
      }
      setIsEditing(false);
      setMessage("Fitness profile updated successfully!");
      if (onUpdateProfile) onUpdateProfile();
    } catch (err) {
      alert("Profile update failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.deleteAccount();
      localStorage.removeItem("fitquest_token");
      window.location.reload();
    } catch (err) {
      alert("Account deletion error: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "860px", margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
            <User color="var(--brand-red)" /> Profile & Account Management
          </h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Manage your personal physical metrics, fitness goals, security, and account preferences.
          </p>
        </div>

        {activeSubTab === "fitness" && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              background: isEditing ? "rgba(244, 63, 94, 0.15)" : "rgba(255, 51, 75, 0.15)",
              border: isEditing ? "1px solid var(--brand-rose)" : "1px solid var(--brand-red)",
              color: isEditing ? "var(--brand-rose)" : "var(--brand-red)",
              padding: "10px 18px",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "0.88rem",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Edit3 size={16} /> {isEditing ? "Cancel Editing" : "Edit Metrics"}
          </button>
        )}
      </div>

      {/* Sub-Tab Navigation: Fitness Metrics vs Account Management */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
        <button
          onClick={() => setActiveSubTab("fitness")}
          style={{
            padding: "10px 20px",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: activeSubTab === "fitness" ? "var(--gradient-red)" : "#161b29",
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <User size={18} /> Fitness Metrics & Goals
        </button>

        <button
          onClick={() => setActiveSubTab("account")}
          style={{
            padding: "10px 20px",
            borderRadius: "var(--radius-md)",
            border: "none",
            background: activeSubTab === "account" ? "var(--gradient-purple)" : "#161b29",
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <Settings size={18} /> Account Management & Security
        </button>
      </div>

      {message && (
        <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid var(--brand-green)", color: "var(--brand-green)", padding: "12px", borderRadius: "var(--radius-md)", fontWeight: "700" }}>
          ✓ {message}
        </div>
      )}

      {/* SUB-TAB 1: FITNESS METRICS FORM */}
      {activeSubTab === "fitness" && (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* PERSONAL METRICS CARD */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--brand-red)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <User size={18} /> Physical Metrics
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "700" }}>Full Name</label>
                {isEditing ? (
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                ) : (
                  <p style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-primary)", marginTop: "4px" }}>{formData.name}</p>
                )}
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "700" }}>Age & Gender</label>
                {isEditing ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input type="number" name="age" value={formData.age} onChange={handleChange} />
                    <select name="gender" value={formData.gender} onChange={handleChange}>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                ) : (
                  <p style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-primary)", marginTop: "4px" }}>{formData.age} yrs • {formData.gender}</p>
                )}
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "700" }}>Height</label>
                {isEditing ? (
                  <input type="number" name="height_cm" value={formData.height_cm} onChange={handleChange} />
                ) : (
                  <p style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-primary)", marginTop: "4px" }}>{formData.height_cm} cm</p>
                )}
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "700" }}>Current & Target Weight</label>
                {isEditing ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input type="number" step="0.1" name="current_weight_kg" value={formData.current_weight_kg} onChange={handleChange} />
                    <input type="number" step="0.1" name="target_weight_kg" value={formData.target_weight_kg} onChange={handleChange} />
                  </div>
                ) : (
                  <p style={{ fontSize: "1rem", fontWeight: "700", color: "var(--text-primary)", marginTop: "4px" }}>{formData.current_weight_kg} kg → {formData.target_weight_kg} kg</p>
                )}
              </div>
            </div>
          </div>

          {/* FITNESS GOALS CARD */}
          <div className="glass-card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--brand-purple)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Target size={18} /> Goals & Nutrition
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "700" }}>Primary Goal</label>
                {isEditing ? (
                  <select name="goal" value={formData.goal} onChange={handleChange}>
                    <option value="Weight loss">Weight loss</option>
                    <option value="Muscle gain">Muscle gain</option>
                    <option value="Fat loss">Fat loss</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                ) : (
                  <p style={{ fontSize: "1rem", fontWeight: "700", color: "var(--brand-red)", marginTop: "4px" }}>{formData.goal}</p>
                )}
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "700" }}>Food Preference</label>
                {isEditing ? (
                  <select name="food_preference" value={formData.food_preference} onChange={handleChange}>
                    <option value="Non-vegetarian">Non-vegetarian</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Eggetarian">Eggetarian</option>
                  </select>
                ) : (
                  <p style={{ fontSize: "1rem", fontWeight: "700", color: "var(--brand-green)", marginTop: "4px" }}>{formData.food_preference}</p>
                )}
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "700" }}>Workout Mode</label>
                {isEditing ? (
                  <select name="workout_preference" value={formData.workout_preference} onChange={handleChange}>
                    <option value="Home">Home</option>
                    <option value="Gym">Gym</option>
                    <option value="Both">Both (Home & Gym)</option>
                  </select>
                ) : (
                  <p style={{ fontSize: "1rem", fontWeight: "700", color: "var(--brand-purple)", marginTop: "4px" }}>{formData.workout_preference}</p>
                )}
              </div>
            </div>
          </div>

          {isEditing && (
            <button type="submit" disabled={saving} className="red-btn" style={{ padding: "16px", fontSize: "1rem" }}>
              {saving ? <Loader2 size={18} className="spin" /> : <Check size={18} />}
              <span>Save Profile Changes</span>
            </button>
          )}
        </form>
      )}

      {/* SUB-TAB 2: ACCOUNT MANAGEMENT SECTION (EXPLICIT USER REQUEST) */}
      {activeSubTab === "account" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* USER ACCOUNT OVERVIEW CARD */}
          <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Shield size={20} color="var(--brand-red)" /> Account Overview
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "16px" }}>
              <div style={{
                background: "rgba(255,255,255,0.02)",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid var(--border-color)",
                overflow: "hidden",
                minWidth: 0,
                boxSizing: "border-box"
              }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>REGISTERED EMAIL</span>
                <p 
                  title={profile?.email || "gowtham24092002@gmail.com"}
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "800",
                    color: "var(--brand-red)",
                    marginTop: "4px",
                    wordBreak: "break-all",
                    overflowWrap: "anywhere",
                    whiteSpace: "normal",
                    lineHeight: "1.3",
                    maxWidth: "100%",
                    overflow: "hidden"
                  }}
                >
                  {profile?.email || "gowtham24092002@gmail.com"}
                </p>
              </div>


              <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>LEVEL & GAMIFICATION</span>
                <p style={{ fontSize: "1rem", fontWeight: "800", color: "var(--brand-purple)", marginTop: "4px" }}>
                  Level {profile?.level || 1} • {profile?.xp || 100} XP
                </p>
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>AUTHENTICATION STATUS</span>
                <p style={{ fontSize: "1rem", fontWeight: "800", color: "var(--brand-green)", marginTop: "4px" }}>
                  ✓ OTP Verified
                </p>
              </div>
            </div>
          </div>

          {/* APP PREFERENCES & UNITS CARD */}
          <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <Scale size={20} color="var(--brand-purple)" /> Units & Preferences
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "700", marginBottom: "6px", display: "block" }}>
                  Weight Unit
                </label>
                <select
                  value={unitPreferences.weight_unit}
                  onChange={(e) => setUnitPreferences({ ...unitPreferences, weight_unit: e.target.value })}
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="lbs">Pounds (lbs)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "700", marginBottom: "6px", display: "block" }}>
                  Distance Unit
                </label>
                <select
                  value={unitPreferences.distance_unit}
                  onChange={(e) => setUnitPreferences({ ...unitPreferences, distance_unit: e.target.value })}
                >
                  <option value="km">Kilometers (km)</option>
                  <option value="miles">Miles (mi)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "700", marginBottom: "6px", display: "block" }}>
                  Daily Notifications
                </label>
                <select
                  value={unitPreferences.notifications_enabled ? "enabled" : "disabled"}
                  onChange={(e) => setUnitPreferences({ ...unitPreferences, notifications_enabled: e.target.value === "enabled" })}
                >
                  <option value="enabled">Enabled (Recommended)</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            </div>
          </div>

          {/* DANGER ZONE / ACCOUNT DELETION CARD */}
          <div className="glass-card" style={{
            padding: "24px",
            border: "1px solid rgba(244, 63, 94, 0.3)",
            background: "linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, rgba(22, 28, 43, 0.9) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px"
          }}>
            <div>
              <h4 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--brand-rose)", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={18} /> Danger Zone: Delete Account
              </h4>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Permanently delete your profile, workout logs, diet plans, and weight history.
              </p>
            </div>

            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                background: "rgba(244, 63, 94, 0.2)",
                border: "1px solid var(--brand-rose)",
                color: "var(--brand-rose)",
                padding: "10px 20px",
                borderRadius: "var(--radius-md)",
                fontWeight: "700",
                fontSize: "0.88rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <Trash2 size={16} /> Delete Account
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "460px" }}>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <AlertTriangle size={42} color="var(--brand-rose)" style={{ marginBottom: "12px" }} />
              <h3 style={{ fontSize: "1.3rem", fontWeight: "800", color: "#ffffff" }}>Are you absolutely sure?</h3>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginTop: "6px" }}>
                This action cannot be undone. All your diet plans, workout streaks, XP levels, and health records will be permanently deleted.
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowDeleteModal(false)}
                style={{ flex: 1, padding: "12px", background: "none", border: "1px solid var(--border-color)", color: "#ffffff", borderRadius: "var(--radius-md)", cursor: "pointer", fontWeight: "600" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{ flex: 1, padding: "12px", background: "var(--brand-rose)", border: "none", color: "#ffffff", borderRadius: "var(--radius-md)", cursor: "pointer", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                {deleting ? <Loader2 size={16} className="spin" /> : <Trash2 size={16} />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
