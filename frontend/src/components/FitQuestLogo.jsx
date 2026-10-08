import React from "react";

export function FitQuestLogo({ size = 42, showText = true, isCompact = false }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "12px" }}>
      {/* White rounded square emblem */}
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
          flexShrink: 0,
          padding: "5px"
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width={Math.round(size * 0.72)}
          height={Math.round(size * 0.72)}
          fill="none"
          stroke="#e5384f"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Caduceus staff */}
          <line x1="12" y1="2" x2="12" y2="22" stroke="#e5384f" strokeWidth="2" />
          <circle cx="12" cy="2.5" r="1.5" fill="#e5384f" />
          {/* Wings */}
          <path d="M7 5.5C8.5 4 10.5 4.5 12 5.5C13.5 4.5 15.5 4 17 5.5C18.5 7 17.5 9 15 9.5L12 9.5L9 9.5C6.5 9 5.5 7 7 5.5Z" fill="#e5384f" opacity="0.9" />
          {/* Entwined serpents */}
          <path d="M8.5 11C8.5 11 10 13 12 13C14 13 15.5 11 15.5 11" stroke="#e5384f" strokeWidth="1.8" />
          <path d="M15.5 14C15.5 14 14 16 12 16C10 16 8.5 14 8.5 14" stroke="#e5384f" strokeWidth="1.8" />
          <path d="M9.5 18C10.2 19 11.2 19.5 12 19.5C12.8 19.5 13.8 19 14.5 18" stroke="#e5384f" strokeWidth="1.8" />
        </svg>
      </div>

      {showText && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: isCompact ? "1.1rem" : "1.35rem",
              fontWeight: "900",
              letterSpacing: "-0.5px",
              color: "#ffffff",
              lineHeight: "1.1"
            }}
          >
            FitQuest
          </span>
          <span
            style={{
              fontSize: isCompact ? "0.6rem" : "0.68rem",
              fontWeight: "600",
              color: "#8c96ab",
              letterSpacing: "0.2px",
              marginTop: "2px"
            }}
          >
            Your Health, Your Quest
          </span>
        </div>
      )}
    </div>
  );
}
