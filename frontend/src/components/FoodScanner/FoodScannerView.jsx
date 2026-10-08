import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Image as ImageIcon, Sparkles, Check, 
  Trash2, Edit3, ArrowLeft, Plus, Scale, AlertCircle, Award
} from 'lucide-react';
import { api } from '../../services/api';

export default function FoodScannerView({ onBack, onLoggedSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [quantityKg, setQuantityKg] = useState(0.50);
  const [mealType, setMealType] = useState('Lunch');

  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Manual correction state
  const [isEditing, setIsEditing] = useState(false);
  const [editFoodName, setEditFoodName] = useState('');

  // History list
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await api.getNutritionHistory();
      setHistory(res.history || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }

    setErrorMsg('');
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setAnalysisResult(null);
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) return;

    setAnalyzing(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('quantity_kg', quantityKg.toString());
    formData.append('meal_type', mealType);
    if (editFoodName.trim()) {
      formData.append('food_name_override', editFoodName.trim());
    }

    try {
      const res = await api.analyzeFoodImage(formData);
      setAnalysisResult(res.result);
      setEditFoodName(res.result.food_name);
      fetchHistory();
      if (onLoggedSuccess) onLoggedSuccess();
    } catch (err) {
      setErrorMsg(err.message || 'Image analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveCorrection = async () => {
    if (!analysisResult) return;
    try {
      const res = await api.updateNutritionLog(analysisResult.id, {
        food_name: editFoodName,
        quantity_kg: quantityKg
      });
      setAnalysisResult(res.result);
      setIsEditing(false);
      fetchHistory();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      await api.deleteNutritionLog(id);
      if (analysisResult?.id === id) {
        setAnalysisResult(null);
        setSelectedFile(null);
        setPreviewUrl(null);
      }
      fetchHistory();
    } catch (e) {
      console.error(e);
    }
  };

  const resetScanner = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setErrorMsg('');
    setIsEditing(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onBack && (
          <button onClick={onBack} className="btn btn-secondary btn-icon" style={{ width: '36px', height: '36px' }}>
            <ArrowLeft size={18} />
          </button>
        )}
        <div>
          <h2 style={{ fontSize: '20px' }}>AI Food Scanner</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Multimodal Vision Nutrition AI</span>
        </div>
      </div>

      {/* Hidden File Inputs */}
      {/* Rear Camera Capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {/* Gallery Picker */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* 1. CAMERA SELECTION HUD */}
      {!previewUrl && !analysisResult && (
        <div className="card" style={{ textAlign: 'center', padding: '30px 20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(0, 240, 255, 0.15)',
            color: 'var(--accent-cyan)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: 'var(--shadow-glow-cyan)'
          }}>
            <Camera size={32} />
          </div>

          <h3 style={{ fontSize: '18px', marginBottom: '6px' }}>Snap or Upload Meal Photo</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '24px' }}>
            FitQuest AI will recognize your ingredients and calculate calories and macronutrients instantly.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="btn btn-primary"
              style={{ width: '100%', fontSize: '16px', padding: '14px' }}
            >
              <Camera size={20} />
              TAKE PHOTO
            </button>

            <button
              onClick={() => galleryInputRef.current?.click()}
              className="btn btn-secondary"
              style={{ width: '100%', fontSize: '15px', padding: '12px' }}
            >
              <ImageIcon size={18} />
              CHOOSE FROM GALLERY
            </button>
          </div>
        </div>
      )}

      {/* 2. IMAGE PREVIEW & WEIGHT SELECTION */}
      {previewUrl && !analysisResult && (
        <div className="card">
          <div style={{
            width: '100%',
            height: '240px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            marginBottom: '16px',
            position: 'relative'
          }}>
            <img 
              src={previewUrl} 
              alt="Meal Preview" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
            <button
              onClick={resetScanner}
              className="btn btn-icon"
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.6)',
                color: '#fff',
                width: '32px',
                height: '32px'
              }}
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Prompt: Meal Weight Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>
              <Scale size={16} style={{ color: 'var(--accent-cyan)' }} />
              What is the approximate weight of this meal?
            </label>

            {/* Weight Chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '10px' }}>
              {[0.25, 0.50, 0.75, 1.00].map(kg => (
                <button
                  key={kg}
                  type="button"
                  onClick={() => setQuantityKg(kg)}
                  className={quantityKg === kg ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ minHeight: '38px', height: '38px', padding: 0, fontSize: '13px' }}
                >
                  {kg.toFixed(2)} kg
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Custom:</span>
              <input
                type="number"
                step="0.05"
                min="0.05"
                max="5.0"
                value={quantityKg}
                onChange={(e) => setQuantityKg(parseFloat(e.target.value) || 0.50)}
                style={{ flex: 1, height: '38px', padding: '0 12px' }}
              />
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>kg</span>
            </div>
          </div>

          {/* Meal Type */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Meal Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
              {['Breakfast', 'Lunch', 'Snack', 'Dinner'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMealType(t)}
                  className={mealType === t ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ minHeight: '34px', height: '34px', padding: 0, fontSize: '12px' }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div style={{ color: 'var(--accent-coral)', fontSize: '13px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            onClick={handleStartAnalysis}
            disabled={analyzing}
            className="btn btn-primary"
            style={{ width: '100%', fontSize: '16px', padding: '14px' }}
          >
            {analyzing ? (
              <>
                <Sparkles size={18} className="spin-animation" />
                Analyzing your food with Vision AI...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Analyze Nutrition (+10 XP)
              </>
            )}
          </button>
        </div>
      )}

      {/* 3. NUTRITION RESULT CARD */}
      {analysisResult && (
        <div className="card" style={{ border: '1px solid var(--border-active)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <span className="badge badge-emerald" style={{ marginBottom: '4px' }}>
                AI Vision Confidence: {Math.round((analysisResult.confidence || 0.9) * 100)}%
              </span>
              <h3 style={{ fontSize: '20px' }}>{analysisResult.food_name}</h3>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {analysisResult.quantity_kg} kg • {analysisResult.serving}
              </span>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-icon"
              title="Edit dish name or portion"
              style={{ background: 'var(--bg-input)', width: '36px', height: '36px' }}
            >
              <Edit3 size={16} />
            </button>
          </div>

          {/* Edit Correction Drawer */}
          {isEditing && (
            <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Correct Dish Name
              </label>
              <input
                type="text"
                value={editFoodName}
                onChange={(e) => setEditFoodName(e.target.value)}
                style={{ marginBottom: '10px', height: '38px' }}
              />
              <button onClick={handleSaveCorrection} className="btn btn-primary" style={{ width: '100%', fontSize: '13px' }}>
                Save Correction
              </button>
            </div>
          )}

          {/* Big Macro Summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            <div style={{ background: 'var(--bg-input)', padding: '10px 4px', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Calories</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-coral)' }}>{analysisResult.calories}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>kcal</div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '10px 4px', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Protein</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-cyan)' }}>{analysisResult.protein_g}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>grams</div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '10px 4px', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Carbs</div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>{analysisResult.carbs_g}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>grams</div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '10px 4px', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fat</div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>{analysisResult.fat_g}</div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>grams</div>
            </div>
          </div>

          {/* Detected Ingredients */}
          {analysisResult.detected_items?.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Detected Ingredients:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {analysisResult.detected_items.map((item, idx) => (
                  <span key={idx} style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '12px'
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {analysisResult.notes && (
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', marginBottom: '16px' }}>
              {analysisResult.notes}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={resetScanner} className="btn btn-primary" style={{ flex: 1 }}>
              <Plus size={16} /> Scan Another Meal
            </button>
            <button 
              onClick={() => handleDeleteLog(analysisResult.id)} 
              className="btn btn-danger btn-icon"
              title="Delete scan"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 4. RECENT FOOD LOGS & HISTORY */}
      <div className="card">
        <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Food Logs History</h3>

        {history.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
            No food scans yet. Snap a meal photo above to start tracking!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {history.map(item => (
              <div
                key={item.id}
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
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{item.food_name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {item.quantity_kg} kg • {item.date_str || 'Today'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 800 }}>{item.calories} kcal</div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-emerald)' }}>{item.protein_g}g protein</div>
                  </div>

                  <button
                    onClick={() => handleDeleteLog(item.id)}
                    className="btn btn-icon"
                    style={{ width: '28px', height: '28px', background: 'transparent', color: 'var(--accent-coral)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
