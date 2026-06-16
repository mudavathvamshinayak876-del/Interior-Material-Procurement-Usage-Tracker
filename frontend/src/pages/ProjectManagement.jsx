import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Calendar, MapPin, DollarSign, X, HardHat } from 'lucide-react';

function ProjectManagement() {
  const { apiFetch, user } = useAuth();
  const canEdit = user && (user.role === 'admin' || user.role === 'project_manager');
  const [projects, setProjects] = useState([]);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  
  // Form State
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [address, setAddress] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState('planning');
  const [assignedEngineerId, setAssignedEngineerId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEngineers = async () => {
    try {
      const res = await apiFetch('/api/auth/users');
      if (res.ok) {
        const allUsers = await res.json();
        // Filter only site engineers for project assignment
        setEngineers(allUsers.filter(u => u.role === 'site_engineer'));
      }
    } catch (err) {
      console.error('Failed to load engineers:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchEngineers();
  }, []);

  const openCreateModal = () => {
    setEditingProject(null);
    setProjectName('');
    setClientName('');
    setAddress('');
    setBudget('');
    setStatus('planning');
    setAssignedEngineerId('');
    setStartDate('');
    setEndDate('');
    setErrorMessage('');
    setModalOpen(true);
  };

  const openEditModal = (proj) => {
    setEditingProject(proj);
    setProjectName(proj.project_name);
    setClientName(proj.client_name);
    setAddress(proj.address || '');
    setBudget(proj.budget);
    setStatus(proj.status);
    setAssignedEngineerId(proj.assigned_engineer_id || '');
    setStartDate(proj.start_date || '');
    setEndDate(proj.end_date || '');
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const payload = {
      project_name: projectName,
      client_name: clientName,
      address,
      budget: parseFloat(budget),
      status,
      assigned_engineer_id: assignedEngineerId ? parseInt(assignedEngineerId) : null,
      start_date: startDate || null,
      end_date: endDate || null
    };

    try {
      let res;
      if (editingProject) {
        res = await apiFetch(`/api/projects/${editingProject.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch('/api/projects', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setModalOpen(false);
        fetchProjects();
      } else {
        const errData = await res.json();
        setErrorMessage(errData.message || 'Operation failed.');
      }
    } catch (err) {
      setErrorMessage('Network or server error.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project? This will permanently delete all associated materials and invoices.')) {
      return;
    }

    try {
      const res = await apiFetch(`/api/projects/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchProjects();
      } else {
        alert('Failed to delete project.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Project Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {canEdit ? 'Define site locations, budgets, and track construction durations' : 'Viewing your assigned projects'}
          </p>
        </div>
        {canEdit && (
          <button 
            onClick={openCreateModal}
            className="flex items-center space-x-2 py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-955 font-bold text-xs shadow-lg shadow-amber-500/10 hover-lift transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-sm text-slate-400">No projects set up yet. Click "New Project" to add one.</p>
        </div>
      ) : (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div key={proj.id} className="glass-card rounded-2xl p-6 flex flex-col justify-between hover-lift relative overflow-hidden">
              <span className={`absolute top-4 right-4 text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                proj.status === 'active' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' :
                proj.status === 'planning' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                proj.status === 'completed' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20' :
                'bg-slate-500/10 text-slate-500 border border-slate-500/20'
              }`}>
                {proj.status}
              </span>

              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-md pr-16 truncate" title={proj.project_name}>
                    {proj.project_name}
                  </h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">Client: {proj.client_name}</p>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{proj.address || 'No Address Logged'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      {proj.start_date ? new Date(proj.start_date).toLocaleDateString() : 'TBD'} - {proj.end_date ? new Date(proj.end_date).toLocaleDateString() : 'TBD'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-white">
                      ₹{parseFloat(proj.budget).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Assigned Engineer */}
                  <div className="flex items-center space-x-2">
                    <HardHat className="w-4 h-4 text-slate-400 shrink-0" />
                    {proj.engineer_name ? (
                      <span className="inline-flex items-center space-x-1.5">
                        <span className="w-5 h-5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-600 dark:text-green-400 text-[9px] font-bold">
                          {proj.engineer_name.charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{proj.engineer_name}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No engineer assigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons - only for admin/PM */}
              {canEdit && (
                <div className="flex justify-end space-x-2 pt-5 border-t border-slate-100 dark:border-slate-800/80 mt-5">
                  <button
                    onClick={() => openEditModal(proj)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
                    title="Edit Project"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(proj.id)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              {editingProject ? 'Modify Project Site' : 'Register New Project'}
            </h3>
            <p className="text-xs text-slate-400">Provide details about the client, budget caps, and timeline</p>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Project Name</label>
                  <input 
                    type="text" 
                    required
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Indiranagar Villa"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Client Name</label>
                  <input 
                    type="text" 
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Rohan Mehra"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Site Address</label>
                <textarea 
                  rows="2"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="456, 12th Main, Indiranagar, Bangalore"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Budget (INR)</label>
                  <input 
                    type="number" 
                    required
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="7500000"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Project Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Assign Site Engineer */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  <span className="inline-flex items-center space-x-1">
                    <HardHat className="w-3 h-3" />
                    <span>Assign Site Engineer</span>
                  </span>
                </label>
                <select
                  value={assignedEngineerId}
                  onChange={(e) => setAssignedEngineerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="">— No Engineer Assigned —</option>
                  {engineers.map(eng => (
                    <option key={eng.id} value={eng.id}>
                      {eng.name} (Site Engineer) — {eng.email}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  The assigned engineer will be responsible for on-site material tracking for this project
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">End Date</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  />
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
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default ProjectManagement;
