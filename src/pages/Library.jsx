import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Video, Mic, Plus, ArrowLeft, Trash2, FileText, Edit2, Check, X } from 'lucide-react';
import { getProcesses, deleteProcess, renameProcess } from '../lib/storage';

export default function Library() {
  const navigate = useNavigate();
  const [processes, setProcesses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    setProcesses(getProcesses());
  }, []);

  const handleDelete = (e, id) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this process?')) {
      deleteProcess(id);
      setProcesses(getProcesses());
    }
  };

  const startRename = (e, id, currentTitle) => {
    e.stopPropagation();
    setEditingId(id);
    setEditValue(currentTitle);
  };

  const cancelRename = (e) => {
    e.stopPropagation();
    setEditingId(null);
    setEditValue('');
  };

  const submitRename = (e, id) => {
    e.stopPropagation();
    if (editValue.trim()) {
      renameProcess(id, editValue.trim());
      setProcesses(getProcesses());
      setEditingId(null);
    }
  };

  const openProcess = (proc) => {
    if (editingId) return; // Don't open if renaming
    navigate('/execution', { 
      state: { 
        sourceData: proc.sourceData || { inputType: proc.mockInput, content: proc.title },
        generatedPlan: proc.plan,
        process: proc
      } 
    });
  };

  const filteredProcesses = processes.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.desc && p.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'loom': case 'video': return <Video className="w-4 h-4 text-white/80" />;
      case 'voice': case 'voice note': return <Mic className="w-4 h-4 text-white/80" />;
      default: return <FileText className="w-4 h-4 text-white/80" />;
    }
  };

  return (
    <main className="relative min-h-screen w-full mx-auto px-6 md:px-12 pt-12 pb-32 bg-slate-50 font-body text-slate-900 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.03),transparent_50%)]" />
      <div className="fixed inset-0 noise-bg z-0 opacity-[0.03]" />
      
      <div className="relative z-10 max-w-[1024px] mx-auto">
        <button onClick={() => navigate('/input')} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-accent transition-colors text-xs font-bold uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> Back to Input
        </button>

        <div className="mb-12">
          <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-8 text-slate-900">Growth Archive</h2>
          <div className="relative group w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden focus-within:border-accent/40 focus-within:ring-4 focus-within:ring-accent/5 transition-all">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-slate-300" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none focus:outline-none focus:ring-0 py-5 pl-14 pr-6 text-slate-900 placeholder:text-slate-300 font-medium" 
              placeholder="Find a recorded process..." 
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-12 px-8 py-2 hidden md:grid">
            <div className="col-span-6 font-bold text-[9px] text-slate-400 uppercase tracking-widest">Process Name</div>
            <div className="col-span-3 font-bold text-[9px] text-slate-400 uppercase tracking-widest text-center">Source</div>
            <div className="col-span-2 font-bold text-[9px] text-slate-400 uppercase tracking-widest text-right">Created</div>
            <div className="col-span-1"></div>
          </div>

          {filteredProcesses.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-[2rem] border border-dashed border-slate-200 shadow-sm">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 mx-auto mb-6">
                <FileText className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-slate-400 text-sm font-medium">No processes found in your archive.</p>
            </div>
          ) : (
            filteredProcesses.map((process) => (
              <div 
                key={process.id} 
                onClick={() => openProcess(process)}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-0 items-start md:items-center bg-white hover:bg-slate-50 transition-all duration-300 rounded-[1.5rem] px-8 py-6 group cursor-pointer border border-slate-200/60 shadow-sm hover:shadow-md relative overflow-hidden"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-accent/0 group-hover:bg-accent transition-all" />
                
                <div className="md:col-span-6 flex flex-col gap-1">
                  {editingId === process.id ? (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <input 
                        type="text" 
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        autoFocus
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:border-accent w-full font-medium"
                        onKeyDown={e => {
                          if (e.key === 'Enter') submitRename(e, process.id);
                          if (e.key === 'Escape') cancelRename(e);
                        }}
                      />
                      <button onClick={e => submitRename(e, process.id)} className="p-2 hover:text-emerald-500 transition-colors"><Check className="w-4 h-4" /></button>
                      <button onClick={e => cancelRename(e)} className="p-2 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <>
                      <span className="font-display text-lg font-bold text-slate-900 tracking-tight">{process.title}</span>
                      <span className="text-sm text-slate-400 font-medium line-clamp-1">{process.desc}</span>
                    </>
                  )}
                </div>
                
                <div className="md:col-span-3 flex justify-start md:justify-center">
                  <div className="flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100">
                    <span className="text-slate-400 group-hover:text-accent transition-colors">{getIcon(process.type)}</span>
                    <span className="font-bold text-[9px] text-slate-500 uppercase tracking-widest">{process.type}</span>
                  </div>
                </div>
                
                <div className="md:col-span-2 text-left md:text-right mt-2 md:mt-0">
                  <span className="font-bold text-[9px] text-slate-300 uppercase tracking-widest">{process.date}</span>
                </div>

                <div className="md:col-span-1 flex justify-end gap-1">
                  <button 
                    onClick={(e) => startRename(e, process.id, process.title)}
                    className="p-2 rounded-xl hover:bg-white text-slate-300 hover:text-accent transition-all opacity-0 group-hover:opacity-100 border border-transparent shadow-none hover:shadow-sm hover:border-slate-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, process.id)}
                    className="p-2 rounded-xl hover:bg-white text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 border border-transparent shadow-none hover:shadow-sm hover:border-slate-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}

          <div onClick={() => navigate('/input')} className="flex items-center justify-center p-12 border border-dashed border-slate-300 hover:border-accent/40 rounded-[2rem] bg-white group transition-all cursor-pointer shadow-sm hover:shadow-md">
            <div className="flex flex-col items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 group-hover:border-accent/20 group-hover:bg-accent/5 transition-all duration-300">
                <Plus className="w-6 h-6 text-slate-400 group-hover:text-accent transition-colors" />
              </div>
              <span className="font-bold text-[9px] text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-900 transition-colors">Capture New Process</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
