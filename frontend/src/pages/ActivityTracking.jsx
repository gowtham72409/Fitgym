import React, { useState, useEffect, useRef } from "react";
import { 
  Play, Pause, Square, MapPin, Zap, Flame, 
  RotateCcw, Trash2, Check, Loader2, ArrowRight
} from "lucide-react";
import { api } from "../api";

function getHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function ActivityTracking() {
  const [selectedActivity, setSelectedActivity] = useState("Walking");
  const [status, setStatus] = useState("idle"); // idle, tracking, paused
  const [seconds, setSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0.0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0.0);
  const [calories, setCalories] = useState(0);
  const [routePoints, setRoutePoints] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [saving, setSaving] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [userWeightKg, setUserWeightKg] = useState(70);
  const [isMoving, setIsMoving] = useState(false);
  const [steps, setSteps] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const timerRef = useRef(null);
  const simTimerRef = useRef(null);
  const watchIdRef = useRef(null);
  const lastPosRef = useRef(null);
  const lastMoveTimeRef = useRef(Date.now());
  const lastStepTimeRef = useRef(0);

  const activityOptions = [
    { id: "Walking", label: "Walking", icon: "🚶" },
    { id: "Running", label: "Running", icon: "🏃" },
    { id: "Cycling", label: "Cycling", icon: "🚴" },
    { id: "Hiking", label: "Hiking", icon: "🥾" },
  ];

  // Activity Physics & Calorie Configuration (ACSM Standards)
  // Active Calories = Real Distance (km) * Body Weight (kg) * Calorie Factor
  // Walking: ~0.75 kcal/kg/km, Running: ~1.03, Cycling: ~0.35, Hiking: ~0.85
  // Crucial: When stationary or not moving, 0 active calories are burned!
  const ACTIVITY_CONFIG = {
    Walking: { minMoveKmh: 1.2, maxSpeedKmh: 7.5, calFactor: 0.75, strideLengthM: 0.76 },
    Running: { minMoveKmh: 4.0, maxSpeedKmh: 22.0, calFactor: 1.03, strideLengthM: 1.05 },
    Cycling: { minMoveKmh: 3.0, maxSpeedKmh: 45.0, calFactor: 0.35, strideLengthM: 0.0 },
    Hiking: { minMoveKmh: 1.0, maxSpeedKmh: 7.0, calFactor: 0.85, strideLengthM: 0.70 },
  };

  useEffect(() => {
    fetchHistory();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const prof = await api.getProfile();
      const w = prof?.weight_kg || prof?.starting_weight_kg || prof?.profile?.weight_kg;
      if (w && Number(w) > 30) {
        setUserWeightKg(Number(w));
      }
    } catch (e) {
      // Default to 70kg
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const list = await api.getActivities();
      setActivities(list || []);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Stopwatch timer & stationary speed decay
  useEffect(() => {
    if (status === "tracking") {
      timerRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);

        // If no genuine physical movement in the last 4 seconds, set speed to 0.0 km/h
        if (!isSimulating && Date.now() - lastMoveTimeRef.current > 4000) {
          setIsMoving(false);
          setCurrentSpeedKmh(0.0);
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status, isSimulating]);

  // Accelerometer / Device Motion Listener (for mobile devices)
  useEffect(() => {
    if (status !== "tracking") return;

    const handleMotion = (event) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (!acc) return;
      const mag = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
      const now = Date.now();

      // Step detection: typical acceleration spike > 12.0 m/s2 and > 330ms between steps
      if (mag > 12.2 && now - lastStepTimeRef.current > 330) {
        lastStepTimeRef.current = now;
        lastMoveTimeRef.current = now;
        setIsMoving(true);
        setSteps((prev) => {
          const nextSteps = prev + 1;
          const cfg = ACTIVITY_CONFIG[selectedActivity] || ACTIVITY_CONFIG.Walking;
          if (cfg.strideLengthM > 0) {
            setDistanceKm((currDist) => {
              const addedKm = cfg.strideLengthM / 1000;
              const newDist = parseFloat((currDist + addedKm).toFixed(3));
              const cal = Math.round(newDist * userWeightKg * cfg.calFactor);
              setCalories(cal);
              return newDist;
            });
            setCurrentSpeedKmh((prevSpd) => (prevSpd < 2.0 ? 4.2 : prevSpd));
          }
          return nextSteps;
        });
      }
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener("devicemotion", handleMotion, true);
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener("devicemotion", handleMotion, true);
      }
    };
  }, [status, selectedActivity, userWeightKg]);

  // Geolocation live watcher with strict stationary filter & speed limits
  useEffect(() => {
    if (status === "tracking") {
      if (!navigator.geolocation) {
        setGeoError("Geolocation is not supported by your browser or device.");
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          setGeoError("");
          const { latitude, longitude, speed, accuracy } = pos.coords;
          const now = pos.timestamp || Date.now();

          // Reject inaccurate GPS fixes (> 35m) to avoid erratic location jumps
          if (accuracy && accuracy > 35) {
            return;
          }

          if (lastPosRef.current) {
            const dtSec = (now - lastPosRef.current.time) / 1000;
            if (dtSec < 0.8) return; // Ignore rapid duplicate events

            const deltaKm = getHaversineDistanceKm(
              lastPosRef.current.lat,
              lastPosRef.current.lng,
              latitude,
              longitude
            );
            const deltaMeters = deltaKm * 1000;

            // Check hardware speed if available
            const hwSpeedKmh = (speed !== null && speed !== undefined && speed >= 0) ? speed * 3.6 : null;

            // STATIONARY DETECTION:
            // When user is standing still, GPS floats 2-6 meters due to satellite signal noise.
            // Ignore any jitter less than 7 meters or less than 60% of GPS accuracy radius.
            const minMoveMeters = Math.max(7.0, (accuracy || 10) * 0.6);

            if (deltaMeters < minMoveMeters) {
              // User is stationary / standing still!
              if (!hwSpeedKmh || hwSpeedKmh < 1.0) {
                setCurrentSpeedKmh(0.0);
                setIsMoving(false);
              }
              return;
            }

            // USER IS ACTUALLY MOVING
            const computedSpeedKmh = dtSec > 0 ? (deltaKm / (dtSec / 3600)) : 0;
            let effectiveSpeed = (hwSpeedKmh !== null && hwSpeedKmh > 0.5) ? hwSpeedKmh : computedSpeedKmh;

            const cfg = ACTIVITY_CONFIG[selectedActivity] || ACTIVITY_CONFIG.Walking;

            // Reject impossible spikes (e.g. 18.4 km/h jump while walking)
            if (effectiveSpeed > cfg.maxSpeedKmh * 1.35) {
              return;
            }

            if (effectiveSpeed < cfg.minMoveKmh) {
              // Below minimal speed for this activity
              setCurrentSpeedKmh(0.0);
              setIsMoving(false);
              return;
            }

            // Clamp to realistic physical maximum for this activity
            effectiveSpeed = Math.min(effectiveSpeed, cfg.maxSpeedKmh);

            // Update real speed & motion state
            setCurrentSpeedKmh(parseFloat(effectiveSpeed.toFixed(1)));
            setIsMoving(true);
            lastMoveTimeRef.current = Date.now();

            // Accumulate real distance
            setDistanceKm((prevDist) => {
              const newDist = parseFloat((prevDist + deltaKm).toFixed(2));
              // Accurate Calories = Real Distance (km) * User Weight (kg) * Calorie Factor
              // If stationary or 0 distance, calories remains 0!
              const cal = Math.round(newDist * userWeightKg * cfg.calFactor);
              setCalories(cal);
              return newDist;
            });

            setRoutePoints((prev) => [...prev, { lat: latitude, lng: longitude }]);
          }

          lastPosRef.current = { lat: latitude, lng: longitude, time: now };
        },
        (err) => {
          console.warn("GPS tracking warning:", err.message);
          setGeoError("GPS searching... Move outside for better satellite signal.");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
      );
    } else {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      lastPosRef.current = null;
      setIsMoving(false);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [status, selectedActivity, userWeightKg]);

  // Simulation handler for indoor/desktop testing
  const toggleSimulation = () => {
    if (status !== "tracking") {
      alert("Please start the activity first, then you can simulate movement.");
      return;
    }

    if (isSimulating) {
      clearInterval(simTimerRef.current);
      setIsSimulating(false);
      setIsMoving(false);
      setCurrentSpeedKmh(0.0);
    } else {
      setIsSimulating(true);
      setIsMoving(true);
      lastMoveTimeRef.current = Date.now();
      const cfg = ACTIVITY_CONFIG[selectedActivity] || ACTIVITY_CONFIG.Walking;
      const simSpeed = cfg === ACTIVITY_CONFIG.Walking ? 4.5 : (cfg === ACTIVITY_CONFIG.Running ? 9.5 : (cfg === ACTIVITY_CONFIG.Cycling ? 16.0 : 4.0));
      setCurrentSpeedKmh(simSpeed);

      simTimerRef.current = setInterval(() => {
        const deltaKm = (simSpeed / 3600);
        lastMoveTimeRef.current = Date.now();
        setSteps((s) => s + 2);
        setDistanceKm((prev) => {
          const nextDist = parseFloat((prev + deltaKm).toFixed(3));
          const cal = Math.round(nextDist * userWeightKg * cfg.calFactor);
          setCalories(cal);
          return nextDist;
        });
      }, 1000);
    }
  };

  useEffect(() => {
    if (status !== "tracking" && isSimulating) {
      clearInterval(simTimerRef.current);
      setIsSimulating(false);
    }
    return () => clearInterval(simTimerRef.current);
  }, [status, isSimulating]);

  const handleStart = () => {
    setStatus("tracking");
  };

  const handlePause = () => {
    setStatus("paused");
  };

  const handleResume = () => {
    setStatus("tracking");
  };

  const handleStopAndSave = async () => {
    if (seconds < 5 && distanceKm === 0) {
      if (window.confirm("Session is very short. Reset without saving?")) {
        resetLiveSession();
      }
      return;
    }

    setSaving(true);
    const avgSpeed = seconds > 0 ? parseFloat(((distanceKm / (seconds / 3600)) || 0).toFixed(1)) : 0.0;
    const payload = {
      activity_type: selectedActivity,
      distance_km: distanceKm,
      duration_sec: seconds,
      avg_speed_kmh: avgSpeed > 0 ? avgSpeed : currentSpeedKmh,
      calories: calories,
      route_data: routePoints
    };

    try {
      await api.saveActivity(payload);
      resetLiveSession();
      await fetchHistory();
    } catch (err) {
      alert("Failed to save activity: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetLiveSession = () => {
    setStatus("idle");
    setSeconds(0);
    setDistanceKm(0.0);
    setCurrentSpeedKmh(0.0);
    setCalories(0);
    setSteps(0);
    setIsMoving(false);
    setIsSimulating(false);
    if (simTimerRef.current) clearInterval(simTimerRef.current);
    setRoutePoints([]);
    lastPosRef.current = null;
  };

  const handleClearHistory = async () => {
    if (!activities.length) return;
    if (!window.confirm("Clear all your logged activities?")) return;
    try {
      for (const act of activities) {
        await api.deleteActivity(act.id);
      }
      setActivities([]);
    } catch (err) {
      console.error("Error clearing activities:", err);
    }
  };

  const formatTime = (totalSec) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Pace calculation: min/km
  const getPaceStr = () => {
    if (distanceKm > 0.05 && seconds > 10) {
      const paceDec = (seconds / 60) / distanceKm;
      const paceMin = Math.floor(paceDec);
      const paceSec = Math.round((paceDec - paceMin) * 60);
      return `${paceMin}'${paceSec.toString().padStart(2, "0")}"`;
    }
    return "--";
  };

  const currentIcon = activityOptions.find((a) => a.id === selectedActivity)?.icon || "🚶";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "28px",
        maxWidth: "1080px",
        margin: "0 auto",
        padding: "10px 0 60px 0",
        color: "#ffffff"
      }}
    >
      {/* Top Header */}
      <div>
        <p
          style={{
            fontSize: "0.8rem",
            fontWeight: "800",
            letterSpacing: "2.5px",
            color: "#8c9eff",
            textTransform: "uppercase",
            marginBottom: "8px"
          }}
        >
          MOVE • TRACK • LEVEL UP
        </p>
        <h1
          style={{
            fontSize: "clamp(2rem, 3.5vw, 2.7rem)",
            fontWeight: "900",
            letterSpacing: "-0.8px",
            lineHeight: "1.15",
            marginBottom: "8px",
            color: "#ffffff"
          }}
        >
          Activity Tracking
        </h1>
        <p style={{ fontSize: "1rem", color: "#94a3b8", fontWeight: "500" }}>
          Track walking, running, cycling and hiking with your phone GPS.
        </p>
      </div>

      {/* 4 Activity Selector Pills */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "14px"
        }}
      >
        {activityOptions.map((opt) => {
          const isSelected = selectedActivity === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => {
                if (status === "idle") setSelectedActivity(opt.id);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "16px 20px",
                backgroundColor: isSelected ? "#181d33" : "#131625",
                border: isSelected ? "1.5px solid #5865f2" : "1px solid rgba(255, 255, 255, 0.07)",
                borderRadius: "16px",
                cursor: status === "idle" ? "pointer" : "default",
                transition: "all 0.2s ease",
                textAlign: "left",
                boxShadow: isSelected ? "0 4px 20px rgba(88, 101, 242, 0.25)" : "none"
              }}
            >
              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  backgroundColor: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.3rem",
                  flexShrink: 0
                }}
              >
                {opt.icon}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "1.05rem", fontWeight: "800", color: "#ffffff" }}>
                  {opt.label}
                </span>
                <span style={{ fontSize: "0.74rem", color: "#8c96ab", fontWeight: "600" }}>
                  GPS tracking
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Session Container */}
      <div
        style={{
          backgroundColor: "#141829",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "26px",
          display: "flex",
          flexDirection: "column",
          gap: "22px"
        }}
      >
        {/* Live Session Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px"
          }}
        >
          <div>
            <p
              style={{
                fontSize: "0.74rem",
                fontWeight: "800",
                letterSpacing: "2px",
                color: "#8c9eff",
                textTransform: "uppercase",
                marginBottom: "4px"
              }}
            >
              LIVE SESSION
            </p>
            <h2
              style={{
                fontSize: "1.6rem",
                fontWeight: "900",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span>{currentIcon}</span> {selectedActivity}
            </h2>

            {status === "idle" && (
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "4px" }}>
                Ready to start. GPS & step sensors ready.
              </p>
            )}

            {status === "paused" && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 12px",
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  border: "1px solid rgba(245, 158, 11, 0.35)",
                  borderRadius: "20px",
                  color: "#fbbf24",
                  fontSize: "0.78rem",
                  fontWeight: "800",
                  marginTop: "6px"
                }}
              >
                <span>⏸</span> Session Paused
              </div>
            )}

            {status === "tracking" && (
              <div style={{ marginTop: "6px" }}>
                {isMoving ? (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      padding: "5px 12px",
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      border: "1px solid rgba(16, 185, 129, 0.45)",
                      borderRadius: "20px",
                      color: "#34d399",
                      fontSize: "0.8rem",
                      fontWeight: "800"
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#10b981",
                        boxShadow: "0 0 8px #10b981"
                      }}
                    />
                    MOVING ({currentSpeedKmh.toFixed(1)} km/h) • Burning Active Calories
                  </div>
                ) : (
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      padding: "5px 12px",
                      backgroundColor: "rgba(245, 158, 11, 0.12)",
                      border: "1px solid rgba(245, 158, 11, 0.35)",
                      borderRadius: "20px",
                      color: "#fbbf24",
                      fontSize: "0.8rem",
                      fontWeight: "800"
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        backgroundColor: "#f59e0b"
                      }}
                    />
                    STATIONARY / STANDING • Speed: 0.0 km/h (Calories Paused)
                  </div>
                )}
              </div>
            )}

            {geoError && (
              <p style={{ fontSize: "0.78rem", color: "#f87171", marginTop: "4px" }}>
                {geoError}
              </p>
            )}
          </div>

          {/* Action Buttons: Start / Pause / Stop & Save / Simulate Walk */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {status === "tracking" && (
              <button
                onClick={toggleSimulation}
                style={{
                  backgroundColor: isSimulating ? "#dc2626" : "#202742",
                  color: "#ffffff",
                  border: isSimulating ? "1px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.14)",
                  borderRadius: "12px",
                  padding: "12px 18px",
                  fontSize: "0.88rem",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.18s ease"
                }}
                title="Simulate walking movement for testing indoors/desktop"
              >
                {isSimulating ? "⏹ Stop Test Walk" : "🚶 Simulate Walk (Test)"}
              </button>
            )}

            {status === "idle" ? (
              <button
                onClick={handleStart}
                style={{
                  backgroundColor: "#5865f2",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 28px",
                  fontSize: "1rem",
                  fontWeight: "800",
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(88, 101, 242, 0.35)",
                  transition: "all 0.18s ease"
                }}
              >
                Start
              </button>
            ) : status === "tracking" ? (
              <button
                onClick={handlePause}
                style={{
                  backgroundColor: "#f59e0b",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 24px",
                  fontSize: "0.95rem",
                  fontWeight: "800",
                  cursor: "pointer"
                }}
              >
                Pause
              </button>
            ) : (
              <button
                onClick={handleResume}
                style={{
                  backgroundColor: "#10b981",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "12px 24px",
                  fontSize: "0.95rem",
                  fontWeight: "800",
                  cursor: "pointer"
                }}
              >
                Resume
              </button>
            )}

            <button
              onClick={handleStopAndSave}
              disabled={status === "idle" && distanceKm === 0 && seconds === 0}
              style={{
                backgroundColor: "#1c2238",
                color: "#e2e8f0",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "12px",
                padding: "12px 24px",
                fontSize: "0.95rem",
                fontWeight: "700",
                cursor: (status !== "idle" || seconds > 0) ? "pointer" : "not-allowed",
                opacity: (status !== "idle" || seconds > 0) ? 1 : 0.6
              }}
            >
              {saving ? "Saving..." : "Stop & Save"}
            </button>
          </div>
        </div>

        {/* Center GPS Route Preview Curve Container */}
        <div
          style={{
            backgroundColor: "#1b2138",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            height: "240px",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          {/* Aesthetic GPS Wave Curve */}
          <svg
            viewBox="0 0 600 240"
            style={{ width: "100%", height: "100%", filter: "drop-shadow(0 0 10px rgba(88, 101, 242, 0.15))" }}
          >
            <path
              d="M 60 160 C 180 80, 240 210, 360 140 C 420 100, 480 90, 540 100"
              fill="none"
              stroke="#2c3559"
              strokeWidth="28"
              strokeLinecap="round"
            />
            {status === "tracking" && (
              <path
                d="M 60 160 C 180 80, 240 210, 360 140 C 420 100, 480 90, 540 100"
                fill="none"
                stroke="#5865f2"
                strokeWidth="4"
                strokeDasharray="8 8"
                strokeLinecap="round"
              />
            )}
          </svg>

          {/* Bottom Left Label */}
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              left: "20px",
              fontSize: "0.78rem",
              color: "#64748b",
              fontWeight: "600"
            }}
          >
            GPS route preview
          </div>
        </div>

        {/* Bottom Row of 5 HUD Metric Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: "12px"
          }}
        >
          {/* Time */}
          <div
            style={{
              backgroundColor: "#171c30",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              padding: "16px 20px"
            }}
          >
            <span style={{ fontSize: "0.78rem", color: "#8c96ab", fontWeight: "600" }}>
              Time
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#ffffff", marginTop: "4px" }}>
              {formatTime(seconds)}
            </div>
          </div>

          {/* Distance */}
          <div
            style={{
              backgroundColor: "#171c30",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              padding: "16px 20px"
            }}
          >
            <span style={{ fontSize: "0.78rem", color: "#8c96ab", fontWeight: "600" }}>
              Distance
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#ffffff", marginTop: "4px" }}>
              {distanceKm.toFixed(2)} km
            </div>
          </div>

          {/* Speed */}
          <div
            style={{
              backgroundColor: "#171c30",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              padding: "16px 20px"
            }}
          >
            <span style={{ fontSize: "0.78rem", color: "#8c96ab", fontWeight: "600" }}>
              Speed
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#ffffff", marginTop: "4px" }}>
              {currentSpeedKmh.toFixed(1)} km/h
            </div>
          </div>

          {/* Pace */}
          <div
            style={{
              backgroundColor: "#171c30",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              padding: "16px 20px"
            }}
          >
            <span style={{ fontSize: "0.78rem", color: "#8c96ab", fontWeight: "600" }}>
              Pace
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#ffffff", marginTop: "4px" }}>
              {getPaceStr()}
            </div>
          </div>

          {/* Calories */}
          <div
            style={{
              backgroundColor: "#171c30",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              padding: "16px 20px"
            }}
          >
            <span style={{ fontSize: "0.78rem", color: "#8c96ab", fontWeight: "600" }}>
              Calories
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#ffffff", marginTop: "4px" }}>
              {calories} kcal
            </div>
          </div>

          {/* Steps */}
          <div
            style={{
              backgroundColor: "#171c30",
              borderRadius: "14px",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              padding: "16px 20px"
            }}
          >
            <span style={{ fontSize: "0.78rem", color: "#8c96ab", fontWeight: "600" }}>
              Steps
            </span>
            <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#ffffff", marginTop: "4px" }}>
              {steps}
            </div>
          </div>
        </div>

        {/* Real movement assurance banner */}
        <div
          style={{
            backgroundColor: "#111524",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            fontSize: "0.82rem",
            color: "#94a3b8"
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>💡</span>
            <span>
              <strong>Active Burn Mode:</strong> Speed and calories only calculate when you physically move. Standing still will keep speed at 0.0 km/h and calories paused.
            </span>
          </span>
          <span style={{ color: "#8c9eff", fontWeight: "700" }}>
            Weight: {userWeightKg} kg • Formula: ACSM Standard
          </span>
        </div>
      </div>

      {/* Recent Activities Section */}
      <div
        style={{
          backgroundColor: "#141829",
          borderRadius: "20px",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "26px",
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontSize: "1.35rem", fontWeight: "900", color: "#ffffff" }}>
              Recent activities
            </h3>
            <p style={{ fontSize: "0.88rem", color: "#94a3b8", marginTop: "2px" }}>
              Your last tracked sessions on this device.
            </p>
          </div>
          {activities.length > 0 && (
            <button
              onClick={handleClearHistory}
              style={{
                background: "none",
                border: "none",
                color: "#94a3b8",
                fontSize: "0.9rem",
                fontWeight: "700",
                cursor: "pointer",
                padding: "6px 12px"
              }}
            >
              Clear
            </button>
          )}
        </div>

        {loadingHistory ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#8c9eff" }}>
            <Loader2 size={30} className="spin" />
          </div>
        ) : activities.length === 0 ? (
          <div
            style={{
              padding: "48px 20px",
              textAlign: "center",
              color: "#64748b",
              fontSize: "0.9rem"
            }}
          >
            No activities yet. Start a walk or ride to begin tracking.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {activities.map((act) => (
              <div
                key={act.id}
                style={{
                  backgroundColor: "#181d33",
                  borderRadius: "14px",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "38px",
                      height: "38px",
                      backgroundColor: "#ffffff",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.2rem"
                    }}
                  >
                    {act.activity_type?.toLowerCase().includes("run") ? "🏃" :
                     act.activity_type?.toLowerCase().includes("cycl") ? "🚴" :
                     act.activity_type?.toLowerCase().includes("hik") ? "🥾" : "🚶"}
                  </div>
                  <div>
                    <h4 style={{ fontSize: "1rem", fontWeight: "800", color: "#ffffff" }}>
                      {act.activity_type || "Walking"}
                    </h4>
                    <span style={{ fontSize: "0.78rem", color: "#8c96ab" }}>
                      {act.created_at ? new Date(act.created_at).toLocaleDateString() : "Today"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#8c96ab" }}>Distance</span>
                    <p style={{ fontSize: "1.05rem", fontWeight: "800", color: "#ffffff" }}>
                      {(act.distance_km || 0).toFixed(2)} km
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#8c96ab" }}>Duration</span>
                    <p style={{ fontSize: "1.05rem", fontWeight: "800", color: "#ffffff" }}>
                      {formatTime(act.duration_sec || 0)}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.72rem", color: "#8c96ab" }}>Calories</span>
                    <p style={{ fontSize: "1.05rem", fontWeight: "800", color: "#ffffff" }}>
                      {act.calories || 0} kcal
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
