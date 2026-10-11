import React, { useState, useEffect } from 'react';
import { Stethoscope, FileText, CheckCircle2, ChevronRight, X, Search, Activity, User, ShieldAlert, Sparkles, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import Toast from '../common/Toast';

export default function ClinicalPortal() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const params = {};
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await axios.get('/api/v1/clinical/patients', { 
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setPatients(res.data);
      if (selectedPatient) {
        const updated = res.data.find(p => p.id === selectedPatient.id);
        if (updated) setSelectedPatient(updated);
      }
    } catch (err) {
      console.error("Failed to fetch patients", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSaveNote = async () => {
    if (!clinicalNotes.trim() || !selectedPatient) {
      showToast("Please enter clinical observation text before saving.", "warning");
      return;
    }
    try {
      setSavingNote(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      await axios.post(
        `/api/v1/clinical/patients/${selectedPatient.id}/notes`,
        { content: clinicalNotes.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const newEntry = {
        id: `note-${Date.now()}`,
        content: clinicalNotes.trim(),
        created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };

      setSelectedPatient(prev => ({
        ...prev,
        notes_history: [...(prev.notes_history || []), newEntry]
      }));

      setClinicalNotes('');
      showToast("Clinical observation saved successfully!", "success");
      fetchPatients();
    } catch (e) {
      showToast("Failed to save clinical observation. Ensure clinical authorization.", "error");
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8 animate-fadeIn">
      {/* Dark cyan/teal header banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-teal-900/40 to-cyan-900/40 border border-teal-500/30 flex justify-between items-center">
        <div>
          <div className="flex items-center space-x-3 text-teal-400 mb-2">
            <Stethoscope className="w-8 h-8" />
            <h2 className="text-2xl font-bold text-white">Clinical Dermatology Diagnostic Portal</h2>
          </div>
          <p className="text-slate-400 text-sm">Access patient assessments, skin health trends, and manage clinical notes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Patient Directory Roster */}
        <div className="lg:col-span-1 p-6 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <User className="w-5 h-5 text-teal-400"/> Patient Directory
            </h3>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {patients.length} records
            </span>
          </div>

          {/* Search box for patients */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patient name / email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {loading ? (
            <p className="text-slate-400 text-sm py-4">Loading directory...</p>
          ) : patients.length === 0 ? (
            <div className="p-6 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl text-xs space-y-1">
              <p className="font-semibold text-slate-400">No Assigned Patients</p>
              <p>You currently have no patients assigned. An Administrator must assign patients via the Admin Control Center.</p>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
              {patients.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => { setSelectedPatient(p); setClinicalNotes(''); }}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${selectedPatient?.id === p.id ? 'border-l-4 border-l-teal-400 bg-teal-950/40 border-teal-500/60 shadow-lg' : 'bg-slate-800/50 border-slate-700/80 hover:border-slate-500'}`}
                >
                  <div className="overflow-hidden pr-2">
                    <h4 className="font-bold text-white text-sm flex items-center gap-1.5 flex-wrap">
                      <span className="truncate">{p.full_name}</span>
                      {(p.is_demo || p.id.startsWith('mock-')) && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[9px] font-bold tracking-wider uppercase">[DEMO]</span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">{p.email}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 ${selectedPatient?.id === p.id ? 'text-teal-400' : 'text-slate-500'}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Diagnostics Workspace */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-6">
              {/* Workspace Header */}
              <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                    {selectedPatient.full_name}
                    {(selectedPatient.is_demo || selectedPatient.id.startsWith('mock-')) && (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] uppercase font-bold rounded border border-amber-500/30">
                        [Demo / Sample Record]
                      </span>
                    )}
                  </h3>
                  <p className="text-slate-400 text-xs mt-0.5">{selectedPatient.email} &bull; Identifier: {selectedPatient.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedPatient(null)} 
                  className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition"
                >
                  <X className="w-4 h-4"/>
                </button>
              </div>

              {/* Patient Baseline Vitals & Adherence */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Baseline Health Score</p>
                  <p className="text-3xl font-extrabold text-teal-400">{selectedPatient.skin_health_score}/100</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Routine Adherence</p>
                  <p className="text-3xl font-extrabold text-emerald-400">{selectedPatient.adherence_rate}%</p>
                </div>
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 col-span-2 sm:col-span-1">
                  <p className="text-[11px] text-slate-400 uppercase tracking-wider mb-1">Phototype / Profile</p>
                  <p className="text-lg font-bold text-slate-200 mt-1">{selectedPatient.fitzpatrick_scale || "Type III Fitzpatrick"}</p>
                </div>
              </div>

              {/* Flagged Concerns & Clinical Alerts */}
              <div>
                <h4 className="font-bold text-sm text-slate-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" /> Flagged Clinical Concerns
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPatient.concerns && selectedPatient.concerns.length > 0 ? (
                    selectedPatient.concerns.map((c, i) => (
                      <span key={i} className="px-3 py-1 bg-rose-500/10 text-rose-300 border border-rose-500/20 rounded-full text-xs font-semibold">
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">No acute concerns flagged.</span>
                  )}
                </div>
              </div>

              {/* Diagnostic Notes & Entry */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-teal-400"/> Physician Clinical Diagnostic Notes
                  </h4>
                  <button 
                    onClick={() => window.print()}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Clinical Summary</span>
                  </button>
                </div>
                
                <textarea 
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  rows="3" 
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-slate-300 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Enter medical assessment, clinical prescriptions, or active ingredient adjustments here..."
                />
                
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500 italic">
                    Clinical notes are protected under patient confidentiality protocols.
                  </span>
                  <button 
                    disabled={savingNote || !clinicalNotes.trim()}
                    onClick={handleSaveNote}
                    className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" /> {savingNote ? "Saving..." : "Save Clinical Observation"}
                  </button>
                </div>

                {/* Timestamped Audit Trail of Notes */}
                {selectedPatient.notes_history && selectedPatient.notes_history.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
                    <h5 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Timestamped Clinical Note Trail</h5>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {selectedPatient.notes_history.map((nh, idx) => {
                        const noteKey = nh.id || `note-${idx}`;
                        const isExpanded = expandedNotes[noteKey] !== false; // default open
                        return (
                          <div key={noteKey} className="rounded-xl border border-slate-800 bg-slate-950/80 overflow-hidden text-xs transition">
                            <button
                              type="button"
                              onClick={() => setExpandedNotes(prev => ({ ...prev, [noteKey]: !isExpanded }))}
                              className="w-full p-2.5 flex justify-between items-center text-left hover:bg-slate-900/50 transition"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-teal-400">Clinical Entry #{idx + 1}</span>
                                <span className="text-[10px] text-slate-500">{nh.created_at}</span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="px-3 pb-3 pt-1 border-t border-slate-800/60 text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {nh.content}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[450px] flex items-center justify-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 flex-col gap-3 p-10 bg-slate-900/40">
              <Stethoscope className="w-12 h-12 text-slate-700" />
              <p className="text-sm">Select a patient from the directory to view their clinical diagnostic summary.</p>
            </div>
          )}
        </div>
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
