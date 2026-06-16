import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Calendar, ShoppingCart, Filter, X } from 'lucide-react';

function MaterialProcurement() {
  const { apiFetch, user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  // Filter States
  const [filterProject, setFilterProject] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Form States
  const [projectId, setProjectId] = useState('');
  const [materialName, setMaterialName] = useState('');
  const [category, setCategory] = useState('Plywood');
  const [orderedQty, setOrderedQty] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const categories = ['Plywood', 'Hardware', 'Stone', 'Laminates', 'Paint', 'Glass', 'Panels', 'Lighting', 'Misc'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const matRes = await apiFetch('/api/materials');
      if (matRes.ok) setMaterials(await matRes.json());

      const projRes = await apiFetch('/api/projects');
      if (projRes.ok) setProjects(await projRes.json());

      const supRes = await apiFetch('/api/suppliers');
      if (supRes.ok) setSuppliers(await supRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    if (projects.length === 0) {
      alert('Create a project site first before purchasing materials!');
      return;
    }
    setEditingMaterial(null);
    setProjectId(projects[0]?.id || '');
    setMaterialName('');
    setCategory('Plywood');
    setOrderedQty('');
    setUnitCost('');
    setSupplierId(suppliers[0]?.id || '');
    setOrderDate(new Date().toISOString().split('T')[0]);
    setErrorMessage('');
    setModalOpen(true);
  };

  const openEditModal = (mat) => {
    setEditingMaterial(mat);
    setProjectId(mat.project_id);
    setMaterialName(mat.material_name);
    setCategory(mat.category);
    setOrderedQty(mat.ordered_qty);
    setUnitCost(mat.unit_cost);
    setSupplierId(mat.supplier_id || '');
    setOrderDate(mat.order_date || '');
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const payload = {
      project_id: parseInt(projectId),
      material_name: materialName,
      category,
      ordered_qty: parseFloat(orderedQty),
      unit_cost: parseFloat(unitCost),
      supplier_id: supplierId ? parseInt(supplierId) : null,
      order_date: orderDate || null
    };

    try {
      let res;
      if (editingMaterial) {
        // PM / Admin / Vendor can edit
        res = await apiFetch(`/api/materials/${editingMaterial.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch('/api/materials', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setModalOpen(false);
        fetchData();
      } else {
        const errData = await res.json();
        setErrorMessage(errData.message || 'Operation failed.');
      }
    } catch (err) {
      setErrorMessage('Network or server error.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel and delete this material procurement log?')) {
      return;
    }

    try {
      const res = await apiFetch(`/api/materials/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to delete material log.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchProj = filterProject === '' || m.project_id === parseInt(filterProject);
    const matchCat = filterCategory === '' || m.category === filterCategory;
    return matchProj && matchCat;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Material Procurement</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Order supplies, assign vendors, and track delivery progress</p>
        </div>
        {user.role !== 'site_engineer' && (
          <button 
            onClick={openCreateModal}
            className="flex items-center space-x-2 py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/10 hover-lift transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Order Material</span>
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-xl flex flex-wrap gap-4 items-center">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 uppercase">
          <Filter className="w-4 h-4 text-amber-500" />
          <span>Filters</span>
        </div>
        
        {/* Project Selector */}
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

        {/* Category Selector */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500"
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {(filterProject || filterCategory) && (
          <button 
            onClick={() => { setFilterProject(''); setFilterCategory(''); }}
            className="text-xs text-red-500 hover:underline font-semibold"
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <p className="text-sm text-slate-400">No procurement logs match the filter criteria.</p>
        </div>
      ) : (
        /* Materials Table */
        <div className="glass-card rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="p-4">Material</th>
                  <th className="p-4">Project</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Ordered Qty</th>
                  <th className="p-4">Unit Cost</th>
                  <th className="p-4">Total Cost</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMaterials.map((mat) => (
                  <tr key={mat.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10">
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">{mat.material_name}</td>
                    <td className="p-4 text-slate-500">{mat.project_name}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                        {mat.category}
                      </span>
                    </td>
                    <td className="p-4 font-semibold">{parseFloat(mat.ordered_qty).toLocaleString()}</td>
                    <td className="p-4">₹{parseFloat(mat.unit_cost).toLocaleString('en-IN')}</td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      ₹{((parseFloat(mat.ordered_qty) || 0) * (parseFloat(mat.unit_cost) || 0)).toLocaleString('en-IN')}
                    </td>
                    <td className="p-4 text-slate-500">{mat.supplier_name || 'Not Assigned'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        mat.status === 'received' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' :
                        mat.status === 'ordered' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                        'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}>
                        {mat.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center space-x-2">
                        {user.role !== 'site_engineer' ? (
                          <>
                            <button
                              onClick={() => openEditModal(mat)}
                              className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-amber-500 transition-colors"
                              title="Edit Order"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(mat.id)}
                              className="p-1 rounded border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-red-500 transition-colors"
                              title="Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No Edit Rights</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Procurement Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl relative">
            <button 
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              {editingMaterial ? 'Modify Material Order' : 'Procure Site Materials'}
            </h3>
            <p className="text-xs text-slate-400">Order materials and bind them to project budgets</p>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Project</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    disabled={!!editingMaterial}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.project_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Material Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-850 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Material Name / Specs</label>
                <input 
                  type="text" 
                  required
                  value={materialName}
                  onChange={(e) => setMaterialName(e.target.value)}
                  placeholder="Teak Wood Plywood 18mm"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-855 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Quantity Ordered</label>
                  <input 
                    type="number" 
                    required
                    value={orderedQty}
                    onChange={(e) => setOrderedQty(e.target.value)}
                    placeholder="150"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-855 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Unit Cost (INR)</label>
                  <input 
                    type="number" 
                    required
                    value={unitCost}
                    onChange={(e) => setUnitCost(e.target.value)}
                    placeholder="2200"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-855 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Supplier / Vendor</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-855 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="">No Supplier Assigned</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.supplier_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Order Date</label>
                  <input 
                    type="date" 
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-855 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Estimate Total */}
              {orderedQty && unitCost && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/20 text-slate-800 dark:text-slate-200 rounded-lg flex justify-between items-center text-xs">
                  <span className="font-semibold uppercase text-[10px] text-slate-400">Total Purchase Value:</span>
                  <span className="font-bold text-amber-500 text-sm">
                    ₹{(parseFloat(orderedQty) * parseFloat(unitCost)).toLocaleString('en-IN')}
                  </span>
                </div>
              )}

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
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-955 font-bold rounded-lg text-xs shadow-lg shadow-amber-500/10"
                >
                  {editingMaterial ? 'Save Changes' : 'Record Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default MaterialProcurement;
