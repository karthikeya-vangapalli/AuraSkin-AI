import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 3500 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';
  const isWarning = type === 'warning';

  return (
    <div className="fixed top-5 right-5 z-[100] max-w-sm w-full animate-fadeIn transition-all">
      <div className={`p-4 rounded-2xl border backdrop-blur-md shadow-2xl flex items-start gap-3 ${
        isSuccess 
          ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' 
          : isError
          ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
          : isWarning
          ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
          : 'bg-slate-900/90 border-slate-700 text-slate-200'
      }`}>
        <div className="shrink-0 mt-0.5">
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {isError && <AlertCircle className="w-5 h-5 text-rose-400" />}
          {(isWarning || (!isSuccess && !isError)) && <Info className="w-5 h-5 text-amber-400" />}
        </div>
        <div className="flex-1 text-xs font-medium leading-relaxed">
          {message}
        </div>
        {onClose && (
          <button 
            type="button"
            onClick={onClose}
            className="shrink-0 text-slate-400 hover:text-white p-0.5 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
