import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Download, Printer, FileText, Table, Sparkles } from 'lucide-react';

function Reports() {
  const { apiFetch } = useAuth();
  const [activeTab, setActiveTab] = useState('consumption');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (tab) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/reports/${tab}`);
      if (res.ok) {
        setReportData(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab]);

  const handleDownloadCSV = () => {
    const token = localStorage.getItem('token');
    // Open in a new tab or trigger direct download
    const url = `/api/reports/${activeTab}?export_csv=true&Authorization=Bearer ${token}`;
    
    // Create hidden anchor link to trigger download with proper headers or direct token parsing
    // Since browser downloads don't support custom headers easily, we pass the token in URL query parameter,
    // and let the backend auth middleware check both headers and query string.
    // Wait, let's verify if the backend auth middleware check query string.
    // Our backend auth middleware in backend/middleware/auth.js:
    // "const token = authHeader && authHeader.split(' ')[1];"
    // It doesn't check query string!
    // To solve this beautifully, we can trigger the fetch in JS, get the blob, and download it!
    // This is 100% secure, doesn't require backend modifications, and works perfectly!
    
    setLoading(true);
    apiFetch(`/api/reports/${activeTab}?export_csv=true`)
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeTab}_report.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handlePrint = () => {
    window.print();
  };

  const tabs = [
    { id: 'consumption', label: 'Material Consumption', description: 'Tracks ordered vs consumed material cost and volume across project sites.' },
    { id: 'wastage', label: 'Wastage Report', description: 'Calculates wastage weights, percentages, and financial impact for active materials.' },
    { id: 'cost-variance', label: 'Cost Variance', description: 'Compares total project budget allocations against actual procurement invoice totals.' },
    { id: 'supplier-performance', label: 'Supplier Performance', description: 'Tracks vendor deliveries counts, invoice values, and average defect/wastage rates.' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Reports & Auditing</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Generate compliance sheets, track scrap margins, and audit vendor performance</p>
        </div>
        
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button 
            onClick={handlePrint}
            className="flex items-center justify-center space-x-2 py-2 px-4 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-650 dark:text-slate-350 text-xs font-semibold w-full sm:w-auto"
          >
            <Printer className="w-4 h-4 text-slate-450" />
            <span>Print PDF</span>
          </button>
          
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center justify-center space-x-2 py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold w-full sm:w-auto shadow-lg shadow-amber-500/10 hover-lift transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap border-b border-slate-200 dark:border-slate-850 gap-2 print:hidden">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`pb-3 px-4 font-bold text-xs transition-colors uppercase tracking-wider relative ${
              activeTab === t.id 
                ? 'text-amber-500 border-b-2 border-amber-500' 
                : 'text-slate-400 hover:text-slate-650'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Report Summary Details Card */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/60 rounded-xl space-y-1 print:border-none print:shadow-none print:p-0">
        <h3 className="font-bold text-slate-850 dark:text-white text-xs print:text-lg">
          {tabs.find(t => t.id === activeTab)?.label}
        </h3>
        <p className="text-[11px] text-slate-400 print:hidden">
          {tabs.find(t => t.id === activeTab)?.description}
        </p>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center print:hidden">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : reportData.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl print:hidden">
          <p className="text-sm text-slate-400">No data compiled for this report timeframe.</p>
        </div>
      ) : (
        /* Report Tables depending on tab selection */
        <div className="glass-card rounded-2xl overflow-hidden print:border-none print:shadow-none print:bg-transparent">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs print:text-[10px]">
              
              {/* HEADERS */}
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-150 dark:border-slate-800 text-slate-450 font-bold uppercase text-[9px] print:bg-slate-100">
                  {activeTab === 'consumption' && (
                    <>
                      <th className="p-4">Project</th>
                      <th className="p-4">Material</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Ordered</th>
                      <th className="p-4">Received</th>
                      <th className="p-4">Consumed (Used)</th>
                      <th className="p-4">Unit Cost</th>
                      <th className="p-4">Total Cost</th>
                      <th className="p-4">Supplier</th>
                    </>
                  )}
                  {activeTab === 'wastage' && (
                    <>
                      <th className="p-4">Project</th>
                      <th className="p-4">Material</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Received</th>
                      <th className="p-4">Consumed (Used)</th>
                      <th className="p-4">Wasted</th>
                      <th className="p-4">Scrap rate</th>
                      <th className="p-4">Wastage Loss</th>
                    </>
                  )}
                  {activeTab === 'cost-variance' && (
                    <>
                      <th className="p-4">Project</th>
                      <th className="p-4">Client</th>
                      <th className="p-4">Allocated Budget</th>
                      <th className="p-4">Ordered Cost</th>
                      <th className="p-4">Actual Cost</th>
                      <th className="p-4">Variance Balance</th>
                      <th className="p-4">Invoiced Total</th>
                      <th className="p-4">Status</th>
                    </>
                  )}
                  {activeTab === 'supplier-performance' && (
                    <>
                      <th className="p-4">Supplier Name</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">GST Number</th>
                      <th className="p-4 text-center">Deliveries</th>
                      <th className="p-4">Total Value</th>
                      <th className="p-4">Wastage Cost</th>
                      <th className="p-4">Avg Material Wastage</th>
                    </>
                  )}
                </tr>
              </thead>

              {/* BODY ROWS */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10 print:hover:bg-transparent">
                    {activeTab === 'consumption' && (
                      <>
                        <td className="p-4 font-semibold text-slate-900 dark:text-white">{row.project_name}</td>
                        <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{row.material_name}</td>
                        <td className="p-4">{row.category}</td>
                        <td className="p-4">{parseFloat(row.ordered_qty).toLocaleString()}</td>
                        <td className="p-4">{parseFloat(row.received_qty).toLocaleString()}</td>
                        <td className="p-4">{parseFloat(row.used_qty).toLocaleString()}</td>
                        <td className="p-4">₹{parseFloat(row.unit_cost).toLocaleString('en-IN')}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">₹{parseFloat(row.total_cost).toLocaleString('en-IN')}</td>
                        <td className="p-4 text-slate-500">{row.supplier_name || 'N/A'}</td>
                      </>
                    )}
                    {activeTab === 'wastage' && (
                      <>
                        <td className="p-4 font-semibold text-slate-900 dark:text-white">{row.project_name}</td>
                        <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{row.material_name}</td>
                        <td className="p-4">{row.category}</td>
                        <td className="p-4">{parseFloat(row.received_qty).toLocaleString()}</td>
                        <td className="p-4">{parseFloat(row.used_qty).toLocaleString()}</td>
                        <td className="p-4 text-red-500 font-semibold">{parseFloat(row.wasted_qty).toLocaleString()}</td>
                        <td className={`p-4 font-bold ${parseFloat(row.wastage_percentage) > 10 ? 'text-red-500' : 'text-green-500'}`}>
                          {row.wastage_percentage}%
                        </td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">₹{parseFloat(row.wastage_cost).toLocaleString('en-IN')}</td>
                      </>
                    )}
                    {activeTab === 'cost-variance' && (
                      <>
                        <td className="p-4 font-semibold text-slate-900 dark:text-white">{row.project_name}</td>
                        <td className="p-4 text-slate-500">{row.client_name}</td>
                        <td className="p-4 font-medium">₹{parseFloat(row.budget).toLocaleString('en-IN')}</td>
                        <td className="p-4">₹{parseFloat(row.total_ordered_cost).toLocaleString('en-IN')}</td>
                        <td className="p-4">₹{parseFloat(row.total_actual_cost).toLocaleString('en-IN')}</td>
                        <td className={`p-4 font-bold ${parseFloat(row.variance) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                          ₹{parseFloat(row.variance).toLocaleString('en-IN')}
                        </td>
                        <td className="p-4 font-semibold">₹{parseFloat(row.total_invoiced_amount).toLocaleString('en-IN')}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[8px] ${
                            row.status === 'active' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' :
                            row.status === 'planning' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' :
                            'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </>
                    )}
                    {activeTab === 'supplier-performance' && (
                      <>
                        <td className="p-4 font-semibold text-slate-900 dark:text-white">{row.supplier_name}</td>
                        <td className="p-4 text-slate-500">{row.contact_person || 'N/A'}</td>
                        <td className="p-4 text-slate-405">{row.gst_number || 'N/A'}</td>
                        <td className="p-4 text-center font-medium">{row.materials_supplied_count}</td>
                        <td className="p-4 font-bold text-slate-900 dark:text-white">₹{parseFloat(row.total_supply_value).toLocaleString('en-IN')}</td>
                        <td className="p-4 text-red-500">₹{parseFloat(row.total_wastage_cost).toLocaleString('en-IN')}</td>
                        <td className={`p-4 font-bold ${parseFloat(row.average_material_wastage_percentage) > 10 ? 'text-red-500' : 'text-green-500'}`}>
                          {row.average_material_wastage_percentage}%
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>
      )}

    </div>
  );
}

export default Reports;
