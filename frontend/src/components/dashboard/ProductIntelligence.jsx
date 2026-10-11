import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Sun,
  Moon,
  Clock,
  DollarSign,
  Layers,
  Search,
  Plus,
  X,
  TrendingDown,
  CheckCircle2,
  Info,
  Sliders,
  Filter,
} from 'lucide-react';
import { ingredientService, recommendationService } from '../../services/api';

export const formatPriceInINR = (priceInUSD, exchangeRate = 84.8) => {
  if (priceInUSD === undefined || priceInUSD === null || isNaN(priceInUSD)) return '₹0';
  const inrValue = Math.round(priceInUSD * exchangeRate);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(inrValue);
};


const QUICK_ACTIVES = [
  'Retinol 0.5%',
  'Salicylic Acid 2%',
  'Glycolic Acid 7%',
  'Vitamin C (L-Ascorbic Acid)',
  'Benzoyl Peroxide 2.5%',
  'Niacinamide 10%',
  'Copper Peptides',
  'Hyaluronic Acid',
  'Ceramides NP',
  'Centella Asiatica',
];

const COMMON_ALLERGIES = [
  'Fragrance / Parfum',
  'Essential Oils',
  'Parabens',
  'Sulfates (SLS)',
  'Nut Oils / Almond',
  'Salicylate',
];

const ROUTINE_STEPS_OPTIONS = [
  { id: 'cleanser', label: 'Cleanser' },
  { id: 'toner', label: 'Toner / Essence' },
  { id: 'serum', label: 'Treatment Serum' },
  { id: 'moisturizer', label: 'Moisturizer' },
  { id: 'sunscreen', label: 'Sunscreen (SPF 30+)' },
  { id: 'retinol', label: 'Night Retinoid' },
];

export default function ProductIntelligence() {
  const [activeTab, setActiveTab] = useState('ingredients'); // 'ingredients' or 'recommendations'

  // Ingredient Analyzer State
  const [selectedIngredients, setSelectedIngredients] = useState([
    'Retinol 0.5%',
    'Salicylic Acid 2%',
    'Vitamin C (L-Ascorbic Acid)',
  ]);
  const [customIngredient, setCustomIngredient] = useState('');
  const [userAllergies, setUserAllergies] = useState(['Fragrance / Parfum']);
  const [customAllergy, setCustomAllergy] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  // Recommendations State
  const [skinType, setSkinType] = useState('Combination');
  const [skinConcerns, setSkinConcerns] = useState(['Acne', 'Redness']);
  const [budgetMax, setBudgetMax] = useState(60);
  const [userRoutineSteps, setUserRoutineSteps] = useState(['cleanser', 'serum']);
  const [recommending, setRecommending] = useState(false);
  const [recResult, setRecResult] = useState(null);
  const [recError, setRecError] = useState(null);

  // Add / Remove helpers
  const handleAddIngredient = (ing) => {
    if (ing && !selectedIngredients.includes(ing)) {
      setSelectedIngredients([...selectedIngredients, ing]);
    }
    setCustomIngredient('');
  };

  const handleRemoveIngredient = (ing) => {
    setSelectedIngredients(selectedIngredients.filter((i) => i !== ing));
  };

  const handleToggleAllergy = (allergy) => {
    if (userAllergies.includes(allergy)) {
      setUserAllergies(userAllergies.filter((a) => a !== allergy));
    } else {
      setUserAllergies([...userAllergies, allergy]);
    }
  };

  const handleToggleConcern = (concern) => {
    if (skinConcerns.includes(concern)) {
      setSkinConcerns(skinConcerns.filter((c) => c !== concern));
    } else {
      setSkinConcerns([...skinConcerns, concern]);
    }
  };

  const handleToggleRoutineStep = (stepId) => {
    if (userRoutineSteps.includes(stepId)) {
      setUserRoutineSteps(userRoutineSteps.filter((s) => s !== stepId));
    } else {
      setUserRoutineSteps([...userRoutineSteps, stepId]);
    }
  };

  // Run Ingredient Conflict Check
  const runIngredientAnalysis = async () => {
    if (selectedIngredients.length === 0) {
      setAnalysisError('Please select or add at least one ingredient.');
      return;
    }
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const data = await ingredientService.analyze(selectedIngredients, userAllergies);
      setAnalysisResult(data);
    } catch (err) {
      setAnalysisError(err.response?.data?.detail || 'Ingredient analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Run Product Recommendations Check
  const runProductRecommendations = async () => {
    setRecommending(true);
    setRecError(null);
    try {
      const skinProfile = {
        skin_type: skinType,
        skin_concerns: skinConcerns,
        allergies: userAllergies,
      };
      const data = await recommendationService.getRecommendations(
        skinProfile,
        budgetMax,
        ['fragrance-free'],
        userRoutineSteps
      );
      setRecResult(data);
    } catch (err) {
      setRecError(err.response?.data?.detail || 'Product recommendation query failed.');
    } finally {
      setRecommending(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-purple-950/40 p-8 border border-slate-800 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Milestone 3: AI Product & Formulation Intelligence</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Ingredient Safety & Product Recommender
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl">
              Deterministic chemical conflict detection, allergy screening, photosensitivity SPF enforcement,
              and intelligent regimen gap filler with budget-friendly dupe alternatives.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === 'ingredients'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Ingredient Intelligence</span>
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
                activeTab === 'recommendations'
                  ? 'bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Product Recommender & Dupes</span>
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: INGREDIENT INTELLIGENCE */}
      {activeTab === 'ingredients' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Input Selection Panel */}
            <div className="lg:col-span-5 space-y-6">
              <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Search className="w-4 h-4 text-indigo-400" />
                  <span>Selected Actives for Conflict Scan</span>
                </h3>

                {/* Custom Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddIngredient(customIngredient);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Type custom active (e.g. Tretinoin, AHA)..."
                    value={customIngredient}
                    onChange={(e) => setCustomIngredient(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </form>

                {/* Quick Add Chips */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Quick-Select Key Actives:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ACTIVES.map((act) => {
                      const isSelected = selectedIngredients.includes(act);
                      return (
                        <button
                          key={act}
                          type="button"
                          onClick={() => (isSelected ? handleRemoveIngredient(act) : handleAddIngredient(act))}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                            isSelected
                              ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-semibold'
                              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {act}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Tag Box */}
                <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl min-h-[90px] flex flex-wrap gap-1.5 items-start">
                  {selectedIngredients.length === 0 ? (
                    <span className="text-xs text-slate-600 italic m-auto">No ingredients selected yet.</span>
                  ) : (
                    selectedIngredients.map((ing) => (
                      <span
                        key={ing}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
                      >
                        <span>{ing}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(ing)}
                          className="text-indigo-400 hover:text-white p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Allergy Screen Section */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <label className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
                    <span>Allergy & Sensitivity Profile:</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_ALLERGIES.map((allergy) => {
                      const isChecked = userAllergies.includes(allergy);
                      return (
                        <button
                          key={allergy}
                          type="button"
                          onClick={() => handleToggleAllergy(allergy)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                            isChecked
                              ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-semibold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {isChecked ? '⚠️ ' : ''}
                          {allergy}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Trigger Button */}
                <button
                  type="button"
                  onClick={runIngredientAnalysis}
                  disabled={analyzing}
                  className="w-full py-3.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-rose-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-500/20 transition flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{analyzing ? 'Scanning Formulation Safety...' : 'Run Conflict & Safety Scan'}</span>
                </button>
              </div>
            </div>

            {/* Right: Results Display Panel */}
            <div className="lg:col-span-7 space-y-6">
              {analysisError && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                  {analysisError}
                </div>
              )}

              {!analysisResult && !analyzing && (
                <div className="glass-card p-10 rounded-3xl border border-slate-800 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Ready for Formulation Audit</h4>
                  <p className="text-slate-400 text-xs max-w-md mx-auto">
                    Select active ingredients on the left and trigger the scan to audit cross-chemical incompatibilities,
                    allergies, photosensitivity, frequency limits, and AM/PM routine division.
                  </p>
                </div>
              )}

              {analysisResult && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Status Banner */}
                  <div
                    className={`p-6 rounded-3xl border flex items-start space-x-4 ${
                      analysisResult.is_safe
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {analysisResult.is_safe ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-7 h-7 text-rose-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white">
                        {analysisResult.is_safe
                          ? 'Formulation Safe & Compatible'
                          : 'Chemical Conflict / Allergen Alert'}
                      </h4>
                      <p className="text-xs opacity-90">{analysisResult.summary}</p>
                    </div>
                  </div>

                  {/* Photosensitivity SPF Badge */}
                  {analysisResult.spf_required && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-3 text-amber-300 text-xs">
                      <Sun className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <div>
                        <span className="font-bold">Mandatory SPF 30+ Enforced: </span>
                        <span>
                          Photosensitizing agents detected. Daily broad-spectrum UV protection is non-negotiable.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Incompatibility / Conflict Cards */}
                  {analysisResult.conflicts && analysisResult.conflicts.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Detected Chemical Incompatibilities ({analysisResult.conflicts.length}):
                      </h4>
                      <div className="space-y-3">
                        {analysisResult.conflicts.map((conf, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs font-bold text-white">{conf.ingredient_1}</span>
                                <span className="text-slate-500 text-xs">⚡</span>
                                <span className="text-xs font-bold text-white">{conf.ingredient_2}</span>
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  conf.severity === 'High'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    : conf.severity === 'Moderate'
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}
                              >
                                {conf.severity} Severity
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{conf.warning}</p>
                            <div className="p-2.5 rounded-xl bg-slate-950 text-indigo-300 text-xs flex items-center space-x-2 border border-slate-800">
                              <Info className="w-3.5 h-3.5 flex-shrink-0 text-indigo-400" />
                              <span>{conf.recommendation}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AM vs PM Smart Split Suggestion */}
                  {analysisResult.am_pm_split_suggestion && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Intelligent Regimen Distribution:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* AM Card */}
                        <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-500/5 to-slate-900 border border-amber-500/20 space-y-3">
                          <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                            <Sun className="w-4 h-4" />
                            <span>Morning Regimen (AM)</span>
                          </div>
                          <div className="space-y-1.5">
                            {analysisResult.am_pm_split_suggestion.am.map((ing, i) => (
                              <div
                                key={i}
                                className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 flex items-center space-x-2"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                                <span>{ing}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* PM Card */}
                        <div className="p-5 rounded-2xl bg-gradient-to-b from-purple-500/5 to-slate-900 border border-purple-500/20 space-y-3">
                          <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                            <Moon className="w-4 h-4" />
                            <span>Evening Regimen (PM)</span>
                          </div>
                          <div className="space-y-1.5">
                            {analysisResult.am_pm_split_suggestion.pm.map((ing, i) => (
                              <div
                                key={i}
                                className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 flex items-center space-x-2"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                                <span>{ing}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Frequency Caps */}
                  {analysisResult.frequency_caps && analysisResult.frequency_caps.length > 0 && (
                    <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        <span>Recommended Frequency Guidelines</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {analysisResult.frequency_caps.map((cap, i) => (
                          <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white">{cap.ingredient}</span>
                              <span className="text-indigo-400 font-semibold">{cap.max_frequency}</span>
                            </div>
                            <p className="text-[11px] text-slate-400">{cap.guidance}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT RECOMMENDER & DUPES */}
      {activeTab === 'recommendations' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Preferences & Constraints Filter */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-5">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-rose-400" />
                  <span>Profile & Constraints</span>
                </h3>

                {/* Skin Type */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Skin Type:</label>
                  <select
                    value={skinType}
                    onChange={(e) => setSkinType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="Combination">Combination</option>
                    <option value="Oily">Oily</option>
                    <option value="Dry">Dry</option>
                    <option value="Sensitive">Sensitive</option>
                    <option value="Normal">Normal</option>
                  </select>
                </div>

                {/* Skin Concerns */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400">Target Concerns:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Acne', 'Redness', 'Barrier Damage', 'Hyperpigmentation', 'Dehydration', 'Aging'].map((c) => {
                      const isSel = skinConcerns.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => handleToggleConcern(c)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                            isSel
                              ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 font-semibold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {isSel ? '✓ ' : '+ '}
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Budget Slider */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-400">Max Budget Constraint:</span>
                    <span className="font-bold text-emerald-400">{formatPriceInINR(budgetMax)}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    step="5"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(parseFloat(e.target.value))}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                </div>

                {/* Current Routine Steps for Routine Gap Filler */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-xs font-semibold text-slate-400">Current Regimen Steps (For Gap Analysis):</label>
                  <div className="space-y-1.5">
                    {ROUTINE_STEPS_OPTIONS.map((step) => {
                      const isChecked = userRoutineSteps.includes(step.id);
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => handleToggleRoutineStep(step.id)}
                          className={`w-full p-2 rounded-xl border text-left text-xs flex items-center justify-between transition ${
                            isChecked
                              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                              : 'bg-slate-900 border-slate-800/80 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <span>{step.label}</span>
                          <span className="text-xs">{isChecked ? 'Active ✓' : 'Missing'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={runProductRecommendations}
                  disabled={recommending}
                  className="w-full py-3.5 bg-gradient-to-r from-rose-500 via-purple-600 to-indigo-600 hover:opacity-90 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-lg shadow-rose-500/20 transition flex items-center justify-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{recommending ? 'Generating Recommendations...' : 'Get Tailored Recommendations'}</span>
                </button>
              </div>
            </div>

            {/* Right: Results Display */}
            <div className="lg:col-span-8 space-y-6">
              {recError && (
                <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
                  {recError}
                </div>
              )}

              {!recResult && !recommending && (
                <div className="glass-card p-10 rounded-3xl border border-slate-800 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                    <Layers className="w-7 h-7" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Find Your Clinical Matches</h4>
                  <p className="text-slate-400 text-xs max-w-md mx-auto">
                    Click <strong>Get Tailored Recommendations</strong> to evaluate compatibility scores,
                    discover budget dupe alternatives, and uncover missing foundational routine steps.
                  </p>
                </div>
              )}

              {recResult && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Routine Gap Filler Alert */}
                  {recResult.routine_gaps && recResult.routine_gaps.length > 0 && (
                    <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                      <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <span>Routine Gap Filler: Missing Core Foundational Steps</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Your current regimen lacks essential barrier foundation steps. We have prioritized these matches:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                        {recResult.routine_gaps.map((gap, idx) => (
                          <div key={idx} className="p-3.5 rounded-2xl bg-slate-900 border border-amber-500/20 space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white">Missing: {gap.missing_step}</span>
                              <span className="text-[10px] uppercase font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/20">
                                {gap.importance}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{gap.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendation Cards */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white">
                        Ranked Compatibility Recommendations ({recResult.total_recommendations}):
                      </h4>
                    </div>

                    <div className="space-y-4">
                      {recResult.recommended_products.map((prod) => (
                        <div
                          key={prod.id}
                          className="glass-card p-5 rounded-3xl border border-slate-800 hover:border-slate-700 transition space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                                {prod.category} • {prod.brand}
                              </span>
                              <h4 className="text-base font-bold text-white">{prod.name}</h4>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="text-sm font-bold text-emerald-400">{formatPriceInINR(prod.price)}</span>
                              <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-rose-500/20 to-indigo-500/20 border border-rose-500/30 text-rose-300 font-extrabold text-xs">
                                {prod.suitability_score}% Match
                              </div>
                            </div>
                          </div>

                          {/* Actives & Match Reasons */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500">Key Actives</span>
                              <p className="text-slate-300 font-medium">{prod.key_actives.join(', ')}</p>
                            </div>
                            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1">
                              <span className="text-[10px] uppercase font-bold text-slate-500">Clinical Justification</span>
                              <p className="text-slate-300 font-medium">{prod.match_reasons[0] || 'Matches skin type profile.'}</p>
                            </div>
                          </div>

                          {/* DUPE ALTERNATIVE CARD */}
                          {prod.dupe_alternative && (
                            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-0.5">
                                <div className="flex items-center space-x-2">
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                                    💡 Budget Dupe Alternative
                                  </span>
                                  <span className="text-xs font-bold text-white">
                                    {prod.dupe_alternative.brand} - {prod.dupe_alternative.name}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400">{prod.dupe_alternative.similarity_reason}</p>
                              </div>
                              <div className="flex items-center space-x-2 sm:self-center flex-shrink-0">
                                <span className="text-xs font-bold text-emerald-400">
                                  {formatPriceInINR(prod.dupe_alternative.price)}
                                </span>
                                <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                  Save {prod.dupe_alternative.savings_percentage}%
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
