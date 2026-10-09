import React, { useState, useEffect } from "react";
import { Login } from "./pages/Login";
import { Onboarding } from "./pages/Onboarding";
import { HomeDashboard } from "./pages/HomeDashboard";
import { DietPlan } from "./pages/DietPlan";
import { WorkoutPlan } from "./pages/WorkoutPlan";
import { FoodScanner } from "./pages/FoodScanner";
import { ActivityTracking } from "./pages/ActivityTracking";
import { Progress } from "./pages/Progress";
import { DailyChallenges } from "./pages/DailyChallenges";
import { MonthlyProgress } from "./pages/MonthlyProgress";
import { HistoryPage } from "./pages/HistoryPage";
import { Profile } from "./pages/Profile";
import { Settings } from "./pages/Settings";

import { MobileHeader } from "./components/MobileHeader";
import { BottomNav } from "./components/BottomNav";
import { MobileDrawer } from "./components/MobileDrawer";
import { SaraDrawer } from "./components/SaraDrawer";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";

import { api } from "./api";
import { Sparkles, Loader2 } from "lucide-react";
import { getResolvedUserName } from "./utils/userHelper";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("FitQuest UI Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          textAlign: "center"
        }}>
          <h2 style={{ fontSize: "1.4rem", color: "var(--brand-rose)", marginBottom: "12px" }}>
            Something went wrong while loading this view.
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", maxWidth: "400px", marginBottom: "20px" }}>
            {this.state.error?.message || "An unexpected UI error occurred."}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="red-btn"
          >
            Reload FitQuest AI
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("fitquest_token"));
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [theme, setTheme] = useState(localStorage.getItem("fitquest_theme") || "dark");
  const [isSaraOpen, setIsSaraOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  
  const [isMobileLayout, setIsMobileLayout] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileLayout(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Apply theme to HTML root element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("fitquest_theme", theme);
  }, [theme]);

  // Listen for auth logout events
  useEffect(() => {
    // Cleanse any outdated "Athlete" fallback in localStorage
    const stored = localStorage.getItem("fitquest_user_name");
    if (!stored || stored.toLowerCase() === "athlete") {
      localStorage.setItem("fitquest_user_name", "Gowtham");
    }

    const handleAuthChange = () => {
      setToken(localStorage.getItem("fitquest_token"));
      setProfile(null);
    };
    window.addEventListener("auth-changed", handleAuthChange);
    return () => window.removeEventListener("auth-changed", handleAuthChange);
  }, []);

  // Fetch profile when token exists
  useEffect(() => {
    if (token) {
      fetchUserProfile();
    } else {
      setLoadingProfile(false);
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      setLoadingProfile(true);
      const data = await api.getProfile();
      const resolvedName = getResolvedUserName(data);
      localStorage.setItem("fitquest_user_name", resolvedName);
      setProfile(data ? { ...data, name: resolvedName } : null);
    } catch (err) {
      console.warn("Profile check:", err.message);
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleLogout = () => {
    localStorage.removeItem("fitquest_token");
    setToken(null);
    setProfile(null);
  };

  if (!token) {
    return (
      <Login
        onLoginSuccess={(res) => {
          if (res?.access_token) {
            localStorage.setItem("fitquest_token", res.access_token);
            setToken(res.access_token);
          }
        }}
      />
    );
  }

  // 2. LOADING PROFILE
  if (loadingProfile) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        color: "var(--brand-red)"
      }}>
        <Loader2 size={42} className="spin" style={{ marginBottom: "12px" }} />
        <p style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-secondary)" }}>
          Loading FitQuest AI Engine...
        </p>
      </div>
    );
  }

  // 3. AUTHENTICATED BUT PROFILE INCOMPLETE -> ONBOARDING
  if (!profile) {
    return <Onboarding onComplete={(newProf) => setProfile(newProf)} />;
  }

  // 4. MAIN APP - RESPONSIVE EXPERIENCE (NO MANUAL SWITCHER BUTTONS)
  return (
    <ErrorBoundary>
      <div className={`app-root-wrapper ${isMobileLayout ? "mode-phone" : "mode-desktop"}`}>
        {/* IF EXPANDED DESKTOP MODE */}
        {!isMobileLayout ? (
          <div style={{ display: "flex", minHeight: "100vh", width: "100%", background: "var(--bg-primary)" }}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            <div className="main-workspace">
              <Header
                profile={profile}
                theme={theme}
                toggleTheme={toggleTheme}
                onOpenProfile={() => setActiveTab("profile")}
                onOpenSara={() => setIsSaraOpen(true)}
              />
              <main className="main-content-area">
                {activeTab === "home" && <HomeDashboard profile={profile} onUpdateProfile={fetchUserProfile} onNavigate={setActiveTab} onOpenSara={() => setIsSaraOpen(true)} />}
                {activeTab === "diet" && <DietPlan />}
                {activeTab === "workout" && <WorkoutPlan />}
                {activeTab === "scanner" && <FoodScanner />}
                {activeTab === "activity" && <ActivityTracking />}
                {activeTab === "progress" && <Progress profile={profile} />}
                {activeTab === "challenges" && <DailyChallenges profile={profile} onUpdateProfile={fetchUserProfile} />}
                {activeTab === "summary" && <MonthlyProgress />}
                {activeTab === "history" && <HistoryPage />}
                {activeTab === "profile" && <Profile profile={profile} onUpdateProfile={fetchUserProfile} />}
                {activeTab === "settings" && <Settings theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />}
              </main>
            </div>
          </div>
        ) : (
          /* DEFAULT: PURE NATIVE MOBILE APPLICATION EXPERIENCE */
          <div className="mobile-phone-container">
            {/* Mobile Top Header */}
            <MobileHeader
              activeTab={activeTab}
              profile={profile}
              onMenuOpen={() => setIsMobileDrawerOpen(true)}
              onProfileClick={() => setActiveTab("profile")}
            />

            {/* Mobile Main Content Area */}
            <main className="mobile-scrollable-content">
              {activeTab === "home" && <HomeDashboard profile={profile} onUpdateProfile={fetchUserProfile} onNavigate={setActiveTab} onOpenSara={() => setIsSaraOpen(true)} />}
              {activeTab === "diet" && <DietPlan />}
              {activeTab === "workout" && <WorkoutPlan />}
              {activeTab === "scanner" && <FoodScanner />}
              {activeTab === "activity" && <ActivityTracking />}
              {activeTab === "progress" && <Progress profile={profile} />}
              {activeTab === "challenges" && <DailyChallenges profile={profile} onUpdateProfile={fetchUserProfile} />}
              {activeTab === "summary" && <MonthlyProgress />}
              {activeTab === "history" && <HistoryPage />}
              {activeTab === "profile" && <Profile profile={profile} onUpdateProfile={fetchUserProfile} />}
              {activeTab === "settings" && <Settings theme={theme} toggleTheme={toggleTheme} onLogout={handleLogout} />}
            </main>

            {/* Floating Sara AI Assistant Button */}
            <button
              onClick={() => setIsSaraOpen(true)}
              className="mobile-floating-sara-btn"
              title="Open Sara AI Assistant"
            >
              <Sparkles size={24} />
            </button>

            {/* Fixed Bottom Navigation with More (Opens Drawer) */}
            <BottomNav
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onOpenMore={() => setIsMobileDrawerOpen(true)}
            />
          </div>
        )}

        {/* Mobile Full Feature Sidebar Drawer */}
        <MobileDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          profile={profile}
          onLogout={handleLogout}
          onOpenSara={() => setIsSaraOpen(true)}
        />

        {/* Sara AI Assistant Drawer */}
        <SaraDrawer isOpen={isSaraOpen} onClose={() => setIsSaraOpen(false)} />
      </div>
    </ErrorBoundary>
  );
}
