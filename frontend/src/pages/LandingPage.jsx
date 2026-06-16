import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  TrendingUp, 
  Sparkles, 
  Scale, 
  ArrowRight, 
  Users, 
  BarChart3, 
  Box, 
  CircleDollarSign,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

function LandingPage() {
  const { darkMode, toggleTheme } = useTheme();
  const [billingPeriod, setBillingPeriod] = useState('monthly'); // monthly / yearly
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
  };

  const features = [
    {
      title: 'Material Procurement',
      desc: 'Log orders, track supplier timelines, calculate units cost, and link files seamlessly.',
      icon: Box,
      color: 'bg-amber-500/10 text-amber-500'
    },
    {
      title: 'Site Usage Tracking',
      desc: 'Site engineers log received, used, and wasted supplies. Instantly calculates balances.',
      icon: TrendingUp,
      color: 'bg-green-500/10 text-green-500'
    },
    {
      title: 'AI Insights Engine',
      desc: 'Predict reorder dates, flag abnormal wastage rates, and receive cost-saving ideas.',
      icon: Sparkles,
      color: 'bg-purple-500/10 text-purple-500'
    },
    {
      title: 'Supplier & Invoice Center',
      desc: 'Manage supplier contacts, link invoice files, and review supplier quality history.',
      icon: Users,
      color: 'bg-blue-500/10 text-blue-500'
    },
    {
      title: 'Cost Variance & Auditing',
      desc: 'Track project budget limits against actual spending and inspect security audit logs.',
      icon: CircleDollarSign,
      color: 'bg-red-500/10 text-red-500'
    },
    {
      title: 'Interactive Reporting',
      desc: 'Generate PDF summaries, and export consumption, wastage, and cost files to CSV.',
      icon: BarChart3,
      color: 'bg-indigo-500/10 text-indigo-500'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      
      {/* Navbar */}
      <nav className="glass-navbar border-none shadow-none backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded bg-slate-900 dark:bg-amber-500 flex items-center justify-center font-black text-amber-500 dark:text-slate-950 text-lg">G</div>
            <span className="font-extrabold text-lg tracking-tight bg-clip-text text-gradient">Glory Simon Interiors</span>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>
            <Link 
              to="/login"
              className="px-5 py-2 rounded-full text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 transition-all shadow-md"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Hero Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Material Intelligence</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1]">
              Track Materials. <br />
              <span className="bg-gradient-to-r from-amber-500 to-amber-600 bg-clip-text text-transparent">Reduce Wastage.</span> <br />
              Scale Profitability.
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base sm:text-lg max-w-xl leading-relaxed">
              Designed for luxury interior projects. Compare materials ordered, received, consumed, and wasted across sites in real time with Glory Simon's smart material procurement system.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
              <Link 
                to="/login"
                className="px-8 py-3 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold hover:bg-slate-800 dark:hover:bg-amber-400 flex items-center justify-center space-x-2 shadow-xl shadow-amber-500/5 hover-lift transition-all"
              >
                <span>Launch Portal</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a 
                href="#features"
                className="px-8 py-3 rounded-lg border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center justify-center transition-colors"
              >
                Explore Features
              </a>
            </div>
          </motion.div>

          {/* Hero Visual Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            {/* Background glowing gradients */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-500 to-pink-500 opacity-20 blur-xl"></div>
            
            {/* Visual Glass Box */}
            <div className="relative border border-slate-200 dark:border-slate-800 rounded-2xl bg-white/70 dark:bg-slate-900/60 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">glorysimon-tracker.app</div>
              </div>
              
              {/* Fake dashboard content */}
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Total Budget</span>
                    <p className="text-sm font-bold text-slate-800 dark:text-white mt-1">₹12.0M</p>
                  </div>
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Wastage Rate</span>
                    <p className="text-sm font-bold text-red-500 mt-1">14.6% ⚠️</p>
                  </div>
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-lg">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Efficiency</span>
                    <p className="text-sm font-bold text-green-500 mt-1">85.4%</p>
                  </div>
                </div>

                {/* Progress Indicators */}
                <div className="space-y-3 bg-slate-100/50 dark:bg-slate-800/30 p-3 rounded-lg">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span>Teak Wood Plywood 18mm</span>
                    <span className="text-red-500 font-bold">12.0% Wastage</span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500 rounded-full" style={{ width: '88%' }}></div>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                    <span>Used: 100 Sheets</span>
                    <span>Wasted: 18 Sheets</span>
                    <span>Remaining: 32 Sheets</span>
                  </div>
                </div>

                {/* Live Alert pop-up */}
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium flex items-center space-x-2">
                  <span className="animate-pulse">●</span>
                  <span>AI Insight: Abnormal plywood wastage (12%) flagged in Villa Project!</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white dark:bg-slate-900/40 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Full-Stack Enterprise Management</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              A comprehensive system built specifically for premium interior contracting. Control design deliverables and materials from order to site.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((f, idx) => {
              const Icon = f.icon;
              return (
                <motion.div 
                  key={idx}
                  variants={itemVariants}
                  className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover-lift flex flex-col justify-between"
                >
                  <div>
                    <div className={`w-12 h-12 rounded-lg ${f.color} flex items-center justify-center mb-5`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Enterprise Pricing</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Select a plan that suits your interior company size. Swap billing schedules to unlock annual savings.
          </p>

          {/* Billing Switcher */}
          <div className="inline-flex items-center p-1 rounded-full bg-slate-200/50 dark:bg-slate-800 mt-4">
            <button 
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${billingPeriod === 'monthly' ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition-all ${billingPeriod === 'yearly' ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400'}`}
            >
              Yearly (Save 20%)
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 items-stretch max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className="p-8 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400">Studio</span>
              <div className="flex items-baseline mt-4">
                <span className="text-4xl font-black">₹4,999</span>
                <span className="text-slate-500 text-xs ml-1">/ month</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">Perfect for independent designers.</p>
              
              <ul className="mt-8 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span>Up to 3 active projects</span>
                </li>
                <li className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span>Standard material logs</span>
                </li>
                <li className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span>Basic reporting</span>
                </li>
              </ul>
            </div>
            <Link to="/login" className="w-full py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-center font-bold text-sm mt-8 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Get Started
            </Link>
          </div>

          {/* Business Plan (Recommended) */}
          <div className="p-8 border-2 border-amber-500 rounded-2xl bg-slate-900 text-white relative flex flex-col justify-between shadow-xl">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">Recommended</span>
            <div>
              <span className="text-xs uppercase font-bold text-amber-500">Professional</span>
              <div className="flex items-baseline mt-4">
                <span className="text-4xl font-black">
                  {billingPeriod === 'monthly' ? '₹14,999' : '₹11,999'}
                </span>
                <span className="text-slate-400 text-xs ml-1">/ month</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">For growing interior design companies.</p>

              <ul className="mt-8 space-y-3 text-sm text-slate-300">
                <li className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Unlimited projects</span>
                </li>
                <li className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>AI Procurement Assistant</span>
                </li>
                <li className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Real-time Websocket alerts</span>
                </li>
                <li className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <span>Invoice Upload (Cloudinary)</span>
                </li>
              </ul>
            </div>
            <Link to="/login" className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-center font-bold text-sm mt-8 transition-colors shadow-lg shadow-amber-500/20">
              Try Free Trial
            </Link>
          </div>

          {/* Enterprise Plan */}
          <div className="p-8 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400">Enterprise</span>
              <div className="flex items-baseline mt-4">
                <span className="text-4xl font-black">Custom</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">For large construction and interior organizations.</p>

              <ul className="mt-8 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <li className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span>Dedicated server setup</span>
                </li>
                <li className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span>Custom API & ERP integrations</span>
                </li>
                <li className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span>SLA Guarantee & Support</span>
                </li>
              </ul>
            </div>
            <a href="#contact" className="w-full py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-center font-bold text-sm mt-8 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-24 bg-white dark:bg-slate-900/40 relative">
        <div className="max-w-md mx-auto px-6">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-3xl font-extrabold">Connect With Us</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Have questions about setting up your Glory Simon tracking workspace?</p>
          </div>

          {contactSubmitted ? (
            <div className="p-6 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-center space-y-2">
              <ShieldCheck className="w-10 h-10 mx-auto" />
              <p className="font-bold text-sm">Message Sent Successfully!</p>
              <p className="text-xs">Our engineering team will get back to you within 24 hours.</p>
            </div>
          ) : (
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                setContactSubmitted(true);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Your Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="Simon Glory"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="simon@glorysimon.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Message</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="How can we help optimize your design workflows?"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                ></textarea>
              </div>
              <button 
                type="submit"
                className="w-full py-3 bg-slate-900 dark:bg-amber-500 hover:bg-slate-800 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold rounded-lg text-sm transition-all"
              >
                Send Inquiry
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-200 dark:border-slate-900 text-center text-xs text-slate-500 dark:text-slate-500">
        <div className="max-w-7xl mx-auto px-6 space-y-4">
          <p>© 2026 Glory Simon Interiors. All rights reserved. Built with Antigravity AI Engine.</p>
          <div className="flex justify-center space-x-6">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Contact Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;
