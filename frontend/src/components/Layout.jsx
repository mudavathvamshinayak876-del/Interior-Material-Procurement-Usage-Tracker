import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  LayoutDashboard, 
  FolderGit2, 
  ShoppingCart, 
  Activity, 
  Users2, 
  BrainCircuit, 
  FilePieChart, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Bell, 
  User,
  AlertTriangle,
  FileWarning,
  Box,
  Truck,
  UsersRound,
  ClipboardList
} from 'lucide-react';

function Layout() {
  const { user, logout, hasRole } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'project_manager', 'site_engineer', 'vendor_coordinator'] },
    { path: '/employees', label: 'Employees & Workers', icon: UsersRound, roles: ['admin'] },
    { path: '/projects', label: 'Projects', icon: FolderGit2, roles: ['admin', 'project_manager', 'site_engineer'] },
    { path: '/procurement', label: 'Procurement', icon: ShoppingCart, roles: ['admin', 'project_manager', 'vendor_coordinator'] },
    { path: '/usage', label: 'Material Usage', icon: Activity, roles: ['admin', 'project_manager', 'site_engineer', 'vendor_coordinator'] },
    { path: '/tasks', label: 'Tasks & Workers', icon: ClipboardList, roles: ['admin', 'project_manager', 'site_engineer'] },
    { path: '/suppliers', label: 'Suppliers & Invoices', icon: Users2, roles: ['admin', 'project_manager', 'site_engineer', 'vendor_coordinator'] },
    { path: '/ai-assistant', label: 'AI Assistant', icon: BrainCircuit, roles: ['admin', 'project_manager', 'site_engineer', 'vendor_coordinator'] },
    { path: '/reports', label: 'Reports & Audits', icon: FilePieChart, roles: ['admin', 'project_manager', 'site_engineer'] }
  ];

  const getNotifIcon = (type) => {
    switch (type) {
      case 'excess_wastage': return <AlertTriangle className="text-red-500 w-5 h-5" />;
      case 'missing_invoice': return <FileWarning className="text-amber-500 w-5 h-5" />;
      case 'low_inventory': return <Box className="text-blue-500 w-5 h-5" />;
      case 'delayed_delivery': return <Truck className="text-orange-500 w-5 h-5" />;
      default: return <Bell className="text-slate-500 w-5 h-5" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
      case 'project_manager': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
      case 'site_engineer': return 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20';
      case 'vendor_coordinator': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
      default: return 'bg-slate-500/10 text-slate-600 border border-slate-500/20';
    }
  };

  const formatRoleName = (role) => {
    return role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0">
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 space-x-2">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-bold text-slate-950">G</div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-wide leading-tight">Glory Simon</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Materials Hub</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (item.roles && !item.roles.includes(user?.role)) return null;
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive 
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-col space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-white">
              {user?.name?.charAt(0) || <User />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full inline-block mt-0.5 font-bold uppercase tracking-wider ${getRoleBadgeColor(user?.role)}`}>
                {user?.role ? formatRoleName(user.role) : ''}
              </span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 text-xs font-semibold transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Drawer Sidebar for Mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay */}
          <div 
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          ></div>

          <aside className="relative flex flex-col w-64 max-w-xs bg-slate-900 text-slate-300 border-r border-slate-800 z-50">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-bold text-slate-950">G</div>
                <h1 className="font-bold text-white text-sm">Glory Simon</h1>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                if (item.roles && !item.roles.includes(user?.role)) return null;
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) => `
                      flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-150
                      ${isActive 
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800 bg-slate-950">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-white">
                  {user?.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{user?.name}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full inline-block mt-0.5 font-bold uppercase tracking-wider ${getRoleBadgeColor(user?.role)}`}>
                    {user?.role ? formatRoleName(user.role) : ''}
                  </span>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-slate-800 hover:bg-red-500 hover:text-white text-slate-400 text-xs font-semibold transition-all duration-150"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Top Navbar */}
        <header className="glass-navbar h-16 flex items-center justify-between px-4 sm:px-6 shadow-sm">
          {/* Left: Hamburger menu & branding */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="lg:hidden flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center font-bold text-slate-950">G</div>
              <span className="font-bold text-slate-900 dark:text-white text-sm">GS Interiors</span>
            </div>
            
            {/* Desktop Page Title (derived or simple) */}
            <span className="hidden sm:inline-block font-semibold text-slate-800 dark:text-slate-200 text-lg">
              Glory Simon Interiors Portal
            </span>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            {/* Notifications Dropdown Wrapper */}
            <div className="relative">
              <button 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2 z-[90] max-h-[480px] overflow-hidden flex flex-col">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">Notifications ({unreadCount})</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-amber-500 hover:text-amber-600 font-semibold"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 max-h-[300px]">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-4 flex items-start space-x-3 transition-colors ${notif.status === 'unread' ? 'bg-amber-500/5 dark:bg-amber-500/[0.02]' : ''}`}
                        >
                          <div className="shrink-0 mt-0.5">
                            {getNotifIcon(notif.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs ${notif.status === 'unread' ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                              {notif.message}
                            </p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          {notif.status === 'unread' && (
                            <button 
                              onClick={() => markAsRead(notif.id)}
                              className="shrink-0 text-[10px] font-bold text-amber-500 hover:text-amber-600 self-center"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Profile Pill */}
            <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-800 pl-4">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                {user?.name?.charAt(0)}
              </div>
              <span className="hidden md:inline-block text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                {user?.name.split(' ')[0]}
              </span>
            </div>

          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
          <Outlet />
        </main>
      </div>

    </div>
  );
}

export default Layout;
