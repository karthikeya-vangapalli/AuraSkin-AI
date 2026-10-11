import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import SkinProfileForm from './components/dashboard/SkinProfileForm';
import LifestyleTracker from './components/dashboard/LifestyleTracker';
import SkinAnalysisDashboard from './components/dashboard/SkinAnalysisDashboard';
import TextualAssessment from './components/dashboard/TextualAssessment';
import ProductIntelligence from './components/dashboard/ProductIntelligence';
import RoutineTracker from './components/dashboard/RoutineTracker';
import ProgressAnalyticsDashboard from './components/dashboard/ProgressAnalyticsDashboard';
import ConsultantPortal from './components/dashboard/ConsultantPortal';
import ClinicalPortal from './components/dashboard/ClinicalPortal';
import AdminControlCenter from './components/dashboard/AdminControlCenter';
import { Sparkles, ShieldAlert, Stethoscope, Compass } from 'lucide-react';

// Protected Route Wrapper with RBAC Role Check
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-slate-400 text-sm flex items-center space-x-2 animate-pulse">
          <Sparkles className="w-5 h-5 text-rose-500" />
          <span>Authenticating user session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center">
        <div className="glass-card p-8 rounded-3xl border border-slate-800 space-y-4 max-w-md">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h3 className="text-xl font-bold text-white">Access Restricted</h3>
          <p className="text-slate-400 text-sm">
            Your role (<span className="text-rose-400 font-semibold">{role}</span>) does not have authorization to access this clinical portal.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

function RoleBasedRedirect() {
  const { role, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (role === 'Administrator') return <Navigate to="/admin" replace />;
  if (role === 'Dermatologist') return <Navigate to="/clinical" replace />;
  if (role === 'Skincare Consultant') return <Navigate to="/consultations" replace />;
  
  return <Navigate to="/dashboard" replace />;
}

function MainApp() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-6">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['User']}>
                <LifestyleTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['User']}>
                <SkinProfileForm />
              </ProtectedRoute>
            }
          />

          <Route
            path="/skin-analysis"
            element={
              <ProtectedRoute allowedRoles={['User']}>
                <SkinAnalysisDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/textual-assessment"
            element={
              <ProtectedRoute allowedRoles={['User']}>
                <TextualAssessment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/product-intelligence"
            element={
              <ProtectedRoute allowedRoles={['User', 'Administrator']}>
                <ProductIntelligence />
              </ProtectedRoute>
            }
          />
          <Route
            path="/routine-tracker"
            element={
              <ProtectedRoute allowedRoles={['User']}>
                <RoutineTracker />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={['User']}>
                <ProgressAnalyticsDashboard />
              </ProtectedRoute>
            }
          />
          {/* Role Protected Portals */}
          <Route
            path="/consultations"
            element={
              <ProtectedRoute allowedRoles={['Skincare Consultant']}>
                <ConsultantPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clinical"
            element={
              <ProtectedRoute allowedRoles={['Dermatologist']}>
                <ClinicalPortal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['Administrator']}>
                <AdminControlCenter />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<RoleBasedRedirect />} />
          <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© 2026 AuraSkin AI Intelligence Platform. Powered by FastAPI, PostgreSQL, MongoDB & React.</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </Router>
  );
}
