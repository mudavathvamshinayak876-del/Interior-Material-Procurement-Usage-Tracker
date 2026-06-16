import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Shield, Briefcase, HardHat, Truck, Mail, Calendar, X, Users, Search, Trash2, AlertTriangle } from 'lucide-react';

function EmployeeManagement() {
  const { apiFetch, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');

  // Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('site_engineer');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/users');
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('site_engineer');
    setErrorMessage('');
    setSuccessMessage('');
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`/api/auth/users/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteTarget(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete employee.');
      }
    } catch (err) {
      alert('Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await apiFetch('/api/auth/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role })
      });

      if (res.ok) {
        setSuccessMessage(`Employee "${name}" created successfully!`);
        setName('');
        setEmail('');
        setPassword('');
        setRole('site_engineer');
        fetchUsers();
        setTimeout(() => setModalOpen(false), 1200);
      } else {
        const data = await res.json();
        setErrorMessage(data.message || 'Failed to create employee.');
      }
    } catch (err) {
      setErrorMessage('Network error. Please try again.');
    }
  };

  const getRoleConfig = (r) => {
    switch (r) {
      case 'admin':
        return { 
          icon: Shield, 
          label: 'Administrator', 
          color: 'text-red-500', 
          bg: 'bg-red-500/10 border-red-500/20',
          pill: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
        };
      case 'project_manager':
        return { 
          icon: Briefcase, 
          label: 'Project Manager', 
          color: 'text-amber-500', 
          bg: 'bg-amber-500/10 border-amber-500/20',
          pill: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
        };
      case 'site_engineer':
        return { 
          icon: HardHat, 
          label: 'Site Engineer', 
          color: 'text-green-500', 
          bg: 'bg-green-500/10 border-green-500/20',
          pill: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
        };
      case 'vendor_coordinator':
        return { 
          icon: Truck, 
          label: 'Vendor Coordinator', 
          color: 'text-blue-500', 
          bg: 'bg-blue-500/10 border-blue-500/20',
          pill: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
        };
      default:
        return { 
          icon: Users, 
          label: r, 
          color: 'text-slate-500', 
          bg: 'bg-slate-500/10 border-slate-500/20',
          pill: 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
        };
    }
  };

  // Role summary stats
  const roleCounts = {
    admin: users.filter(u => u.role === 'admin').length,
    project_manager: users.filter(u => u.role === 'project_manager').length,
    site_engineer: users.filter(u => u.role === 'site_engineer').length,
    vendor_coordinator: users.filter(u => u.role === 'vendor_coordinator').length
  };

  // Filter & search
  const filteredUsers = users.filter(u => {
    const matchSearch = searchTerm === '' || 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === '' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const roleOptions = [
    { value: 'admin', label: 'Administrator' },
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'site_engineer', label: 'Site Engineer' },
    { value: 'vendor_coordinator', label: 'Vendor Coordinator' }
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Employees & Workers</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage team members, assign portal roles, and control system access
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/10 hover-lift transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {roleOptions.map(r => {
          const config = getRoleConfig(r.value);
          const Icon = config.icon;
          const count = roleCounts[r.value] || 0;
          return (
            <button
              key={r.value}
              onClick={() => setFilterRole(filterRole === r.value ? '' : r.value)}
              className={`glass-card rounded-2xl p-5 text-left hover-lift transition-all ${
                filterRole === r.value ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-950' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div className={`p-2.5 rounded-xl ${config.bg} border`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <span className="text-2xl font-black text-slate-800 dark:text-white">{count}</span>
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-3">{r.label}s</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {filterRole === r.value ? 'Click to clear filter' : 'Click to filter'}
              </p>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-xl">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span className="font-bold">{filteredUsers.length}</span>
          <span>of {users.length} employees</span>
        </div>
      </div>

      {/* Employees Table */}
      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <Users className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
          <p className="text-sm text-slate-400">
            {searchTerm || filterRole ? 'No employees match the current filter.' : 'No employees registered yet.'}
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Access Level</th>
                  <th className="p-4">Joined</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => {
                  const config = getRoleConfig(u.role);
                  const Icon = config.icon;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${config.bg} border ${config.color}`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">{u.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">ID: EMP-{String(u.id).padStart(4, '0')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${config.pill}`}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{config.label}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          {u.role === 'admin' && (
                            <>
                              <p>• Full system access</p>
                              <p>• User management</p>
                              <p>• Reports & audit logs</p>
                            </>
                          )}
                          {u.role === 'project_manager' && (
                            <>
                              <p>• Create/manage projects</p>
                              <p>• Track materials & costs</p>
                              <p>• Assign suppliers</p>
                            </>
                          )}
                          {u.role === 'site_engineer' && (
                            <>
                              <p>• Update material received</p>
                              <p>• Log usage & wastage</p>
                              <p>• Upload site reports</p>
                            </>
                          )}
                          {u.role === 'vendor_coordinator' && (
                            <>
                              <p>• Manage supplier records</p>
                              <p>• Upload invoices</p>
                              <p>• Track deliveries</p>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1.5 text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="text-[11px]">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 text-[9px] font-bold uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          <span>Active</span>
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {currentUser && u.id !== currentUser.id ? (
                          <button
                            onClick={() => setDeleteTarget(u)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
                            title={`Remove ${u.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-300 dark:text-slate-700 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400">
            <span>Showing {filteredUsers.length} employee{filteredUsers.length !== 1 ? 's' : ''}</span>
            <span>Total workforce: {users.length} members</span>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Register New Employee</h3>
            <p className="text-xs text-slate-400">Add a new team member and assign their portal access role</p>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Rajesh Kumar"
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="rajesh@glorysimon.com"
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Assigned Role</label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {roleOptions.map(r => {
                    const config = getRoleConfig(r.value);
                    const Icon = config.icon;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          role === r.value
                            ? 'border-amber-500 bg-amber-500/5 ring-1 ring-amber-500'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className={`w-4 h-4 ${config.color}`} />
                          <span className="text-xs font-bold text-slate-800 dark:text-white">{r.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Role Description Preview */}
              <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Permissions Preview</p>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
                  {role === 'admin' && (
                    <>
                      <p>• Full system access — manage users, projects, and all settings</p>
                      <p>• View analytics dashboard, generate and export all reports</p>
                    </>
                  )}
                  {role === 'project_manager' && (
                    <>
                      <p>• Create and manage interior projects and client budgets</p>
                      <p>• Track material usage, assign suppliers, monitor wastage</p>
                    </>
                  )}
                  {role === 'site_engineer' && (
                    <>
                      <p>• Update material received, consumed, and wasted on site</p>
                      <p>• Cannot create projects or manage suppliers</p>
                    </>
                  )}
                  {role === 'vendor_coordinator' && (
                    <>
                      <p>• Manage supplier records and upload invoices</p>
                      <p>• Track deliveries and procurement orders</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs shadow-lg shadow-amber-500/10"
                >
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Remove Employee</h3>
                <p className="text-xs text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Are you sure you want to permanently remove <strong>{deleteTarget.name}</strong> ({deleteTarget.email}) from the system?
              </p>
              <p className="text-[11px] text-slate-400 mt-2">
                Their access will be revoked immediately. All associated audit logs will be preserved.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs shadow-lg shadow-red-500/20 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Removing...' : 'Yes, Remove Employee'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeManagement;
