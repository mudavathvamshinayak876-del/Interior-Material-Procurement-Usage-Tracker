import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import ProjectManagement from './pages/ProjectManagement';
import MaterialProcurement from './pages/MaterialProcurement';
import MaterialUsage from './pages/MaterialUsage';
import SupplierInvoice from './pages/SupplierInvoice';
import AIAssistant from './pages/AIAssistant';
import Reports from './pages/Reports';
import EmployeeManagement from './pages/EmployeeManagement';
import TaskAssignment from './pages/TaskAssignment';
import Layout from './components/Layout';

// Route guard for authenticated users
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Route guard for role validation
function RoleRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Private Portal Layout */}
            <Route 
              path="/*" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<Dashboard />} />

              {/* Employees & Workers - Admin only */}
              <Route 
                path="employees" 
                element={
                  <RoleRoute allowedRoles={['admin']}>
                    <EmployeeManagement />
                  </RoleRoute>
                } 
              />
              
              {/* Projects - Admin, PM, and Site Engineers (engineers see only assigned) */}
              <Route 
                path="projects" 
                element={
                  <RoleRoute allowedRoles={['admin', 'project_manager', 'site_engineer']}>
                    <ProjectManagement />
                  </RoleRoute>
                } 
              />
              
              {/* Procurement - PM, Admin, Vendor */}
              <Route 
                path="procurement" 
                element={
                  <RoleRoute allowedRoles={['admin', 'project_manager', 'vendor_coordinator']}>
                    <MaterialProcurement />
                  </RoleRoute>
                } 
              />

              {/* Usage tracking - All roles (Site Engineer updates, PM/Admin monitors) */}
              <Route path="usage" element={<MaterialUsage />} />

              {/* Task and Worker Assignments */}
              <Route 
                path="tasks" 
                element={
                  <RoleRoute allowedRoles={['admin', 'project_manager', 'site_engineer']}>
                    <TaskAssignment />
                  </RoleRoute>
                } 
              />

              {/* Suppliers and Invoices */}
              <Route path="suppliers" element={<SupplierInvoice />} />

              {/* AI Assistant Panel */}
              <Route path="ai-assistant" element={<AIAssistant />} />

              {/* Reports & Audits - Admin, PM, and Site Engineers (scoped to assigned projects) */}
              <Route 
                path="reports" 
                element={
                  <RoleRoute allowedRoles={['admin', 'project_manager', 'site_engineer']}>
                    <Reports />
                  </RoleRoute>
                } 
              />

              {/* Default catch-all redirection */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
