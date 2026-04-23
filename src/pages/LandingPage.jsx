import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Sparkles, ArrowRight, Zap, Target, Users } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [authView, setAuthView] = useState('get-started'); // 'get-started' or 'login'

  const features = [
    { icon: <Zap className="w-6 h-6" />, title: 'Strategic Synthesis', desc: 'Convert raw transcripts into actionable execution plans in real-time.' },
    { icon: <Target className="w-6 h-6" />, title: 'Generative Architecture', desc: 'Unique visual blueprints mapped to your specific strategic challenges.' },
    { icon: <Users className="w-6 h-6" />, title: 'VA Deployment', desc: 'Instantly transmit tactical briefings to your operational support team.' }
  ];

  return (
    <div className="relative min-h-screen w-full bg-slate-50 text-slate-900 overflow-hidden font-body">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[140px]" />
        <div className="absolute inset-0 noise-bg opacity-[0.03]" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Header */}
      <header className="relative z-50 px-8 py-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight text-slate-900">Founder OS</span>
        </div>
        <button 
          onClick={() => setAuthView(authView === 'login' ? 'get-started' : 'login')}
          className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-accent transition-colors"
        >
          {authView === 'login' ? 'Back' : 'Sign In'}
        </button>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-40 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        {/* Left Side: Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/5 border border-accent/10 text-accent text-[10px] uppercase tracking-[0.3em] font-bold mb-8">
            Operation v3.0 // Ready
          </span>
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.05] tracking-tight text-slate-900 mb-8">
            Scale Your Output, <br />
            <span className="text-slate-400 italic font-normal">Multiply Your Freedom.</span>
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed mb-12 max-w-lg">
            The strategic intelligence engine for high-performance entrepreneurs. Convert meetings into architecture in seconds.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="group"
              >
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-5 group-hover:border-accent/40 transition-colors">
                  <div className="text-accent">{f.icon}</div>
                </div>
                <h3 className="font-display font-bold text-slate-900 mb-2 tracking-tight">{f.title}</h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side: Auth Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex justify-center lg:justify-end"
        >
          <div className="w-full max-w-md bg-white p-12 rounded-[2.5rem] border border-slate-200/60 shadow-2xl relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-accent/20 rounded-full" />
            
            <AnimatePresence mode="wait">
              {authView === 'get-started' ? (
                <motion.div 
                  key="signup"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight mb-2">Initialize Core</h2>
                    <p className="text-slate-400 text-sm font-medium">Create your strategic footprint to begin.</p>
                  </div>

                  <div className="space-y-4">
                    <input type="text" placeholder="Full Name" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-accent transition-all font-medium" />
                    <input type="email" placeholder="Work Email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-accent transition-all font-medium" />
                    <input type="password" placeholder="Secure Password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-accent transition-all font-medium" />
                  </div>

                  <button 
                    onClick={() => navigate('/input')}
                    className="w-full py-5 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-black active:scale-[0.98] transition-all shadow-xl shadow-slate-200"
                  >
                    Enter Architecture <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  key="login"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-3xl font-display font-bold text-slate-900 tracking-tight mb-2">Return to Core</h2>
                    <p className="text-slate-400 text-sm font-medium">Secure authorization required for archive access.</p>
                  </div>

                  <div className="space-y-4">
                    <input type="email" placeholder="Email" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-accent transition-all font-medium" />
                    <input type="password" placeholder="Password" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-6 py-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-accent transition-all font-medium" />
                  </div>

                  <button 
                    onClick={() => navigate('/input')}
                    className="w-full py-5 rounded-xl bg-accent text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-xl shadow-accent/20"
                  >
                    Authenticate <LogIn className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* Footer Branding */}
      <div className="fixed bottom-10 left-10 text-[9px] uppercase tracking-[0.5em] text-slate-300 font-bold pointer-events-none">
        Executive Neural Network // 2026
      </div>
    </div>
  );
}
