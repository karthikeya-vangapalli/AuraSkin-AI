import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Activity, Package, Search, Filter, 
  UserCheck, X, CheckCircle2, UserX, Stethoscope, Sparkles, HelpCircle, AlertTriangle, Loader2 
} from 'lucide-react';
import axios from 'axios';
import API, { userService, assignmentService } from '../../services/api';
import Toast from '../common/Toast';

const USER_SERVICE_BASE = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8001';
const PROFILE_SERVICE_BASE = import.meta.env.VITE_PROFILE_SERVICE_URL || 'http://localhost:8002';
const AI_SKIN_SERVICE_BASE = import.meta.env.VITE_AI_SKIN_SERVICE_URL || 'https://auraskin-ai-skin-service.onrender.com';

export default function AdminControlCenter() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Assignment Modal State
  const [assignmentModalUser, setAssignmentModalUser] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [targetSpecialistRole, setTargetSpecialistRole] = useState('Dermatologist');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [assigningLoading, setAssigningLoading] = useState(false);

  // Revocation Confirmation Modal State
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokingLoading, setRevokingLoading] = useState(false);

  // Modern In-App Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const [health, setHealth] = useState({ user: 'Checking...', profile: 'Checking...', ai: 'Checking...' });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchStats = async () => {
    try {
      const data = await userService.getStatsSummary();
      setStats(data);
    } catch (err) {
      try {
        const res = await axios.get(`${USER_SERVICE_BASE}/api/v1/users/stats/summary`, {
          headers: getAuthHeaders()
        });
        setStats(res.data);
      } catch (directErr) {
        console.warn("Could not fetch user stats summary", directErr);
      }
    }
  };

  const fetchAssignments = async () => {
    try {
      const data = await assignmentService.getAssignments("active");
      setAssignments(data);
    } catch (err) {
      console.warn("Could not fetch assignments", err);
    }
  };

  const fetchUsers = async (search = searchQuery, role = roleFilter) => {
    setLoading(true);
    try {
      const params = {};
      if (search && search.trim()) params.search = search.trim();
      if (role && role !== 'All') params.role = role;

      let data;
      try {
        const res = await axios.get(`${USER_SERVICE_BASE}/api/v1/users/`, { 
          params,
          headers: getAuthHeaders() 
        });
        data = res.data;
      } catch (directErr) {
        data = await userService.getUsers(params);
      }

      setUsers(data);
      setError('');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to fetch users. Access might be restricted.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  const checkHealth = async () => {
    const parseStatus = (res) => {
      if (res && res.data) {
        if (res.data.status === 'healthy') return 'Online';
        if (res.data.status === 'degraded') return 'Degraded';
      }
      return 'Online';
    };

    try {
      const res = await axios.get(`${USER_SERVICE_BASE}/health`, { timeout: 3000 })
        .catch(() => axios.get('/api/v1/users/health', { timeout: 3000 }));
      setHealth(h => ({ ...h, user: parseStatus(res) }));
    } catch (e) {
      setHealth(h => ({ ...h, user: 'Offline' }));
    }

    try {
      const res = await axios.get(`${PROFILE_SERVICE_BASE}/health`, { timeout: 3000 })
        .catch(() => axios.get('/api/v1/profile/health', { timeout: 3000 }));
      setHealth(h => ({ ...h, profile: parseStatus(res) }));
    } catch (e) {
      setHealth(h => ({ ...h, profile: 'Offline' }));
    }

    try {
      const res = await axios.get(`${AI_SKIN_SERVICE_BASE}/health`, { timeout: 3000 })
        .catch(() => axios.get('/api/v1/skin/health', { timeout: 3000 }));
      setHealth(h => ({ ...h, ai: parseStatus(res) }));
    } catch (e) {
      setHealth(h => ({ ...h, ai: 'Offline' }));
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchAssignments();
    checkHealth();
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchUsers(val, roleFilter);
  };

  const handleRoleFilterChange = (e) => {
    const val = e.target.value;
    setRoleFilter(val);
    fetchUsers(searchQuery, val);
  };

  // Helper to get active assigned professional for a patient
  const getActiveAssignmentForUser = (userId) => {
    return assignments.find(a => a.patient_id === userId && a.status === 'active');
  };

  // Filter professionals based on the currently selected role toggle in the modal
  const filteredProfessionals = users.filter(u => u.role === targetSpecialistRole);

  const openAssignmentModal = (user) => {
    setAssignmentModalUser(user);
    // Automatically set default specialist role based on triage recommendation
    const rec = user.triage_suggestion || user.triage_recommendation;
    if (rec === 'Dermatologist') {
      setTargetSpecialistRole('Dermatologist');
    } else if (rec === 'Skincare Consultant') {
      setTargetSpecialistRole('Skincare Consultant');
    } else {
      setTargetSpecialistRole('Dermatologist');
    }

    // Auto-select first matching professional if available
    const matching = users.filter(u => u.role === (rec === 'Skincare Consultant' ? 'Skincare Consultant' : 'Dermatologist'));
    setSelectedProfessionalId(matching.length > 0 ? matching[0].id : '');
  };

  const handleAssignProfessional = async () => {
    if (!assignmentModalUser || !selectedProfessionalId) return;
    try {
      setAssigningLoading(true);
      await assignmentService.assignPatient(assignmentModalUser.id, selectedProfessionalId);
      
      const assignedProfObj = users.find(u => u.id === selectedProfessionalId);
      // Optimistic update
      if (assignedProfObj) {
        setUsers(prev => prev.map(u => u.id === assignmentModalUser.id ? {
          ...u,
          assigned_professional: {
            id: assignedProfObj.id,
            name: assignedProfObj.full_name || assignedProfObj.email,
            email: assignedProfObj.email,
            role: assignedProfObj.role
          }
        } : u));
      }

      setAssignmentModalUser(null);
      setSelectedProfessionalId('');
      showToast("Specialist assigned successfully.", "success");
      await fetchAssignments();
      await fetchUsers();
    } catch (err) {
      showToast("Failed to assign specialist: " + (err.response?.data?.detail || err.message), "error");
    } finally {
      setAssigningLoading(false);
    }
  };

  const requestRevokeAssignment = (patient, activeAssign) => {
    setRevokeTarget({
      patientId: patient.id,
      patientName: patient.full_name || patient.email,
      professionalId: activeAssign?.id || activeAssign?.professional_id,
      professionalName: activeAssign?.name || activeAssign?.professional_name || activeAssign?.email || 'Specialist',
      professionalRole: activeAssign?.role || activeAssign?.professional_role || 'Specialist'
    });
  };

  const executeRevokeAssignment = async () => {
    if (!revokeTarget) return;
    const targetPatientId = revokeTarget.patientId;
    try {
      setRevokingLoading(true);
      // Send patient UUID directly to revoke endpoint
      await assignmentService.revokeAssignment(targetPatientId);
      
      // 1. Optimistically clear assignment state so badge immediately switches back to + Assign Specialist
      setUsers(prev => prev.map(u => u.id === targetPatientId ? { ...u, assigned_professional: null } : u));
      setAssignments(prev => prev.filter(a => a.patient_id !== targetPatientId));
      
      if (assignmentModalUser && assignmentModalUser.id === targetPatientId) {
        setAssignmentModalUser(null);
      }
      setRevokeTarget(null);
      showToast("Specialist assignment revoked successfully.", "success");

      // 2. Re-fetch live user directory and assignments to confirm database reflects null state
      await fetchAssignments();
      await fetchUsers();
    } catch (err) {
      showToast("Failed to revoke assignment: " + (err.response?.data?.detail || err.message), "error");
    } finally {
      setRevokingLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-900/40 to-orange-900/40 border border-amber-500/30">
        <div className="flex items-center space-x-3 text-amber-400 mb-2">
          <ShieldCheck className="w-8 h-8" />
          <h2 className="text-2xl font-bold text-white">Admin Control Center</h2>
        </div>
        <p className="text-slate-400 text-sm">
          Automated triage recommendations, clinical/cosmetic assignments, and global metrics.
        </p>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Users & Role Breakdown */}
        <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <Users className="w-6 h-6 text-blue-400 mb-2" />
            <h3 className="text-lg font-bold text-white">Total Users</h3>
            <p className="text-3xl font-extrabold mt-2 text-white">
              {stats?.total_users ?? users.length}
            </p>
          </div>
          {stats?.role_breakdown && (
            <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
              <span>Standard: <strong className="text-slate-200">{stats.role_breakdown.User}</strong></span>
              <span>Derm: <strong className="text-teal-400">{stats.role_breakdown.Dermatologist}</strong></span>
              <span>Consultant: <strong className="text-purple-400">{stats.role_breakdown['Skincare Consultant']}</strong></span>
            </div>
          )}
        </div>

        {/* System Health */}
        <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <Activity className="w-6 h-6 text-emerald-400 mb-2" />
            <h3 className="text-lg font-bold text-white">System Health</h3>
          </div>
          <div className="mt-2 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">User Service (PostgreSQL):</span>
              <span className={health.user === 'Online' ? 'text-emerald-400 font-bold' : health.user === 'Degraded' ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>{health.user}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Profile Service (MongoDB):</span>
              <span className={health.profile === 'Online' ? 'text-emerald-400 font-bold' : health.profile === 'Degraded' ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>{health.profile}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">AI Skin Service (Catalog):</span>
              <span className={health.ai === 'Online' ? 'text-emerald-400 font-bold' : health.ai === 'Degraded' ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>{health.ai}</span>
            </div>
          </div>
        </div>

        {/* Product Catalog Overview */}
        <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <Package className="w-6 h-6 text-purple-400 mb-2" />
            <h3 className="text-lg font-bold text-white">Product Catalog</h3>
            <p className="text-3xl font-extrabold mt-2 text-white">1,204 Indexed</p>
          </div>
          <a href="/product-intelligence" className="text-xs text-purple-400 hover:text-purple-300 font-semibold mt-3 inline-flex items-center gap-1">
            Browse Catalog Controls &rarr;
          </a>
        </div>
      </div>

      {/* User Management Directory Table */}
      <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-xl font-bold text-white">User Management Directory</h3>
          
          {/* Real-time Search & Role Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search name or email..." 
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-8 py-1.5 bg-slate-800 text-xs text-slate-200 rounded-xl border border-slate-700 focus:border-amber-500 focus:outline-none placeholder-slate-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    fetchUsers('', roleFilter);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select 
                value={roleFilter} 
                onChange={handleRoleFilterChange}
                className="py-1.5 px-2 bg-slate-800 text-xs text-slate-300 rounded-xl border border-slate-700 focus:border-amber-500 focus:outline-none"
              >
                <option value="All">All Roles</option>
                <option value="User">User</option>
                <option value="Skincare Consultant">Skincare Consultant</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Administrator">Administrator</option>
              </select>
            </div>
          </div>
        </div>

        {error ? (
          <div className="p-4 bg-rose-900/30 border border-rose-500/30 text-rose-400 rounded-xl text-xs">
            {error}
          </div>
        ) : loading ? (
          <p className="text-slate-400 text-xs py-4">Loading users...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800 text-slate-400">
                <tr>
                  <th className="p-3 rounded-tl-lg">ID</th>
                  <th className="p-3">User & Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Triage Suggestion</th>
                  <th className="p-3">Reported Concerns</th>
                  <th className="p-3">Assigned Specialist</th>
                  <th className="p-3 rounded-tr-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-6 text-center text-slate-500 text-xs">
                      No registered users match your search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  users.map(u => {
                    const activeAssign = getActiveAssignmentForUser(u.id) || u.assigned_professional;
                    const triage = u.triage_suggestion || u.triage_recommendation || "Unassessed";
                    const concerns = u.reported_concerns || [];

                    return (
                      <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                        <td className="p-3 font-mono text-xs text-slate-400">{u.id.substring(0,8)}...</td>
                        <td className="p-3">
                          <p className="font-medium text-white">{u.full_name || 'N/A'}</p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </td>
                        <td className="p-3">
                          <select 
                            value={u.role} 
                            onChange={async (e) => {
                                const newRole = e.target.value;
                                try {
                                    try {
                                      await axios.patch(`${USER_SERVICE_BASE}/api/v1/users/${u.id}/role`, { role: newRole }, { headers: getAuthHeaders() });
                                    } catch (dErr) {
                                      await userService.updateRole(u.id, newRole);
                                    }
                                    setUsers(users.map(user => user.id === u.id ? { ...user, role: newRole } : user));
                                    showToast(`Role updated to ${newRole} for ${u.full_name || u.email}.`, "success");
                                    fetchStats();
                                } catch(err) {
                                    showToast("Failed to update role. Administrator authorization required.", "error");
                                }
                            }}
                            className="px-2 py-1 bg-slate-800 text-xs text-slate-200 rounded border border-slate-700 outline-none focus:border-amber-500"
                          >
                            <option value="User">User</option>
                            <option value="Skincare Consultant">Skincare Consultant</option>
                            <option value="Dermatologist">Dermatologist</option>
                            <option value="Administrator">Administrator</option>
                          </select>
                        </td>

                        {/* Triage Suggestion Badge */}
                        <td className="p-3">
                          {u.role === 'User' ? (
                            triage === 'Dermatologist' ? (
                              <span 
                                title={u.triage_reason || "High severity or clinical condition detected"}
                                className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 inline-flex items-center gap-1 cursor-help"
                              >
                                <Stethoscope className="w-3 h-3 text-rose-400" />
                                <span>🩺 Dermatologist</span>
                              </span>
                            ) : triage === 'Skincare Consultant' ? (
                              <span 
                                title={u.triage_reason || "Cosmetic routine and ingredient optimization"}
                                className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 inline-flex items-center gap-1 cursor-help"
                              >
                                <Sparkles className="w-3 h-3 text-purple-400" />
                                <span>✨ Consultant</span>
                              </span>
                            ) : (
                              <span 
                                title="User has not completed the questionnaire"
                                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700 inline-flex items-center gap-1.5 cursor-help"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block"></span>
                                <span>⚪ Unassessed</span>
                              </span>
                            )
                          ) : (
                            <span className="text-xs text-slate-500 italic">—</span>
                          )}
                        </td>

                        {/* Reported Concerns Pills (Max 2 + N more counter) */}
                        <td className="p-3">
                          {u.role === 'User' ? (
                            concerns.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1 max-w-xs">
                                {concerns.slice(0, 2).map((c, i) => {
                                  const cStr = String(c);
                                  const isClinical = cStr.includes('4/5') || cStr.includes('5/5') || /rosacea|eczema|dermatitis|barrier/i.test(cStr);
                                  return (
                                    <span 
                                      key={i} 
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                        isClinical 
                                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' 
                                          : 'bg-slate-800 text-slate-300 border-slate-700'
                                      }`}
                                    >
                                      {cStr}
                                    </span>
                                  );
                                })}
                                {concerns.length > 2 && (
                                  <span 
                                    title={concerns.slice(2).join(', ')}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700 cursor-help hover:text-slate-200 hover:border-slate-500 transition"
                                  >
                                    +{concerns.length - 2} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 italic">None logged</span>
                            )
                          ) : (
                            <span className="text-xs text-slate-500 italic">—</span>
                          )}
                        </td>

                        {/* Assigned Specialist Column (Refined interactive pill with discreet revoke icon) */}
                        <td className="p-3">
                          {u.role === 'User' ? (
                            activeAssign ? (
                              <div className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition ${
                                (activeAssign.role || activeAssign.professional_role) === 'Dermatologist'
                                  ? 'bg-teal-950/40 text-teal-300 border-teal-500/30 hover:border-teal-500/50'
                                  : 'bg-purple-950/40 text-purple-300 border-purple-500/30 hover:border-purple-500/50'
                              }`}>
                                <span className="truncate max-w-[130px]" title={activeAssign.name || activeAssign.professional_name || activeAssign.email}>
                                  {activeAssign.name || activeAssign.professional_name || activeAssign.email}
                                </span>
                                <span className="text-[10px] opacity-75">
                                  ({(activeAssign.role || activeAssign.professional_role) === 'Dermatologist' ? 'Derm' : 'Consultant'})
                                </span>
                                <button
                                  type="button"
                                  title="Revoke Specialist Assignment"
                                  onClick={() => requestRevokeAssignment(u, activeAssign)}
                                  className="ml-1 text-slate-400 hover:text-rose-400 p-0.5 rounded-full hover:bg-rose-500/20 transition"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openAssignmentModal(u)}
                                className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-400 rounded-full text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                              >
                                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                                <span>+ Assign Specialist</span>
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-slate-500 italic">—</span>
                          )}
                        </td>

                        {/* Status Toggle Button */}
                        <td className="p-3">
                          <button 
                            type="button"
                            onClick={async () => {
                                const newStatus = !u.is_active;
                                try {
                                    try {
                                      await axios.put(`${USER_SERVICE_BASE}/api/v1/users/${u.id}`, { is_active: newStatus }, { headers: getAuthHeaders() });
                                    } catch (dErr) {
                                      await userService.updateStatus(u.id, newStatus);
                                    }
                                    setUsers(users.map(user => user.id === u.id ? { ...user, is_active: newStatus } : user));
                                    showToast(`User status set to ${newStatus ? 'Active' : 'Inactive'}.`, "success");
                                    fetchStats();
                                } catch(err) {
                                    showToast("Failed to update user status.", "error");
                                }
                            }}
                            className={`px-2.5 py-1 text-xs rounded-lg font-bold transition ${u.is_active ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'}`}
                          >
                            {u.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Intelligent Patient Assignment Modal */}
      {assignmentModalUser && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scaleUp">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" /> Intelligent Specialist Assignment
              </h3>
              <button 
                onClick={() => setAssignmentModalUser(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Patient Context Card */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-white">{assignmentModalUser.full_name || assignmentModalUser.email}</p>
                  <p className="text-xs text-slate-400">{assignmentModalUser.email}</p>
                </div>
                {getActiveAssignmentForUser(assignmentModalUser.id) && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                    Currently Assigned
                  </span>
                )}
              </div>

              {/* Triage Recommendation Summary */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-col gap-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-semibold">System Triage:</span>
                  {assignmentModalUser.triage_recommendation === 'Dermatologist' ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                      <Stethoscope className="w-3 h-3 text-rose-400" /> Recommended: Dermatologist
                    </span>
                  ) : assignmentModalUser.triage_recommendation === 'Skincare Consultant' ? (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-400" /> Recommended: Skincare Consultant
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                      Unassessed (No Questionnaire Logged)
                    </span>
                  )}
                </div>

                {assignmentModalUser.triage_reason && (
                  <p className="text-[11px] text-slate-400 italic">
                    {assignmentModalUser.triage_reason}
                  </p>
                )}

                {assignmentModalUser.reported_concerns && assignmentModalUser.reported_concerns.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    <span className="text-[11px] text-slate-400 mr-1">Concerns:</span>
                    {assignmentModalUser.reported_concerns.map((c, i) => (
                      <span key={i} className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded text-[10px]">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Specialist Role Filter Toggle (Defaults to recommendation) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Target Specialist Discipline:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetSpecialistRole('Dermatologist');
                    const match = users.filter(u => u.role === 'Dermatologist');
                    setSelectedProfessionalId(match.length > 0 ? match[0].id : '');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                    targetSpecialistRole === 'Dermatologist'
                      ? 'bg-rose-950/40 text-rose-300 border-rose-500/50 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Clinical Dermatologist</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetSpecialistRole('Skincare Consultant');
                    const match = users.filter(u => u.role === 'Skincare Consultant');
                    setSelectedProfessionalId(match.length > 0 ? match[0].id : '');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                    targetSpecialistRole === 'Skincare Consultant'
                      ? 'bg-purple-950/40 text-purple-300 border-purple-500/50 shadow-sm'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cosmetic Consultant</span>
                </button>
              </div>
            </div>

            {/* Filtered Professional Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Choose Available {targetSpecialistRole}:
              </label>
              {filteredProfessionals.length === 0 ? (
                <div className="p-3 bg-slate-950 border border-dashed border-slate-800 rounded-xl text-xs text-slate-400 text-center">
                  No registered active {targetSpecialistRole}s found on platform.
                </div>
              ) : (
                <select
                  value={selectedProfessionalId}
                  onChange={(e) => setSelectedProfessionalId(e.target.value)}
                  className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                >
                  <option value="">-- Choose {targetSpecialistRole} --</option>
                  {filteredProfessionals.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.full_name || p.email} ({p.email})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              {getActiveAssignmentForUser(assignmentModalUser.id) ? (
                <button
                  type="button"
                  onClick={() => {
                    const a = getActiveAssignmentForUser(assignmentModalUser.id);
                    requestRevokeAssignment(assignmentModalUser, a);
                  }}
                  className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 text-xs rounded-lg transition flex items-center gap-1"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Unassign / Remove</span>
                </button>
              ) : <div />}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAssignmentModalUser(null)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={assigningLoading || !selectedProfessionalId}
                  onClick={handleAssignProfessional}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {assigningLoading ? "Assigning..." : "Confirm Assignment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* In-App Revocation Confirmation Modal */}
      {revokeTarget && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400" /> Revoke Specialist Assignment
              </h3>
              <button 
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Are you sure you want to remove <strong className="text-white">{revokeTarget.professionalName}</strong> ({revokeTarget.professionalRole}) from patient <strong className="text-white">{revokeTarget.patientName}</strong>?
              </p>
              <p className="text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                The specialist will no longer have access to this patient's records or consultation notes.
              </p>
            </div>

            <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={revokingLoading}
                onClick={executeRevokeAssignment}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-rose-600/20"
              >
                {revokingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                <span>{revokingLoading ? "Revoking Access..." : "Revoke Access"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modern Slide-In Toast Alert */}
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
