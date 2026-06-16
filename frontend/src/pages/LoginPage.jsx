import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, Sparkles, UserCheck } from 'lucide-react';

function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  const demoAccounts = [
    { label: 'Admin', email: 'admin@glorysimon.com', role: 'Full System Access' },
    { label: 'Project Manager', email: 'pm@glorysimon.com', role: 'Manage Projects & Orders' },
    { label: 'Site Engineer', email: 'engineer@glorysimon.com', role: 'Log Received & Consumption' },
    { label: 'Vendor Coordinator', email: 'vendor@glorysimon.com', role: 'Suppliers & Invoice Upload' }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    
    const result = await login(email, password);
    if (!result.success) {
      setErrorMessage(result.error || 'Invalid email or password.');
      setIsSubmitting(false);
    }
  };

  const handleDemoSelect = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  const handleGoogleLogin = () => {
    setIsSubmitting(true);
    setErrorMessage('');
    setTimeout(async () => {
      // Log in as admin for demo simplicity
      const result = await login('admin@glorysimon.com', 'password123');
      if (!result.success) {
        setErrorMessage('Google SSO simulation failed.');
        setIsSubmitting(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-950 dark:to-slate-900 transition-colors duration-200">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Branding text */}
        <div className="lg:col-span-5 space-y-6 hidden lg:block text-slate-800 dark:text-slate-200">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded bg-slate-900 dark:bg-amber-500 flex items-center justify-center font-black text-amber-500 dark:text-slate-950 text-xl">G</div>
            <h1 className="font-extrabold text-2xl tracking-tight">Glory Simon Interiors</h1>
          </div>
          <h2 className="text-3xl font-black leading-tight">
            Enterprise Material tracking for professional designers.
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            Monitor, budget, and optimize wood, stone, hardware, and lighting resources across multiple residential and commercial sites. Secure access logs ensure compliance and accountability.
          </p>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-500">
            <Sparkles className="w-4 h-4" />
            <span>Real-time site sync via WebSockets</span>
          </div>
        </div>

        {/* Right Column: Glass Login card & demo accounts */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* Main login card */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="mb-6 lg:hidden flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-slate-900 dark:bg-amber-500 flex items-center justify-center font-bold text-amber-500 dark:text-slate-950 text-md">G</div>
              <span className="font-bold text-slate-800 dark:text-white">Glory Simon Interiors</span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Welcome back</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-6">Log in to your workspace portal to manage materials</p>

            {errorMessage && (
              <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="enter your company email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-bold uppercase text-slate-400">Password</label>
                  <button 
                    type="button"
                    onClick={() => { setShowForgotModal(true); setForgotSent(false); }}
                    className="text-[11px] font-bold text-amber-500 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4"
                  />
                  <span>Remember my login info</span>
                </label>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 text-white font-bold rounded-lg text-sm transition-all hover-lift flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/5"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
              <span className="relative px-3 bg-white dark:bg-slate-900 text-[10px] text-slate-400 uppercase font-bold tracking-wider">or connect with</span>
            </div>

            {/* Google Login Simulator */}
            <button 
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full py-2.5 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950 flex items-center justify-center space-x-2 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.478 0-6.3-2.822-6.3-6.3s2.822-6.3 6.3-6.3c1.63 0 3.107.622 4.22 1.635l3.12-3.12C19.18 2.54 15.91 1.2 12.24 1.2c-5.965 0-10.8 4.835-10.8 10.8s4.835 10.8 10.8 10.8c5.448 0 10.155-3.896 10.155-10.8 0-.615-.077-1.2-.22-1.715H12.24z"/>
              </svg>
              <span>Login with Google Workplace</span>
            </button>

          </div>

          {/* Quick Demo Selector Panel */}
          <div className="p-5 border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 rounded-2xl backdrop-blur-sm shadow-xl">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
              <UserCheck className="w-4 h-4 text-amber-500" />
              <span>Developer Quick Logins</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.label}
                  onClick={() => handleDemoSelect(account.email)}
                  className="p-2.5 border border-slate-200/50 dark:border-slate-800/50 hover:border-amber-500 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-all group"
                >
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">{account.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 truncate">{account.role}</p>
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Forgot Password Simulator Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-md">Forgot Password Simulation</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              In production, this triggers an SMTP email containing a secure token link to update your password.
            </p>
            {forgotSent ? (
              <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-lg">
                Demo recovery email logged to console!
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Your Email</label>
                <input 
                  type="email" 
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@glorysimon.com"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}
            <div className="flex justify-end space-x-2 pt-2">
              <button 
                onClick={() => setShowForgotModal(false)}
                className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Close
              </button>
              {!forgotSent && (
                <button 
                  onClick={() => {
                    console.log(`Password reset requested for: ${forgotEmail}`);
                    setForgotSent(true);
                  }}
                  className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Send Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
