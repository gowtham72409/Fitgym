import React, { useState, useEffect } from "react";
import { Utensils, RefreshCw, Edit3, Flame, Clock, Sparkles, ChevronDown, ChevronUp, Loader2, X, Check, Plus, Trash2 } from "lucide-react";
import { api } from "../api";

export function DietPlan() {
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [selectedDay, setSelectedDay] = useState(() => daysOfWeek[new Date().getDay()]);
  const [regenerating, setRegenerating] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  
  // Customize Form state
  const [customizeForm, setCustomizeForm] = useState({
    action: "edit", // "edit" or "add"
    meal_index: null,
    day: "Tuesday",
    meal_type: "Breakfast",
    new_food_name: "",
    new_calories: 450,
    new_protein_g: 25,
    new_carbs_g: 50,
    new_fat_g: 15,
    new_fiber_g: 5,
    new_recipe: "",
    new_ingredients: "",
    new_instructions: ""
  });
  const [savingCustom, setSavingCustom] = useState(false);

  useEffect(() => {
    fetchDietPlan();
  }, []);

  const fetchDietPlan = async () => {
    try {
      setLoading(true);
      const data = await api.getDiet();
      setDietPlan(data);
    } catch (err) {
      console.error("Failed to load diet plan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const data = await api.generateDiet();
      setDietPlan(data);
    } catch (err) {
      alert("Failed to regenerate diet plan: " + err.message);
    } finally {
      setRegenerating(false);
    }
  };

  const openAddMealModal = () => {
    setCustomizeForm({
      action: "add",
      meal_index: null,
      day: selectedDay,
      meal_type: "Breakfast",
      new_food_name: "",
      new_calories: 400,
      new_protein_g: 25,
      new_carbs_g: 45,
      new_fat_g: 12,
      new_fiber_g: 5,
      new_recipe: "",
      new_ingredients: "Eggs, Whole wheat toast, Avocado",
      new_instructions: "Cook lightly with olive oil and season to taste."
    });
    setShowCustomizeModal(true);
  };

  const openCustomizeModal = (mealObj, idx) => {
    setCustomizeForm({
      action: "edit",
      meal_index: idx !== undefined ? idx : null,
      day: selectedDay,
      meal_type: mealObj.meal,
      new_food_name: mealObj.recipe_name || mealObj.food_name || "",
      new_calories: mealObj.calories || 350,
      new_protein_g: mealObj.protein_g || 14,
      new_carbs_g: mealObj.carbs_g || 45,
      new_fat_g: mealObj.fat_g || 7,
      new_fiber_g: mealObj.fiber_g || 6,
      new_recipe: mealObj.recipe_name || "",
      new_ingredients: Array.isArray(mealObj.ingredients) ? mealObj.ingredients.join(", ") : (mealObj.ingredients || ""),
      new_instructions: Array.isArray(mealObj.instructions) ? mealObj.instructions.join("\n") : (mealObj.instructions || "")
    });
    setShowCustomizeModal(true);
  };

  const handleDeleteMeal = async (mealObj, idx) => {
    const mealName = mealObj.recipe_name || mealObj.meal;
    if (!window.confirm(`Are you sure you want to delete "${mealName}" from ${selectedDay}?`)) return;
    try {
      setLoading(true);
      const res = await api.customizeDiet({
        action: "delete",
        day: selectedDay,
        meal_index: idx,
        meal_type: mealObj.meal
      });
      setDietPlan(res.plan_data);
    } catch (err) {
      alert("Failed to delete meal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCustomize = async (e) => {
    e.preventDefault();
    try {
      setSavingCustom(true);
      const payload = {
        ...customizeForm,
        new_ingredients: customizeForm.new_ingredients.split(",").map((s) => s.trim()).filter(Boolean),
        new_instructions: customizeForm.new_instructions.split("\n").map((s) => s.trim()).filter(Boolean)
      };
      const res = await api.customizeDiet(payload);
      setDietPlan(res.plan_data);
      setShowCustomizeModal(false);
    } catch (err) {
      alert("Customization error: " + err.message);
    } finally {
      setSavingCustom(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px", color: "var(--brand-purple)" }}>
        <Loader2 size={36} className="spin" />
      </div>
    );
  }

  const currentDayData = dietPlan?.days?.find((d) => d.day === selectedDay) || dietPlan?.days?.[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", paddingBottom: "40px" }}>
      {/* Header Bar matching Screenshot 1 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#94a3b8", letterSpacing: "2px", textTransform: "uppercase" }}>
            PERSONAL FUEL MAP
          </span>
          <h2 style={{ fontSize: "2.2rem", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>
            Your Sunday–Saturday Diet Plan
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#94a3b8", marginTop: "4px" }}>
            Every meal includes ingredients, recipe, cooking steps, macros and estimated calories.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={openAddMealModal}
            className="purple-btn"
            style={{ padding: "12px 20px", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Plus size={16} /> Add Custom Meal
          </button>

          <button
            onClick={() => openCustomizeModal(currentDayData?.meals?.[0] || { meal: "Breakfast", recipe_name: "Custom Meal" }, 0)}
            style={{
              padding: "12px 20px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#ffffff",
              borderRadius: "var(--radius-md)",
              cursor: "pointer",
              fontWeight: "700"
            }}
          >
            Customize {selectedDay}
          </button>
        </div>
      </div>

      {/* WEEKLY TABS (Sunday - Saturday) MATCHING SCREENSHOT 1 */}
      <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "8px" }}>
        {daysOfWeek.map((day) => {
          const isSel = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                padding: "10px 22px",
                borderRadius: "var(--radius-full)",
                border: "none",
                background: isSel ? "var(--brand-purple)" : "#161c2b",
                color: "#ffffff",
                fontWeight: isSel ? "800" : "600",
                fontSize: "0.9rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease"
              }}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* MAIN DIET CONTENT & RIGHT SIDEBAR GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
        
        {/* LEFT MAIN DIET MEALS COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", gridColumn: "span 2" }}>
          
          {/* FOOD BANNER MATCHING SCREENSHOT 1 */}
          <div style={{
            position: "relative",
            borderRadius: "20px",
            overflow: "hidden",
            height: "150px",
            backgroundImage: "linear-gradient(to right, rgba(16, 22, 34, 0.95) 40%, rgba(16, 22, 34, 0.4) 100%), url('https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=1200&auto=format&fit=crop')",
            backgroundSize: "cover",
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            border: "1px solid rgba(255,255,255,0.08)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#94a3b8", letterSpacing: "1.5px" }}>
                  {selectedDay.toUpperCase()}
                </span>
                <h3 style={{ fontSize: "1.8rem", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>
                  Custom meals + recipes
                </h3>
                <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "4px" }}>
                  Calories shown for each meal • Fully customizable
                </p>
              </div>

              <button
                onClick={openAddMealModal}
                style={{
                  background: "rgba(88, 101, 242, 0.85)",
                  color: "#ffffff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "12px",
                  fontWeight: "700",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Plus size={14} /> Add Meal
              </button>
            </div>
          </div>

          {/* MEALS LIST MATCHING SCREENSHOT 1 */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {(!currentDayData?.meals || currentDayData?.meals.length === 0) && (
              <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                <p style={{ fontSize: "1rem", marginBottom: "12px" }}>No meals scheduled for {selectedDay}.</p>
                <button onClick={openAddMealModal} className="purple-btn" style={{ padding: "10px 20px" }}>
                  <Plus size={16} /> Add Your First Meal
                </button>
              </div>
            )}

            {currentDayData?.meals?.map((meal, idx) => (
              <div key={idx} className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "var(--brand-purple)", letterSpacing: "1px" }}>
                      {meal.meal.toUpperCase()}
                    </span>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: "900", color: "#ffffff", marginTop: "4px" }}>
                      {meal.recipe_name}
                    </h3>
                    <p style={{ fontSize: "1.2rem", fontWeight: "800", color: "#ffffff", marginTop: "6px" }}>
                      {meal.calories || 0} kcal
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      onClick={() => openCustomizeModal(meal, idx)}
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "#ffffff",
                        padding: "8px 16px",
                        borderRadius: "var(--radius-full)",
                        cursor: "pointer",
                        fontSize: "0.82rem",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      <Edit3 size={13} /> Customize
                    </button>

                    <button
                      onClick={() => handleDeleteMeal(meal, idx)}
                      style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.25)",
                        color: "#ef4444",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-full)",
                        cursor: "pointer",
                        fontSize: "0.82rem",
                        fontWeight: "700",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}
                      title="Delete Meal"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Macro Pills matching Screenshot 1 */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  <span className="badge badge-purple">Protein {meal.protein_g || 14}g</span>
                  <span className="badge badge-purple">Carbs {meal.carbs_g || 45}g</span>
                  <span className="badge badge-purple">Fat {meal.fat_g || 7}g</span>
                  <span className="badge badge-purple">Fibre {meal.fiber_g || 6}g</span>
                </div>

                {/* 3 Sub-Boxes matching Screenshot 1: Ingredients, Recipe, How to cook */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
                  <div style={{ background: "#101420", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <h4 style={{ fontSize: "0.82rem", fontWeight: "800", color: "#ffffff", marginBottom: "8px" }}>
                      🥣 Ingredients
                    </h4>
                    <p style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: "1.5" }}>
                      {Array.isArray(meal.ingredients) ? meal.ingredients.join(", ") : (meal.ingredients || meal.recipe_name)}
                    </p>
                  </div>

                  <div style={{ background: "#101420", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <h4 style={{ fontSize: "0.82rem", fontWeight: "800", color: "#ffffff", marginBottom: "8px" }}>
                      🍳 Recipe
                    </h4>
                    <p style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: "1.5" }}>
                      Simple preparation of the listed foods.
                    </p>
                  </div>

                  <div style={{ background: "#101420", padding: "14px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <h4 style={{ fontSize: "0.82rem", fontWeight: "800", color: "#ffffff", marginBottom: "8px" }}>
                      👨‍🍳 How to cook
                    </h4>
                    <p style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: "1.5" }}>
                      {Array.isArray(meal.instructions) ? meal.instructions.join(" ") : (meal.instructions || "Cook ingredients cleanly with minimal oil.")}
                    </p>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* RIGHT SIDEBAR WIDGET: GROCERY RUN MATCHING SCREENSHOT 1 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "#94a3b8", letterSpacing: "1.5px" }}>GROCERY RUN</span>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "900", color: "#ffffff", marginTop: "2px" }}>
                Budget-friendly picks
              </h3>
            </div>

            {/* 4 Food Image Grid matching Screenshot 1 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ height: "90px", borderRadius: "12px", backgroundImage: "url('https://images.unsplash.com/photo-1516467508483-a7212febe31a?q=80&w=300&auto=format&fit=crop')", backgroundSize: "cover" }} />
              <div style={{ height: "90px", borderRadius: "12px", backgroundImage: "url('https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=300&auto=format&fit=crop')", backgroundSize: "cover" }} />
              <div style={{ height: "90px", borderRadius: "12px", backgroundImage: "url('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop')", backgroundSize: "cover" }} />
              <div style={{ height: "90px", borderRadius: "12px", backgroundImage: "url('https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=300&auto=format&fit=crop')", backgroundSize: "cover" }} />
            </div>

            <p style={{ fontSize: "0.75rem", color: "#94a3b8", lineHeight: "1.5" }}>
              Eggs • rice • oats • dal • chicken • paneer • greens • seasonal fruit
            </p>

            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              style={{
                width: "100%",
                padding: "14px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#ffffff",
                borderRadius: "var(--radius-md)",
                fontWeight: "700",
                fontSize: "0.9rem",
                cursor: "pointer"
              }}
            >
              {regenerating ? "Regenerating..." : "Regenerate 7-Day Plan"}
            </button>
          </div>

        </div>

      </div>

      {/* CUSTOMIZE DIET MODAL */}
      {showCustomizeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: "900", color: "#ffffff", margin: 0 }}>
                  {customizeForm.action === "add" ? `Add Custom Meal (${selectedDay})` : `Customize Meal (${selectedDay})`}
                </h3>
                <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "2px 0 0 0" }}>
                  Set custom recipe name, ingredients, macros and instructions
                </p>
              </div>
              <button onClick={() => setShowCustomizeModal(false)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomize} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Meal Type selection */}
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>Meal Type</label>
                <select
                  value={customizeForm.meal_type}
                  onChange={(e) => setCustomizeForm({ ...customizeForm, meal_type: e.target.value })}
                  style={{ width: "100%", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Morning Snack">Morning Snack</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Evening Snack">Evening Snack</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Pre-Workout">Pre-Workout Fuel</option>
                  <option value="Post-Workout">Post-Workout Fuel</option>
                  <option value="Custom Meal">Custom Snack</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>Recipe / Food Name</label>
                <input
                  type="text"
                  placeholder="e.g. Scrambled Eggs with Avocado Toast"
                  value={customizeForm.new_food_name}
                  onChange={(e) => setCustomizeForm({ ...customizeForm, new_food_name: e.target.value })}
                  style={{ width: "100%", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                  required
                />
              </div>

              {/* Calories & Macros */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>Calories (kcal)</label>
                  <input
                    type="number"
                    min="0"
                    max="3000"
                    value={customizeForm.new_calories}
                    onChange={(e) => setCustomizeForm({ ...customizeForm, new_calories: parseInt(e.target.value) || 0 })}
                    style={{ width: "100%", marginTop: "4px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={customizeForm.new_protein_g}
                    onChange={(e) => setCustomizeForm({ ...customizeForm, new_protein_g: parseFloat(e.target.value) || 0 })}
                    style={{ width: "100%", marginTop: "4px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={customizeForm.new_carbs_g}
                    onChange={(e) => setCustomizeForm({ ...customizeForm, new_carbs_g: parseFloat(e.target.value) || 0 })}
                    style={{ width: "100%", marginTop: "4px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-secondary)" }}>Fat (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={customizeForm.new_fat_g}
                    onChange={(e) => setCustomizeForm({ ...customizeForm, new_fat_g: parseFloat(e.target.value) || 0 })}
                    style={{ width: "100%", marginTop: "4px", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>Ingredients (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. 3 Eggs, 2 Whole Wheat Toast, Olive oil"
                  value={customizeForm.new_ingredients}
                  onChange={(e) => setCustomizeForm({ ...customizeForm, new_ingredients: e.target.value })}
                  style={{ width: "100%", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "4px", display: "block" }}>Cooking Instructions / Steps</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Whisk eggs in a bowl. Heat pan with a drop of olive oil. Cook gently until fluffy."
                  value={customizeForm.new_instructions}
                  onChange={(e) => setCustomizeForm({ ...customizeForm, new_instructions: e.target.value })}
                  style={{ width: "100%", padding: "10px", background: "#131726", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#fff", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button type="button" onClick={() => setShowCustomizeModal(false)} style={{ flex: 1, padding: "12px", background: "none", border: "1px solid rgba(255,255,255,0.15)", color: "#ffffff", borderRadius: "var(--radius-md)", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingCustom} className="purple-btn" style={{ flex: 1, padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  {savingCustom ? <Loader2 size={16} className="spin" /> : <Check size={16} />}
                  <span>{customizeForm.action === "add" ? "Add Meal" : "Save Meal"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
