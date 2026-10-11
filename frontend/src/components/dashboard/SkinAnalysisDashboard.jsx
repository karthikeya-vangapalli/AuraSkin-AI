import React, { useState } from 'react';
import { AlertCircle, Check, Droplets, Moon, Sparkles } from 'lucide-react';

const concernOptions = [
  ['acne', 'Acne'],
  ['redness', 'Redness'],
  ['hyperpigmentation', 'Hyperpigmentation'],
  ['dryness', 'Dryness'],
  ['dullness', 'Dullness'],
];

const scoreLabels = {
  condition: 'Condition',
  lifestyle: 'Lifestyle',
  sleep: 'Sleep',
  routine_consistency: 'Consistency',
  hydration: 'Hydration',
};

function RangeField({ label, name, value, min, max, step, suffix, onChange }) {
  return (
    <label className="block text-sm text-slate-300">
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <strong className="text-rose-300">{value}{suffix}</strong>
      </span>
      <input type="range" name={name} min={min} max={max} step={step} value={value} onChange={onChange} className="mt-3 w-full accent-rose-500" />
      <span className="mt-1 flex justify-between text-xs text-slate-500">
        <span>{min}{suffix}</span>
        <span>{max}{suffix}</span>
      </span>
    </label>
  );
}

function RoutineCard({ title, routine = [] }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h4 className="mb-3 text-base font-semibold text-white">{title}</h4>
      <div className="space-y-3">
        {routine.map((item) => (
          <div key={`${title}-${item.step}`} className="border-l-2 border-rose-500/60 pl-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-200">Step {item.step}: {item.category}</span>
              <span className="text-xs text-slate-500">{item.product_type}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Key ingredient: {item.key_ingredient}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function SkinAnalysisDashboard() {
  const [formData, setFormData] = useState({
    water_intake: 2.5,
    sleep_hours: 7.5,
    stress_level: 'medium',
    acne_severity: 2,
    redness_level: 1,
    skin_concerns: ['acne', 'redness'],
    current_season: 'summer',
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = ({ target }) => {
    const numericFields = ['water_intake', 'sleep_hours', 'acne_severity', 'redness_level'];
    setFormData((previous) => ({
      ...previous,
      [target.name]: numericFields.includes(target.name) ? Number(target.value) : target.value,
    }));
  };

  const toggleConcern = (concern) => {
    setFormData((previous) => ({
      ...previous,
      skin_concerns: previous.skin_concerns.includes(concern)
        ? previous.skin_concerns.filter((item) => item !== concern)
        : [...previous.skin_concerns, concern],
    }));
  };

  const handleAnalyze = async (event) => {
    if (event) event.preventDefault();
    console.log('Analyze button clicked!');
    setLoading(true);
    setError(null);

    const waterIntake = formData.water_intake;
    const sleepHours = formData.sleep_hours;
    const stressLevel = formData.stress_level;
    const acneSeverity = formData.acne_severity;
    const rednessSeverity = formData.redness_level;
    const selectedConcerns = formData.skin_concerns;
    const currentSeason = formData.current_season;

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      console.log('Token retrieved:', token);

      const payload = {
        user_id: 'user_123',
        water_intake: Number(waterIntake || 2.5),
        sleep_hours: Number(sleepHours || 7.5),
        stress_level: String(stressLevel || 'medium').toLowerCase(),
        acne_severity: Number(acneSeverity || 0),
        redness_level: Number(rednessSeverity || 0),
        skin_concerns: selectedConcerns || ['acne'],
        current_season: String(currentSeason || 'summer').toLowerCase(),
        routine_days_logged: 5,
      };

      console.log('Sending payload:', payload);

      const aiSkinServiceUrl = import.meta.env.VITE_AI_SKIN_SERVICE_URL || 'https://auraskin-ai-skin-service.onrender.com';
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token && token !== 'undefined' && token !== 'null') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${aiSkinServiceUrl}/api/v1/skin/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      console.log('HTTP Status:', response.status);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || `Server returned status ${response.status}`);
      }

      console.log('RECEIVED API RESULT:', data);
      setResult(data);
    } catch (err) {
      console.error('CATCH ERROR:', err);
      setError(err.message || 'Network request failed');
    } finally {
      console.log('Releasing loading state');
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-h-screen max-w-5xl space-y-6 overflow-y-auto py-8">
      <div>
        <div className="flex items-center gap-2 text-rose-400">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">Personalized intelligence</span>
        </div>
        <h2 className="mt-2 text-3xl font-bold text-white">AI Skin Analysis</h2>
        <p className="mt-2 text-sm text-slate-400">Tell us about your current routine and receive a practical plan for today.</p>
      </div>

      <form onSubmit={(event) => event.preventDefault()} className="glass-card space-y-6 rounded-2xl border border-slate-800 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="mb-4 flex items-center gap-2 text-slate-200"><Droplets className="h-4 w-4 text-cyan-400" /><span className="font-medium">Daily hydration</span></div>
            <RangeField label="Water intake" name="water_intake" value={formData.water_intake.toFixed(1)} min="1.0" max="5.0" step="0.5" suffix="L" onChange={handleChange} />
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="mb-4 flex items-center gap-2 text-slate-200"><Moon className="h-4 w-4 text-indigo-300" /><span className="font-medium">Rest and recovery</span></div>
            <RangeField label="Sleep hours" name="sleep_hours" value={formData.sleep_hours.toFixed(1)} min="4.0" max="12.0" step="0.5" suffix=" hrs" onChange={handleChange} />
          </div>
          <label className="text-sm text-slate-300">
            <span>Stress level</span>
            <select name="stress_level" value={formData.stress_level} onChange={handleChange} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white">
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </label>
          <label className="text-sm text-slate-300">
            <span>Current season</span>
            <select name="current_season" value={formData.current_season} onChange={handleChange} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white">
              <option value="summer">Summer</option><option value="winter">Winter</option><option value="monsoon">Monsoon</option><option value="spring_fall">Spring/Fall</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"><RangeField label="Acne severity" name="acne_severity" value={formData.acne_severity} min="0" max="5" step="1" suffix=" / 5" onChange={handleChange} /></div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"><RangeField label="Redness severity" name="redness_level" value={formData.redness_level} min="0" max="5" step="1" suffix=" / 5" onChange={handleChange} /></div>
        </div>

        <fieldset>
          <legend className="text-sm font-medium text-slate-300">Skin concerns</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {concernOptions.map(([value, label]) => {
              const selected = formData.skin_concerns.includes(value);
              return <button type="button" key={value} onClick={() => toggleConcern(value)} className={`rounded-full border px-3 py-2 text-xs font-medium transition ${selected ? 'border-rose-400 bg-rose-500/15 text-rose-200' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`} aria-pressed={selected}>{selected && <Check className="mr-1 inline h-3 w-3" />}{label}</button>;
            })}
          </div>
        </fieldset>

        <button type="button" onClick={handleAnalyze} disabled={loading} className="w-full rounded-lg bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-wait disabled:opacity-60">
          {loading ? 'Analyzing...' : 'Analyze my skin'}
        </button>
      </form>

      {error && <div role="alert" className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300"><AlertCircle className="h-4 w-4" />{error}</div>}

      {result && <div className="glass-card space-y-6 rounded-2xl border border-slate-800 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-sm text-slate-400">Overall Skin Health Score</p><p className="text-5xl font-bold text-white">{result.overall_skin_health_score}<span className="text-xl text-slate-500">/100</span></p></div>
          <p className="text-sm text-emerald-300">Improvement delta: {result.improvement_delta}</p>
        </div>
        <div className="flex flex-wrap gap-2">{Object.entries(result.score_breakdown || {}).map(([key, value]) => <span key={key} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300">{scoreLabels[key] || key}: <strong className="text-white">{value}</strong></span>)}</div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div><h3 className="mb-3 font-semibold text-white">Prioritized Concerns</h3><div className="flex flex-wrap gap-2">{(result.prioritized_concerns || []).map((concern) => <span key={concern} className="rounded-full bg-amber-500/15 px-3 py-1.5 text-xs text-amber-200">{concern}</span>)}</div></div>
          <div><h3 className="mb-3 font-semibold text-white">Seasonal Adjustments</h3><ul className="space-y-2 text-sm text-slate-300">{(result.seasonal_adjustments || []).map((adjustment) => <li key={adjustment}>• {adjustment}</li>)}</ul></div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><RoutineCard title="AM Routine" routine={result.am_routine} /><RoutineCard title="PM Routine" routine={result.pm_routine} /></div>
      </div>}
    </div>
  );
}
