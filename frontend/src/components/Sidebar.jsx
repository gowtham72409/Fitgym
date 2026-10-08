import React from "react";
import { 
  Home, 
  Circle, 
  UtensilsCrossed, 
  Dumbbell, 
  Zap, 
  Scan, 
  Trophy, 
  RotateCcw, 
  BookOpen, 
  Settings as SettingsIcon,
  ArrowRight
} from "lucide-react";
import { FitQuestLogo } from "./FitQuestLogo";

export function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "profile", label: "Profile", icon: Circle },
    { id: "diet", label: "Diet Plan", icon: UtensilsCrossed },
    { id: "workout", label: "Workout", icon: Dumbbell },
    { id: "activity", label: "Activity Tracking", icon: Zap },
    { id: "scanner", label: "Food Scanner", icon: Scan },
    { id: "challenges", label: "Challenges", icon: Trophy },
    { id: "progress", label: "Progress", icon: RotateCcw },
    { id: "history", label: "History", icon: BookOpen },
    { id: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <aside
      className="app-sidebar"
      style={{
        width: "260px",
        minWidth: "260px",
        backgroundColor: "#0d101c",
        borderRight: "1px solid rgba(255, 255, 255, 0.06)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "24px 18px",
        height: "100vh",
        position: "sticky",
        top: 0,
        zIndex: 100,
        overflowY: "auto"
      }}
    >
      <div>
        {/* Top Logo */}
        <div style={{ marginBottom: "28px", paddingLeft: "6px" }}>
          <FitQuestLogo size={40} showText={true} />
        </div>

        {/* Nav Items List */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "11px 16px",
                  borderRadius: "12px",
                  border: isActive ? "1px solid #333d6b" : "1px solid transparent",
                  backgroundColor: isActive ? "#181e35" : "transparent",
                  color: isActive ? "#8c9eff" : "#94a3b8",
                  fontSize: "0.92rem",
                  fontWeight: isActive ? "700" : "500",
                  cursor: "pointer",
                  transition: "all 0.18s ease",
                  textAlign: "left",
                  width: "100%"
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.04)";
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#94a3b8";
                  }
                }}
              >
                <Icon size={19} color={isActive ? "#8c9eff" : "#94a3b8"} strokeWidth={isActive ? 2.3 : 1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sidebar Motivational Card */}
      <div style={{ marginTop: "24px" }}>
        <div
          style={{
            backgroundColor: "#141829",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          {/* Pastel Mountain Graphic */}
          <div
            style={{
              width: "100%",
              height: "72px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #1b2138 0%, #15192b 100%)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg viewBox="0 0 160 80" style={{ width: "100%", height: "100%" }}>
              {/* Sun */}
              <circle cx="130" cy="24" r="10" fill="#facc15" opacity="0.9" />
              {/* Back Hill */}
              <polygon points="10,80 80,30 150,80" fill="#6ee7b7" opacity="0.8" />
              {/* Front Hill */}
              <polygon points="40,80 110,40 170,80" fill="#a78bfa" opacity="0.7" />
              {/* Dot detail */}
              <circle cx="45" cy="52" r="3.5" fill="#312e81" />
            </svg>
          </div>

          <div>
            <p style={{ fontSize: "0.76rem", color: "#94a3b8", lineHeight: "1.3" }}>
              Small steps<br />make big changes
            </p>
            <button
              onClick={() => setActiveTab("progress")}
              style={{
                marginTop: "6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "0.78rem",
                fontWeight: "700",
                color: "#8c9eff",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0
              }}
            >
              Keep Going <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
