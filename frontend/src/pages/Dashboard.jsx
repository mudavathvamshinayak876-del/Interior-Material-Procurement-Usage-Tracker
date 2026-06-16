import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  FolderCheck, 
  Boxes, 
  AlertTriangle, 
  DollarSign, 
  Activity,
  ArrowUpRight,
  TrendingUp,
  History
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';

function Dashboard() {
  const { apiFetch, user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const projRes = await apiFetch('/api/projects');
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData);
      }

      const matRes = await apiFetch('/api/materials');
      if (matRes.ok) {
        const matData = await matRes.json();
        setMaterials(matData);
      }

      // Audit logs (accessible by admin/pm)
      if (user.role === 'admin' || user.role === 'project_manager') {
        const logRes = await apiFetch('/api/auth/logs');
        if (logRes.ok) {
          const logData = await logRes.json();
          setAuditLogs(logData.slice(0, 5)); // show recent 5
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // 1. Math and aggregations
  const totalProjects = projects.length;
  const activeProjectsCount = projects.filter(p => p.status === 'active').length;
  
  // Total costs
  const totalOrderedValue = materials.reduce((sum, m) => sum + ((parseFloat(m.ordered_qty) || 0) * (parseFloat(m.unit_cost) || 0)), 0);
  const totalActualCost = materials.reduce((sum, m) => sum + ((parseFloat(m.received_qty) || 0) * (parseFloat(m.unit_cost) || 0)), 0);
  const totalWastedCost = materials.reduce((sum, m) => sum + ((parseFloat(m.wasted_qty) || 0) * (parseFloat(m.unit_cost) || 0)), 0);
  
  // Material weights/counts
  const totalReceivedUnits = materials.reduce((sum, m) => sum + (parseFloat(m.received_qty) || 0), 0);
  const totalUsedUnits = materials.reduce((sum, m) => sum + (parseFloat(m.used_qty) || 0), 0);
  const totalWastedUnits = materials.reduce((sum, m) => sum + (parseFloat(m.wasted_qty) || 0), 0);
  const totalRemainingUnits = materials.reduce((sum, m) => sum + (parseFloat(m.remaining_qty) || 0), 0);
  
  const averageWastageRate = totalReceivedUnits > 0 
    ? ((totalWastedUnits / totalReceivedUnits) * 100).toFixed(1) 
    : '0.0';

  // 2. Chart A: Cost by Project (Actual Cost vs Budget)
  const costByProjectData = projects.map(p => {
    const projMaterials = materials.filter(m => m.project_id === p.id);
    const spent = projMaterials.reduce((sum, m) => sum + ((parseFloat(m.received_qty) || 0) * (parseFloat(m.unit_cost) || 0)), 0);
    return {
      name: p.project_name.length > 15 ? p.project_name.slice(0, 15) + '...' : p.project_name,
      Budget: parseFloat(p.budget) || 0,
      Spent: spent
    };
  });

  // 3. Chart B: Procurement vs Usage Trends (Grouped by Category)
  const categorySummary = {};
  materials.forEach(m => {
    if (!categorySummary[m.category]) {
      categorySummary[m.category] = { ordered: 0, received: 0, used: 0, wasted: 0 };
    }
    categorySummary[m.category].ordered += parseFloat(m.ordered_qty) || 0;
    categorySummary[m.category].received += parseFloat(m.received_qty) || 0;
    categorySummary[m.category].used += parseFloat(m.used_qty) || 0;
    categorySummary[m.category].wasted += parseFloat(m.wasted_qty) || 0;
  });

  const categoryChartData = Object.keys(categorySummary).map(cat => ({
    name: cat,
    Ordered: categorySummary[cat].ordered,
    Received: categorySummary[cat].received,
    Used: categorySummary[cat].used,
    Wasted: categorySummary[cat].wasted
  }));

  // 4. Chart C: Wastage Cost Distribution (Pie Chart)
  const COLORS = ['#F59E0B', '#EF4444', '#3B82F6', '#10B981', '#6366F1', '#EC4899'];
  const pieData = Object.keys(categorySummary).map(cat => {
    // find cost of waste in this category
    const catMaterials = materials.filter(m => m.category === cat);
    const cost = catMaterials.reduce((sum, m) => sum + ((parseFloat(m.wasted_qty) || 0) * (parseFloat(m.unit_cost) || 0)), 0);
    return { name: cat, value: cost };
  }).filter(item => item.value > 0);

  // 5. KPI list configuration
  const kpiCards = [
    { title: 'Total Projects', value: totalProjects, subtext: `${activeProjectsCount} Active Sites`, icon: Building2, color: 'text-blue-500 bg-blue-500/10' },
    { title: 'Materials Ordered', value: `₹${(totalOrderedValue / 100000).toFixed(1)}L`, subtext: `${materials.length} Line items`, icon: Boxes, color: 'text-amber-500 bg-amber-500/10' },
    { title: 'Materials Used', value: totalUsedUnits.toLocaleString(), subtext: 'Units consumed', icon: Activity, color: 'text-green-500 bg-green-500/10' },
    { title: 'Total Wastage Cost', value: `₹${(totalWastedCost / 100000).toFixed(2)}L`, subtext: `${averageWastageRate}% Avg wastage`, icon: AlertTriangle, color: 'text-red-500 bg-red-500/10' },
    { title: 'Inventory Balance', value: totalRemainingUnits.toLocaleString(), subtext: 'Units on-site', icon: FolderCheck, color: 'text-indigo-500 bg-indigo-500/10' },
    { title: 'Actual Project Cost', value: `₹${(totalActualCost / 100000).toFixed(2)}L`, subtext: 'Actual procurement spent', icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10' }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/50 dark:border-slate-800/60 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Glory Simon Interiors Dashboard</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Hello {user.name}, you are currently logged in as a {user.role.replace('_', ' ')}.
            {user.role === 'site_engineer' && projects.length > 0 && (
              <span className="ml-1 text-amber-500 font-semibold">
                — Viewing {projects.length} assigned project{projects.length !== 1 ? 's' : ''}: {projects.map(p => p.project_name).join(', ')}
              </span>
            )}
            {user.role === 'site_engineer' && projects.length === 0 && (
              <span className="ml-1 text-slate-400 italic"> — No projects assigned to you yet.</span>
            )}
          </p>
        </div>
        <div className="text-xs bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-full font-bold uppercase tracking-wide">
          Site Live
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-card rounded-2xl p-5 hover-lift">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{card.title}</span>
                  <h4 className="text-2xl font-black text-slate-800 dark:text-white mt-2">{card.value}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">{card.subtext}</p>
                </div>
                <div className={`p-3.5 rounded-xl ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recharts Graphs Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Project Costing vs Budget: 8 cols */}
        <div className="lg:col-span-8 glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-md">Project Cost Comparison</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Budget allowance vs actual materials value received</p>
            </div>
            <TrendingUp className="w-5 h-5 text-slate-400" />
          </div>
          <div className="h-80 w-full">
            {costByProjectData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">No projects available for chart.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costByProjectData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(245, 158, 11, 0.05)' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="Budget" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Spent" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Wastage Distribution: 4 cols */}
        <div className="lg:col-span-4 glass-card rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-md">Wastage Distribution</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Category share of total wasted material cost</p>
          </div>
          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length === 0 ? (
              <div className="text-slate-400 text-xs text-center py-12">No wastage recorded yet. Excellent efficiency!</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-4 text-[10px] font-bold text-slate-500">
            {pieData.map((entry, idx) => (
              <div key={idx} className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Consumption: 12 cols */}
        <div className="lg:col-span-12 glass-card rounded-2xl p-6">
          <div className="mb-6">
            <h3 className="font-bold text-slate-900 dark:text-white text-md">Category Resource Tracking</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Sum of ordered, received, used and wasted quantities across material categories</p>
          </div>
          <div className="h-80 w-full">
            {categoryChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">No material data logged yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="Ordered" fill="#94A3B8" opacity={0.5} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Received" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Used" fill="#10B981" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Wasted" fill="#EF4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Grid of Tables: Recent Projects & Recent Activity logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Projects Table */}
        <div className="glass-card rounded-2xl p-5 overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Recent Interior Projects</h3>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="py-2">Project</th>
                  <th className="py-2">Client</th>
                  <th className="py-2">Budget</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {projects.slice(0, 5).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-2.5 font-semibold text-slate-900 dark:text-white">{p.project_name}</td>
                    <td className="py-2.5 text-slate-500">{p.client_name}</td>
                    <td className="py-2.5 font-medium">₹{(p.budget / 100000).toFixed(1)}L</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        p.status === 'active' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                        p.status === 'planning' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                        'bg-slate-500/10 text-slate-500'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="glass-card rounded-2xl p-5 overflow-hidden flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">System Audit History</h3>
            </div>
          </div>
          <div className="overflow-x-auto">
            {user.role !== 'admin' && user.role !== 'project_manager' ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Audit logs are restricted to Administrators and Project Managers.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                    <th className="py-2">User</th>
                    <th className="py-2">Action</th>
                    <th className="py-2">Details</th>
                    <th className="py-2">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 font-semibold text-slate-800 dark:text-slate-200">{log.user_name || 'System'}</td>
                      <td className="py-2.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-500 truncate max-w-[150px]" title={log.details}>{log.details}</td>
                      <td className="py-2.5 text-slate-400 text-[10px]">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
