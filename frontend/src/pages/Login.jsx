import React, { useState } from "react";
import { Mail, Lock, User, ArrowRight, ShieldCheck, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { FitQuestLogo } from "../components/FitQuestLogo";
import { api } from "../api";

export function Login({ onLoginSuccess }) {
  const [activeMode, setActiveMode] = useState("signin"); // "signin" | "register"
  
  // Sign In state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Handle direct Password Sign In (NO verification code!)
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!loginPassword.trim()) {
      setError("Please enter your password.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await api.loginWithPassword(loginEmail, loginPassword);
      if (res.access_token) {
        const candidate = res.user?.name || res.profile?.name || localStorage.getItem("fitquest_user_name");
        const resolvedName = (candidate && candidate.toLowerCase() !== "athlete") 
          ? candidate 
          : (loginEmail && !loginEmail.toLowerCase().includes("athlete") ? loginEmail.split("@")[0] : "Gowtham");
        localStorage.setItem("fitquest_user_name", resolvedName);
        onLoginSuccess(res);
      } else {
        throw new Error("Login failed. No access token received.");
      }
    } catch (err) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle User Registration -> Switches to Sign In page!
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!regEmail.trim() || !regEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setError("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const res = await api.register(regName, regEmail, regPassword);
      localStorage.setItem("fitquest_user_name", regName.trim());
      setSuccessMsg(res.message || "Account registered successfully! Please sign in with your password.");
      setLoginEmail(regEmail);
      setLoginPassword("");
      setActiveMode("signin");
      // Clear register fields
      setRegPassword("");
      setRegConfirmPassword("");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#0d101c",
        backgroundImage: "radial-gradient(ellipse at 50% 30%, #1a2038 0%, #0a0d18 100%)",
        padding: "24px 32px",
        color: "#ffffff"
      }}
    >
      {/* Top Bar Logo */}
      <header style={{ display: "flex", alignItems: "center" }}>
        <FitQuestLogo size={36} showText={true} />
      </header>

      {/* Centered Auth Card */}
      <main style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "auto 0", padding: "20px 0" }}>
        <div
          style={{
            maxWidth: "460px",
            width: "100%",
            backgroundColor: "#141829",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "24px",
            padding: "36px 32px",
            boxShadow: "0 25px 70px rgba(0, 0, 0, 0.75)",
            textAlign: "center"
          }}
        >
          {/* Top Emblem */}
          <div style={{ marginBottom: "16px", display: "flex", justifyContent: "center" }}>
            <FitQuestLogo size={44} showText={false} />
          </div>

          <p
            style={{
              fontSize: "0.72rem",
              fontWeight: "800",
              letterSpacing: "2px",
              color: "#e5384f",
              textTransform: "uppercase",
              marginBottom: "6px"
            }}
          >
            FITNESS RPG • YOUR QUEST
          </p>

          <h2
            style={{
              fontSize: "1.9rem",
              fontWeight: "900",
              letterSpacing: "-0.5px",
              marginBottom: "18px",
              color: "#ffffff"
            }}
          >
            {activeMode === "signin" ? "Enter FitQuest" : "Create Account"}
          </h2>

          {/* Mode Switcher Tabs */}
          <div
            style={{
              display: "flex",
              backgroundColor: "#1b2138",
              borderRadius: "14px",
              padding: "4px",
              marginBottom: "22px",
              border: "1px solid rgba(255, 255, 255, 0.08)"
            }}
          >
            <button
              type="button"
              onClick={() => {
                setActiveMode("signin");
                setError("");
                setSuccessMsg("");
              }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: activeMode === "signin" ? "#e5384f" : "transparent",
                color: "#ffffff",
                fontSize: "0.9rem",
                fontWeight: "800",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode("register");
                setError("");
                setSuccessMsg("");
              }}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                border: "none",
                backgroundColor: activeMode === "register" ? "#5865f2" : "transparent",
                color: "#ffffff",
                fontSize: "0.9rem",
                fontWeight: "800",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Sign Up / Register
            </button>
          </div>

          {/* Success Banner (e.g. after registration) */}
          {successMsg && (
            <div
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                borderRadius: "12px",
                padding: "12px 16px",
                marginBottom: "18px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#34d399",
                fontSize: "0.85rem",
                textAlign: "left"
              }}
            >
              <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div
              style={{
                backgroundColor: "rgba(229, 56, 79, 0.15)",
                border: "1px solid rgba(229, 56, 79, 0.4)",
                borderRadius: "12px",
                padding: "12px 16px",
                marginBottom: "18px",
                color: "#f87171",
                fontSize: "0.85rem",
                textAlign: "left"
              }}
            >
              {error}
            </div>
          )}

          {/* SIGN IN FORM */}
          {activeMode === "signin" && (
            <form onSubmit={handleSignIn} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ textAlign: "left" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#94a3b8", marginBottom: "6px", display: "block" }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={18}
                    style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
                  />
                  <input
                    type="email"
                    required
                    placeholder="athlete@gmail.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "13px 14px 13px 44px",
                      backgroundColor: "#1b2138",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "0.95rem",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div style={{ textAlign: "left" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#94a3b8", marginBottom: "6px", display: "block" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={18}
                    style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
                  />
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "13px 44px 13px 44px",
                      backgroundColor: "#1b2138",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "0.95rem",
                      outline: "none"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    {showLoginPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: "8px",
                  backgroundColor: "#e5384f",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "14px",
                  padding: "15px",
                  fontSize: "1.05rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: "0 8px 24px rgba(229, 56, 79, 0.4)",
                  transition: "all 0.2s ease"
                }}
              >
                {loading ? <Loader2 size={20} className="spin" /> : <><span>Sign In</span> <ArrowRight size={18} /></>}
              </button>

              <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "8px" }}>
                Don't have an account yet?{" "}
                <span
                  onClick={() => {
                    setActiveMode("register");
                    setError("");
                    setSuccessMsg("");
                  }}
                  style={{ color: "#8c9eff", fontWeight: "700", cursor: "pointer" }}
                >
                  Register here
                </span>
              </p>
            </form>
          )}

          {/* SIGN UP / REGISTER FORM */}
          {activeMode === "register" && (
            <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ textAlign: "left" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#94a3b8", marginBottom: "4px", display: "block" }}>
                  Full Name
                </label>
                <div style={{ position: "relative" }}>
                  <User
                    size={18}
                    style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="enter the name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 44px",
                      backgroundColor: "#1b2138",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "0.95rem",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div style={{ textAlign: "left" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#94a3b8", marginBottom: "4px", display: "block" }}>
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={18}
                    style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
                  />
                  <input
                    type="email"
                    required
                    placeholder="athlete@gmail.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 44px",
                      backgroundColor: "#1b2138",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "0.95rem",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <div style={{ textAlign: "left" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#94a3b8", marginBottom: "4px", display: "block" }}>
                  Password (min. 6 characters)
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={18}
                    style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
                  />
                  <input
                    type={showRegPassword ? "text" : "password"}
                    required
                    placeholder="Create a secure password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 44px 12px 44px",
                      backgroundColor: "#1b2138",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "0.95rem",
                      outline: "none"
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    {showRegPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: "left" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "700", color: "#94a3b8", marginBottom: "4px", display: "block" }}>
                  Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={18}
                    style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}
                  />
                  <input
                    type="password"
                    required
                    placeholder="Confirm your password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px 12px 44px",
                      backgroundColor: "#1b2138",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "0.95rem",
                      outline: "none"
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: "8px",
                  backgroundColor: "#5865f2",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "14px",
                  padding: "15px",
                  fontSize: "1.05rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: "0 8px 24px rgba(88, 101, 242, 0.4)",
                  transition: "all 0.2s ease"
                }}
              >
                {loading ? <Loader2 size={20} className="spin" /> : <><span>Register & Proceed to Sign In</span> <ArrowRight size={18} /></>}
              </button>

              <p style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "6px" }}>
                Already have an account?{" "}
                <span
                  onClick={() => {
                    setActiveMode("signin");
                    setError("");
                    setSuccessMsg("");
                  }}
                  style={{ color: "#e5384f", fontWeight: "700", cursor: "pointer" }}
                >
                  Sign In directly
                </span>
              </p>
            </form>
          )}
        </div>
      </main>

      {/* Footer watermark */}
      <footer style={{ display: "flex", justifyContent: "center" }}>
        <span style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.3)" }}>
          FitQuest AI • Secure Password Authentication
        </span>
      </footer>
    </div>
  );
}
