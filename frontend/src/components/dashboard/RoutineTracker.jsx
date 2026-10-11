import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Sun,
  Moon,
  Droplets,
  Bed,
  Flame,
  Camera,
  Smile,
  Save,
  Calendar,
  Sparkles,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { progressService } from '../../services/api';

const AM_STEPS = [
  { id: 'am_cleanser', label: 'Gentle Cleanser', category: 'Cleanser' },
  { id: 'am_toner', label: 'Hydrating Essence / Toner', category: 'Toner' },
  { id: 'am_antioxidant', label: 'Vitamin C / Antioxidant Serum', category: 'Serum' },
  { id: 'am_moisturizer', label: 'Barrier Moisturizer', category: 'Moisturizer' },
  { id: 'am_sunscreen', label: 'Broad-Spectrum SPF 30+ / 50+', category: 'Sunscreen' },
];

const PM_STEPS = [
  { id: 'pm_double_cleanse', label: 'Oil Cleanser / Micellar Water', category: 'First Cleanse' },
  { id: 'pm_cleanser', label: 'Gentle SA / Gel Cleanser', category: 'Second Cleanse' },
  { id: 'pm_actives', label: 'Active Retinoid or Exfoliant', category: 'Treatment' },
  { id: 'pm_serum', label: 'Niacinamide / Hyaluronic Serum', category: 'Hydration' },
  { id: 'pm_moisturizer', label: 'Deep Nourishing Night Cream', category: 'Barrier Repair' },
];

const SKIN_FEELINGS = [
  { id: 'Glowing', label: 'Glowing ✨', color: 'from-amber-500/20 to-yellow-500/20 text-yellow-300' },
  { id: 'Calm', label: 'Calm & Balanced 🌿', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-300' },
  { id: 'Dry', label: 'Tight / Dry 🏜️', color: 'from-blue-500/20 to-cyan-500/20 text-cyan-300' },
  { id: 'Breakout', label: 'Active Breakout 🔴', color: 'from-rose-500/20 to-red-500/20 text-rose-300' },
  { id: 'Sensitive', label: 'Irritated / Stinging ⚡', color: 'from-purple-500/20 to-indigo-500/20 text-purple-300' },
];

export default function RoutineTracker() {
  const [completedSteps, setCompletedSteps] = useState(['am_cleanser', 'am_sunscreen']);
  const [waterMl, setWaterMl] = useState(2250);
  const [sleepHours, setSleepHours] = useState(7.5);
  const [stressLevel, setStressLevel] = useState('Low');
  const [skinFeeling, setSkinFeeling] = useState('Calm');
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [skinHealthScore, setSkinHealthScore] = useState(8.5);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Load today's progress on mount
  useEffect(() => {
    async function loadToday() {
      try {
        const todayData = await progressService.getTodayProgress();
        if (todayData) {
          if (todayData.completed_steps) setCompletedSteps(todayData.completed_steps);
          if (todayData.water_ml) setWaterMl(todayData.water_ml);
          if (todayData.sleep_hours) setSleepHours(todayData.sleep_hours);
          if (todayData.stress_level) setStressLevel(todayData.stress_level);
          if (todayData.skin_feeling) setSkinFeeling(todayData.skin_feeling);
          if (todayData.photo_url) setPhotoUrl(todayData.photo_url);
          if (todayData.notes) setNotes(todayData.notes);
          if (todayData.skin_health_score) setSkinHealthScore(todayData.skin_health_score);
        }
      } catch (err) {
        console.error('Failed to load today progress', err);
      }
    }
    loadToday();
  }, []);

  const handleToggleStep = (stepId) => {
    if (completedSteps.includes(stepId)) {
      setCompletedSteps(completedSteps.filter((s) => s !== stepId));
    } else {
      setCompletedSteps([...completedSteps, stepId]);
    }
  };

  const isAmComplete = AM_STEPS.every((s) => completedSteps.includes(s.id));
  const isPmComplete = PM_STEPS.every((s) => completedSteps.includes(s.id));

  const handleSaveProgress = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSavedSuccess(false);

    try {
      const payload = {
        am_routine_completed: isAmComplete,
        pm_routine_completed: isPmComplete,
        completed_steps: completedSteps,
        water_ml: waterMl,
        sleep_hours: sleepHours,
        stress_level: stressLevel,
        skin_feeling: skinFeeling,
        photo_url: photoUrl || null,
        notes: notes || null,
        skin_health_score: skinHealthScore,
      };

      await progressService.logDailyProgress(payload);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Failed to save daily routine log.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-rose-950/40 to-purple-950/40 p-8 border border-slate-800 shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Daily Regimen & Lifestyle Check-In</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Routine & Progress Tracker</h1>
          <p className="text-slate-400 text-xs">
            Log daily AM/PM skincare steps, cellular recovery metrics, and track visible skin progress.
          </p>
        </div>

        <button
          onClick={handleSaveProgress}
          disabled={saving}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition flex items-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Daily Log'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Daily progress recorded successfully! Streak and analytics updated.</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Routine Checklists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AM ROUTINE CHECKLIST */}
        <div className="glass-card p-6 rounded-3xl border border-amber-500/20 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
              <Sun className="w-5 h-5" />
              <span>Morning Routine (AM)</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                isAmComplete
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              }`}
            >
              {isAmComplete ? 'Completed ✓' : `${completedSteps.filter((s) => s.startsWith('am_')).length}/5 Steps`}
            </span>
          </div>

          <div className="space-y-2">
            {AM_STEPS.map((step) => {
              const isChecked = completedSteps.includes(step.id);
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleToggleStep(step.id)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                    isChecked
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">{step.category}</span>
                    <span className="text-xs font-semibold text-white">{step.label}</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                      isChecked
                        ? 'bg-amber-500 border-amber-400 text-slate-950 font-bold'
                        : 'border-slate-700 bg-slate-950'
                    }`}
                  >
                    {isChecked ? '✓' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PM ROUTINE CHECKLIST */}
        <div className="glass-card p-6 rounded-3xl border border-purple-500/20 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-purple-400 font-bold text-sm">
              <Moon className="w-5 h-5" />
              <span>Evening Routine (PM)</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                isPmComplete
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
              }`}
            >
              {isPmComplete ? 'Completed ✓' : `${completedSteps.filter((s) => s.startsWith('pm_')).length}/5 Steps`}
            </span>
          </div>

          <div className="space-y-2">
            {PM_STEPS.map((step) => {
              const isChecked = completedSteps.includes(step.id);
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleToggleStep(step.id)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                    isChecked
                      ? 'bg-purple-500/10 border-purple-500/40 text-purple-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 block">{step.category}</span>
                    <span className="text-xs font-semibold text-white">{step.label}</span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                      isChecked
                        ? 'bg-purple-500 border-purple-400 text-white font-bold'
                        : 'border-slate-700 bg-slate-950'
                    }`}
                  >
                    {isChecked ? '✓' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Lifestyle Factors & Skin Feeling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Water Intake */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-xs">
              <Droplets className="w-4 h-4" />
              <span>Hydration (mL)</span>
            </div>
            <span className="text-sm font-bold text-white">{waterMl} mL</span>
          </div>

          <input
            type="range"
            min="500"
            max="4000"
            step="250"
            value={waterMl}
            onChange={(e) => setWaterMl(parseInt(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setWaterMl((prev) => Math.min(4000, prev + 250))}
              className="flex-1 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-cyan-300 transition"
            >
              +250 mL
            </button>
            <button
              type="button"
              onClick={() => setWaterMl((prev) => Math.min(4000, prev + 500))}
              className="flex-1 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-cyan-300 transition"
            >
              +500 mL
            </button>
          </div>
        </div>

        {/* Sleep Hours */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
              <Bed className="w-4 h-4" />
              <span>Sleep Duration</span>
            </div>
            <span className="text-sm font-bold text-white">{sleepHours} Hours</span>
          </div>

          <input
            type="range"
            min="3"
            max="12"
            step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(parseFloat(e.target.value))}
            className="w-full accent-indigo-400 cursor-pointer"
          />

          <div className="text-[11px] text-slate-400 text-center">
            {sleepHours >= 7.5 ? 'Optimal cellular regeneration window 💤' : 'Sub-optimal recovery time'}
          </div>
        </div>

        {/* Stress Level */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs">
            <Flame className="w-4 h-4" />
            <span>Stress Level</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['Low', 'Medium', 'High'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setStressLevel(lvl)}
                className={`py-2 rounded-xl text-xs font-bold border transition ${
                  stressLevel === lvl
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 text-center">
            Cortisol impact: {stressLevel === 'Low' ? 'Minimal' : stressLevel === 'Medium' ? 'Moderate' : 'High trigger'}
          </div>
        </div>
      </div>

      {/* Skin Feeling & Photo Record Section */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
        {/* Skin Feeling Tags */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-white flex items-center space-x-2">
            <Smile className="w-4 h-4 text-emerald-400" />
            <span>How does your skin feel today?</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {SKIN_FEELINGS.map((feel) => (
              <button
                key={feel.id}
                type="button"
                onClick={() => setSkinFeeling(feel.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                  skinFeeling === feel.id
                    ? `bg-gradient-to-r ${feel.color} border-slate-700 shadow-md scale-105`
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {feel.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes & Photo Upload Record */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Daily Skin Observation Notes:</label>
            <textarea
              rows={3}
              placeholder="e.g. Minor redness on left cheek after retinoid; skin texture noticeably smoother..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Camera className="w-3.5 h-3.5 text-indigo-400" />
              <span>Progress Photo URL / Image Record:</span>
            </label>
            <input
              type="text"
              placeholder="https://example.com/skin-progress-day14.jpg"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {photoUrl && (
              <div className="mt-2 flex items-center space-x-3 p-2 bg-slate-950 rounded-xl border border-slate-800">
                <img
                  src={photoUrl}
                  alt="Progress preview"
                  className="w-12 h-12 object-cover rounded-lg border border-slate-700"
                  onError={(e) => (e.target.style.display = 'none')}
                />
                <span className="text-[11px] text-slate-400">Photo preview loaded for comparison viewer.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
