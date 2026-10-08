import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Moon, Sun, Shield, LogOut, Trash2, Bell, Globe, Check, Loader2 } from "lucide-react";
import { api } from "../api";

export function Settings({ theme, toggleTheme, onLogout }) {
  const [settingsData, setSettingsData] = useState({
    theme: theme,
    weight_unit: "kg",
    distance_unit: "km",
    notifications_enabled: true,
    language: "en"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setSettingsData(data);
    } catch (err) {
      console.error("Error loading settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (updated) => {
    const newSt = { ...settingsData, ...updated };
    setSettingsData(newSt);
    setSaving(true);
    try {
      await api.updateSettings(newSt);
      setMessage("Settings updated!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      alert("Failed to update settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("⚠️ ARE YOU SURE? This will permanently delete your account, workout history, nutrition records, and user data.")) {
      try {
        await api.deleteAccount();
        onLogout();
      } catch (err) {
        alert("Delete account error: " + err.message);
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "760px", margin: "0 auto" }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
          <SettingsIcon color="var(--brand-green)" /> Application Settings
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
          Customize app display, units of measurement, notifications, and account settings.
        </p>
      </div>

      {message && (
        <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid var(--brand-green)", color: "var(--brand-green)", padding: "12px", borderRadius: "var(--radius-md)", fontWeight: "700" }}>
          ✓ {message}
        </div>
      )}

      {/* APPEARANCE & THEME */}
      <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
          {theme === "dark" ? <Moon size={18} color="var(--brand-purple)" /> : <Sun size={18} color="var(--brand-amber)" />} Appearance & Theme
        </h3>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ fontSize: "0.92rem", fontWeight: "700", color: "var(--text-primary)" }}>Theme Mode</p>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Currently using {theme.toUpperCase()} mode</p>
          </div>
          <button onClick={toggleTheme} className="gradient-btn" style={{ padding: "8px 16px", fontSize: "0.85rem" }}>
            Switch to {theme === "dark" ? "Light" : "Dark"} Mode
          </button>
        </div>
      </div>

      {/* UNITS OF MEASUREMENT */}
      <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Globe size={18} color="var(--brand-cyan)" /> Units of Measurement
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Weight Unit</label>
            <select value={settingsData.weight_unit} onChange={(e) => handleSaveSettings({ weight_unit: e.target.value })}>
              <option value="kg">Kilograms (kg)</option>
              <option value="lb">Pounds (lb)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Distance Unit</label>
            <select value={settingsData.distance_unit} onChange={(e) => handleSaveSettings({ distance_unit: e.target.value })}>
              <option value="km">Kilometers (km)</option>
              <option value="miles">Miles (mi)</option>
            </select>
          </div>
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div className="glass-card" style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Bell size={18} color="var(--brand-amber)" /> Push & In-App Notifications
          </h3>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Receive workout reminders and daily meal plan updates.</p>
        </div>
        <input
          type="checkbox"
          checked={settingsData.notifications_enabled}
          onChange={(e) => handleSaveSettings({ notifications_enabled: e.target.checked })}
          style={{ width: "22px", height: "22px", cursor: "pointer" }}
        />
      </div>

      {/* PRIVACY SECTION */}
      <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Shield size={18} color="var(--brand-green)" /> Security & Privacy
        </h3>
        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.4" }}>
          FitQuest AI stores your personal health metrics in an isolated, encrypted account. Your data is strictly user-scoped and never shared with third parties.
        </p>
      </div>

      {/* GOOGLE FIREBASE CLOUD SYNC WIDGET */}
      <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(19, 25, 39, 0.95) 100%)", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            🔥 Google Firebase Cloud Sync Status
          </h3>
          <span className="badge badge-amber" style={{ fontSize: "0.75rem", padding: "4px 10px" }}>
            ONLINE & CONNECTED
          </span>
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.5", margin: 0 }}>
          Google Firebase SDK & Cloud Firestore Offline Persistence are active. Your workout plans, diet logs, and activity tracking automatically sync between your mobile phone and cloud storage.
        </p>
        <div style={{ display: "flex", gap: "16px", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
          <span>• Project ID: <strong style={{ color: "#fff" }}>fitquest-ai</strong></span>
          <span>• Firestore Mode: <strong style={{ color: "var(--brand-green)" }}>Offline Cache Enabled</strong></span>
        </div>
      </div>

      {/* ACCOUNT ACTIONS */}
      <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--text-primary)" }}>Account Management</h3>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <button
            onClick={onLogout}
            style={{
              padding: "12px 24px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <LogOut size={16} /> Log Out
          </button>

          <button
            onClick={handleDeleteAccount}
            style={{
              padding: "12px 24px",
              background: "rgba(244, 63, 94, 0.15)",
              border: "1px solid var(--brand-rose)",
              color: "var(--brand-rose)",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Trash2 size={16} /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
