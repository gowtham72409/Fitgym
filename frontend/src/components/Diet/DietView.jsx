import React, { useState, useEffect } from 'react';
import { 
  Utensils, ChevronDown, ChevronUp, RefreshCw, 
  Sparkles, Plus, Edit2, Trash2, Check, BookOpen, Clock, Heart
} from 'lucide-react';
import { api } from '../../services/api';

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DietView({ onOpenScanner }) {
  const [selectedDay, setSelectedDay] = useState(
    new Date().toLocaleDateString('en-US', { weekday: 'long' })
  );
  const [dietPlan, setDietPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedMeal, setExpandedMeal] = useState(null);

  // Meal replace modal state
  const [replacingMeal, setReplacingMeal] = useState(null);
  const [replacementOptions, setReplacementOptions] = useState([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);

  // Quantity edit state
  const [editingQuantityMeal, setEditingQuantityMeal] = useState(null);
  const [editQtyValue, setEditQtyValue] = useState('');

  const fetchDiet = async () => {
    setLoading(true);
    try {
      const res = await api.getDiet();
      setDietPlan(res.diet);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiet();
  }, []);

  const currentDayData = dietPlan?.days?.find(
    d => d.day.toLowerCase() === selectedDay.toLowerCase()
  ) || dietPlan?.days?.[0];

  const handleRegenerateWeek = async () => {
    setLoading(true);
    try {
      const res = await api.generatePlans();
      setDietPlan(res.diet);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReplace = async (mealObj) => {
    setReplacingMeal(mealObj);
    setLoadingAlternatives(true);
    try {
      const res = await api.replaceMeal({
        meal: mealObj.meal,
        calories: mealObj.calories,
        protein_g: mealObj.protein_g
      });
      setReplacementOptions(res.alternatives || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  const handleSelectReplacement = async (newOption) => {
    if (!dietPlan || !replacingMeal) return;

    const updatedDays = dietPlan.days.map(d => {
      if (d.day.toLowerCase() === selectedDay.toLowerCase()) {
        const updatedMeals = d.meals.map(m => {
          if (m.meal === replacingMeal.meal) {
            return {
              ...m,
              food_name: newOption.food_name,
              quantity: newOption.quantity,
              serving_size_g: newOption.serving_size_g,
              calories: newOption.calories,
              protein_g: newOption.protein_g,
              carbs_g: newOption.carbs_g,
              fat_g: newOption.fat_g,
              fiber_g: newOption.fiber_g,
              recipe: newOption.recipe
            };
          }
          return m;
        });
        return { ...d, meals: updatedMeals };
      }
      return d;
    });

    const updatedDiet = { ...dietPlan, days: updatedDays };
    setDietPlan(updatedDiet);
    setReplacingMeal(null);
    await api.updateDiet(updatedDiet);
  };

  const handleSaveQuantity = async () => {
    if (!dietPlan || !editingQuantityMeal || !editQtyValue.trim()) return;

    // Estimate new macros if numeric gram detected
    const match = editQtyValue.match(/(\d+)/);
    const updatedDays = dietPlan.days.map(d => {
      if (d.day.toLowerCase() === selectedDay.toLowerCase()) {
        const updatedMeals = d.meals.map(m => {
          if (m.meal === editingQuantityMeal.meal) {
            let ratio = 1;
            if (match && m.serving_size_g) {
              const newGrams = parseInt(match[1]);
              if (newGrams > 0) ratio = newGrams / m.serving_size_g;
            }
            return {
              ...m,
              quantity: editQtyValue,
              calories: round(m.calories * ratio),
              protein_g: round(m.protein_g * ratio),
              carbs_g: round(m.carbs_g * ratio),
              fat_g: round(m.fat_g * ratio),
              fiber_g: round(m.fiber_g * ratio)
            };
          }
          return m;
        });
        return { ...d, meals: updatedMeals };
      }
      return d;
    });

    const updatedDiet = { ...dietPlan, days: updatedDays };
    setDietPlan(updatedDiet);
    setEditingQuantityMeal(null);
    await api.updateDiet(updatedDiet);
  };

  const round = (val) => Math.round(val || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Controls: Day selector tabs */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '20px' }}>7-Day Adaptive Diet</h2>
          <button onClick={handleRegenerateWeek} className="btn btn-outline" style={{ fontSize: '12px', padding: '6px 12px' }}>
            <RefreshCw size={14} /> Regenerate Week
          </button>
        </div>

        {/* Horizontal Days Scroll */}
        <div className="scroll-tabs">
          {DAYS.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`tab-chip ${selectedDay.toLowerCase() === day.toLowerCase() ? 'active' : ''}`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Targets HUD */}
      <div className="card" style={{ padding: '14px 18px', background: 'var(--bg-card)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 700, textTransform: 'uppercase' }}>
              {selectedDay} Total Targets
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800 }}>
              {currentDayData?.meals?.reduce((acc, m) => acc + (m.calories || 0), 0) || dietPlan?.daily_target_calories || 2000} kcal
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Protein</span>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                {currentDayData?.meals?.reduce((acc, m) => acc + (m.protein_g || 0), 0) || 120}g
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Carbs</span>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--accent-gold)' }}>
                {currentDayData?.meals?.reduce((acc, m) => acc + (m.carbs_g || 0), 0) || 180}g
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 MEALS LIST: Breakfast, Lunch, Snack, Dinner */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
          <Sparkles size={28} className="spin-animation" style={{ color: 'var(--accent-cyan)', marginBottom: '8px' }} />
          <p>Loading your personalized meals...</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {currentDayData?.meals?.map((meal, mIdx) => {
            const isExpanded = expandedMeal === meal.meal;

            return (
              <div key={mIdx} className="card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
                {/* Header: Meal Type + Food Name */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <span className="badge badge-cyan" style={{ fontSize: '10px', marginBottom: '4px' }}>
                      {meal.meal}
                    </span>
                    <h3 style={{ fontSize: '16px', marginTop: '2px' }}>{meal.food_name}</h3>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '17px', fontWeight: 800 }}>{meal.calories} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>kcal</span></div>
                    <div style={{ fontSize: '12px', color: 'var(--accent-emerald)', fontWeight: 600 }}>{meal.protein_g}g protein</div>
                  </div>
                </div>

                {/* Quantity and Serving Size with Edit */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-input)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '10px'
                }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Portion: <strong style={{ color: 'var(--text-primary)' }}>{meal.quantity}</strong>
                  </div>

                  <button
                    onClick={() => {
                      setEditingQuantityMeal(meal);
                      setEditQtyValue(meal.quantity);
                    }}
                    className="btn btn-icon"
                    title="Edit portion"
                    style={{ width: '28px', height: '28px', background: 'transparent', color: 'var(--accent-cyan)' }}
                  >
                    <Edit2 size={14} />
                  </button>
                </div>

                {/* Macro breakdown strip */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '6px',
                  textAlign: 'center',
                  fontSize: '11px',
                  marginBottom: '12px'
                }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Protein</div>
                    <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{meal.protein_g}g</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Carbs</div>
                    <div style={{ fontWeight: 700 }}>{meal.carbs_g}g</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Fat</div>
                    <div style={{ fontWeight: 700 }}>{meal.fat_g}g</div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '6px' }}>
                    <div style={{ color: 'var(--text-muted)' }}>Fiber</div>
                    <div style={{ fontWeight: 700 }}>{meal.fiber_g}g</div>
                  </div>
                </div>

                {/* Action Buttons: Replace & View Recipe */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleOpenReplace(meal)}
                    className="btn btn-secondary"
                    style={{ flex: 1, fontSize: '13px', padding: '8px 12px' }}
                  >
                    <Sparkles size={14} style={{ color: 'var(--accent-cyan)' }} />
                    Replace Meal
                  </button>

                  <button
                    onClick={() => setExpandedMeal(isExpanded ? null : meal.meal)}
                    className="btn btn-outline"
                    style={{ fontSize: '13px', padding: '8px 12px' }}
                  >
                    <BookOpen size={14} />
                    {isExpanded ? 'Hide Recipe' : 'Recipe'}
                  </button>
                </div>

                {/* Expandable Recipe Section */}
                {isExpanded && meal.recipe && (
                  <div style={{
                    marginTop: '14px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)',
                    animation: 'fadeIn 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <Clock size={14} />
                      <span>Prep time: {meal.recipe.prep_time_mins || 15} minutes</span>
                    </div>

                    <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '6px' }}>Ingredients</h4>
                    <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: '1.6' }}>
                      {meal.recipe.ingredients?.map((ing, iIdx) => (
                        <li key={iIdx}>{ing}</li>
                      ))}
                    </ul>

                    <h4 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '6px' }}>Instructions</h4>
                    <ol style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                      {meal.recipe.instructions?.map((ins, iIdx) => (
                        <li key={iIdx}>{ins}</li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action / Scanner prompt */}
      <button onClick={onOpenScanner} className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
        <Plus size={18} /> Log or Scan Food with Mobile Camera
      </button>

      {/* MODAL 1: Replace Meal (AI 3 Alternatives) */}
      {replacingMeal && (
        <div className="modal-overlay" onClick={() => setReplacingMeal(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>Replace {replacingMeal.meal}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
              Choose an AI alternative calibrated to match your targets (~{replacingMeal.calories} kcal):
            </p>

            {loadingAlternatives ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <Sparkles size={24} style={{ color: 'var(--accent-cyan)', marginBottom: '8px' }} />
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Generating smart recipe replacements...</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {replacementOptions.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    onClick={() => handleSelectReplacement(opt)}
                    className="card"
                    style={{
                      background: 'var(--bg-input)',
                      cursor: 'pointer',
                      border: '1px solid var(--border-subtle)',
                      transition: 'border-color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{opt.food_name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{opt.quantity}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', fontWeight: 800 }}>{opt.calories} kcal</div>
                        <div style={{ fontSize: '11px', color: 'var(--accent-emerald)' }}>{opt.protein_g}g protein</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Quantity */}
      {editingQuantityMeal && (
        <div className="modal-overlay" onClick={() => setEditingQuantityMeal(null)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>Edit Portion Size</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
              Adjust quantity for {editingQuantityMeal.food_name} (e.g. "200g", "2 eggs", "250 ml"):
            </p>

            <input
              type="text"
              value={editQtyValue}
              onChange={(e) => setEditQtyValue(e.target.value)}
              placeholder="e.g. 180g rice"
              style={{ fontSize: '16px', marginBottom: '16px' }}
              autoFocus
            />

            <button onClick={handleSaveQuantity} className="btn btn-primary" style={{ width: '100%' }}>
              Save & Recalculate Nutrition
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
