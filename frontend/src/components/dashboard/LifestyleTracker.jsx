import React, { useState, useEffect } from 'react';
import { lifestyleService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Droplet, Moon, Sun, Flame, MessageSquare, PlusCircle, History, Check, Stethoscope, Sparkles } from 'lucide-react';

const formatLogTimestamp = (rawTimestamp) => {
  if (!rawTimestamp) return { dateStr: 'Today', timeStr: '' };

  const date = new Date(rawTimestamp);
  if (Number.isNaN(date.getTime())) return { dateStr: 'Today', timeStr: '' };

  const dateStr = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return { dateStr, timeStr };
};

export default function LifestyleTracker() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [metrics, setMetrics] = useState({
    water_intake: 2500,
    water_intake_ml: 2500,
    sleep_hours: 7.5,
    sleep_quality: 8,
    sleep_quality_score: 8,
    sun_exposure: 1.5,
    sun_exposure_hours: 1.5,
    stress_level: 4,
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  const fetchHistory = async () => {
    if (user?.id) {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const customConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const logs = await lifestyleService.getHistory(user.id, null, null, 10, customConfig);
        setHistory(Array.isArray(logs) ? logs : (logs?.data && Array.isArray(logs.data) ? logs.data : (logs?.history || [])));
      } catch (err) {
        console.error('Failed to load lifestyle logs history:', err.response?.data || err);
        setHistory([]);
      }
    }
  };

  const [clinicalNotes, setClinicalNotes] = useState([]);

  const fetchNotes = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const { default: ax } = await import('axios');
        const res = await ax.get('/api/v1/clinical/patients/me/notes', { headers: { Authorization: `Bearer ${token}` } });
        setClinicalNotes(res.data);
      } catch (err) {
        console.error(err);
      }
  };

  useEffect(() => {
    fetchHistory();
    fetchNotes();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    // Explicitly cast numeric inputs and format timestamp ISO string to prevent 422 errors
    const payload = {
      water_intake: Number(metrics.water_intake ?? metrics.water_intake_ml ?? 0),
      sun_exposure: Number(metrics.sun_exposure ?? metrics.sun_exposure_hours ?? 0),
      sleep_hours: Number(metrics.sleep_hours || 0),
      sleep_quality: Number(metrics.sleep_quality ?? metrics.sleep_quality_score ?? 7),
      stress_level: Number(metrics.stress_level || 5),
      notes: metrics.notes || '',
      log_date: metrics.date ? new Date(metrics.date).toISOString() : new Date().toISOString(),
    };

    // Attach Bearer token from localStorage (access_token or token) in headers to prevent 401 errors
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    const customConfig = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    try {
      await lifestyleService.logMetrics(payload, customConfig);
      setSuccessMessage('Daily lifestyle metrics recorded successfully!');
      fetchHistory();
    } catch (err) {
      console.error('Lifestyle submission failed:', err.response?.data || err);
      const detail = err.response?.data?.detail;
      const msg = typeof detail === 'string' ? detail : detail?.[0]?.msg || JSON.stringify(detail) || 'Failed to submit daily metrics.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Daily Skincare Lifestyle Tracker</h2>
        <p className="text-slate-400 text-sm">
          Track biological factors that directly impact epidermal hydration, inflammation, and skin barrier health.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-2xl text-teal-300 text-sm flex items-center space-x-2">
          <Check className="w-5 h-5 text-teal-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-sm">
          {errorMessage}
        </div>
      )}

      {clinicalNotes.length > 0 && (
        <div className="p-6 bg-gradient-to-r from-teal-950/40 via-slate-900 to-purple-950/40 border border-teal-500/30 rounded-3xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2 text-base">
              <Check className="w-5 h-5 text-teal-400" />
              <span>Specialist Clinical Notes & Consultant Recommendations</span>
            </h3>
            <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
              {clinicalNotes.length} update{clinicalNotes.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="space-y-3">
            {clinicalNotes.map((n, i) => {
              const isConsultant = n.type === 'consultant';
              return (
                <div key={i} className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    {isConsultant ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs font-semibold inline-flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Skincare Consultant</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 text-xs font-semibold inline-flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                        <span>Dermatologist</span>
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400 font-medium">
                      {n.date ? new Date(n.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed pl-1">{n.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Logging Form */}
      <form onSubmit={handleSubmit} className="glass-card p-8 rounded-3xl border border-slate-800 space-y-8 glow-rose">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Water Intake */}
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-teal-400">
              <div className="flex items-center space-x-2">
                <Droplet className="w-5 h-5" />
                <span className="font-bold text-sm text-white">Water Intake</span>
              </div>
              <span className="text-lg font-black">{metrics.water_intake_ml} ml</span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={metrics.water_intake_ml}
              onChange={(e) => setMetrics({ ...metrics, water_intake_ml: parseInt(e.target.value) })}
              className="w-full accent-teal-400 bg-slate-800 rounded-lg h-2"
            />
            <p className="text-[11px] text-slate-500">Target: ~2,500 ml for optimum cellular hydration</p>
          </div>

          {/* Sleep Hours & Quality */}
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center text-indigo-400">
              <div className="flex items-center space-x-2">
                <Moon className="w-5 h-5" />
                <span className="font-bold text-sm text-white">Sleep Duration & Quality</span>
              </div>
              <span className="text-lg font-black">{metrics.sleep_hours} hrs</span>
            </div>
            <input
              type="range"
              min="2"
              max="12"
              step="0.5"
              value={metrics.sleep_hours}
              onChange={(e) => setMetrics({ ...metrics, sleep_hours: parseFloat(e.target.value) })}
              className="w-full accent-indigo-400 bg-slate-800 rounded-lg h-2"
            />
            <div className="pt-2">
              <span className="text-xs text-slate-400">Quality Score: <strong className="text-indigo-300">{metrics.sleep_quality_score}/10</strong></span>
              <input
                type="range"
                min="1"
                max="10"
                value={metrics.sleep_quality_score}
                onChange={(e) => setMetrics({ ...metrics, sleep_quality_score: parseInt(e.target.value) })}
                className="w-full accent-indigo-500 bg-slate-800 rounded-lg h-1.5 mt-1"
              />
            </div>
          </div>

          {/* Sun Exposure */}
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-amber-400">
              <div className="flex items-center space-x-2">
                <Sun className="w-5 h-5" />
                <span className="font-bold text-sm text-white">Outdoor Sun Exposure</span>
              </div>
              <span className="text-lg font-black">{metrics.sun_exposure_hours} hrs</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={metrics.sun_exposure_hours}
              onChange={(e) => setMetrics({ ...metrics, sun_exposure_hours: parseFloat(e.target.value) })}
              className="w-full accent-amber-400 bg-slate-800 rounded-lg h-2"
            />
            <p className="text-[11px] text-slate-500">Always apply SPF 50+ if exposure exceeds 30 minutes</p>
          </div>

          {/* Stress Level */}
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-rose-400">
              <div className="flex items-center space-x-2">
                <Flame className="w-5 h-5" />
                <span className="font-bold text-sm text-white">Self-Reported Stress</span>
              </div>
              <span className="text-lg font-black">{metrics.stress_level}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={metrics.stress_level}
              onChange={(e) => setMetrics({ ...metrics, stress_level: parseInt(e.target.value) })}
              className="w-full accent-rose-500 bg-slate-800 rounded-lg h-2"
            />
            <p className="text-[11px] text-slate-500">Cortisol spikes increase sebum production & breakout risk</p>
          </div>

          {/* Log Date */}
          <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-rose-400">
              <span className="font-bold text-sm text-white">Log Date</span>
              <span className="text-xs text-slate-400">{metrics.date || 'Today'}</span>
            </div>
            <input
              type="date"
              value={metrics.date}
              onChange={(e) => setMetrics({ ...metrics, date: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-rose-500"
            />
            <p className="text-[11px] text-slate-500">Pick date for retroactive tracking or leave as today</p>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-slate-400" />
            <span>Daily Observations / Trigger Notes</span>
          </label>
          <textarea
            rows="3"
            value={metrics.notes}
            onChange={(e) => setMetrics({ ...metrics, notes: e.target.value })}
            placeholder="e.g. Tried new sunscreen, high humidity day, mild redness on cheek..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-500 via-rose-500 to-purple-600 hover:from-teal-600 hover:to-purple-700 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-teal-500/10 transition"
        >
          <PlusCircle className="w-5 h-5" />
          <span>{loading ? 'Recording Log...' : 'Record Daily Lifestyle Log'}</span>
        </button>
      </form>

      {/* History Log */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-slate-300">
          <History className="w-5 h-5 text-rose-400" />
          <h3 className="font-bold text-lg">Recent Tracking Logs History</h3>
        </div>

        {Array.isArray(history) && history.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Array.isArray(history) ? history : []).map((log) => (
              <div key={log.id} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-semibold text-rose-400">
                    {formatLogTimestamp(log.created_at || log.timestamp || log.logged_at || log.date || log.log_date).dateStr}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {formatLogTimestamp(log.created_at || log.timestamp || log.logged_at || log.date || log.log_date).timeStr}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Water</span>
                    <strong className="text-teal-400">{log.water_intake ?? log.water_intake_ml ?? log.water ?? 0}ml</strong>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Sleep</span>
                    <strong className="text-indigo-400">{log.sleep_hours}h</strong>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Sun</span>
                    <strong className="text-amber-400">{log.sun_exposure ?? log.sun_exposure_hours ?? log.sun ?? 0}h</strong>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Stress</span>
                    <strong className="text-rose-400">{log.stress_level}/10</strong>
                  </div>
                </div>
                {log.notes && <p className="text-xs text-slate-400 italic mt-1">"{log.notes}"</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card p-6 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
            No history logs recorded yet. Use the form above to log today's metrics!
          </div>
        )}
      </div>
    </div>
  );
}
