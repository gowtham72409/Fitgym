import React, { useState, useEffect } from 'react';
import { User, ArrowLeft, Check, Scale, Dumbbell, Utensils, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function ProfileView({ onBack, onProfileUpdated }) {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.getProfile();
      setProfile(res.profile || {});
      setMetrics(res.metrics || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const updateField = (key, val) => {
    setProfile(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.updateProfile(profile);
      setProfile(res.profile);
      setMetrics(res.metrics);
      setSaveNotice('Profile & metabolic targets successfully updated');
      setTimeout(() => setSaveNotice(''), 2500);
      if (onProfileUpdated) onProfileUpdated();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
        Loading profile...
      </div>
    );
  }

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
          <h2 style={{ fontSize: '20px' }}>Personal Profile</h2>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{currentUser?.email}</span>
        </div>
      </div>

      {saveNotice && (
        <div style={{
          background: 'rgba(0, 229, 153, 0.15)',
          color: 'var(--accent-emerald)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Check size={16} />
          <span>{saveNotice}</span>
        </div>
      )}

      {/* 1. METRICS OVERVIEW STRIP */}
      {metrics && (
        <div className="card" style={{ background: 'var(--bg-input)', padding: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BMI</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-cyan)' }}>{metrics.bmi}</div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BMR</span>
              <div style={{ fontSize: '16px', fontWeight: 800 }}>{metrics.bmr}</div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Calories</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-coral)' }}>{metrics.target_calories}</div>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Protein</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-emerald)' }}>{metrics.target_protein_g}g</div>
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT FORM */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Basic Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Full Name</label>
              <input
                type="text"
                value={profile?.name || ''}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Athlete Name"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Age</label>
                <input
                  type="number"
                  value={profile?.age || 25}
                  onChange={(e) => updateField('age', parseInt(e.target.value) || 25)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Gender</label>
                <select
                  value={profile?.gender || 'Male'}
                  onChange={(e) => updateField('gender', e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Body Dimensions & Goals</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Height (cm)</label>
                <input
                  type="number"
                  value={profile?.height_cm || 175}
                  onChange={(e) => updateField('height_cm', parseFloat(e.target.value) || 175)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Current (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={profile?.weight_kg || 70}
                  onChange={(e) => updateField('weight_kg', parseFloat(e.target.value) || 70)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Target (kg)</label>
                <input
                  type="number"
                  step="0.5"
                  value={profile?.target_weight_kg || 65}
                  onChange={(e) => updateField('target_weight_kg', parseFloat(e.target.value) || 65)}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Primary Goal</label>
              <select
                value={profile?.goal || 'Weight loss'}
                onChange={(e) => updateField('goal', e.target.value)}
              >
                <option value="Weight loss">Weight loss</option>
                <option value="Fat loss">Fat loss</option>
                <option value="Muscle gain">Muscle gain</option>
                <option value="Maintenance">Maintenance</option>
                <option value="General fitness">General fitness</option>
                <option value="Improve endurance">Improve endurance</option>
                <option value="Improve strength">Improve strength</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Diet & Nutrition Preferences</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Dietary Type</label>
                <select
                  value={profile?.food_preference || 'Non-vegetarian'}
                  onChange={(e) => updateField('food_preference', e.target.value)}
                >
                  <option value="Non-vegetarian">Non-vegetarian</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Eggetarian">Eggetarian</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Food Budget</label>
                <select
                  value={profile?.budget || 'Moderate'}
                  onChange={(e) => updateField('budget', e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Allergies to Exclude</label>
              <input
                type="text"
                value={profile?.allergies || ''}
                onChange={(e) => updateField('allergies', e.target.value)}
                placeholder="e.g. peanuts, dairy, shellfish or none"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary"
          style={{ width: '100%', fontSize: '16px', padding: '14px', marginTop: '6px' }}
        >
          {saving ? 'Updating...' : 'Save & Recalculate Targets'}
        </button>
      </form>

    </div>
  );
}
