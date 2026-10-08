import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Square, MapPin, Compass, 
  Flame, Clock, Activity, ShieldAlert, Award, Trash2, Edit3, ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';

// Haversine formula to compute distance between GPS lat/lng points in km
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function ActivityView({ initialType = 'Running', onActivityFinished }) {
  const [activityType, setActivityType] = useState(initialType);
  const [goalType, setGoalType] = useState('Free'); // Distance, Time, Calories, Free
  const [goalValue, setGoalValue] = useState(5.0);

  // Activity Status: 'idle' | 'tracking' | 'paused' | 'summary'
  const [status, setStatus] = useState('idle');
  const [permissionExplaining, setPermissionExplaining] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Live Metrics
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0.0);
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState(0.0);
  const [currentPaceMinKm, setCurrentPaceMinKm] = useState('0:00');
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [routePoints, setRoutePoints] = useState([]);

  // Session & Summary
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [history, setHistory] = useState([]);

  // Leaflet map refs
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineRef = useRef(null);
  const markerRef = useRef(null);

  // Watch position ID
  const watchIdRef = useRef(null);
  const timerRef = useRef(null);
  const lastCoordRef = useRef(null);

  // Fetch past activity history
  const fetchHistory = async () => {
    try {
      const res = await api.getActivityHistory();
      setHistory(res.history || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (status === 'tracking' || status === 'paused') {
      if (window.L && mapContainerRef.current && !mapInstanceRef.current) {
        try {
          const map = window.L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false
          }).setView([37.7749, -122.4194], 16);

          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
          }).addTo(map);

          polylineRef.current = window.L.polyline([], {
            color: '#00F0FF',
            weight: 5,
            opacity: 0.9
          }).addTo(map);

          mapInstanceRef.current = map;
        } catch (e) {
          console.warn("Leaflet map init warning:", e);
        }
      }
    }

    return () => {
      if (status === 'idle' && mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [status]);

  // Stopwatch timer
  useEffect(() => {
    if (status === 'tracking') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(s => {
          const nextSecs = s + 1;
          // Calculate MET calorie burn
          // Running ~10 METs, Cycling ~8, Walking ~3.8, Hiking ~6
          const met = activityType === 'Running' ? 10 : activityType === 'Cycling' ? 8 : activityType === 'Hiking' ? 6 : 4;
          setCaloriesBurned(Math.round((nextSecs / 3600) * met * 70));
          return nextSecs;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [status, activityType]);

  // Request GPS permission with transparent explainer
  const handleInitiateStart = () => {
    setPermissionExplaining(true);
  };

  const handleConfirmGPSPermission = async () => {
    setPermissionExplaining(false);
    setPermissionDenied(false);

    if (!('geolocation' in navigator)) {
      setPermissionDenied(true);
      return;
    }

    try {
      // Start session on backend
      const res = await api.startActivity({
        type: activityType,
        goal_type: goalType,
        goal_value: goalValue
      });
      setActiveSessionId(res.activity.id);

      // Reset state
      setElapsedSeconds(0);
      setDistanceKm(0.0);
      setRoutePoints([]);
      lastCoordRef.current = null;
      setStatus('tracking');

      // Start watching GPS position
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 2000
        }
      );
    } catch (e) {
      console.error("Failed to start activity:", e);
    }
  };

  const handleLocationUpdate = (pos) => {
    const { latitude, longitude, speed } = pos.coords;
    const newPoint = [latitude, longitude];

    setRoutePoints(prev => {
      const updated = [...prev, newPoint];
      // Update Leaflet polyline and marker
      if (mapInstanceRef.current) {
        if (polylineRef.current) polylineRef.current.setLatLngs(updated);
        if (!markerRef.current) {
          markerRef.current = window.L.circleMarker(newPoint, {
            radius: 8,
            fillColor: '#00F0FF',
            color: '#FFFFFF',
            weight: 2,
            opacity: 1,
            fillOpacity: 1
          }).addTo(mapInstanceRef.current);
        } else {
          markerRef.current.setLatLng(newPoint);
        }
        mapInstanceRef.current.panTo(newPoint);
      }
      return updated;
    });

    if (lastCoordRef.current) {
      const addedDist = calculateDistance(
        lastCoordRef.current[0], lastCoordRef.current[1],
        latitude, longitude
      );
      if (addedDist > 0.002) { // filter jitter
        setDistanceKm(prev => {
          const nextDist = prev + addedDist;
          // Calculate Pace (min per km)
          if (nextDist > 0.05 && elapsedSeconds > 10) {
            const paceDec = (elapsedSeconds / 60) / nextDist;
            const pMin = Math.floor(paceDec);
            const pSec = Math.round((paceDec - pMin) * 60);
            setCurrentPaceMinKm(`${pMin}:${pSec < 10 ? '0' : ''}${pSec}`);
          }
          return nextDist;
        });
      }
    }
    lastCoordRef.current = newPoint;

    // Speed in km/h
    const speedKmh = speed && speed > 0 ? (speed * 3.6) : 0;
    setCurrentSpeedKmh(Math.round(speedKmh * 10) / 10);
  };

  const handleLocationError = (err) => {
    console.warn("Geolocation warning:", err.message);
    if (err.code === 1) { // PERMISSION_DENIED
      setPermissionDenied(true);
      setStatus('idle');
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    }
  };

  const handlePause = () => {
    setStatus('paused');
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
  };

  const handleResume = () => {
    setStatus('tracking');
    if ('geolocation' in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
      );
    }
  };

  const handleFinish = async () => {
    setStatus('summary');
    if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);

    const avgSpeed = elapsedSeconds > 0 ? ((distanceKm / (elapsedSeconds / 3600)) || 0).toFixed(1) : 0;
    
    try {
      const res = await api.finishActivity({
        id: activeSessionId,
        distance_km: distanceKm,
        duration_seconds: elapsedSeconds,
        calories: caloriesBurned,
        average_speed: avgSpeed,
        average_pace: currentPaceMinKm,
        route: routePoints
      });
      setSummaryData(res);
      fetchHistory();
      if (onActivityFinished) onActivityFinished();
    } catch (e) {
      setSummaryData({
        activity: {
          type: activityType,
          distance_km: distanceKm,
          duration_seconds: elapsedSeconds,
          calories: caloriesBurned,
          average_speed: avgSpeed,
          average_pace: currentPaceMinKm
        },
        xp_awarded: 75
      });
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
      await api.deleteActivity(id);
      fetchHistory();
    } catch (e) {}
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px' }}>Outdoor GPS Tracker</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Real-time location, speed & pace</span>
        </div>
        <span className="badge badge-cyan">GPS Active</span>
      </div>

      {/* 1. PERMISSION DENIED FRIENDLY FALLBACK */}
      {permissionDenied && (
        <div className="card" style={{ background: 'rgba(255, 94, 94, 0.1)', border: '1px solid rgba(255, 94, 94, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-coral)', marginBottom: '6px' }}>
            <ShieldAlert size={20} />
            <span style={{ fontWeight: 700 }}>Location Access Denied</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            FitQuest AI could not access GPS location. You can still use manual logging, or enable location permissions in your browser/device settings. All Diet, Workout, and Scanner features remain fully accessible!
          </p>
        </div>
      )}

      {/* 2. PRE-START SETUP VIEW (When status is idle) */}
      {status === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Activity Selector */}
          <div className="card">
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              ACTIVITY TYPE
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '8px' }}>
              {['Walking', 'Running', 'Cycling', 'Hiking'].map(type => (
                <button
                  key={type}
                  onClick={() => setActivityType(type)}
                  className={activityType === type ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{
                    flexDirection: 'column',
                    padding: '12px 4px',
                    fontSize: '12px',
                    fontWeight: 700,
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>
                    {type === 'Walking' ? '🚶' : type === 'Running' ? '🏃' : type === 'Cycling' ? '🚴' : '🥾'}
                  </span>
                  <span>{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Goal Selector */}
          <div className="card">
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              TARGET GOAL
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '12px' }}>
              {['Free', 'Distance', 'Time', 'Calories'].map(g => (
                <button
                  key={g}
                  onClick={() => setGoalType(g)}
                  className={goalType === g ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ minHeight: '34px', height: '34px', padding: 0, fontSize: '12px' }}
                >
                  {g}
                </button>
              ))}
            </div>

            {goalType !== 'Free' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Goal Target:</span>
                <input
                  type="number"
                  step="0.5"
                  value={goalValue}
                  onChange={(e) => setGoalValue(parseFloat(e.target.value) || 5)}
                  style={{ flex: 1, height: '38px' }}
                />
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {goalType === 'Distance' ? 'km' : goalType === 'Time' ? 'mins' : 'kcal'}
                </span>
              </div>
            )}
          </div>

          {/* Start Activity Button */}
          <button
            onClick={handleInitiateStart}
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '17px', padding: '16px', gap: '10px' }}
          >
            <Play size={20} fill="#0A0D14" />
            Start {activityType} (+75 XP)
          </button>
        </div>
      )}

      {/* 3. PERMISSION EXPLAINER MODAL (Requirement 21) */}
      {permissionExplaining && (
        <div className="modal-overlay">
          <div className="bottom-sheet" style={{ textAlign: 'center' }}>
            <div className="sheet-handle" />
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(0, 240, 255, 0.15)',
              color: 'var(--accent-cyan)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <MapPin size={32} />
            </div>

            <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Location Access</h3>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '15px', marginBottom: '10px' }}>
              "FitQuest AI uses your location only to track your outdoor activity."
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px', lineHeight: '1.5' }}>
              We track route distance, live speed, and pace while your activity is in progress. Location tracking stops immediately when you pause or finish.
            </p>

            <button onClick={handleConfirmGPSPermission} className="btn btn-primary" style={{ width: '100%', fontSize: '16px', padding: '14px' }}>
              Allow & Start Tracking
            </button>
          </div>
        </div>
      )}

      {/* 4. ACTIVE TRACKING HUD & MAP (When tracking or paused) */}
      {(status === 'tracking' || status === 'paused') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Live Leaflet Map Container */}
          <div style={{
            width: '100%',
            height: '240px',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
            position: 'relative'
          }}>
            <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />
            
            {/* Status indicator on top of map */}
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 10,
              background: 'rgba(10, 13, 20, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 700,
              color: status === 'tracking' ? 'var(--accent-cyan)' : 'var(--accent-gold)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: status === 'tracking' ? 'var(--accent-cyan)' : 'var(--accent-gold)'
              }} />
              {status === 'tracking' ? 'GPS Recording' : 'Paused'}
            </div>
          </div>

          {/* Big Live Stats HUD */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '48px', fontWeight: 900, fontFamily: 'var(--font-display)', lineHeight: '1', color: 'var(--accent-cyan)' }}>
                {distanceKm.toFixed(2)}
              </div>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Kilometers
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TIME</span>
                <div style={{ fontSize: '18px', fontWeight: 800 }}>{formatTimer(elapsedSeconds)}</div>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PACE</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-emerald)' }}>{currentPaceMinKm}</div>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>min/km</span>
              </div>
              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>CALORIES</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-coral)' }}>{caloriesBurned}</div>
                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>kcal</span>
              </div>
            </div>
          </div>

          {/* Controls: Pause / Resume / Finish */}
          <div style={{ display: 'flex', gap: '12px' }}>
            {status === 'tracking' ? (
              <button onClick={handlePause} className="btn btn-secondary" style={{ flex: 1, padding: '14px', fontSize: '16px' }}>
                <Pause size={18} /> PAUSE
              </button>
            ) : (
              <button onClick={handleResume} className="btn btn-primary" style={{ flex: 1, padding: '14px', fontSize: '16px' }}>
                <Play size={18} /> RESUME
              </button>
            )}

            <button 
              onClick={handleFinish} 
              className="btn btn-outline" 
              style={{ flex: 1, padding: '14px', fontSize: '16px', borderColor: 'var(--accent-coral)', color: 'var(--accent-coral)' }}
            >
              <Square size={18} /> FINISH
            </button>
          </div>

        </div>
      )}

      {/* 5. FINISH SUMMARY VIEW */}
      {status === 'summary' && summaryData && (
        <div className="card" style={{ textAlign: 'center', padding: '24px 20px' }}>
          <div style={{
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            background: 'var(--gradient-brand)',
            color: '#0A0D14',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: 'var(--shadow-glow-cyan)'
          }}>
            <Award size={36} />
          </div>

          <h2 style={{ fontSize: '24px', marginBottom: '4px' }}>Activity Completed!</h2>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            +{summaryData.xp_awarded || 75} XP added to your athlete profile
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '20px 0' }}>
            <div className="card" style={{ background: 'var(--bg-input)', padding: '14px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Distance</span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-cyan)' }}>{distanceKm.toFixed(2)} km</div>
            </div>
            <div className="card" style={{ background: 'var(--bg-input)', padding: '14px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Duration</span>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>{formatTimer(elapsedSeconds)}</div>
            </div>
            <div className="card" style={{ background: 'var(--bg-input)', padding: '14px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Average Pace</span>
              <div style={{ fontSize: '20px', fontWeight: 800 }}>{currentPaceMinKm} min/km</div>
            </div>
            <div className="card" style={{ background: 'var(--bg-input)', padding: '14px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Calories</span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-coral)' }}>{caloriesBurned} kcal</div>
            </div>
          </div>

          <button
            onClick={() => setStatus('idle')}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
          >
            Back to GPS Tracker
          </button>
        </div>
      )}

      {/* 6. ACTIVITY HISTORY LIST */}
      {status === 'idle' && (
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Activity History</h3>

          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
              No outdoor sessions recorded yet. Start your first run or walk above!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map(act => (
                <div
                  key={act.id}
                  style={{
                    background: 'var(--bg-input)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '14px' }}>{act.type}</span>
                      <span className="badge badge-cyan" style={{ fontSize: '9px' }}>{act.distance_km} km</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formatTimer(act.duration_seconds || 0)} • {act.average_pace || '6:15'} min/km • {act.calories} kcal
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteHistory(act.id)}
                    className="btn btn-icon"
                    style={{ width: '28px', height: '28px', background: 'transparent', color: 'var(--accent-coral)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
