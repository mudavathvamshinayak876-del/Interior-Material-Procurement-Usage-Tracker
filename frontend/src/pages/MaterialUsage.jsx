import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Activity, Plus, Edit2, Info, AlertTriangle, CheckCircle, RefreshCw, X } from 'lucide-react';

function MaterialUsage() {
  const { apiFetch, user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [targetMaterial, setTargetMaterial] = useState(null);

  // Form States
  const [receivedQty, setReceivedQty] = useState('');
  const [usedQty, setUsedQty] = useState('');
  const [wastedQty, setWastedQty] = useState('');
  const [isIncremental, setIsIncremental] = useState(false);
  const [addUsed, setAddUsed] = useState('');
  const [addWasted, setAddWasted] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const projRes = await apiFetch('/api/projects');
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData);
        if (projData.length > 0) {
          setSelectedProjectId(projData[0].id.toString());
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterialsForProject = async () => {
    if (!selectedProjectId) return;
    try {
      const res = await apiFetch(`/api/materials?project_id=${selectedProjectId}`);
      if (res.ok) {
        setMaterials(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchMaterialsForProject();
  }, [selectedProjectId]);

  const openUpdateModal = (mat) => {
    setTargetMaterial(mat);
    setReceivedQty(mat.received_qty);
    setUsedQty(mat.used_qty);
    setWastedQty(mat.wasted_qty);
    setAddUsed('');
    setAddWasted('');
    setIsIncremental(false);
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleQuickUseRemaining = async (mat) => {
    const rec = parseFloat(mat.received_qty) || 0;
    const currentUsed = parseFloat(mat.used_qty) || 0;
    const wst = parseFloat(mat.wasted_qty) || 0;
    const rem = parseFloat(mat.remaining_qty) || 0;

    if (rem <= 0) return;

    if (!window.confirm(`Are you sure you want to mark all remaining ${rem} units of '${mat.material_name}' as used?`)) {
      return;
    }

    try {
      const res = await apiFetch(`/api/materials/${mat.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          received_qty: rec,
          used_qty: currentUsed + rem,
          wasted_qty: wst
        })
      });

      if (res.ok) {
        fetchMaterialsForProject();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Failed to update remaining stocks.');
      }
    } catch (err) {
      alert('Server error updating remaining stocks.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const rec = parseFloat(receivedQty) || 0;
    const usd = isIncremental 
      ? ((parseFloat(targetMaterial.used_qty) || 0) + (parseFloat(addUsed) || 0))
      : (parseFloat(usedQty) || 0);
    const wst = isIncremental 
      ? ((parseFloat(targetMaterial.wasted_qty) || 0) + (parseFloat(addWasted) || 0))
      : (parseFloat(wastedQty) || 0);

    if (rec < (usd + wst)) {
      setErrorMessage('Validation Error: Received quantity cannot be less than Used + Wasted combined.');
      return;
    }

    if (isIncremental) {
      const remaining = parseFloat(targetMaterial.remaining_qty) || 0;
      const added = (parseFloat(addUsed) || 0) + (parseFloat(addWasted) || 0);
      if (added > remaining) {
        setErrorMessage(`Validation Error: Additional Used + Additional Wasted (${added}) cannot exceed current remaining stock (${remaining}).`);
        return;
      }
    }

    try {
      const res = await apiFetch(`/api/materials/${targetMaterial.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          received_qty: rec,
          used_qty: usd,
          wasted_qty: wst
        })
      });

      if (res.ok) {
        setModalOpen(false);
        fetchMaterialsForProject();
      } else {
        const errData = await res.json();
        setErrorMessage(errData.message || 'Failed to update usage logs.');
      }
    } catch (err) {
      setErrorMessage('Server error updating logs.');
    }
  };

  // Math variables for usage modal live-render
  const liveReceived = parseFloat(receivedQty) || 0;
  const liveUsed = isIncremental 
    ? ((parseFloat(targetMaterial?.used_qty) || 0) + (parseFloat(addUsed) || 0))
    : (parseFloat(usedQty) || 0);
  const liveWasted = isIncremental 
    ? ((parseFloat(targetMaterial?.wasted_qty) || 0) + (parseFloat(addWasted) || 0))
    : (parseFloat(wastedQty) || 0);
  const liveRemaining = Math.max(0, liveReceived - liveUsed - liveWasted);
  const liveWastagePercent = liveReceived > 0 ? ((liveWasted / liveReceived) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Material Usage & Waste Tracking</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Log site deliveries, consumption rates, and analyze scrap/wastage indices</p>
        </div>
        
        {/* Project Selector dropdown */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-400 uppercase whitespace-nowrap">Selected Site:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500 font-semibold"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.project_name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : materials.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-sm text-slate-400">No materials ordered for this project yet. Please order materials under the Procurement tab first.</p>
        </div>
      ) : (
        /* Materials Usage Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {materials.map((mat) => {
            const ord = parseFloat(mat.ordered_qty) || 0;
            const rec = parseFloat(mat.received_qty) || 0;
            const usd = parseFloat(mat.used_qty) || 0;
            const wst = parseFloat(mat.wasted_qty) || 0;
            const rem = parseFloat(mat.remaining_qty) || 0;
            
            // Percent calculations for stacked progress bar
            const usedPct = rec > 0 ? (usd / rec) * 100 : 0;
            const wastedPct = rec > 0 ? (wst / rec) * 100 : 0;
            const remainingPct = rec > 0 ? (rem / rec) * 100 : 0;
            
            const wastageRate = rec > 0 ? (wst / rec) * 100 : 0;
            const isHighWastage = wastageRate > 10;
            const isLowInventory = rec > 0 && rem <= 5;

            return (
              <div key={mat.id} className="glass-card rounded-2xl p-5 hover-lift flex flex-col justify-between space-y-4">
                
                {/* Upper: Details & Alerts */}
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">{mat.material_name}</h4>
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">{mat.category}</p>
                    </div>
                    
                    {/* Alert Badges */}
                    <div className="flex flex-col items-end space-y-1">
                      {isHighWastage && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-full text-[9px] font-bold text-red-500 uppercase tracking-wide">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Excess Wastage: {wastageRate.toFixed(1)}%</span>
                        </span>
                      )}
                      {isLowInventory && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] font-bold text-blue-500 uppercase tracking-wide">
                          <Info className="w-3 h-3" />
                          <span>Low Stock: {rem} Left</span>
                        </span>
                      )}
                      {!isHighWastage && rec > 0 && (
                        <span className="flex items-center space-x-1 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full text-[9px] font-bold text-green-500 uppercase tracking-wide">
                          <CheckCircle className="w-3 h-3" />
                          <span>Optimal Efficiency</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Procurement status vs ordered */}
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60">
                    <div>
                      <p className="text-slate-400 uppercase text-[8px]">Ordered</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{ord}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase text-[8px]">Received</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{rec}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase text-[8px]">Used</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{usd}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 uppercase text-[8px]">Wasted</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{wst}</p>
                    </div>
                  </div>

                  {/* Multi-Colored Custom Visual Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                      <span>Consumption Stack (of Received)</span>
                      <span>Remaining: {rem} units ({remainingPct.toFixed(0)}%)</span>
                    </div>
                    {rec === 0 ? (
                      <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-[8px] text-slate-400 font-bold uppercase">
                        Awaiting site delivery
                      </div>
                    ) : (
                      <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                        {/* Green: Used */}
                        <div 
                          className="h-full bg-green-500 hover:opacity-90 transition-all cursor-help"
                          style={{ width: `${usedPct}%` }}
                          title={`Used: ${usd} units (${usedPct.toFixed(0)}%)`}
                        ></div>
                        {/* Red: Wasted */}
                        <div 
                          className="h-full bg-red-500 hover:opacity-90 transition-all cursor-help"
                          style={{ width: `${wastedPct}%` }}
                          title={`Wasted: ${wst} units (${wastedPct.toFixed(0)}%)`}
                        ></div>
                        {/* Blue: Remaining */}
                        <div 
                          className="h-full bg-blue-500 hover:opacity-90 transition-all cursor-help"
                          style={{ width: `${remainingPct}%` }}
                          title={`Remaining: ${rem} units (${remainingPct.toFixed(0)}%)`}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lower Action: Site engineers update fields */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 font-medium">
                    <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                    <span>Last updated: {new Date(mat.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    {rem > 0 && (
                      <button 
                        onClick={() => handleQuickUseRemaining(mat)}
                        className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-slate-955 dark:hover:bg-emerald-500 dark:hover:text-slate-950 rounded-lg text-[10px] font-bold transition-all shadow-sm"
                        title="Mark all remaining stock as used"
                      >
                        <span>Use Remaining ({rem})</span>
                      </button>
                    )}
                    <button 
                      onClick={() => openUpdateModal(mat)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-amber-500 hover:text-slate-955 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-amber-500 dark:hover:text-slate-950 rounded-lg text-[10px] font-bold transition-all shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Update Logs</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Usage Update Modal Dialog */}
      {modalOpen && targetMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Update Usage Logs</h3>
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h4 className="font-bold text-amber-500 text-sm">{targetMaterial.material_name}</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Ordered Quantity: {targetMaterial.ordered_qty} units</p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Toggle Mode */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200/50 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => setIsIncremental(false)}
                className={`flex-1 text-center py-1.5 rounded-md text-[10px] font-bold transition-all ${!isIncremental ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Log Absolute Totals
              </button>
              <button
                type="button"
                onClick={() => setIsIncremental(true)}
                className={`flex-1 text-center py-1.5 rounded-md text-[10px] font-bold transition-all ${isIncremental ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Log Incremental Usage
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isIncremental ? (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quantity Received</label>
                    <input 
                      type="number" 
                      required
                      value={receivedQty}
                      onChange={(e) => setReceivedQty(e.target.value)}
                      placeholder="e.g. 150"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-855 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Quantity Consumed (Used)</label>
                        {liveRemaining > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const rec = parseFloat(receivedQty) || 0;
                              const wst = parseFloat(wastedQty) || 0;
                              setUsedQty(rec - wst);
                            }}
                            className="text-[9px] text-amber-500 hover:text-amber-400 font-bold uppercase transition-colors"
                          >
                            Use Remaining
                          </button>
                        )}
                      </div>
                      <input 
                        type="number" 
                        required
                        value={usedQty}
                        onChange={(e) => setUsedQty(e.target.value)}
                        placeholder="e.g. 100"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-855 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quantity Wasted</label>
                      <input 
                        type="number" 
                        required
                        value={wastedQty}
                        onChange={(e) => setWastedQty(e.target.value)}
                        placeholder="e.g. 18"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-855 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Current Received:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{targetMaterial.received_qty} units</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-medium">
                      <span>Current Used / Wasted:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {targetMaterial.used_qty} Used / {targetMaterial.wasted_qty} Wasted
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5 text-xs">
                      <span className="font-bold text-slate-500 uppercase tracking-wide">Remaining Stock:</span>
                      <span className="font-bold text-blue-500">{targetMaterial.remaining_qty} units</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Add to Consumed (Used)</label>
                        {parseFloat(targetMaterial.remaining_qty) > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const rem = parseFloat(targetMaterial.remaining_qty) || 0;
                              const currentAddWasted = parseFloat(addWasted) || 0;
                              setAddUsed(Math.max(0, rem - currentAddWasted));
                            }}
                            className="text-[9px] text-amber-500 hover:text-amber-400 font-bold uppercase transition-colors"
                          >
                            All Remaining
                          </button>
                        )}
                      </div>
                      <input 
                        type="number" 
                        value={addUsed}
                        onChange={(e) => setAddUsed(e.target.value)}
                        placeholder="e.g. 15"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-855 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Add to Wasted</label>
                        {parseFloat(targetMaterial.remaining_qty) > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              const rem = parseFloat(targetMaterial.remaining_qty) || 0;
                              const currentAddUsed = parseFloat(addUsed) || 0;
                              setAddWasted(Math.max(0, rem - currentAddUsed));
                            }}
                            className="text-[9px] text-amber-500 hover:text-amber-400 font-bold uppercase transition-colors"
                          >
                            All Remaining
                          </button>
                        )}
                      </div>
                      <input 
                        type="number" 
                        value={addWasted}
                        onChange={(e) => setAddWasted(e.target.value)}
                        placeholder="e.g. 5"
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-855 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  
                  {/* Summary of Changes */}
                  <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[10px] text-slate-500 space-y-1">
                    <p className="font-bold text-slate-400 uppercase text-[8px] tracking-wide mb-1">Live Preview of New Totals</p>
                    <div className="flex justify-between">
                      <span>Consumed (Used):</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {targetMaterial.used_qty} ➜ {liveUsed} units
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wasted:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {targetMaterial.wasted_qty} ➜ {liveWasted} units
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Remaining Stock:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {targetMaterial.remaining_qty} ➜ {liveRemaining} units
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-955 font-bold rounded-lg text-xs"
                >
                  Update Logs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default MaterialUsage;
