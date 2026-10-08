import React, { useState } from "react";
import { Sparkles, ArrowRight, User, Dumbbell, Utensils, Target, Loader2 } from "lucide-react";
import { api } from "../api";

export function Onboarding({ onComplete }) {
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "Male",
    height_cm: "",
    current_weight_kg: "",
    target_weight_kg: "",
    goal: "Weight loss",
    activity_level: "Moderate",
    fitness_experience: "Beginner",
    workout_preference: "Both",
    workout_days_per_week: 5,
    preferred_duration_min: 90,
    food_preference: "Non-vegetarian",
    budget: "Moderate budget",
    food_restrictions: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!formData.age || !formData.height_cm || !formData.current_weight_kg || !formData.target_weight_kg) {
      setError("Please fill in all required metric fields (Age, Height, Current & Target Weight).");
      return;
    }
    setError("");
    setLoading(true);

    const payload = {
      ...formData,
      age: parseFloat(formData.age) || 25,
      height_cm: parseFloat(formData.height_cm) || 170,
      current_weight_kg: parseFloat(formData.current_weight_kg) || 70,
      target_weight_kg: parseFloat(formData.target_weight_kg) || 65,
      workout_days_per_week: parseInt(formData.workout_days_per_week) || 5,
      preferred_duration_min: parseInt(formData.preferred_duration_min) || 90,
    };

    try {
      const profile = await api.updateProfile(payload);
      onComplete(profile);
    } catch (err) {
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg-primary)",
      padding: "40px 20px",
      display: "flex",
      justifyContent: "center"
    }}>
      <div className="glass-card" style={{
        maxWidth: "720px",
        width: "100%",
        padding: "36px",
        borderRadius: "var(--radius-lg)"
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div className="badge badge-purple" style={{ marginBottom: "12px" }}>
            <Sparkles size={14} /> STEP 1: PERSONALIZATION
          </div>
          <h2 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--text-primary)" }}>
            Build Your Fitness Profile
          </h2>
          <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginTop: "6px" }}>
            FitQuest AI will craft your customized 7-day diet and 90-min workout plans based on your unique goals.
          </p>
        </div>

        {error && (
          <div style={{
            background: "rgba(244, 63, 94, 0.15)",
            border: "1px solid rgba(244, 63, 94, 0.4)",
            color: "var(--brand-rose)",
            padding: "12px",
            borderRadius: "var(--radius-md)",
            fontSize: "0.85rem",
            marginBottom: "24px"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* SECTION 1: PERSONAL DETAILS */}
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--brand-green)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <User size={18} /> Personal Details
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Full Name *</label>
                <input type="text" name="name" placeholder="Enter your full name" value={formData.name} onChange={handleChange} required />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Age *</label>
                <input type="number" name="age" placeholder="e.g. 25" value={formData.age} onChange={handleChange} min={12} max={100} required />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Height (cm) *</label>
                <input type="number" name="height_cm" placeholder="e.g. 175" value={formData.height_cm} onChange={handleChange} min={100} max={250} required />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Current Weight (kg) *</label>
                <input type="number" step="0.1" name="current_weight_kg" placeholder="e.g. 75" value={formData.current_weight_kg} onChange={handleChange} required />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Target Weight (kg) *</label>
                <input type="number" step="0.1" name="target_weight_kg" placeholder="e.g. 70" value={formData.target_weight_kg} onChange={handleChange} required />
              </div>
            </div>
          </div>

          {/* SECTION 2: FITNESS GOALS */}
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--brand-cyan)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Target size={18} /> Goals & Activity
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Primary Fitness Goal</label>
                <select name="goal" value={formData.goal} onChange={handleChange}>
                  <option value="Weight loss">Weight loss</option>
                  <option value="Muscle gain">Muscle gain</option>
                  <option value="Fat loss">Fat loss</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="General fitness">General fitness</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Daily Activity Level</label>
                <select name="activity_level" value={formData.activity_level} onChange={handleChange}>
                  <option value="Sedentary">Sedentary (Desk Job)</option>
                  <option value="Light">Light (1-2 days active)</option>
                  <option value="Moderate">Moderate (3-5 days active)</option>
                  <option value="Active">Active (6-7 days active)</option>
                  <option value="Very active">Very active (Intense training)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Fitness Experience</label>
                <select name="fitness_experience" value={formData.fitness_experience} onChange={handleChange}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: WORKOUT PREFERENCES */}
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--brand-orange)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Dumbbell size={18} /> Workout Preferences
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Workout Location</label>
                <select name="workout_preference" value={formData.workout_preference} onChange={handleChange}>
                  <option value="Home">Home Workout</option>
                  <option value="Gym">Gym Workout</option>
                  <option value="Both">Both (Home & Gym)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Days per Week</label>
                <input type="number" name="workout_days_per_week" value={formData.workout_days_per_week} onChange={handleChange} min={1} max={7} />
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Session Duration (Minutes)</label>
                <input type="number" name="preferred_duration_min" value={formData.preferred_duration_min} onChange={handleChange} min={30} max={120} />
              </div>
            </div>
          </div>

          {/* SECTION 4: NUTRITION & FOOD */}
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--brand-purple)", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Utensils size={18} /> Diet & Food Preferences
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Diet Type</label>
                <select name="food_preference" value={formData.food_preference} onChange={handleChange}>
                  <option value="Non-vegetarian">Non-vegetarian</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Eggetarian">Eggetarian</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Food Budget</label>
                <select name="budget" value={formData.budget} onChange={handleChange}>
                  <option value="Low budget">Low budget (Affordable)</option>
                  <option value="Moderate budget">Moderate budget</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-secondary)", marginBottom: "6px", display: "block" }}>Allergies / Restrictions</label>
                <input type="text" name="food_restrictions" placeholder="e.g. Peanuts, Lactose, Seafood" value={formData.food_restrictions} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="gradient-btn"
            style={{ width: "100%", padding: "16px", fontSize: "1.05rem", marginTop: "12px" }}
          >
            {loading ? (
              <>
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                <span>Generating Your AI Plan...</span>
              </>
            ) : (
              <>
                <span>Complete Profile & Generate Plans</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
