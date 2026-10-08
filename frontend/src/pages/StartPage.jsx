import React from "react";
import { FitQuestLogo } from "../components/FitQuestLogo";

export function StartPage({ onStart }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: "#0d101c",
        backgroundImage: "radial-gradient(ellipse at 50% 45%, #181e35 0%, #0a0d18 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "36px 44px",
        color: "#ffffff",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Top Left Header with FitQuest AI Logo */}
      <header style={{ display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* White icon badge with red Caduceus */}
          <div
            style={{
              width: "32px",
              height: "32px",
              backgroundColor: "#ffffff",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px"
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="#e5384f"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="2" x2="12" y2="22" stroke="#e5384f" strokeWidth="2.2" />
              <circle cx="12" cy="2.5" r="1.5" fill="#e5384f" />
              <path d="M7 5.5C8.5 4 10.5 4.5 12 5.5C13.5 4.5 15.5 4 17 5.5C18.5 7 17.5 9 15 9.5L12 9.5L9 9.5C6.5 9 5.5 7 7 5.5Z" fill="#e5384f" opacity="0.9" />
              <path d="M8.5 11C8.5 11 10 13 12 13C14 13 15.5 11 15.5 11" stroke="#e5384f" strokeWidth="2" />
              <path d="M15.5 14C15.5 14 14 16 12 16C10 16 8.5 14 8.5 14" stroke="#e5384f" strokeWidth="2" />
            </svg>
          </div>
          <span style={{ fontSize: "1.15rem", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.3px" }}>
            FitQuest AI
          </span>
        </div>
      </header>

      {/* Hero Content Section */}
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          maxWidth: "760px",
          width: "100%",
          margin: "auto",
          padding: "20px"
        }}
      >
        <p
          style={{
            fontSize: "0.82rem",
            fontWeight: "800",
            letterSpacing: "2.8px",
            color: "#8c9eff",
            textTransform: "uppercase",
            marginBottom: "16px"
          }}
        >
          FITQUEST AI • YOUR FITNESS WORLD
        </p>

        <h1
          style={{
            fontSize: "clamp(2.8rem, 6vw, 4.2rem)",
            fontWeight: "900",
            letterSpacing: "-1.5px",
            lineHeight: "1.08",
            marginBottom: "18px",
            color: "#ffffff"
          }}
        >
          Welcome to<br />FitQuest
        </h1>

        <p
          style={{
            fontSize: "1.15rem",
            color: "#94a3b8",
            fontWeight: "500",
            marginBottom: "36px"
          }}
        >
          Train stronger. Eat smarter. Track your quest.
        </p>

        {/* Big Glowing Red Start Button */}
        <button
          onClick={onStart}
          style={{
            backgroundColor: "#e5384f",
            color: "#ffffff",
            border: "none",
            borderRadius: "14px",
            padding: "16px 64px",
            fontSize: "1.25rem",
            fontWeight: "800",
            cursor: "pointer",
            boxShadow: "0 10px 32px rgba(229, 56, 79, 0.45)",
            transition: "all 0.22s ease",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
            e.currentTarget.style.boxShadow = "0 14px 40px rgba(229, 56, 79, 0.6)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = "0 10px 32px rgba(229, 56, 79, 0.45)";
          }}
        >
          Start
        </button>

        <p
          style={{
            fontSize: "0.82rem",
            color: "#64748b",
            marginTop: "18px",
            fontWeight: "600"
          }}
        >
          Begin your fitness quest
        </p>
      </main>

      {/* Bottom Right Hatchable Badge */}
      <footer style={{ display: "flex", justifyContent: "flex-end" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#161b2d",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            padding: "7px 14px",
            borderRadius: "99px",
            fontSize: "0.78rem",
            fontWeight: "700",
            color: "#f1f5f9",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
          }}
        >
          <span
            style={{
              width: "14px",
              height: "14px",
              backgroundColor: "#f59e0b",
              borderRadius: "50%",
              display: "inline-block"
            }}
          />
          Built on Hatchable
        </div>
      </footer>
    </div>
  );
}
