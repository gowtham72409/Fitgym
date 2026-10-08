import React, { useState, useRef, useEffect } from "react";
import { Camera, Upload, Scale, Sparkles, CheckCircle2, AlertCircle, Loader2, RefreshCw, X, FlipHorizontal, Smartphone, Image as ImageIcon } from "lucide-react";
import { api } from "../api";

export function FoodScanner() {
  const [imagePreview, setImagePreview] = useState(null);
  const [quantityKg, setQuantityKg] = useState(0.50);
  const [foodHint, setFoodHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState("");

  // Live Webcam State (Optional for desktop)
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState("environment");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const nativeCameraInputRef = useRef(null);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to fast, lightweight JPEG (typically ~60-80KB)
          resolve(canvas.toDataURL("image/jpeg", 0.72));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompressing(true);
      setError("");
      try {
        const compressed = await compressImage(file);
        setImagePreview(compressed);
      } catch (err) {
        console.error("Image processing error:", err);
        setError("Failed to process photo. Please choose another image.");
      } finally {
        setCompressing(false);
        // Reset input value so same photo can be re-selected if needed
        e.target.value = "";
      }
    }
  };

  const [cameraLoading, setCameraLoading] = useState(false);

  const startCamera = () => {
    setError("");
    setImagePreview(null);
    setIsCameraActive(true);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCameraLoading(false);
  };

  // Manage camera stream lifecycle whenever isCameraActive or facingMode changes
  useEffect(() => {
    let active = true;

    if (!isCameraActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    const initStream = async () => {
      setCameraLoading(true);
      setError("");
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error("WebRTC camera not supported in this browser.");
        }

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((e) => console.log("Video play err:", e));
          };
        }
      } catch (err) {
        console.warn("Live camera access failed, falling back to device camera:", err);
        if (active) {
          setIsCameraActive(false);
          // If live webcam fails or permission denied, fall back to native device camera file capture
          if (nativeCameraInputRef.current) {
            nativeCameraInputRef.current.click();
          } else {
            setError("Camera permission denied or camera unavailable. Please upload a photo.");
          }
        }
      } finally {
        if (active) {
          setCameraLoading(false);
        }
      }
    };

    initStream();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isCameraActive, facingMode]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (facingMode === "user") {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
      setImagePreview(dataUrl);
      stopCamera();
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (quantityKg <= 0) {
      setError("Please specify meal weight in kg greater than 0.");
      return;
    }
    setError("");
    setLoading(true);
    setScanResult(null);

    try {
      const payload = {
        quantity_kg: parseFloat(quantityKg),
        image_base64: imagePreview,
        food_hint: foodHint
      };
      const result = await api.scanFood(payload);
      setScanResult(result);
    } catch (err) {
      setError(err.message || "Food scanning failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickMealHints = [
    "Chicken Rice",
    "Egg Dosa / Idli",
    "Paneer & Roti",
    "Dal Tadka & Rice",
    "Oats Bowl",
    "Protein Salad"
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>
      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Hidden Inputs for Mobile Camera and Gallery */}
      <input
        type="file"
        ref={nativeCameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleImageChange}
        style={{ display: "none" }}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: "none" }}
      />

      {/* Header */}
      <div>
        <h2 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
          <Camera color="var(--brand-cyan)" /> AI Food Scanner
        </h2>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "4px" }}>
          Snap a meal photo or select an image, set portion weight, and get instant AI macro estimations.
        </p>
      </div>

      {error && (
        <div style={{ background: "rgba(244, 63, 94, 0.15)", border: "1px solid rgba(244, 63, 94, 0.4)", color: "var(--brand-rose)", padding: "12px", borderRadius: "var(--radius-md)" }}>
          {error}
        </div>
      )}

      {/* INPUT FORM CARD */}
      <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* IMAGE / CAMERA CAPTURE BOX */}
        <div>
          <label style={{ fontSize: "0.88rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "12px", display: "block" }}>
            1. Meal Photo
          </label>

          {compressing ? (
            <div style={{ padding: "36px", textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-lg)", border: "1px dashed var(--border-color)" }}>
              <Loader2 size={32} className="spin" color="var(--brand-cyan)" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Optimizing & compressing photo for instant upload...</p>
            </div>
          ) : isCameraActive ? (
            /* LIVE CAMERA VIEWPORT */
            <div style={{
              position: "relative",
              borderRadius: "var(--radius-lg)",
              overflow: "hidden",
              background: "#000000",
              border: "2px solid var(--brand-cyan)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              minHeight: "280px"
            }}>
              {cameraLoading && (
                <div style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(10, 13, 22, 0.85)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 20,
                  gap: "12px"
                }}>
                  <Loader2 size={36} className="spin" color="var(--brand-cyan)" />
                  <span style={{ fontSize: "0.88rem", color: "#ffffff", fontWeight: "700" }}>
                    Starting Live Camera...
                  </span>
                </div>
              )}

              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  maxHeight: "360px",
                  objectFit: "cover",
                  transform: facingMode === "user" ? "scaleX(-1)" : "none"
                }}
              />

              {/* Viewport Reticle */}
              <div style={{
                position: "absolute",
                top: "45%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "220px",
                height: "220px",
                border: "2px dashed rgba(6, 182, 212, 0.75)",
                borderRadius: "16px",
                pointerEvents: "none",
                boxShadow: "0 0 20px rgba(6, 182, 212, 0.25)"
              }} />

              {/* Hint badge */}
              <div style={{
                position: "absolute",
                top: "12px",
                background: "rgba(0,0,0,0.65)",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "0.75rem",
                color: "#e2e8f0",
                fontWeight: "600",
                border: "1px solid rgba(255,255,255,0.15)",
                pointerEvents: "none"
              }}>
                📸 Center food in frame & tap capture
              </div>

              {/* Camera Action Toolbar */}
              <div style={{
                position: "absolute",
                bottom: "16px",
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "24px",
                zIndex: 15
              }}>
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.65)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "transform 0.15s"
                  }}
                  title="Switch Camera (Front/Back)"
                >
                  <FlipHorizontal size={20} />
                </button>

                <button
                  type="button"
                  onClick={capturePhoto}
                  style={{
                    width: "66px",
                    height: "66px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #ff334b, #ff6b6b)",
                    border: "3px solid #ffffff",
                    boxShadow: "0 0 24px rgba(255, 51, 75, 0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    cursor: "pointer",
                    transition: "transform 0.1s"
                  }}
                  title="Capture Photo"
                >
                  <Camera size={28} />
                </button>

                <button
                  type="button"
                  onClick={stopCamera}
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "rgba(244, 63, 94, 0.65)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "transform 0.15s"
                  }}
                  title="Close Camera"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ) : imagePreview ? (
            /* PHOTO PREVIEW BOX */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", border: "1px solid var(--border-color)", padding: "16px", borderRadius: "var(--radius-lg)", background: "rgba(255,255,255,0.02)" }}>
              <img
                src={imagePreview}
                alt="Scanned Food"
                style={{ maxHeight: "240px", borderRadius: "var(--radius-md)", objectFit: "cover", width: "100%", maxWidth: "340px" }}
              />
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={() => setImagePreview(null)}
                  style={{ background: "rgba(244, 63, 94, 0.2)", border: "none", color: "var(--brand-rose)", padding: "8px 16px", borderRadius: "var(--radius-md)", fontSize: "0.82rem", fontWeight: "700", cursor: "pointer" }}
                >
                  Remove Photo
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  style={{ background: "rgba(6, 182, 212, 0.2)", border: "none", color: "var(--brand-cyan)", padding: "8px 16px", borderRadius: "var(--radius-md)", fontSize: "0.82rem", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Camera size={16} /> Retake with Camera
                </button>
              </div>
            </div>
          ) : (
            /* PRIMARY MOBILE & DESKTOP SELECTION BUTTONS */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
              {/* Option 1: Open Live Camera directly */}
              <button
                type="button"
                onClick={startCamera}
                style={{
                  border: "2px dashed rgba(255, 51, 75, 0.5)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px 14px",
                  textAlign: "center",
                  background: "rgba(255, 51, 75, 0.08)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--gradient-red)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ffffff", boxShadow: "0 0 16px rgba(255, 51, 75, 0.4)" }}>
                  <Camera size={24} />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: "800", color: "#ffffff", margin: 0 }}>Take Photo</h4>
                  <p style={{ fontSize: "0.75rem", color: "#f87171", marginTop: "3px", margin: 0, fontWeight: "600" }}>
                    Opens Live Camera
                  </p>
                </div>
              </button>

              {/* Option 2: Gallery / Files */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "2px dashed var(--border-color)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px 14px",
                  textAlign: "center",
                  background: "rgba(255, 255, 255, 0.02)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.08)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-secondary)" }}>
                  <Upload size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: "800", color: "#ffffff", margin: 0 }}>Upload Image</h4>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "3px", margin: 0 }}>
                    Gallery or Files
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* MEAL WEIGHT IN KG */}
        <div>
          <label style={{ fontSize: "0.88rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
            <Scale size={18} color="var(--brand-green)" /> 2. Meal Portion Weight
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "10px" }}>
            {[0.25, 0.50, 0.75, 1.00].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setQuantityKg(preset)}
                style={{
                  padding: "10px 4px",
                  borderRadius: "var(--radius-md)",
                  border: quantityKg === preset ? "2px solid var(--brand-green)" : "1px solid var(--border-color)",
                  background: quantityKg === preset ? "rgba(16, 185, 129, 0.15)" : "var(--bg-primary)",
                  color: quantityKg === preset ? "var(--brand-green)" : "var(--text-secondary)",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
              >
                {preset} kg
              </button>
            ))}
          </div>
          <input
            type="number"
            step="0.05"
            min="0.05"
            max="5.0"
            value={quantityKg}
            onChange={(e) => setQuantityKg(parseFloat(e.target.value) || 0)}
            placeholder="Custom weight in kg"
          />
        </div>

        {/* MEAL DESCRIPTION HINT WITH QUICK PILLS */}
        <div>
          <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>
            3. Meal Name / Hint (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Chicken Rice with Curry, Paneer Dosa, Egg Salad"
            value={foodHint}
            onChange={(e) => setFoodHint(e.target.value)}
          />
          {/* Quick pills */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
            {quickMealHints.map((pill) => (
              <button
                key={pill}
                type="button"
                onClick={() => setFoodHint(pill)}
                style={{
                  background: foodHint === pill ? "rgba(6, 182, 212, 0.2)" : "rgba(255,255,255,0.04)",
                  border: foodHint === pill ? "1px solid var(--brand-cyan)" : "1px solid rgba(255,255,255,0.08)",
                  color: foodHint === pill ? "var(--brand-cyan)" : "var(--text-muted)",
                  padding: "4px 10px",
                  borderRadius: "20px",
                  fontSize: "0.74rem",
                  cursor: "pointer"
                }}
              >
                + {pill}
              </button>
            ))}
          </div>
        </div>

        {/* SCAN BUTTON */}
        <button
          type="button"
          onClick={handleScan}
          disabled={loading || compressing}
          className="gradient-btn"
          style={{ width: "100%", padding: "14px", fontSize: "1rem", marginTop: "4px" }}
        >
          {loading ? (
            <>
              <Loader2 size={18} className="spin" />
              <span>Analyzing Meal with AI...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>Analyze Food & Log Nutrition</span>
            </>
          )}
        </button>
      </div>

      {/* SCAN RESULTS DISPLAY */}
      {scanResult && (
        <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(19, 25, 39, 0.9) 100%)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <span className="badge badge-green" style={{ marginBottom: "6px" }}>
                <CheckCircle2 size={14} /> Scan Saved (+30 XP)
              </span>
              <h3 style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--text-primary)", margin: "4px 0" }}>
                {scanResult.food_name}
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                Portion: {scanResult.quantity_kg} kg ({scanResult.estimated_serving})
              </p>
            </div>

            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--brand-green)", margin: 0 }}>
                {scanResult.calories} kcal
              </p>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Confidence: {Math.round(scanResult.confidence * 100)}%
              </span>
            </div>
          </div>

          {/* MACROS GRID */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", textAlign: "center" }}>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px 6px", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700" }}>PROTEIN</span>
              <p style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--brand-cyan)", marginTop: "2px", margin: 0 }}>{scanResult.protein_g}g</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px 6px", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700" }}>CARBS</span>
              <p style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--brand-amber)", marginTop: "2px", margin: 0 }}>{scanResult.carbs_g}g</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px 6px", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700" }}>FAT</span>
              <p style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--brand-rose)", marginTop: "2px", margin: 0 }}>{scanResult.fat_g}g</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.03)", padding: "12px 6px", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "700" }}>FIBER</span>
              <p style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--brand-purple)", marginTop: "2px", margin: 0 }}>{scanResult.fiber_g}g</p>
            </div>
          </div>

          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontStyle: "italic", borderTop: "1px solid var(--border-color)", paddingTop: "12px", margin: 0 }}>
            ℹ️ {scanResult.notes || "These values are estimates and may vary depending on preparation and ingredients."}
          </p>
        </div>
      )}
    </div>
  );
}
