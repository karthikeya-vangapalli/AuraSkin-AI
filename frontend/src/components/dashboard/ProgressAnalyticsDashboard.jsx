import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Flame,
  Calendar,
  Droplets,
  Bed,
  Sparkles,
  Camera,
  Layers,
  ChevronRight,
  Info,
  CheckCircle2,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { progressService } from '../../services/api';
import Toast from '../common/Toast';

export default function ProgressAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [photoLogs, setPhotoLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

  // Before / After Photo Comparison indices
  const [beforeIndex, setBeforeIndex] = useState(0);
  const [afterIndex, setAfterIndex] = useState(1);
  const [comparisonSliderPos, setComparisonSliderPos] = useState(50);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [analyticsData, photosData] = await Promise.all([
        progressService.getAnalytics(),
        progressService.getPhotos(),
      ]);
      setAnalytics(analyticsData);
      setPhotoLogs(photosData);

      if (photosData && photosData.length >= 2) {
        setBeforeIndex(0);
        setAfterIndex(photosData.length - 1);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Demo Fallback Photos for Before/After Viewer if none uploaded yet
  const samplePhotos = [
    {
      date: '2026-08-25T10:00:00Z',
      photo_url:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
      notes: 'Day 1 Baseline: Mild redness and T-zone congestion.',
      skin_health_score: 6.8,
    },
    {
      date: '2026-09-23T10:00:00Z',
      photo_url:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      notes: 'Day 30 Progress: Barrier fortified, skin radiant and decongested.',
      skin_health_score: 8.9,
    },
  ];

  const activePhotoLogs = photoLogs.length >= 2 ? photoLogs : samplePhotos;
  const beforePhoto = activePhotoLogs[beforeIndex] || activePhotoLogs[0];
  const afterPhoto = activePhotoLogs[afterIndex] || activePhotoLogs[activePhotoLogs.length - 1];

  // Helper for trend line SVG coordinates
  const renderTrendSvg = () => {
    if (!analytics || !analytics.score_trends || analytics.score_trends.length === 0) return null;

    const trends = analytics.score_trends;
    const width = 800;
    const height = 220;
    const paddingX = 40;
    const paddingY = 30;

    const minScore = 5.0;
    const maxScore = 10.0;

    const getX = (idx) => paddingX + (idx / (trends.length - 1)) * (width - 2 * paddingX);
    const getY = (val) => height - paddingY - ((val - minScore) / (maxScore - minScore)) * (height - 2 * paddingY);

    const points = trends.map((t, idx) => `${getX(idx)},${getY(t.score)}`).join(' ');

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56">
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[6, 7, 8, 9, 10].map((level) => {
            const y = getY(level);
            return (
              <g key={level}>
                <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#1e293b" strokeDasharray="4 4" />
                <text x={paddingX - 10} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end">
                  {level}.0
                </text>
              </g>
            );
          })}

          {/* Area fill under curve */}
          <polygon
            points={`${getX(0)},${height - paddingY} ${points} ${getX(trends.length - 1)},${height - paddingY}`}
            fill="url(#scoreGradient)"
          />

          {/* Trend Polyline */}
          <polyline fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />

          {/* Data Points */}
          {trends.map((t, idx) => {
            const cx = getX(idx);
            const cy = getY(t.score);
            return (
              <g key={idx} className="group cursor-pointer">
                <circle
                  cx={cx}
                  cy={cy}
                  r={idx === trends.length - 1 ? 6 : 4}
                  fill={t.am_completed && t.pm_completed ? '#10b981' : '#f43f5e'}
                  stroke="#0f172a"
                  strokeWidth="2"
                  className="transition group-hover:scale-150"
                />
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-rose-950/40 p-8 border border-slate-800 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Milestone 3: Longitudinal Progress & Correlative Analytics</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Analytics & Photo Progress Engine</h1>
          <p className="text-slate-400 text-xs">
            Dynamic health score trends, routine consistency heatmaps, correlative clinical insights, and comparative before/after photo inspection.
          </p>
        </div>

        <div className="flex gap-2 self-start md:self-auto flex-wrap">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition flex items-center space-x-2"
          >
            <span>Export Report (PDF)</span>
          </button>
          <button
            onClick={async () => {
              try {
                const XLSX = await import('xlsx');
                
                // Create workbook
                const wb = XLSX.utils.book_new();
                
                // Sheet 1: Analytics Overview
                const overviewData = [
                  ['Metric', 'Value'],
                  ['Current Streak (Days)', analytics?.current_streak ?? 7],
                  ['Longest Streak (Days)', analytics?.longest_streak ?? 14],
                  ['30-Day Completion Rate (%)', analytics?.completion_rate_30d ?? 86.7],
                  ['7-Day Completion Rate (%)', analytics?.completion_rate_7d ?? 100],
                  ['Average Hydration (mL)', analytics?.average_water_ml ? Math.round(analytics.average_water_ml) : 2350],
                  ['Average Sleep (Hours)', analytics?.average_sleep_hours ? analytics.average_sleep_hours.toFixed(1) : '7.8'],
                ];
                const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
                XLSX.utils.book_append_sheet(wb, wsOverview, "Analytics Overview");
                
                // Sheet 2: Score Trends
                const trends = analytics?.score_trends || [];
                const trendsData = trends.length > 0 
                  ? trends.map(t => ({ Date: t.date, Score: t.score, AM_Completed: t.am_completed, PM_Completed: t.pm_completed }))
                  : [{ Date: 'No Data', Score: '', AM_Completed: '', PM_Completed: '' }];
                const wsTrends = XLSX.utils.json_to_sheet(trendsData);
                XLSX.utils.book_append_sheet(wb, wsTrends, "Score Trends");
                
                // Sheet 3: Correlative Insights
                const insights = analytics?.correlative_insights || [];
                const insightsData = insights.length > 0
                  ? insights.map(i => ({ Factor: i.factor, Impact: i.impact, Description: i.description }))
                  : [{ Factor: 'No Data', Impact: '', Description: '' }];
                const wsInsights = XLSX.utils.json_to_sheet(insightsData);
                XLSX.utils.book_append_sheet(wb, wsInsights, "Correlative Insights");
                
                XLSX.writeFile(wb, "Skincare_Progress_Report.xlsx");
                setToast({ show: true, message: "Progress report exported successfully (.xlsx)!", type: "success" });
              } catch (e) {
                console.error("Failed to export Excel", e);
                setToast({ show: true, message: "Failed to generate Excel report.", type: "error" });
              }
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition flex items-center space-x-2"
          >
            <span>Export Data (.xlsx)</span>
          </button>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center space-x-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Insights</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Top 4 Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak Card */}
        <div className="glass-card p-5 rounded-3xl border border-rose-500/20 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Current Streak</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {analytics?.current_streak ?? 7} <span className="text-sm font-semibold text-rose-400">Days</span>
          </div>
          <p className="text-[11px] text-slate-500">Longest: {analytics?.longest_streak ?? 14} days</p>
        </div>

        {/* 30-Day Completion Rate */}
        <div className="glass-card p-5 rounded-3xl border border-indigo-500/20 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>30-Day Adherence</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {analytics?.completion_rate_30d ?? 86.7}%
          </div>
          <p className="text-[11px] text-slate-500">7-Day: {analytics?.completion_rate_7d ?? 100}%</p>
        </div>

        {/* Average Water */}
        <div className="glass-card p-5 rounded-3xl border border-cyan-500/20 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avg Hydration</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {analytics?.average_water_ml ? Math.round(analytics.average_water_ml) : 2350}{' '}
            <span className="text-sm font-semibold text-cyan-400">mL</span>
          </div>
          <p className="text-[11px] text-slate-500">Target: 2500 mL/day</p>
        </div>

        {/* Average Sleep */}
        <div className="glass-card p-5 rounded-3xl border border-purple-500/20 space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Avg Sleep Hours</span>
            <Bed className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">
            {analytics?.average_sleep_hours ? analytics.average_sleep_hours.toFixed(1) : '7.8'}{' '}
            <span className="text-sm font-semibold text-purple-400">Hours</span>
          </div>
          <p className="text-[11px] text-slate-500">Optimal recovery window</p>
        </div>
      </div>

      {/* Skin Health Score Progression Trend Line Chart */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-rose-400" />
              <span>Skin Health Score Progression (30-Day Longitudinal Trend)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Evaluated based on barrier integrity, erythema reduction, pore congestion, and routine consistency.
            </p>
          </div>
          <div className="flex items-center space-x-3 text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-slate-400">Full AM+PM</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              <span className="text-slate-400">Skin Score</span>
            </div>
          </div>
        </div>

        {renderTrendSvg()}
      </div>

      {/* Consistency Heatmap & Correlative Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 30-Day Heatmap Grid */}
        <div className="lg:col-span-6 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <span>30-Day Routine Consistency Heatmap</span>
          </h3>
          <p className="text-xs text-slate-400">
            Daily visual log of completed morning and evening skincare regimens.
          </p>

          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 pt-2">
            {analytics?.heatmap_data?.map((day, idx) => (
              <div
                key={idx}
                title={`${day.date}: ${day.completion_count} routines completed`}
                className={`h-10 rounded-xl border flex flex-col items-center justify-center text-[10px] font-bold transition transform hover:scale-105 cursor-pointer ${
                  day.level === 2
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : day.level === 1
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-900 border-slate-800 text-slate-600'
                }`}
              >
                <span>{day.date.slice(8)}</span>
                <span className="text-[8px] opacity-70">{day.level === 2 ? 'AM/PM' : day.level === 1 ? '1x' : '—'}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800">
            <span>Less Active</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded bg-slate-900 border border-slate-800"></span>
              <span className="w-3 h-3 rounded bg-amber-500/30 border border-amber-500/50"></span>
              <span className="w-3 h-3 rounded bg-emerald-500/40 border border-emerald-500/70"></span>
            </div>
            <span>High Compliance</span>
          </div>
        </div>

        {/* AI Correlative Insights */}
        <div className="lg:col-span-6 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Correlative Clinical Insights</span>
          </h3>
          <p className="text-xs text-slate-400">
            Multi-variable statistical inferences correlating hydration, sleep, and compliance to skin health.
          </p>

          <div className="space-y-3 pt-1">
            {analytics?.correlative_insights?.map((insight, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 flex items-start space-x-3"
              >
                <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SIDE-BY-SIDE PHOTO PROGRESS COMPARISON VIEWER */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Camera className="w-4 h-4 text-rose-400" />
              <span>Side-by-Side Photographic Progress Viewer</span>
            </h3>
            <p className="text-xs text-slate-400">
              Inspect clinical transformation over time with synchronized before and after views.
            </p>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Delta: +{(afterPhoto.skin_health_score - beforePhoto.skin_health_score).toFixed(1)} Points
            </span>
          </div>
        </div>

        {/* Comparison Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before Photo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-400 uppercase tracking-wider">Before (Baseline)</span>
              <span className="text-slate-400">{new Date(beforePhoto.date).toLocaleDateString()}</span>
            </div>
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
              <img
                src={beforePhoto.photo_url}
                alt="Baseline skin photo"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur border border-slate-800 text-xs font-bold text-white">
                Score: {beforePhoto.skin_health_score} / 10
              </div>
            </div>
            <p className="text-xs text-slate-400 italic bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              "{beforePhoto.notes || 'Baseline condition photo recorded.'}"
            </p>
          </div>

          {/* After Photo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-400 uppercase tracking-wider">After (Current Progress)</span>
              <span className="text-slate-400">{new Date(afterPhoto.date).toLocaleDateString()}</span>
            </div>
            <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-700 bg-slate-950">
              <img
                src={afterPhoto.photo_url}
                alt="Progress skin photo"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/80 backdrop-blur border border-slate-800 text-xs font-bold text-emerald-300">
                Score: {afterPhoto.skin_health_score} / 10
              </div>
            </div>
            <p className="text-xs text-slate-400 italic bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              "{afterPhoto.notes || 'Current progress update photo.'}"
            </p>
          </div>
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
