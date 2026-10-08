import React from "react";
import { getResolvedUserName, getUserInitial } from "../utils/userHelper";

const PAGE_TITLES = {
  home: "FitQuest",
  diet: "Diet Plan",
  workout: "Workout",
  profile: "My Profile",
  scanner: "Food Scanner",
  activity: "Activity",
  progress: "Progress",
  challenges: "Challenges",
  summary: "Monthly Summary",
  history: "History",
  settings: "Settings",
};

export function MobileHeader({ activeTab, profile, onMenuOpen, onProfileClick }) {
  const name = getResolvedUserName(profile);
  const initial = getUserInitial(profile);
  const title = PAGE_TITLES[activeTab] || "FitQuest";

  return (
    <header
      className="mobile-top-header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        background: "var(--bg-secondary)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        position: "sticky",
        top: 0,
        zIndex: 50,
        minHeight: "56px",
      }}
    >
      {/* Left: 3 Horizontal Underscore Lines Menu Button (Three underscores) */}
      <button
        onClick={onMenuOpen}
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "12px",
          width: "42px",
          height: "42px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "4.5px",
          cursor: "pointer",
          padding: 0,
          transition: "background 0.2s, transform 0.15s",
          boxShadow: "0 2px 8px rgba(0,0,0,0.25)"
        }}
        aria-label="Open sidebar menu"
        title="Open Sidebar Menu"
      >
        <span style={{ display: "block", width: "22px", height: "2.5px", backgroundColor: "#ffffff", borderRadius: "2px" }} />
        <span style={{ display: "block", width: "22px", height: "2.5px", backgroundColor: "#ffffff", borderRadius: "2px" }} />
        <span style={{ display: "block", width: "22px", height: "2.5px", backgroundColor: "#ffffff", borderRadius: "2px" }} />
      </button>

      {/* Center: Page Title */}
      <h1 style={{
        fontSize: activeTab === "home" ? "1.15rem" : "1.05rem",
        fontWeight: "800",
        color: "var(--text-primary)",
        margin: 0,
        letterSpacing: activeTab === "home" ? "0.5px" : "0",
        background: activeTab === "home" ? "linear-gradient(135deg, #ff334b, #ff6b6b)" : "none",
        WebkitBackgroundClip: activeTab === "home" ? "text" : "unset",
        WebkitTextFillColor: activeTab === "home" ? "transparent" : "var(--text-primary)",
      }}>
        {title}
      </h1>

      {/* Right: Profile Avatar */}
      <button
        onClick={onProfileClick}
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #ff334b, #ff6b6b)",
          border: "2px solid rgba(255, 51, 75, 0.4)",
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "900",
          fontSize: "1.05rem",
          cursor: "pointer",
          flexShrink: 0,
          boxShadow: "0 4px 14px rgba(255, 51, 75, 0.35)",
          transition: "transform 0.2s",
        }}
        aria-label={`Profile (${name})`}
        title={`Profile: ${name}`}
      >
        {initial}
      </button>
    </header>
  );
}
