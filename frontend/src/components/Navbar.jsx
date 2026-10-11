import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, User, Activity, LogOut, ShieldCheck, Stethoscope, Compass, Layers, CheckCircle2, TrendingUp } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout, role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-rose-500/20 group-hover:scale-105 transition">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            AuraSkin <span className="text-rose-500 font-light">AI</span>
          </span>
        </Link>

        {/* Dynamic RBAC Nav Options */}
        {isAuthenticated && (
          <nav className="hidden xl:flex space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            
            {/* Consumer / User Tabs */}
            {role === 'User' && (
              <>
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    isActive('/dashboard') ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Lifestyle</span>
                </Link>

                <Link
                  to="/profile"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    isActive('/profile') ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Skin Profile</span>
                </Link>

                <Link
                  to="/skin-analysis"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    isActive('/skin-analysis') ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Assessment</span>
                </Link>

                <Link
                  to="/textual-assessment"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    isActive('/textual-assessment') ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Textual Assessment</span>
                </Link>

                <Link
                  to="/product-intelligence"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    isActive('/product-intelligence') ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-indigo-300'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Product & Actives</span>
                </Link>

                <Link
                  to="/routine-tracker"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    isActive('/routine-tracker') ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-rose-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Daily Routine</span>
                </Link>

                <Link
                  to="/analytics"
                  className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    isActive('/analytics') ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-purple-300'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                  <span>Analytics & Photos</span>
                </Link>
              </>
            )}

            {/* Role Specific Navigation */}
            {role === 'Skincare Consultant' && (
              <Link
                to="/consultations"
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  isActive('/consultations') ? 'bg-purple-500 text-white shadow' : 'text-slate-400 hover:text-purple-300'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-purple-400" />
                <span>Client Consultations</span>
              </Link>
            )}

            {role === 'Dermatologist' && (
              <Link
                to="/clinical"
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                  isActive('/clinical') ? 'bg-teal-500 text-white shadow' : 'text-slate-400 hover:text-teal-300'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                <span>Clinical Diagnostics</span>
              </Link>
            )}

            {role === 'Administrator' && (
              <>
                <Link
                  to="/admin"
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    isActive('/admin') ? 'bg-amber-500 text-white shadow' : 'text-slate-400 hover:text-amber-300'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Admin Console</span>
                </Link>
                <Link
                  to="/product-intelligence"
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                    isActive('/product-intelligence') ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-indigo-300'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Product Catalog</span>
                </Link>
              </>
            )}
          </nav>
        )}

        {/* User Badge & Actions */}
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-slate-200">{user?.full_name || 'User'}</span>
                <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded border border-purple-500/20">
                  {role}
                </span>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="p-2 bg-slate-900 hover:bg-rose-500/20 border border-slate-800 hover:border-rose-500/30 rounded-xl text-slate-400 hover:text-rose-400 transition"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Link
                to="/login"
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition shadow-md shadow-rose-500/20"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
