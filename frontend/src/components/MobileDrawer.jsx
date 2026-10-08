import React, { useState, useEffect, useRef } from "react";
import { 
  Home, 
  User, 
  Utensils, 
  Dumbbell, 
  Activity as ActivityIcon, 
  Camera, 
  Trophy, 
  TrendingUp, 
  History, 
  Settings as SettingsIcon,
  X,
  Sparkles,
  LogOut,
  ChevronRight,
  Zap
} from "lucide-react";
import { FitQuestLogo } from "./FitQuestLogo";
import { getResolvedUserName, getUserInitial } from "../utils/userHelper";

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "diet", label: "Diet Plan", icon: Utensils },
  { id: "workout", label: "Workout", icon: Dumbbell },
  { id: "profile", label: "My Profile", icon: User },
  { id: "scanner", label: "Food Scanner", icon: Camera },
  { id: "activity", label: "Activity Tracking", icon: ActivityIcon },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "challenges", label: "Challenges", icon: Trophy },
  { id: "summary", label: "Monthly Summary", icon: TrendingUp },
  { id: "history", label: "History", icon: History },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export function MobileDrawer({ isOpen, onClose, activeTab, setActiveTab, profile, onLogout, onOpenSara }) {
  const drawerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && drawerRef.current && !drawerRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const name = getResolvedUserName(profile);
  const initial = getUserInitial(profile);
  const email = profile?.email || "";
  const level = profile?.level || 2;
  const xp = profile?.xp || 125;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          zIndex: 998,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "280px",
          maxWidth: "80vw",
          background: "linear-gradient(180deg, #0c0f1a 0%, #111527 100%)",
          zIndex: 999,
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: isOpen ? "4px 0 40px rgba(0,0,0,0.5)" : "none",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {/* User Profile Section */}
        <div style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <FitQuestLogo size={28} showText={true} />
            <button
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.22)",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#ffffff",
                padding: 0,
                transition: "all 0.15s ease",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
              }}
              aria-label="Close sidebar menu"
              title="Close"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Profile card */}
          <div 
            onClick={() => { setActiveTab("profile"); onClose(); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              borderRadius: "14px",
              background: "rgba(255,255,255,0.04)",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #ff334b, #ff6b6b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "800",
              fontSize: "1.1rem",
              flexShrink: 0,
            }}>
              {initial}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: "#fff",
                fontWeight: "700",
                fontSize: "0.95rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}>
                {name}
              </div>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "2px",
              }}>
                <Zap size={12} color="#fbbf24" />
                <span style={{ color: "#fbbf24", fontSize: "0.75rem", fontWeight: "600" }}>
                  Level {level}
                </span>
                <span style={{ color: "#64748b", fontSize: "0.7rem" }}>
                  • {xp} XP
                </span>
              </div>
            </div>
            <ChevronRight size={16} color="#475569" />
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{
          flex: 1,
          padding: "12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
        }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  border: "none",
                  background: isActive 
                    ? "linear-gradient(135deg, rgba(255, 51, 75, 0.15), rgba(255, 51, 75, 0.05))" 
                    : "transparent",
                  color: isActive ? "#fff" : "#94a3b8",
                  fontSize: "0.9rem",
                  fontWeight: isActive ? "700" : "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <Icon 
                  size={20} 
                  color={isActive ? "#ff334b" : "currentColor"} 
                  style={{ flexShrink: 0 }}
                />
                <span>{item.label}</span>
                {isActive && (
                  <div style={{
                    marginLeft: "auto",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#ff334b",
                  }} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div style={{
          padding: "12px 12px 24px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}>
          {/* Ask Sara Button */}
          <button
            onClick={() => { onOpenSara(); onClose(); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.05))",
              color: "#a78bfa",
              fontSize: "0.9rem",
              fontWeight: "600",
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
          >
            <Sparkles size={20} />
            <span>Ask Sara AI</span>
          </button>

          {/* Logout */}
          <button
            onClick={() => { onLogout(); onClose(); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "none",
              background: "transparent",
              color: "#ef4444",
              fontSize: "0.9rem",
              fontWeight: "600",
              cursor: "pointer",
              width: "100%",
              textAlign: "left",
            }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
