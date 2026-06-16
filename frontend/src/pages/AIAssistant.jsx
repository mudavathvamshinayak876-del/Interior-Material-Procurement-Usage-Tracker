import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BrainCircuit, AlertTriangle, RefreshCcw, Sparkles, HelpCircle, TrendingUp, HelpCircle as HelpIcon } from 'lucide-react';

function AIAssistant() {
  const { apiFetch } = useAuth();
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, wastage, reorders, savings

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/ai/insights');
      if (res.ok) {
        setInsights(await res.json());
      }
    } catch (err) {
      console.error('Failed to retrieve AI recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Insights Engine v1.2</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <BrainCircuit className="w-6 h-6 text-amber-500" />
            <span>AI Procurement Assistant</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Heuristics analyzer scanning site materials databases to predict supply bottlenecks, audit wastage benchmarks, and optimize budget caps.
          </p>
        </div>
        
        <button 
          onClick={fetchInsights}
          disabled={loading}
          className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
          title="Refresh Analysis"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : !insights ? (
        <div className="p-8 text-center text-slate-400">Failed to compile AI insights. Try seeding database.</div>
      ) : (
        /* Insights Grid Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Main Insights Pane (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Abnormal Wastage Anomaly Alerter */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Abnormal Wastage Warnings</h3>
              </div>

              {insights.anomalies.length === 0 ? (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-semibold">
                  ✓ Excellent efficiency! No material lines exceed the 10.0% wastage threshold.
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.anomalies.map((anom, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-xl border flex items-start space-x-3 transition-colors ${
                        anom.severity === 'critical' 
                          ? 'bg-red-500/[0.04] border-red-500/20 text-slate-700 dark:text-slate-300' 
                          : 'bg-amber-500/[0.04] border-amber-500/20 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${anom.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{anom.message}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Financial Impact: ₹{parseFloat(anom.cost_impact).toLocaleString('en-IN')} loss • Category: {anom.material_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Reorder Recommendations */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Suggested Reorders & Buffers</h3>
              </div>

              {insights.reorderSuggestions.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400 text-xs">
                  All active material balances are sufficient. No low stock alerts.
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.reorderSuggestions.map((rec, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/40 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400">{rec.project_name}</span>
                          <h4 className="font-bold text-slate-900 dark:text-white text-xs">{rec.material_name}</h4>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                          Reorder: +{rec.suggested_qty} units
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{rec.message}</p>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                        <span>Current Stock: {rec.current_remaining} units remaining</span>
                        <span>Est. Cost: ₹{parseFloat(rec.estimated_cost).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Shortage Forecasts */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <BrainCircuit className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Material Consumption Velocity Forecasts</h3>
              </div>

              {insights.forecasts.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400 text-xs">
                  Consumption velocities are currently stable compared to project schedules.
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.forecasts.map((fore, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/20 text-xs text-slate-600 dark:text-slate-400">
                      <p className="font-bold text-slate-900 dark:text-white mb-1">{fore.material_name} ({fore.project_name})</p>
                      <p className="leading-relaxed">{fore.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Right Summaries & Savings Pane (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Project AI Summaries */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Project Summaries</h3>
              </div>
              <div className="space-y-4">
                {insights.summaries.map((sum, idx) => (
                  <div key={idx} className="space-y-2 pb-4 border-b border-slate-100 dark:border-slate-850 last:border-b-0 last:pb-0">
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">{sum.project_name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{sum.summary_text}</p>
                    {sum.average_wastage_rate && (
                      <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 font-semibold">
                        <span>Wastage Rate: {sum.average_wastage_rate}</span>
                        <span>Budget Cap Used: {sum.budget_utilization}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Saving Recommendations */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <HelpIcon className="w-5 h-5 text-green-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Cost Saving Actionables</h3>
              </div>
              <div className="space-y-4">
                {insights.costSavingActions.map((action, idx) => (
                  <div key={idx} className="p-3 bg-green-500/[0.02] border border-green-500/10 rounded-xl space-y-2">
                    <h4 className="font-bold text-green-600 dark:text-green-400 text-xs">{action.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{action.recommendation}</p>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold pt-1 border-t border-slate-150/10">
                      <span>Potential Savings:</span>
                      <span className="text-green-500">{action.savings_potential}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default AIAssistant;
