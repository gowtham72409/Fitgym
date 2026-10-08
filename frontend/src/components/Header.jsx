import React, { useState } from "react";
import { Sun, Moon, Bell, User as UserIcon, Sparkles } from "lucide-react";
import { getResolvedUserName, getUserInitial } from "../utils/userHelper";

export function Header({ profile, theme, toggleTheme, onOpenProfile, onOpenSara }) {
  const [showNotifications, setShowNotifications] = useState(false);

  const name = getResolvedUserName(profile);
  const initial = getUserInitial(profile);
  const dateStr = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const notifications = [
    "🔥 3-day workout streak active! Keep going!",
    "🥗 Daily meal plan prepared for today.",
    "💧 Time to log your daily water intake."
  ];

  return (
    <header className="desktop-header" style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px 28px",
      borderBottom: "1px solid var(--border-color)",
      background: "var(--bg-secondary)",
      position: "sticky",
      top: 0,
      zIndex: 35
    }}>
      <div>
        <h2 style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
          Welcome, <span style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{name}!</span>
        </h2>
        <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "2px" }}>
          📅 {dateStr} • Ready to crush your goals today?
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        {/* Ask Sara Assistant Quick Launch Button */}
        <button
          onClick={onOpenSara}
          style={{
            background: "var(--gradient-purple)",
            color: "#fff",
            border: "none",
            borderRadius: "var(--radius-full)",
            padding: "8px 16px",
            fontSize: "0.85rem",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)"
          }}
        >
          <Sparkles size={16} />
          <span>Ask Sara</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-color)",
            color: "var(--text-primary)",
            width: "40px",
            height: "40px",
            borderRadius: "var(--radius-full)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? <Sun size={18} color="var(--brand-amber)" /> : <Moon size={18} color="var(--brand-purple)" />}
        </button>

        {/* Notifications */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              width: "40px",
              height: "40px",
              borderRadius: "var(--radius-full)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              position: "relative"
            }}
          >
            <Bell size={18} />
            <span style={{
              position: "absolute",
              top: "6px",
              right: "6px",
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "var(--brand-rose)"
            }} />
          </button>

          {showNotifications && (
            <div className="glass-card" style={{
              position: "absolute",
              right: 0,
              top: "50px",
              width: "280px",
              padding: "16px",
              zIndex: 100,
              boxShadow: "var(--shadow-md)"
            }}>
              <h4 style={{ fontSize: "0.88rem", fontWeight: "700", marginBottom: "10px", color: "var(--text-primary)" }}>
                Notifications
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {notifications.map((n, i) => (
                  <div key={i} style={{ fontSize: "0.78rem", color: "var(--text-secondary)", padding: "8px", borderRadius: "8px", background: "rgba(255,255,255,0.03)" }}>
                    {n}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <button
          onClick={onOpenProfile}
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "var(--radius-full)",
            background: "var(--gradient-primary)",
            border: "2px solid var(--brand-green)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            fontSize: "1rem",
            cursor: "pointer"
          }}
          title={`Open Profile (${name})`}
        >
          {initial}
        </button>
      </div>
    </header>
  );
}
