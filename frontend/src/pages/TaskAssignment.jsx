import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ClipboardList, 
  Users, 
  Plus, 
  UserPlus, 
  Phone, 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  X, 
  Trash2, 
  Filter,
  UserCheck
} from 'lucide-react';

function TaskAssignment() {
  const { apiFetch, user } = useAuth();
  const [activeTab, setActiveTab] = useState('tasks');
  const [tasks, setTasks] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [filterProject, setFilterProject] = useState('');

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [workerModalOpen, setWorkerModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Task Form State
  const [targetProjectId, setTargetProjectId] = useState('');
  const [targetWorkerId, setTargetWorkerId] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [taskStatus, setTaskStatus] = useState('assigned');

  // Worker Form State
  const [workerName, setWorkerName] = useState('');
  const [workerTrade, setWorkerTrade] = useState('Painting');
  const [workerPhone, setWorkerPhone] = useState('');

  const trades = ['Painting', 'Electrical', 'Carpentry', 'Plumbing', 'Masonry', 'Flooring', 'HVAC', 'Other'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, workersRes, projectsRes] = await Promise.all([
        apiFetch('/api/tasks'),
        apiFetch('/api/workers'),
        apiFetch('/api/projects')
      ]);

      if (tasksRes.ok) setTasks(await tasksRes.json());
      if (workersRes.ok) setWorkers(await workersRes.json());
      if (projectsRes.ok) {
        const projData = await projectsRes.json();
        setProjects(projData);
        if (projData.length > 0) {
          setTargetProjectId(projData[0].id.toString());
        }
      }
    } catch (err) {
      console.error('Fetch task management data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Set default worker when workers list loads
  useEffect(() => {
    if (workers.length > 0) {
      setTargetWorkerId(workers[0].id.toString());
    }
  }, [workers]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!targetProjectId || !targetWorkerId || !taskDescription) {
      setErrorMessage('All mandatory fields must be filled.');
      return;
    }

    try {
      const res = await apiFetch('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          project_id: parseInt(targetProjectId),
          worker_id: parseInt(targetWorkerId),
          task_description: taskDescription,
          start_date: startDate || null,
          end_date: endDate || null,
          status: taskStatus
        })
      });

      if (res.ok) {
        setTaskModalOpen(false);
        setTaskDescription('');
        setStartDate('');
        setEndDate('');
        setTaskStatus('assigned');
        fetchData();
      } else {
        const err = await res.json();
        setErrorMessage(err.message || 'Failed to assign task.');
      }
    } catch (err) {
      setErrorMessage('Server error creating task assignment.');
    }
  };

  const handleCreateWorker = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!workerName || !workerTrade) {
      setErrorMessage('Worker Name and Trade are required.');
      return;
    }

    try {
      const res = await apiFetch('/api/workers', {
        method: 'POST',
        body: JSON.stringify({
          name: workerName,
          trade: workerTrade,
          phone: workerPhone || null,
          status: 'available'
        })
      });

      if (res.ok) {
        setWorkerModalOpen(false);
        setWorkerName('');
        setWorkerTrade('Painting');
        setWorkerPhone('');
        fetchData();
      } else {
        const err = await res.json();
        setErrorMessage(err.message || 'Failed to register worker.');
      }
    } catch (err) {
      setErrorMessage('Server error registering worker.');
    }
  };

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to update task status.');
      }
    } catch (err) {
      alert('Network error updating task status.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to cancel and delete this task assignment?')) return;

    try {
      const res = await apiFetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchData();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to delete task.');
      }
    } catch (err) {
      alert('Network error deleting task.');
    }
  };

  const filteredTasks = tasks.filter(t => {
    return filterProject === '' || t.project_id === parseInt(filterProject);
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20';
      case 'in_progress': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'assigned': default: return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
    }
  };

  const getWorkerStatusBadge = (status) => {
    switch (status) {
      case 'available': return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'busy': return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      case 'inactive': return 'bg-slate-500/10 text-slate-500 border border-slate-500/20';
      default: return 'bg-slate-500/10 text-slate-500 border border-slate-500/20';
    }
  };

  const openAssignModal = (preselectedWorkerId = null) => {
    if (projects.length === 0) {
      alert('You must have active project sites assigned before distributing work!');
      return;
    }
    if (workers.length === 0) {
      alert('Register workers in the Workers tab before assigning tasks!');
      return;
    }
    setTargetProjectId(projects[0].id.toString());
    
    if (preselectedWorkerId) {
      setTargetWorkerId(preselectedWorkerId.toString());
    } else {
      setTargetWorkerId(workers[0].id.toString());
    }

    setTaskDescription('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setTaskStatus('assigned');
    setErrorMessage('');
    setTaskModalOpen(true);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Resource & Task Assignments</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage on-site workers (electricians, painters) and distribute task assignments</p>
        </div>

        <div className="flex space-x-2 w-full sm:w-auto">
          {activeTab === 'tasks' ? (
            <button 
              onClick={openAssignModal}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/10 hover-lift transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Assign Task</span>
            </button>
          ) : (
            <button 
              onClick={() => { setErrorMessage(''); setWorkerModalOpen(true); }}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/10 hover-lift transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Worker</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center space-x-2 px-6 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'tasks' 
              ? 'border-amber-500 text-amber-500' 
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Work Assignments</span>
        </button>
        <button
          onClick={() => setActiveTab('workers')}
          className={`flex items-center space-x-2 px-6 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all ${
            activeTab === 'workers' 
              ? 'border-amber-500 text-amber-500' 
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Workers Directory</span>
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : activeTab === 'tasks' ? (
        /* ==================== ASSIGNMENTS TAB ==================== */
        <div className="space-y-6">
          
          {/* Project Filters Bar */}
          {user.role !== 'site_engineer' && (
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-xl flex gap-4 items-center">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase">
                <Filter className="w-4 h-4 text-amber-500" />
                <span>Filter Project:</span>
              </div>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="">All Projects</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name}</option>
                ))}
              </select>
            </div>
          )}

          {filteredTasks.length === 0 ? (
            <div className="p-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-sm text-slate-400">No active work assignments found. Add tasks to distribute construction orders.</p>
            </div>
          ) : (
            /* Kanban/List columns */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Column 1: Assigned */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-3 py-2 bg-blue-500/5 dark:bg-blue-500/[0.02] border border-blue-500/10 rounded-lg">
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Assigned</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 font-bold">
                    {filteredTasks.filter(t => t.status === 'assigned').length}
                  </span>
                </div>
                <div className="space-y-4">
                  {filteredTasks.filter(t => t.status === 'assigned').map(t => renderTaskCard(t))}
                </div>
              </div>

              {/* Column 2: In Progress */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-3 py-2 bg-amber-500/5 dark:bg-amber-500/[0.02] border border-amber-500/10 rounded-lg">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
                    <span>In Progress</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-bold">
                    {filteredTasks.filter(t => t.status === 'in_progress').length}
                  </span>
                </div>
                <div className="space-y-4">
                  {filteredTasks.filter(t => t.status === 'in_progress').map(t => renderTaskCard(t))}
                </div>
              </div>

              {/* Column 3: Completed */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-3 py-2 bg-green-500/5 dark:bg-green-500/[0.02] border border-green-500/10 rounded-lg">
                  <span className="text-xs font-bold text-green-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Completed</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-500 font-bold">
                    {filteredTasks.filter(t => t.status === 'completed').length}
                  </span>
                </div>
                <div className="space-y-4">
                  {filteredTasks.filter(t => t.status === 'completed').map(t => renderTaskCard(t))}
                </div>
              </div>

            </div>
          )}

        </div>
      ) : (
        /* ==================== WORKERS TAB ==================== */
        <div className="space-y-4">
          {workers.length === 0 ? (
            <div className="p-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-sm text-slate-400">No workers registered in the hub. Add carpenters, painters, and electricians to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workers.map(worker => (
                <div key={worker.id} className="glass-card rounded-2xl p-5 hover-lift flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                        {worker.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{worker.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase mt-1 inline-block">
                          {worker.trade}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${getWorkerStatusBadge(worker.status)}`}>
                      {worker.status}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-1 text-slate-500 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{worker.phone || 'No Phone Record'}</span>
                      </div>

                      <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                        <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                        <span>
                          {tasks.filter(t => t.worker_id === worker.id && t.status !== 'completed').length} Active Tasks
                        </span>
                      </div>
                    </div>

                    {tasks.filter(t => t.worker_id === worker.id && t.status !== 'completed').length === 0 && (
                      <button
                        onClick={() => openAssignModal(worker.id)}
                        className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-slate-950 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center space-x-1 border border-amber-500/20"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Assign Task</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Task Assignment Modal */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setTaskModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Assign Construction Task</h3>
            <p className="text-xs text-slate-400">Deploy available workers to project sites and outline their duties</p>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Project Site</label>
                <select
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.project_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Worker</label>
                <select
                  value={targetWorkerId}
                  onChange={(e) => setTargetWorkerId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {workers.map(w => (
                    <option key={w.id} value={w.id}>{w.name} ({w.trade}) — {w.status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Task Description / Details</label>
                <textarea 
                  required
                  rows="3"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Describe painting coatings, electrical points layout etc."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-855 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date</label>
                  <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-855 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Expected End Date</label>
                  <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-855 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Initial Status</label>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-955 font-bold rounded-lg text-xs shadow-lg"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Worker Modal */}
      {workerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-955/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setWorkerModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Add Worker profile</h3>
            <p className="text-xs text-slate-400">Register carpenters, painters, electricians on site</p>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateWorker} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-855 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Worker Trade (Specialization)</label>
                <select
                  value={workerTrade}
                  onChange={(e) => setWorkerTrade(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {trades.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contact Phone</label>
                <input 
                  type="text" 
                  value={workerPhone}
                  onChange={(e) => setWorkerPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-855 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button"
                  onClick={() => setWorkerModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-955 font-bold rounded-lg text-xs shadow-lg"
                >
                  Add Worker
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );

  // Sub-renderer for task cards in columns
  function renderTaskCard(t) {
    return (
      <div key={t.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl space-y-3 shadow-xs relative hover:shadow-md transition-shadow">
        
        {/* Project Name and Delete option */}
        <div className="flex justify-between items-start">
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded">
            {t.project_name}
          </span>
          
          <button 
            onClick={() => handleDeleteTask(t.id)}
            className="text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors p-0.5"
            title="Delete assignment"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Task description */}
        <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
          {t.task_description}
        </p>

        {/* Worker name & Trade */}
        <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-lg flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-[10px] font-bold shrink-0">
            {t.worker_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-300 truncate">{t.worker_name}</p>
            <span className="text-[9px] text-slate-400 font-semibold uppercase">{t.worker_trade}</span>
          </div>
        </div>

        {/* Timelines */}
        {(t.start_date || t.end_date) && (
          <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              {t.start_date ? new Date(t.start_date).toLocaleDateString() : 'N/A'} ➜ {t.end_date ? new Date(t.end_date).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        )}

        {/* Task Status Dropdowns/Actions */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
          <span className="text-[9px] text-slate-400 font-semibold">Update State:</span>
          <div className="flex space-x-1.5">
            {t.status !== 'assigned' && (
              <button 
                onClick={() => handleUpdateTaskStatus(t.id, 'assigned')}
                className="text-[9px] font-bold px-2 py-1 rounded bg-slate-100 hover:bg-blue-500 hover:text-white text-slate-500 dark:bg-slate-800 dark:text-slate-400 transition-colors"
              >
                Reset
              </button>
            )}
            {t.status !== 'in_progress' && t.status !== 'completed' && (
              <button 
                onClick={() => handleUpdateTaskStatus(t.id, 'in_progress')}
                className="text-[9px] font-bold px-2 py-1 rounded bg-amber-500/15 text-amber-500 hover:bg-amber-500 hover:text-slate-950 transition-all"
              >
                Start
              </button>
            )}
            {t.status !== 'completed' && (
              <button 
                onClick={() => handleUpdateTaskStatus(t.id, 'completed')}
                className="text-[9px] font-bold px-2 py-1 rounded bg-green-500/15 text-green-500 hover:bg-green-500 hover:text-slate-950 transition-all"
              >
                Done
              </button>
            )}
          </div>
        </div>

      </div>
    );
  }
}

export default TaskAssignment;
