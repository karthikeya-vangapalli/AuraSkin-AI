import React, { useState } from 'react';
import { aiSkinService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Toast from '../common/Toast';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Sparkles, 
  AlertCircle, 
  Droplet, 
  Moon, 
  Sun, 
  ShieldCheck, 
  HeartHandshake,
  DollarSign,
  Info
} from 'lucide-react';

const FITZPATRICK_DESCRIPTIONS = {
  1: "Type I: Pale white skin, burns easily, never tans (High sunlight sensitivity)",
  2: "Type II: Fair skin, burns easily, tans minimally with difficulty",
  3: "Type III: Medium white/olive skin, burns moderately, tans gradually",
  4: "Type IV: Olive/light brown skin, burns minimally, tans easily",
  5: "Type V: Brown skin, rarely burns, tans easily and darkly",
  6: "Type VI: Deeply pigmented dark brown skin, never burns, tans deeply"
};

const SEVERITY_LABELS = {
  0: "0 - None / Calm",
  1: "1 - Mild (Occasional / Faint)",
  2: "2 - Moderate (Noticeable)",
  3: "3 - Pronounced (Frequent flare-ups)",
  4: "4 - Severe (Persistent / Inflamed)",
  5: "5 - Critical (Requires acute care)",
  "-1": "Unsure / Under Observation"
};

export default function TextualAssessment() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

  const [formData, setFormData] = useState({
    // Step A: Baseline
    skin_type: 'Combination',
    fitzpatrick_phototype: 3,
    climate: 'Urban / Humid',
    pollution_exposure: 'Moderate',
    primary_goal: 'Barrier Restoration & Radiance',

    // Step B: Concerns & Severity
    acne_severity: 0,
    hyperpigmentation_severity: 0,
    uneven_tone_severity: 0,
    texture_severity: 0,
    dehydration_severity: 0,
    oiliness_severity: 0,
    redness_severity: 0,
    barrier_concerns_severity: 0,

    // Step C: Lifestyle & Habits
    lifestyle_water_ml: 2500,
    lifestyle_sleep: 7.5,
    lifestyle_sleep_quality: 8,
    lifestyle_stress: 'low',
    sun_exposure_hours: 1.5,
    spf_consistency: 'daily',

    // Step D: Safety & Constraints
    reported_sensitivities: [],
    excluded_ingredients: '',
    budget_tier_inr: 2500,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSlider = (name, val) => {
    setFormData((prev) => ({ ...prev, [name]: parseInt(val, 10) }));
  };

  const submitAssessment = async () => {
    setLoading(true);
    try {
      const payload = {
        skin_type: formData.skin_type === 'Unsure' ? 'Normal' : formData.skin_type,
        fitzpatrick_phototype: Number(formData.fitzpatrick_phototype),
        climate: formData.climate,
        acne_severity: formData.acne_severity === -1 ? 1 : formData.acne_severity,
        hyperpigmentation_severity: formData.hyperpigmentation_severity === -1 ? 1 : formData.hyperpigmentation_severity,
        uneven_tone_severity: formData.uneven_tone_severity === -1 ? 1 : formData.uneven_tone_severity,
        texture_severity: formData.texture_severity === -1 ? 1 : formData.texture_severity,
        dehydration_severity: formData.dehydration_severity === -1 ? 1 : formData.dehydration_severity,
        oiliness_severity: formData.oiliness_severity === -1 ? 1 : formData.oiliness_severity,
        redness_severity: formData.redness_severity === -1 ? 1 : formData.redness_severity,
        barrier_concerns_severity: formData.barrier_concerns_severity === -1 ? 1 : formData.barrier_concerns_severity,
        reported_sensitivities: formData.reported_sensitivities,
        lifestyle_water_ml: Number(formData.lifestyle_water_ml),
        lifestyle_water: Number(formData.lifestyle_water_ml) / 1000.0,
        lifestyle_sleep: Number(formData.lifestyle_sleep),
        lifestyle_sleep_quality: Number(formData.lifestyle_sleep_quality),
        lifestyle_stress: formData.lifestyle_stress,
        sun_exposure_hours: Number(formData.sun_exposure_hours),
        spf_consistency: formData.spf_consistency,
      };

      const response = await aiSkinService.assessTextual(payload);
      setResult(response);
      setStep(5);
    } catch (err) {
      console.error(err);
      setToast({ show: true, message: 'Failed to submit assessment. Please check backend connectivity.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Step Indicators
  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 max-w-xl mx-auto">
      {['1. Baseline', '2. Concerns', '3. Lifestyle', '4. Safety & Review'].map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = step === stepNum;
        const isDone = step > stepNum;
        return (
          <div key={label} className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
              isActive ? 'bg-rose-500 text-white ring-4 ring-rose-500/20' :
              isDone ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
              {isDone ? '✓' : stepNum}
            </div>
            <span className={`hidden sm:inline text-xs font-semibold ${isActive ? 'text-white' : 'text-slate-500'}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );

  // Step 1: Baseline
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-rose-400" /> Step A: Skin Baseline & Environment
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Establish foundational epidermal characteristics without requiring camera or photo uploads.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Skin Type</label>
          <select 
            name="skin_type" 
            value={formData.skin_type} 
            onChange={handleChange} 
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
          >
            <option>Combination</option>
            <option>Oily</option>
            <option>Dry</option>
            <option>Normal</option>
            <option>Sensitive</option>
            <option>Unsure</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Skincare Goal</label>
          <select 
            name="primary_goal" 
            value={formData.primary_goal} 
            onChange={handleChange} 
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
          >
            <option>Barrier Restoration & Radiance</option>
            <option>Acne Control & Pore Clarification</option>
            <option>Hyperpigmentation & Spot Fading</option>
            <option>Deep Hydration & Plumpness</option>
            <option>Anti-Aging & Texture Refinement</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Fitzpatrick Phototype (I–VI)
        </label>
        <select 
          name="fitzpatrick_phototype" 
          value={formData.fitzpatrick_phototype} 
          onChange={handleChange} 
          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
        >
          {[1,2,3,4,5,6].map(num => (
            <option key={num} value={num}>{FITZPATRICK_DESCRIPTIONS[num]}</option>
          ))}
        </select>
        <p className="text-[11px] text-slate-500 mt-1">
          Provides non-diagnostic guidance regarding innate melanin reactivity to sunlight and UV exposure.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Climate / Environment</label>
          <input 
            type="text" 
            name="climate" 
            value={formData.climate} 
            onChange={handleChange} 
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm" 
            placeholder="e.g., Tropical, Humid, Arid, Continental"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Pollution & Air Quality</label>
          <select 
            name="pollution_exposure" 
            value={formData.pollution_exposure} 
            onChange={handleChange} 
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm"
          >
            <option>Low (Rural / Clean Air)</option>
            <option>Moderate (Suburban)</option>
            <option>High (Urban / Industrial)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={() => setStep(2)} 
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold flex items-center transition"
        >
          Continue to Concerns <ChevronRight className="w-4 h-4 ml-1.5"/>
        </button>
      </div>
    </div>
  );

  // Helper for Severity Sliders
  const renderSlider = (label, field, hint) => {
    const isUnsure = formData[field] === -1;
    return (
      <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="font-semibold text-slate-200">{label}</span>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold ${isUnsure ? 'text-amber-400' : 'text-rose-400'}`}>
              {SEVERITY_LABELS[formData[field]]}
            </span>
            <button 
              type="button"
              onClick={() => setFormData(p => ({ ...p, [field]: isUnsure ? 0 : -1 }))}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                isUnsure ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {isUnsure ? 'Active' : 'Unsure'}
            </button>
          </div>
        </div>
        {!isUnsure && (
          <input 
            type="range" 
            min="0" 
            max="5" 
            value={formData[field]} 
            onChange={(e) => handleSlider(field, e.target.value)} 
            className="w-full accent-rose-500 bg-slate-800 h-2 rounded-lg cursor-pointer" 
          />
        )}
        {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
      </div>
    );
  };

  // Step 2: Concerns
  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-400" /> Step B: Skin Concerns & Severity
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Rate self-reported concern severities from 0 to 5, or designate 'Unsure' if observation is pending.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderSlider('Acne & Congestion', 'acne_severity', 'Comedones, pustules, or hormonal breakouts')}
        {renderSlider('Hyperpigmentation & Dark Spots', 'hyperpigmentation_severity', 'PIH, melasma, or sunspots')}
        {renderSlider('Uneven Tone / Dullness', 'uneven_tone_severity', 'Lack of luminosity or blotchy complexion')}
        {renderSlider('Texture & Roughness', 'texture_severity', 'Enlarged pores, bumpy patches, keratinization')}
        {renderSlider('Dehydration & Tightness', 'dehydration_severity', 'Loss of water content, surface flakiness')}
        {renderSlider('Excess Sebum / Oiliness', 'oiliness_severity', 'Midday grease, shiny T-zone')}
        {renderSlider('Redness & Sensitivity', 'redness_severity', 'Erythema, burning, flushing, reactivity')}
        {renderSlider('Barrier Compromise', 'barrier_concerns_severity', 'Stinging from gentle water, persistent irritation')}
      </div>

      <div className="flex justify-between pt-4">
        <button 
          onClick={() => setStep(1)} 
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold flex items-center transition"
        >
          <ChevronLeft className="w-4 h-4 mr-1.5"/> Back
        </button>
        <button 
          onClick={() => setStep(3)} 
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold flex items-center transition"
        >
          Continue to Lifestyle <ChevronRight className="w-4 h-4 ml-1.5"/>
        </button>
      </div>
    </div>
  );

  // Step 3: Lifestyle & Habits
  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-teal-400" /> Step C: Lifestyle, Habits & Recovery
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Biological factors directly correlate with epidermal moisture permeability and cellular renewal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Water Intake */}
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Droplet className="w-4 h-4 text-cyan-400" /> Daily Water Intake (mL)
            </span>
            <span className="text-sm font-bold text-cyan-400">{formData.lifestyle_water_ml} mL</span>
          </div>
          <input 
            type="range" 
            min="500" 
            max="5000" 
            step="100" 
            value={formData.lifestyle_water_ml} 
            onChange={(e) => handleSlider('lifestyle_water_ml', e.target.value)} 
            className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer" 
          />
          <p className="text-[11px] text-slate-500">Evidence benchmark: 2,000–3,000 mL/day optimal for cellular hydration.</p>
        </div>

        {/* Sleep Duration */}
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-indigo-400" /> Sleep Duration (Hours)
            </span>
            <span className="text-sm font-bold text-indigo-400">{formData.lifestyle_sleep} hrs</span>
          </div>
          <input 
            type="range" 
            min="4" 
            max="12" 
            step="0.5" 
            value={formData.lifestyle_sleep} 
            onChange={(e) => setFormData(p => ({ ...p, lifestyle_sleep: parseFloat(e.target.value) }))} 
            className="w-full accent-indigo-400 bg-slate-800 h-2 rounded-lg cursor-pointer" 
          />
          <p className="text-[11px] text-slate-500">7.0–9.0 hrs provides the ideal nocturnal barrier recovery window.</p>
        </div>

        {/* Sleep Quality */}
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-200">Subjective Sleep Quality (1–10)</span>
            <span className="text-sm font-bold text-purple-400">{formData.lifestyle_sleep_quality}/10</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            value={formData.lifestyle_sleep_quality} 
            onChange={(e) => handleSlider('lifestyle_sleep_quality', e.target.value)} 
            className="w-full accent-purple-400 bg-slate-800 h-2 rounded-lg cursor-pointer" 
          />
          <p className="text-[11px] text-slate-500">Deep slow-wave sleep reduces systemic cortisol spikes.</p>
        </div>

        {/* Stress Level */}
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
          <label className="block text-xs font-semibold text-slate-200">Self-Reported Stress Level</label>
          <select 
            name="lifestyle_stress" 
            value={formData.lifestyle_stress} 
            onChange={handleChange} 
            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
          >
            <option value="low">Low (Relaxed / Normal)</option>
            <option value="medium">Medium (Moderate workload / pressure)</option>
            <option value="high">High (Elevated cortisol / Exhaustion)</option>
          </select>
          <p className="text-[11px] text-slate-500">High stress accelerates inflammatory cytokine release in skin.</p>
        </div>

        {/* Sun Exposure */}
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-amber-400" /> Outdoor Sun Hours / Day
            </span>
            <span className="text-sm font-bold text-amber-400">{formData.sun_exposure_hours} hrs</span>
          </div>
          <input 
            type="range" 
            min="0" 
            max="8" 
            step="0.5" 
            value={formData.sun_exposure_hours} 
            onChange={(e) => setFormData(p => ({ ...p, sun_exposure_hours: parseFloat(e.target.value) }))} 
            className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer" 
          />
          <p className="text-[11px] text-slate-500">Direct exposure without filtration induces UV photodamage.</p>
        </div>

        {/* SPF Consistency */}
        <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
          <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> SPF Application Consistency
          </label>
          <select 
            name="spf_consistency" 
            value={formData.spf_consistency} 
            onChange={handleChange} 
            className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-sm"
          >
            <option value="reapplied">Daily & Reapplied Every 2-3 Hours</option>
            <option value="daily">Daily in Morning Routine</option>
            <option value="occasional">Occasional / Sunny Days Only</option>
            <option value="never">Never / Rarely</option>
          </select>
          <p className="text-[11px] text-slate-500">Sunscreen is the foremost defense against collagen degradation.</p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button 
          onClick={() => setStep(2)} 
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold flex items-center transition"
        >
          <ChevronLeft className="w-4 h-4 mr-1.5"/> Back
        </button>
        <button 
          onClick={() => setStep(4)} 
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold flex items-center transition"
        >
          Continue to Safety & Review <ChevronRight className="w-4 h-4 ml-1.5"/>
        </button>
      </div>
    </div>
  );

  // Step 4: Safety & Review
  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" /> Step D: Safety Constraints & Pre-Submission Review
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Specify excluded actives or known allergies to guarantee formula safety screening.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Known Allergies & Excluded Actives (comma-separated)
          </label>
          <input 
            type="text" 
            value={formData.reported_sensitivities.join(', ')} 
            onChange={(e) => setFormData({
              ...formData, 
              reported_sensitivities: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)
            })} 
            className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm" 
            placeholder="e.g., Fragrance, Retinoids, Essential Oils, Parabens" 
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Products containing these compounds will be strictly filtered from recommendations.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Budget Tier Preference (INR ₹)
          </label>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-emerald-400">₹</span>
            <input 
              type="number" 
              name="budget_tier_inr" 
              value={formData.budget_tier_inr} 
              onChange={handleChange} 
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm" 
              placeholder="Max per product (e.g. 2500)"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Prioritizes clinical recommendations and dupe alternatives within your price range.
          </p>
        </div>
      </div>

      {/* Summary Box */}
      <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider text-slate-400">Assessment Summary</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-300">
          <div><span className="text-slate-500 block">Skin Type:</span> <strong className="text-white">{formData.skin_type}</strong></div>
          <div><span className="text-slate-500 block">Fitzpatrick:</span> <strong className="text-white">Type {formData.fitzpatrick_phototype}</strong></div>
          <div><span className="text-slate-500 block">Climate:</span> <strong className="text-white">{formData.climate}</strong></div>
          <div><span className="text-slate-500 block">Daily Water:</span> <strong className="text-cyan-400">{formData.lifestyle_water_ml} mL</strong></div>
          <div><span className="text-slate-500 block">Sleep:</span> <strong className="text-indigo-400">{formData.lifestyle_sleep} hrs ({formData.lifestyle_sleep_quality}/10)</strong></div>
          <div><span className="text-slate-500 block">SPF Routine:</span> <strong className="text-emerald-400">{formData.spf_consistency}</strong></div>
        </div>
        {formData.reported_sensitivities.length > 0 && (
          <div className="pt-2 border-t border-slate-800 text-xs">
            <span className="text-rose-400 font-semibold">Excluded Allergens:</span> {formData.reported_sensitivities.join(', ')}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <button 
          onClick={() => setStep(3)} 
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold flex items-center transition"
        >
          <ChevronLeft className="w-4 h-4 mr-1.5"/> Back
        </button>
        <button 
          onClick={submitAssessment} 
          disabled={loading} 
          className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-semibold flex items-center transition"
        >
          <Save className="w-4 h-4 mr-1.5" /> {loading ? 'Calculating Baseline...' : 'Submit Self-Reported Assessment'}
        </button>
      </div>
    </div>
  );

  // Step 5: Results & Report
  const renderResult = () => (
    <div className="space-y-8 animate-fadeIn">
      {/* Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>{result.disclaimer || "Self-Reported Skin Assessment: This score is calculated from self-reported user inputs and lifestyle factors. It does not constitute a medical or dermatological diagnosis."}</span>
      </div>

      {/* Main Score Banner */}
      <div className="p-8 bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 rounded-3xl border border-rose-500/30 text-center relative overflow-hidden">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
        <span className="text-xs uppercase font-bold tracking-widest text-slate-400">Baseline Skin Health Score</span>
        <div className="text-5xl font-black text-white mt-1">
          {result.baseline_score} <span className="text-xl font-normal text-slate-500">/ 100</span>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {result.mapped_actives.map((act, i) => (
            <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Active: {act}
            </span>
          ))}
        </div>
      </div>

      {/* Factor-by-Factor Weight Contributions */}
      {result.factor_contributions && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white">Deterministic Weight Breakdown (PDF Model)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(result.factor_contributions).map(([key, item]) => (
              <div key={key} className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span className="capitalize font-semibold">{key.replace('_', ' ')}</span>
                  <span className="text-rose-400 font-bold">{item.weight} weight</span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-bold text-white">{item.score}</span>
                  <span className="text-xs text-emerald-400">+{item.contribution} pts</span>
                </div>
                {item.explanation && (
                  <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-800/80">{item.explanation}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Products in INR */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" /> Tailored Product Matches (INR ₹)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.recommended_products.map((p, i) => {
            const inrPrice = Math.round(p.price * 84.8);
            return (
              <div key={i} className="p-5 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-3 hover:border-slate-700 transition">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">{p.category} &bull; {p.brand}</span>
                    <span className="text-sm font-black text-emerald-400">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(inrPrice)}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">{p.name}</h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{p.match_reasons?.[0]}</p>
                </div>

                {p.dupe_alternative && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between items-center text-amber-400 font-bold">
                      <span>Budget Dupe: {p.dupe_alternative.brand} {p.dupe_alternative.name}</span>
                      <span>
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Math.round(p.dupe_alternative.price * 84.8))}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{p.dupe_alternative.similarity_reason}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <button 
          onClick={() => { setStep(1); setResult(null); }} 
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition"
        >
          Retake Self-Reported Assessment
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fadeIn space-y-6">
      {/* Title & Medical Disclaimer */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-1.5">Self-Reported Skin Assessment</h2>
        <p className="text-slate-400 text-xs">
          A multi-step, questionnaire-based assessment evaluating self-reported barrier conditions, lifestyle factors, and habit consistency.
        </p>
      </div>

      {step <= 4 && renderStepIndicator()}

      <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-800">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && result && renderResult()}
      </div>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={() => setToast(prev => ({ ...prev, show: false }))}
      />
    </div>
  );
}
