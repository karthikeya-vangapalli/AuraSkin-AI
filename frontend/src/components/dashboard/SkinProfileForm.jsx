import React, { useState, useEffect } from 'react';
import { profileService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, Check, ArrowRight, ArrowLeft, ShieldAlert, Sparkle, Save } from 'lucide-react';

export default function SkinProfileForm() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [formData, setFormData] = useState({
    skin_type: 'Combination',
    age_group: '25-34',
    skin_concerns: ['Acne', 'Hyperpigmentation'],
    allergies: ['Fragrance'],
    sensitivities: ['Retinoids'],
    fitzpatrick_scale: 3,
    climate_environment: 'Urban / Humid',
  });

  useEffect(() => {
    if (user?.id) {
      profileService.getProfile(user.id)
        .then((data) => {
          if (data) {
            setFormData({
              skin_type: data.skin_type || 'Combination',
              age_group: data.age_group || '25-34',
              skin_concerns: data.skin_concerns || [],
              allergies: data.allergies || [],
              sensitivities: data.sensitivities || [],
              fitzpatrick_scale: data.fitzpatrick_scale || 3,
              climate_environment: data.climate_environment || 'Urban / Humid',
            });
          }
        })
        .catch(() => {
          // Ignore missing initial profile
        });
    }
  }, [user]);

  const toggleArrayItem = (field, value) => {
    setFormData((prev) => {
      const list = prev[field] || [];
      const updated = list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleSave = async () => {
    setLoading(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const payload = {
        skin_type: formData.skin_type,
        age_group: formData.age_group || null,
        skin_concerns: Array.isArray(formData.skin_concerns) ? formData.skin_concerns : [],
        allergies: Array.isArray(formData.allergies) ? formData.allergies : [],
        sensitivities: Array.isArray(formData.sensitivities) ? formData.sensitivities : [],
        ingredient_allergies: Array.isArray(formData.allergies) ? formData.allergies : [],
        active_sensitivities: Array.isArray(formData.sensitivities) ? formData.sensitivities : [],
        fitzpatrick_scale: formData.fitzpatrick_scale || null,
        climate_environment: formData.climate_environment || null,
      };
      await profileService.saveProfile(payload, token ? {
        headers: { Authorization: `Bearer ${token}` },
      } : {});
      setSaveSuccess(true);
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : detail?.[0]?.msg || JSON.stringify(detail) || 'Failed to save skin profile.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const skinTypes = ['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'];
  const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55+'];
  const concernOptions = ['Acne', 'Hyperpigmentation', 'Fine Lines', 'Dark Circles', 'Redness / Rosacea', 'Dehydration', 'Large Pores'];
  const allergyOptions = ['Fragrance', 'Sulfates', 'Parabens', 'Essential Oils', 'Alcohol Denat', 'Lanolin'];
  const sensitivityOptions = ['Retinoids (Retinol/Tretinoin)', 'AHA/BHA Acids', 'L-Ascorbic Acid (Vitamin C)', 'Benzoyl Peroxide', 'Niacinamide (High % )'];

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      {/* Step Header Indicator */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-widest">Step {step} of 3</span>
          <h2 className="text-xl font-bold text-white mt-1">
            {step === 1 && 'Skin Typing & Demographic Profile'}
            {step === 2 && 'Target Skin Concerns'}
            {step === 3 && 'Allergies & Active Ingredient Sensitivities'}
          </h2>
        </div>

        <div className="flex space-x-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-all ${
                s === step ? 'bg-rose-500 ring-4 ring-rose-500/20' : s < step ? 'bg-purple-500' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-emerald-400" />
            <span>Your personalized skin profile has been saved successfully!</span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm">
          {errorMessage}
        </div>
      )}

      {/* STEP 1 */}
      {step === 1 && (
        <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-3">Skin Classification Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {skinTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, skin_type: type })}
                  className={`p-4 rounded-2xl border text-sm font-medium transition flex flex-col items-center justify-center space-y-2 ${
                    formData.skin_type === type
                      ? 'border-rose-500 bg-rose-500/10 text-white shadow-lg shadow-rose-500/10'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Sparkles className={`w-5 h-5 ${formData.skin_type === type ? 'text-rose-400' : 'text-slate-600'}`} />
                  <span>{type}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-3">Age Bracket</label>
            <div className="flex flex-wrap gap-2">
              {ageGroups.map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() => setFormData({ ...formData, age_group: age })}
                  className={`px-5 py-2.5 rounded-xl border text-xs font-semibold transition ${
                    formData.age_group === age
                      ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-3">Fitzpatrick Skin Phototype Scale (1-6)</label>
            <input
              type="range"
              min="1"
              max="6"
              value={formData.fitzpatrick_scale}
              onChange={(e) => setFormData({ ...formData, fitzpatrick_scale: parseInt(e.target.value) })}
              className="w-full accent-rose-500 bg-slate-900 rounded-lg h-2"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>Type I (Very Fair)</span>
              <span className="text-rose-400 font-bold">Type {formData.fitzpatrick_scale}</span>
              <span>Type VI (Deeply Pigmented)</span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-3">
              Select Primary Skin Concerns (Multiple Selection)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {concernOptions.map((concern) => {
                const selected = formData.skin_concerns.includes(concern);
                return (
                  <button
                    key={concern}
                    type="button"
                    onClick={() => toggleArrayItem('skin_concerns', concern)}
                    className={`p-4 rounded-2xl border text-left text-sm font-medium transition flex items-center justify-between ${
                      selected
                        ? 'border-rose-500 bg-rose-500/10 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{concern}</span>
                    {selected && <Check className="w-4 h-4 text-rose-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-3 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Known Ingredient Allergies</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allergyOptions.map((allergy) => {
                const selected = formData.allergies.includes(allergy);
                return (
                  <button
                    key={allergy}
                    type="button"
                    onClick={() => toggleArrayItem('allergies', allergy)}
                    className={`p-3.5 rounded-2xl border text-left text-xs font-medium transition flex items-center justify-between ${
                      selected
                        ? 'border-amber-500 bg-amber-500/10 text-amber-200'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{allergy}</span>
                    {selected && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-3 flex items-center space-x-2">
              <Sparkle className="w-4 h-4 text-purple-400" />
              <span>Active Ingredient Sensitivities</span>
            </label>
            <div className="space-y-2">
              {sensitivityOptions.map((sensitivity) => {
                const selected = formData.sensitivities.includes(sensitivity);
                return (
                  <button
                    key={sensitivity}
                    type="button"
                    onClick={() => toggleArrayItem('sensitivities', sensitivity)}
                    className={`w-full p-3.5 rounded-2xl border text-left text-xs font-medium transition flex items-center justify-between ${
                      selected
                        ? 'border-purple-500 bg-purple-500/10 text-purple-200'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{sensitivity}</span>
                    {selected && <Check className="w-4 h-4 text-purple-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-4">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="px-5 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 text-xs font-semibold flex items-center space-x-2 hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>
        ) : <div />}

        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white text-xs font-semibold flex items-center space-x-2 shadow-lg shadow-rose-500/20 hover:from-rose-600 transition"
          >
            <span>Next Step</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-500/20 hover:from-emerald-600 transition"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving Profile...' : 'Save Skin Profile'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
