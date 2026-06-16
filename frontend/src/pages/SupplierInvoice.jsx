import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Search, Link as LinkIcon, FileText, Download, Phone, Mail, FileCheck, X } from 'lucide-react';

function SupplierInvoice() {
  const { apiFetch, user } = useAuth();
  
  // Lists States
  const [suppliers, setSuppliers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [invoiceSearch, setInvoiceSearch] = useState('');

  // Modals Toggles
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState(null);

  // Supplier Form State
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supGst, setSupGst] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supError, setSupError] = useState('');

  // Invoice Form State
  const [invProject, setInvProject] = useState('');
  const [invSupplier, setInvSupplier] = useState('');
  const [invNumber, setInvNumber] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invDate, setInvDate] = useState('');
  const [invFile, setInvFile] = useState(null);
  const [invError, setInvError] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const supRes = await apiFetch('/api/suppliers');
      if (supRes.ok) setSuppliers(await supRes.json());

      const invRes = await apiFetch('/api/invoices');
      if (invRes.ok) setInvoices(await invRes.json());

      const projRes = await apiFetch('/api/projects');
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData);
        if (projData.length > 0) setInvProject(projData[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const openSupplierModal = () => {
    setSupName('');
    setSupContact('');
    setSupPhone('');
    setSupEmail('');
    setSupGst('');
    setSupAddress('');
    setSupError('');
    setSupplierModalOpen(true);
  };

  const openInvoiceModal = () => {
    if (suppliers.length === 0) {
      alert('Register a supplier first before logging invoices!');
      return;
    }
    setInvSupplier(suppliers[0]?.id.toString());
    setInvNumber('');
    setInvAmount('');
    setInvDate(new Date().toISOString().split('T')[0]);
    setInvFile(null);
    setInvError('');
    setInvoiceModalOpen(true);
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    setSupError('');

    try {
      const res = await apiFetch('/api/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          supplier_name: supName,
          contact_person: supContact,
          phone: supPhone,
          email: supEmail,
          gst_number: supGst,
          address: supAddress
        })
      });

      if (res.ok) {
        setSupplierModalOpen(false);
        fetchAllData();
      } else {
        const data = await res.json();
        setSupError(data.message || 'Failed to register supplier.');
      }
    } catch (err) {
      setSupError('Server communication error.');
    }
  };

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    setInvError('');
    setUploading(true);

    // File upload requires FormData
    const formData = new FormData();
    formData.append('project_id', invProject);
    formData.append('supplier_id', invSupplier);
    formData.append('invoice_number', invNumber);
    formData.append('amount', parseFloat(invAmount));
    formData.append('date', invDate);
    if (invFile) {
      formData.append('invoice_file', invFile);
    }

    try {
      // Custom fetch for multipart/form-data:
      // We manually construct headers and attach the auth token.
      const currentToken = localStorage.getItem('token');
      const headers = {};
      if (currentToken) {
        headers['Authorization'] = `Bearer ${currentToken}`;
      }

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers,
        body: formData
      });

      if (res.ok) {
        setInvoiceModalOpen(false);
        fetchAllData();
      } else {
        const data = await res.json();
        setInvError(data.message || 'Failed to upload invoice.');
      }
    } catch (err) {
      setInvError('Failed to communicate with upload server.');
    } finally {
      setUploading(false);
    }
  };

  const handleInvoiceDelete = async (id) => {
    if (!window.confirm('Delete this invoice record?')) return;
    try {
      const res = await apiFetch(`/api/invoices/${id}`, { method: 'DELETE' });
      if (res.ok) fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSupplierDelete = async (id) => {
    if (!window.confirm('Delete this supplier? All linked invoice listings will remain, but supplier details will be removed.')) return;
    try {
      const res = await apiFetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      if (res.ok) fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const searchedInvoices = invoices.filter(inv => {
    const term = invoiceSearch.toLowerCase();
    return (
      inv.invoice_number.toLowerCase().includes(term) ||
      (inv.supplier_name && inv.supplier_name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8">
      
      {/* Title Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Vendors & Billing center</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage trade contacts and upload invoices for project cost accounting</p>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        /* Two-Pane Layout grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Pane: Supplier Management (5 Cols) */}
          <div className="lg:col-span-5 glass-card rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Suppliers & Subcontractors</h3>
              {user.role !== 'site_engineer' && (
                <button 
                  onClick={openSupplierModal}
                  className="flex items-center space-x-1.5 py-1 px-2.5 rounded bg-slate-100 hover:bg-amber-500 hover:text-slate-950 text-slate-600 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-amber-500 dark:hover:text-slate-950 text-[10px] font-bold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Supplier</span>
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {suppliers.map(s => (
                <div key={s.id} className="p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/40 relative group hover:border-amber-500/30 transition-all">
                  
                  {user.role === 'admin' && (
                    <button
                      onClick={() => handleSupplierDelete(s.id)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove Supplier"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <h4 className="font-bold text-slate-900 dark:text-white text-xs">{s.supplier_name}</h4>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">GST: {s.gst_number || 'Not Registered'}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Contact: {s.contact_person || 'N/A'}</p>
                  
                  <div className="flex space-x-3 text-[10px] text-slate-400 mt-3 border-t border-slate-200/30 pt-2">
                    {s.phone && (
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3 h-3" />
                        <span>{s.phone}</span>
                      </span>
                    )}
                    {s.email && (
                      <span className="flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate max-w-[100px]">{s.email}</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Pane: Invoices Ledger (7 Cols) */}
          <div className="lg:col-span-7 glass-card rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Invoice Management</h3>
              
              <div className="flex items-center space-x-2">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1.5 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    placeholder="Search invoice #"
                    className="pl-8 pr-3 py-1 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[10px] rounded-lg w-32 sm:w-40 outline-none"
                  />
                </div>
                
                {user.role !== 'site_engineer' && (
                  <button 
                    onClick={openInvoiceModal}
                    className="flex items-center space-x-1.5 py-1 px-2.5 rounded bg-slate-100 hover:bg-amber-500 hover:text-slate-955 text-slate-650 dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-amber-500 dark:hover:text-slate-955 text-[10px] font-bold transition-all shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Invoice</span>
                  </button>
                )}
              </div>
            </div>

            {/* Invoices List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="text-slate-400 font-bold uppercase text-[9px] border-b border-slate-100 dark:border-slate-800">
                    <th className="py-2">Inv Number</th>
                    <th className="py-2">Supplier</th>
                    <th className="py-2">Project</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2 text-center">Attachment</th>
                    {user.role === 'admin' && <th className="py-2 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {searchedInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">{inv.invoice_number}</td>
                      <td className="py-2.5 text-slate-500">{inv.supplier_name || 'N/A'}</td>
                      <td className="py-2.5 text-slate-400">{inv.project_name}</td>
                      <td className="py-2.5 font-semibold">₹{parseFloat(inv.amount).toLocaleString('en-IN')}</td>
                      <td className="py-2.5">
                        <div className="flex justify-center">
                          {inv.file_url ? (
                            <button
                              onClick={() => setPreviewInvoice(inv)}
                              className="flex items-center space-x-1 py-1 px-2 border border-slate-200 dark:border-slate-800 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] text-amber-500 font-semibold"
                            >
                              <FileCheck className="w-3.5 h-3.5" />
                              <span>View File</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No File</span>
                          )}
                        </div>
                      </td>
                      {user.role === 'admin' && (
                        <td className="py-2.5 text-center">
                          <button 
                            onClick={() => handleInvoiceDelete(inv.id)}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Supplier Register Modal */}
      {supplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl relative">
            <button onClick={() => setSupplierModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5" /></button>

            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Add Trade Vendor</h3>
            
            {supError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-lg">{supError}</div>}

            <form onSubmit={handleSupplierSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Company Name</label>
                <input type="text" required value={supName} onChange={(e) => setSupName(e.target.value)} placeholder="Apex Materials Ltd" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contact Person</label>
                  <input type="text" value={supContact} onChange={(e) => setSupContact(e.target.value)} placeholder="Amit Shah" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">GST Registration No.</label>
                  <input type="text" value={supGst} onChange={(e) => setSupGst(e.target.value)} placeholder="29AAAAA1111A1Z1" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contact Phone</label>
                  <input type="text" value={supPhone} onChange={(e) => setSupPhone(e.target.value)} placeholder="9876543210" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                  <input type="email" value={supEmail} onChange={(e) => setSupEmail(e.target.value)} placeholder="sales@apex.com" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Office/Warehouse Address</label>
                <textarea rows="2" value={supAddress} onChange={(e) => setSupAddress(e.target.value)} placeholder="12 Industrial Layout, Bangalore" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500"></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setSupplierModalOpen(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-955 font-bold rounded-lg text-xs">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Log Modal */}
      {invoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl relative">
            <button onClick={() => setInvoiceModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-5 h-5" /></button>

            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Record Supplier Invoice</h3>
            <p className="text-xs text-slate-400">Add invoice numbers and attach physical receipts</p>
            
            {invError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-lg">{invError}</div>}

            <form onSubmit={handleInvoiceSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Project</label>
                  <select value={invProject} onChange={(e) => setInvProject(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500">
                    {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Supplier</label>
                  <select value={invSupplier} onChange={(e) => setInvSupplier(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-955 text-xs outline-none focus:ring-1 focus:ring-amber-500">
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Invoice Number</label>
                  <input type="text" required value={invNumber} onChange={(e) => setInvNumber(e.target.value)} placeholder="INV-2026-908" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Billing Date</label>
                  <input type="date" required value={invDate} onChange={(e) => setInvDate(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Invoice Total Amount (INR)</label>
                <input type="number" required value={invAmount} onChange={(e) => setInvAmount(e.target.value)} placeholder="e.g. 45000" className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500" />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">File Attachment (PDF / JPG / PNG)</label>
                <input 
                  type="file" 
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setInvFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 dark:file:bg-slate-800 dark:file:text-slate-200 hover:file:bg-amber-500 hover:file:text-slate-955 cursor-pointer file:cursor-pointer"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setInvoiceModalOpen(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
                <button type="submit" disabled={uploading} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-955 font-bold rounded-lg text-xs flex items-center space-x-1">
                  {uploading ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-b-2 border-current"></div> : <span>Save Invoice</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Viewer / Preview Modal */}
      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-3xl w-full max-h-[85vh] flex flex-col justify-between shadow-2xl relative">
            <button 
              onClick={() => setPreviewInvoice(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-slate-900 dark:text-white text-md border-b border-slate-100 dark:border-slate-800 pb-3">
              Preview Invoice: {previewInvoice.invoice_number}
            </h3>
            
            <div className="flex-1 my-4 overflow-y-auto min-h-[300px] bg-slate-50 dark:bg-slate-950 rounded-lg p-4 flex flex-col items-center justify-center border border-slate-200/50 dark:border-slate-800/80">
              {/* Check if PDF or image */}
              {previewInvoice.file_url.toLowerCase().endsWith('.pdf') ? (
                <div className="space-y-4 text-center">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">PDF Document Attached</p>
                    <p className="text-xs text-slate-400">PDF files cannot be fully embedded inside local sandboxes.</p>
                  </div>
                  <a 
                    href={previewInvoice.file_url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-500 text-slate-955 font-bold rounded-lg text-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF File</span>
                  </a>
                </div>
              ) : (
                /* It's an image or local upload */
                <div className="space-y-4 text-center w-full">
                  <img 
                    src={previewInvoice.file_url} 
                    alt={`Invoice ${previewInvoice.invoice_number}`} 
                    className="max-h-[350px] mx-auto rounded-lg object-contain shadow border border-slate-200 dark:border-slate-800"
                  />
                  <div className="flex justify-center space-x-2">
                    <a 
                      href={previewInvoice.file_url} 
                      download 
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-amber-500 hover:text-slate-955 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-amber-500 dark:hover:text-slate-955 rounded-lg text-xs font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download File</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button 
                onClick={() => setPreviewInvoice(null)} 
                className="px-4 py-2 border border-slate-250 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SupplierInvoice;
