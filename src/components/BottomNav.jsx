import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  const isInput = location.pathname === '/' || location.pathname === '/processing';
  const isLibrary = location.pathname === '/library';

  return (
    <footer className="fixed bottom-0 w-full z-50 rounded-t-3xl bg-white/80 backdrop-blur-xl md:hidden shadow-[0_-8px_32px_rgba(0,0,0,0.05)] border-t border-slate-200/50">
      <div className="flex justify-around items-center w-full px-8 pb-8 pt-4">
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center rounded-2xl px-6 py-2 transition-all active:scale-90 duration-300 ease-out ${isInput ? 'text-accent bg-accent/5' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isInput ? "'FILL' 1" : undefined }}>add_circle</span>
          <span className="font-body text-[10px] font-bold tracking-[0.05em] uppercase">New Input</span>
        </Link>
        <Link 
          to="/library" 
          className={`flex flex-col items-center justify-center rounded-2xl px-6 py-2 transition-all active:scale-90 duration-300 ease-out ${isLibrary ? 'text-accent bg-accent/5' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <span className="material-symbols-outlined mb-1" style={{ fontVariationSettings: isLibrary ? "'FILL' 1" : undefined }}>shelves</span>
          <span className="font-body text-[10px] font-bold tracking-[0.05em] uppercase">Library</span>
        </Link>
      </div>
    </footer>
  );
}
