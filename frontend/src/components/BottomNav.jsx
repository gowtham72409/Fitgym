import React from "react";
import { Home, Utensils, Dumbbell, Zap, Menu } from "lucide-react";

export function BottomNav({ activeTab, setActiveTab, onOpenMore }) {
  const items = [
    { id: "home", label: "Home", icon: Home },
    { id: "workout", label: "Workout", icon: Dumbbell },
    { id: "activity", label: "Activity", icon: Zap },
    { id: "diet", label: "Diet", icon: Utensils },
  ];

  const isMoreActive = ["profile", "scanner", "challenges", "progress", "summary", "history", "settings"].includes(activeTab);

  return (
    <div 
      className="mobile-bottom-nav"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        background: "#0d101c",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 50,
        boxShadow: "0 -4px 24px rgba(0,0,0,0.4)"
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              background: "none",
              border: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              color: isActive ? "#8c9eff" : "#94a3b8",
              cursor: "pointer",
              padding: "6px 12px",
              transition: "all 0.15s ease"
            }}
          >
            <Icon size={21} strokeWidth={isActive ? 2.4 : 1.8} />
            <span style={{ fontSize: "0.68rem", fontWeight: isActive ? "800" : "500" }}>{item.label}</span>
          </button>
        );
      })}

      {/* MORE BUTTON - Opens MobileDrawer with ALL Features */}
      <button
        onClick={onOpenMore}
        style={{
          background: isMoreActive ? "rgba(140, 158, 255, 0.12)" : "none",
          border: isMoreActive ? "1px solid rgba(140, 158, 255, 0.3)" : "none",
          borderRadius: "10px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          color: isMoreActive ? "#8c9eff" : "#94a3b8",
          cursor: "pointer",
          padding: "6px 14px",
          transition: "all 0.15s ease"
        }}
        title="Open all features menu"
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3.5px", width: "21px", height: "21px" }}>
          <span style={{ display: "block", width: "18px", height: "2px", backgroundColor: isMoreActive ? "#8c9eff" : "#94a3b8", borderRadius: "2px" }} />
          <span style={{ display: "block", width: "18px", height: "2px", backgroundColor: isMoreActive ? "#8c9eff" : "#94a3b8", borderRadius: "2px" }} />
          <span style={{ display: "block", width: "18px", height: "2px", backgroundColor: isMoreActive ? "#8c9eff" : "#94a3b8", borderRadius: "2px" }} />
        </div>
        <span style={{ fontSize: "0.68rem", fontWeight: isMoreActive ? "800" : "600" }}>Menu</span>
      </button>
    </div>
  );
}
