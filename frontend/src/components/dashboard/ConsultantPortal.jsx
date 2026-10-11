import React, { useState, useEffect } from 'react';
import { Compass, Users, Sparkles, Filter, Search, X, AlertTriangle, ShieldCheck, Printer, CheckCircle2, Check, UserCheck, ArrowRight } from 'lucide-react';
import API from '../../services/api';
import Toast from '../common/Toast';

export default function ConsultantPortal() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConcern, setSelectedConcern] = useState('All');
  const [selectedClient, setSelectedClient] = useState(null);
  const [recommendationText, setRecommendationText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [activeChecklist, setActiveChecklist] = useState({});

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedConcern && selectedConcern !== 'All') params.concern = selectedConcern;

      const res = await API.get('/api/v1/clinical/consultations/clients', { params });
      setClients(res.data);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchClients();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedConcern]);

  const handleSaveRecommendation = async () => {
    if (!recommendationText.trim() || !selectedClient) return;
    try {
      setSavingNote(true);
      await API.post(
        `/api/v1/clinical/consultations/${selectedClient.id}/recommendations`,
        { content: recommendationText.trim() }
      );
      
      const newRec = {
        id: `rec-${Date.now()}`,
        content: recommendationText.trim(),
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      setSelectedClient(prev => ({
        ...prev,
        recommendations: [...(prev.recommendations || []), newRec]
      }));

      setRecommendationText('');
      showToast("Cosmetic recommendations saved successfully!", "success");
      fetchClients();
    } catch (e) {
      showToast("Failed to save cosmetic recommendation. Ensure consultant credentials are valid.", "error");
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-900/40 to-fuchsia-900/40 border border-purple-500/30">
        <div className="flex items-center space-x-3 text-purple-400 mb-2">
          <Compass className="w-8 h-8" />
          <h2 className="text-2xl font-bold text-white">Client Skincare Consultations Desk</h2>
        </div>
        <p className="text-slate-400 text-sm">Review client skin profiles, active ingredients, and optimize routines.</p>
      </div>

      {/* Main Client Desk Container */}
      <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800">
        {/* Header Controls: Search & Concern Filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-purple-400"/> Active Clients ({clients.length})
          </h3>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Box */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search client by name / email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-400" />
              <select
                value={selectedConcern}
                onChange={(e) => setSelectedConcern(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="All">All Concerns</option>
                <option value="Dehydration">Dehydration</option>
                <option value="Texture">Texture</option>
                <option value="Acne">Acne</option>
                <option value="Active Acne">Active Acne</option>
                <option value="Retinoid Sensitivity">Retinoid Sensitivity</option>
                <option value="Dryness">Dryness</option>
                <option value="Sun Sensitivity">Sun Sensitivity</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clients 3-column Grid */}
        {loading ? (
          <p className="text-slate-400 py-8 text-center">Loading clients...</p>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl p-8 space-y-3 bg-slate-950/40">
            <div className="w-14 h-14 mx-auto rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Compass className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-slate-300 text-base">No Assigned Clients</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              You currently have no clients assigned to your consultant desk. When the Administrator assigns patients to you, their diagnostics and regimens will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map(c => (
              <div key={c.id} className="p-5 bg-slate-800/40 border border-slate-700 rounded-xl hover:border-purple-500/50 transition flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-white text-lg flex items-center gap-1.5 flex-wrap">
                    <span>{c.full_name}</span>
                    {(c.is_demo || c.id.startsWith('mock-')) && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold tracking-wider uppercase">[DEMO RECORD]</span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400 mb-4">{c.email}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Health Score</span>
                      <span className="font-bold text-emerald-400">{c.skin_health_score}/100</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Adherence</span>
                      <span className="font-bold text-blue-400">{c.adherence_rate}%</span>
                    </div>
                    {c.skin_type && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Skin Type</span>
                        <span className="font-medium text-slate-300">{c.skin_type}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1.5 uppercase font-semibold tracking-wider">Top Concerns</p>
                    <div className="flex flex-wrap gap-1.5">
                      {c.concerns?.map((concern, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-purple-500/10 text-purple-300 rounded text-[10px] font-bold border border-purple-500/20">
                          {concern}
                        </span>
                      ))}
                    </div>
                  </div>

                  {c.current_actives && c.current_actives.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5 uppercase font-semibold tracking-wider">Current Regimen Actives</p>
                      <div className="flex flex-wrap gap-1.5">
                        {c.current_actives.map((act, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-medium border border-slate-700">
                            {act}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {c.has_conflict && (
                    <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] leading-tight">
                      <span className="font-bold block flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 inline text-rose-400" /> Active Interaction Detected
                      </span>
                      {c.conflict_warning}
                    </div>
                  )}

                  {c.recommendations && c.recommendations.length > 0 && (
                    <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/20 text-purple-200 text-[11px]">
                      <span className="font-semibold block text-slate-400">Latest Optimization:</span>
                      "{c.recommendations[c.recommendations.length - 1].content}"
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      setSelectedClient(c);
                      setRecommendationText('');
                    }} 
                    className="w-full mt-2 py-2 bg-slate-700 hover:bg-purple-600 text-white rounded text-sm transition flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4"/> Optimize Routine
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Routine Optimization Slide-Over Drawer */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
          <div className="bg-slate-900 border-l border-purple-500/40 w-full max-w-2xl h-full p-6 sm:p-8 overflow-y-auto space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" /> {selectedClient.full_name}
                    </h3>
                    {(selectedClient.is_demo || selectedClient.id.startsWith('mock-')) && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-bold uppercase">[DEMO RECORD]</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedClient.email} &bull; Phototype: {selectedClient.fitzpatrick_scale || 'Type III'}</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Client Skin Summary & Reported Barrier Goals */}
              <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> Client Skin Summary & Barrier Goals
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Skin Type</span>
                    <span className="font-bold text-slate-200 text-xs">{selectedClient.skin_type || 'Combination'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Health Score</span>
                    <span className="font-bold text-emerald-400 text-xs">{selectedClient.skin_health_score}/100</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-center">
                    <span className="text-[11px] text-slate-400 block">Adherence Rate</span>
                    <span className="font-bold text-blue-400 text-xs">{selectedClient.adherence_rate}%</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-300 flex items-center justify-between">
                  <span className="text-slate-400">Barrier Care Objective:</span>
                  <span className="font-semibold text-purple-300">
                    {selectedClient.barrier_goal || "Epidermal barrier stabilization & active hydration"}
                  </span>
                </div>
              </div>

              {/* AM / PM Routines with Toggle Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                    <span>AM Regimen Checklist</span>
                    <span className="text-[10px] text-slate-500 font-normal">Click to toggle review</span>
                  </h4>
                  <ul className="text-xs space-y-2 text-slate-300">
                    {(selectedClient.current_am_routine || ["Gentle Cleanser", "Hydrating Toner", "Moisturizer", "SPF 50"]).map((step, idx) => {
                      const key = `am-${idx}`;
                      const isChecked = !!activeChecklist[key];
                      return (
                        <li 
                          key={idx}
                          onClick={() => setActiveChecklist(prev => ({ ...prev, [key]: !prev[key] }))}
                          className={`p-2 rounded-xl border cursor-pointer transition flex items-center gap-2.5 ${
                            isChecked 
                              ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' 
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold border transition ${
                            isChecked ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-700 bg-slate-800 text-slate-400'
                          }`}>
                            {isChecked ? '✓' : idx + 1}
                          </div>
                          <span className={`flex-1 ${isChecked ? 'line-through text-slate-400' : ''}`}>{step}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center justify-between">
                    <span>PM Regimen Checklist</span>
                    <span className="text-[10px] text-slate-500 font-normal">Click to toggle review</span>
                  </h4>
                  <ul className="text-xs space-y-2 text-slate-300">
                    {(selectedClient.current_pm_routine || ["Double Cleansing", "Active Treatment", "Barrier Recovery Cream"]).map((step, idx) => {
                      const key = `pm-${idx}`;
                      const isChecked = !!activeChecklist[key];
                      return (
                        <li 
                          key={idx}
                          onClick={() => setActiveChecklist(prev => ({ ...prev, [key]: !prev[key] }))}
                          className={`p-2 rounded-xl border cursor-pointer transition flex items-center gap-2.5 ${
                            isChecked 
                              ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-200' 
                              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] font-bold border transition ${
                            isChecked ? 'bg-indigo-500 border-indigo-400 text-slate-950' : 'border-slate-700 bg-slate-800 text-slate-400'
                          }`}>
                            {isChecked ? '✓' : idx + 1}
                          </div>
                          <span className={`flex-1 ${isChecked ? 'line-through text-slate-400' : ''}`}>{step}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              {/* Ingredient Interactions / Conflicts with Soft Amber/Rose Border */}
              {selectedClient.has_conflict ? (
                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-400">
                    <AlertTriangle className="w-4 h-4" /> Active Ingredient Conflict Warning
                  </div>
                  <p className="text-slate-300 leading-relaxed">{selectedClient.conflict_warning}</p>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>No severe ingredient incompatibilities detected across active regimen steps.</span>
                </div>
              )}

              {/* Consultation Scope Disclaimer */}
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-purple-300 text-[11px] leading-relaxed">
                <span className="font-bold block text-purple-200 mb-0.5">Cosmetic Consultation Scope:</span>
                Recommendations are formulated for daily cosmetic routine optimization and barrier maintenance. They do not constitute clinical diagnoses.
              </div>

              {/* Regimen Optimization Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Provide Regimen Optimization & Active Ingredient Recommendations
                </label>
                <textarea
                  value={recommendationText}
                  onChange={(e) => setRecommendationText(e.target.value)}
                  rows={3}
                  placeholder="e.g., Alternate Retinol and AHA to reduce barrier strain; introduce Ceramide moisturizer in PM..."
                  className="w-full p-3.5 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* History trail */}
              {selectedClient.recommendations && selectedClient.recommendations.length > 0 && (
                <div className="border-t border-slate-800 pt-3 space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Previous Consultation History</h5>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {selectedClient.recommendations.map((rec, idx) => (
                      <div key={rec.id || idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                        <div className="flex justify-between text-[11px] text-purple-400 mb-1">
                          <span>Consultation #{idx + 1}</span>
                          <span className="text-slate-500">{rec.created_at}</span>
                        </div>
                        <p className="text-slate-300">{rec.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" /> Print Summary
              </button>
              <button
                type="button"
                disabled={savingNote || !recommendationText.trim()}
                onClick={handleSaveRecommendation}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-purple-600/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{savingNote ? "Saving..." : "Save Recommendations"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(prev => ({ ...prev, show: false }))}
        />
      )}
    </div>
  );
}
