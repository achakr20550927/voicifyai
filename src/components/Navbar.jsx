import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const isInput = location.pathname === '/' || location.pathname === '/processing';
  const isLibrary = location.pathname === '/library';
  const isExecution = location.pathname === '/execution';

  return (
    <header className="sticky top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/50">
      <nav className="flex items-center justify-between px-6 md:px-10 py-5 w-full">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
            <span className="material-symbols-outlined text-accent text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900 uppercase font-headline">Founder OS</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link 
            to="/" 
            className={`font-label text-xs uppercase tracking-widest font-bold transition-all ${isInput ? 'text-accent' : 'text-slate-400 hover:text-slate-600'}`}
          >
            New Input
          </Link>
          <Link 
            to="/library" 
            className={`font-label text-xs uppercase tracking-widest font-bold transition-all ${isLibrary ? 'text-accent' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Library
          </Link>
          {isExecution && (
             <span className="font-label text-xs uppercase tracking-widest font-bold text-accent">Execution</span>
          )}
          
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-surface-container-highest flex items-center justify-center border border-outline-variant/15 overflow-hidden">
            <span className="material-symbols-outlined text-on-surface-variant text-sm md:text-base">person</span>
          </div>
        </div>
      </nav>
    </header>
  );
}
