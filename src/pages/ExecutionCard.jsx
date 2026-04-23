import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MermaidChart from '../components/MermaidChart';
import { generateExecutionPlan } from '../lib/openai';
import { saveProcess } from '../lib/storage';
import { ArrowLeft, Copy, UserPlus, FileText, Network, BookOpen, Activity, Check, CheckCircle2, AlertTriangle, FileUp, Image as ImageIcon, Plus, Users, Send, Sparkles, FolderOpen, Mic, Download, Share2, ExternalLink, Loader2, ShieldCheck, Zap } from 'lucide-react';

export default function ExecutionCard() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [generatedPlan, setGeneratedPlan] = useState(location.state?.generatedPlan || {});
  const [sourceData, setSourceData] = useState(location.state?.sourceData || { inputType: 'text', content: 'Manual input' });
  const [isRefining, setIsRefining] = useState(false);
  const [refineInput, setRefineInput] = useState('');
  const [isAssignedToVA, setIsAssignedToVA] = useState(false);
  const [toast, setToast] = useState('');
  const [tasks, setTasks] = useState(generatedPlan.tasks || []);

  const sourceText = typeof sourceData?.content === 'string' ? sourceData.content : '';
  const isStakeholderNameGrounded = (name) => {
    if (!name || typeof name !== 'string') return false;
    const raw = name
      .replace(/^(mr|ms|mrs|dr|prof|sir|madam)\.?\s+/i, '')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!raw) return false;

    // For safety: consider only longer tokens (avoid common small words)
    const tokens = raw
      .toLowerCase()
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length >= 3);

    if (tokens.length === 0) return false;

    const haystack = sourceText.toLowerCase();
    return tokens.every(t => haystack.includes(t));
  };

  const groundedStakeholders = (generatedPlan.stakeholders || []).map((s) => {
    const grounded = isStakeholderNameGrounded(s?.name);
    return {
      ...s,
      name: grounded ? s.name : null, // never hallucinate names not present in the source
    };
  });

  useEffect(() => {
    if (generatedPlan.tasks) {
      setTasks(generatedPlan.tasks);
    }
  }, [generatedPlan]);

  const toggleTask = (id) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updatedTasks);
    const updatedPlan = { ...generatedPlan, tasks: updatedTasks };
    setGeneratedPlan(updatedPlan);
    if (location.state?.process?.id) {
       saveProcess({ ...location.state.process, plan: updatedPlan });
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const [isNotionModalOpen, setIsNotionModalOpen] = useState(false);
  const [notionConfig, setNotionConfig] = useState({
    apiKey: localStorage.getItem('notion_api_key') || '',
    databaseId: localStorage.getItem('notion_db_id') || ''
  });

  const saveNotionConfig = () => {
    localStorage.setItem('notion_api_key', notionConfig.apiKey);
    localStorage.setItem('notion_db_id', notionConfig.databaseId);
    setIsNotionModalOpen(false);
    showToast('Notion credentials saved locally.');
  };

  const syncToNotion = async () => {
    if (!notionConfig.apiKey || !notionConfig.databaseId) {
      setIsNotionModalOpen(true);
      return;
    }
    setIsRefining(true);
    showToast('Synchronizing with Notion...');
    try {
      const markdown = `# ${generatedPlan.title}\n\n${generatedPlan.summary}\n\n## Detailed Summary\n${generatedPlan.detailedSummary}\n\n## Strategic Tasks\n${tasks.map(t => `- [${t.completed ? 'x' : ' '}] ${t.title}${t.category ? ` (${t.category})` : ''}${t.owner ? ` | Owner: ${t.owner}` : ''}${t.due ? ` | Due: ${t.due}` : ''}`).join('\n')}`;
      await navigator.clipboard.writeText(markdown);
      showToast('Formatted for Notion & copied to clipboard.');
      window.open(`https://www.notion.so/${notionConfig.databaseId.replace(/-/g, '')}`, '_blank');
    } catch (err) {
      showToast('Sync failed: ' + err.message);
    } finally {
      setIsRefining(false);
    }
  };

  const handleFocusRefine = async (focus) => {
    setRefineInput(`Refine this plan with a specific focus on: ${focus}`);
    setIsRefining(true);
    showToast(`Focusing intelligence on ${focus}...`);
    try {
      const newPlan = await generateExecutionPlan(`Refine this plan with a specific focus on: ${focus}`, generatedPlan);
      setGeneratedPlan(newPlan);
      showToast('Strategic focus applied!');
    } catch (err) {
      showToast('Refinement failed: ' + err.message);
    } finally {
      setIsRefining(false);
      setRefineInput('');
    }
  };

  const handleDownloadReport = () => {
    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Strategic Growth Blueprint: ${generatedPlan.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #111827; max-width: 850px; margin: 0 auto; padding: 60px 40px; background: #fff; }
          .header { border-bottom: 2px solid #f3f4f6; margin-bottom: 40px; padding-bottom: 20px; }
          .title { font-size: 32px; font-weight: 700; color: #000; margin: 0 0 10px 0; letter-spacing: -0.02em; }
          .summary-box { background: #f9fafb; border-radius: 12px; padding: 24px; border-left: 4px solid #10b981; margin: 30px 0; }
          h2 { font-size: 20px; border-bottom: 1px solid #eee; padding-bottom: 8px; margin-top: 40px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; }
          .task-item { border-bottom: 1px solid #f3f4f6; padding: 12px 0; display: flex; align-items: flex-start; }
          .category { font-size: 10px; color: #9ca3af; text-transform: uppercase; font-weight: 700; display: block; }
          .footer { margin-top: 60px; font-size: 12px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <p style="text-transform: uppercase; font-size: 10px; tracking: 0.2em; font-weight: 700; color: #10b981; margin-bottom: 8px;">Founder OS Execution Pack</p>
          <h1 class="title">${generatedPlan.title}</h1>
          <p style="color: #6b7280;">Generated: ${new Date().toLocaleDateString()}</p>
        </div>
        <div class="summary-box">${generatedPlan.summary}</div>
        <h2>Detailed Strategy</h2>
        <div style="white-space: pre-wrap;">${generatedPlan.detailedSummary}</div>
        
        ${generatedPlan.keyDecisions ? `
          <h2>Strategic Decisions</h2>
          ${generatedPlan.keyDecisions.map(d => `
            <div style="margin-bottom: 20px;">
              <p><strong>Decision:</strong> ${d.decision}</p>
              <p style="font-size: 13px; color: #666;">Rationale: ${d.rationale}</p>
              <p style="font-size: 13px; color: #10b981;">Impact: ${d.impact}</p>
            </div>
          `).join('')}
        ` : ''}

        ${generatedPlan.riskAssessment ? `
          <h2>Risk Mitigation</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 10px; border: 1px solid #eee; font-size: 11px; text-align: left;">RISK</th>
                <th style="padding: 10px; border: 1px solid #eee; font-size: 11px; text-align: left;">IMPACT</th>
                <th style="padding: 10px; border: 1px solid #eee; font-size: 11px; text-align: left;">MITIGATION</th>
              </tr>
            </thead>
            <tbody>
              ${generatedPlan.riskAssessment.map(r => `
                <tr>
                  <td style="padding: 10px; border: 1px solid #eee; font-size: 12px;">${r.risk}</td>
                  <td style="padding: 10px; border: 1px solid #eee; font-size: 12px;">${r.impact}</td>
                  <td style="padding: 10px; border: 1px solid #eee; font-size: 12px;">${r.mitigation}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}
        <h2>Active Deployment Tasks</h2>
        <div>${tasks.map(t => `
          <div class="task-item">
            <div>
              <span class="category">${t.category}</span>
              <span style="${t.completed ? 'text-decoration: line-through; color: #9ca3af;' : ''}">${t.title}</span>
            </div>
          </div>`).join('')}
        </div>
        <div class="footer">Confidential Strategic Document // Founder OS Intelligence Engine</div>
      </body>
      </html>
    `;
    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Strategic_Blueprint_${generatedPlan.title.replace(/\s+/g, '_')}.html`;
    a.click();
    showToast('Executive report downloaded.');
  };

  const handleShare = async () => {
    const text = `Founder OS Execution Plan: ${generatedPlan.title}\n${generatedPlan.summary}\n\nView full report in Growth Archive.`;
    await navigator.clipboard.writeText(text);
    showToast('Summary copied to clipboard!');
  };

  const handleAssignToVA = () => {
    setIsAssignedToVA(true);
    showToast('Compiling Mission Briefing for VA...');
    
    setTimeout(() => {
      const briefing = `
# VA MISSION BRIEFING: ${generatedPlan.title}

## OVERVIEW
${generatedPlan.summary}

## STAKEHOLDERS
${generatedPlan.stakeholders?.map(s => `- ${s.name} (${s.role}): ${s.responsibility}`).join('\n')}

## TACTICAL TASKS
${tasks.map(t => `- [${t.completed ? 'x' : ' '}] ${t.title}${t.category ? ` [Category: ${t.category}]` : ''}${t.owner ? ` (Owner: ${t.owner})` : ''}${t.due ? ` (Due: ${t.due})` : ''}`).join('\n')}

## CORE DECISIONS
${generatedPlan.keyDecisions?.map(d => `### ${d.decision}\nRationale: ${d.rationale}\nImpact: ${d.impact}`).join('\n\n')}

## RISK MITIGATION
${generatedPlan.riskAssessment?.map(r => `- **${r.risk}** [Impact: ${r.impact}]: ${r.mitigation} (Trigger: ${r.trigger})`).join('\n')}

---
*Assigned via Founder OS Strategic Engine*
      `;
      
      const blob = new Blob([briefing], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VA_Briefing_${generatedPlan.title.replace(/\s+/g, '_')}.md`;
      a.click();
      
      showToast('Mission Briefing deployed & downloaded.');
    }, 1500);
  };

  const renderFormattedText = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (!trimmed) return null; // Avoid rendering empty paragraphs (keeps spacing clean)
      if (trimmed.startsWith('###')) {
        return (
          <h3
            key={i}
            className="text-lg font-display font-medium text-blue-600 dark:text-blue-400 mt-8 mb-4 border-b border-slate-200/50 dark:border-white/5 pb-2 uppercase tracking-widest text-[11px]"
          >
            {trimmed.replace('###', '').trim()}
          </h3>
        );
      }
      if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        return (
          <div key={i} className="flex gap-2 my-2 text-slate-700/70 dark:text-white/50 pl-2">
            <span className="text-blue-600 dark:text-blue-500">•</span>
            <span>{trimmed.replace(/^[-*]\s?/, '').trim()}</span>
          </div>
        );
      }
      if (/^\d+\./.test(trimmed)) {
        return (
          <div key={i} className="flex gap-2 my-2 text-slate-700/70 dark:text-white/50 pl-2">
            <span className="text-blue-600 dark:text-blue-500">{trimmed.match(/^\d+/)?.[0] || ''}.</span>
            <span>{trimmed.replace(/^\d+\./, '').trim()}</span>
          </div>
        );
      }
      return <p key={i} className="mb-4 text-slate-800/80 dark:text-white/70 leading-relaxed font-body tracking-wide">{line}</p>;
    });
  };

  if (!generatedPlan.title) return null;

  return (
    <div className="min-h-screen bg-background text-primary pt-14 pb-24 font-body relative">
      <div className="fixed inset-0 noise-bg z-0 opacity-[0.03]" />
      
      <main className="max-w-[1400px] mx-auto px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row lg:items-start justify-between gap-10 mb-10"
        >
          <div className="flex-1">
            <button 
              onClick={() => navigate('/library')}
              className="group flex items-center gap-2 text-slate-400 hover:text-slate-600 transition-all text-[10px] mb-6 uppercase tracking-[0.2em] font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" /> Back to Archive
            </button>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-lg bg-accent/5 border border-accent/10 text-accent text-[9px] uppercase tracking-[0.2em] font-bold">
                Strategic Blueprint // Executive
              </span>
              <span className="text-slate-300 text-[9px] uppercase tracking-widest font-medium">ARC-OS-{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
            </div>
            <h1 className="text-4xl lg:text-6xl font-display font-bold tracking-tight mb-4 text-slate-900">{generatedPlan.title}</h1>
            <p className="text-base text-slate-500 leading-relaxed max-w-3xl font-medium">{generatedPlan.summary}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-4 lg:mt-0">
            <button onClick={syncToNotion} className="liquid-glass-strong px-5 py-3 rounded-xl border border-slate-200 hover:border-accent/30 transition-all font-display text-xs font-bold flex items-center gap-2 group text-slate-700">
              <ExternalLink className="w-3.5 h-3.5 text-accent group-hover:scale-110 transition-transform" /> Sync to Notion
            </button>
            <button 
              onClick={handleAssignToVA} 
              className={`px-5 py-3 rounded-xl transition-all font-display text-xs font-bold flex items-center gap-2 shadow-sm ${isAssignedToVA ? 'bg-accent text-white shadow-accent/20' : 'liquid-glass-strong border border-slate-200 hover:border-accent/30 text-slate-700'}`}
            >
              {isAssignedToVA ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              {isAssignedToVA ? 'Briefing Deployed' : 'Assign to VA'}
            </button>
            <button onClick={handleShare} className="p-3 rounded-xl liquid-glass-strong border border-slate-200 hover:bg-slate-50 transition-all text-slate-600">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        <div className="space-y-10">
          {/* Top Section: Detailed Summary & Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start dark:items-stretch">
            <div className="lg:col-span-8">
              <motion.section 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="liquid-glass rounded-[2rem] p-8 border border-slate-200/60 h-full shadow-sm"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-accent/5 flex items-center justify-center border border-accent/10">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Executive Summary</h2>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-0.5 font-bold">In-depth Strategic Audit</p>
                    </div>
                  </div>
                  <button onClick={handleDownloadReport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500 dark:text-white/50 hover:text-slate-700 dark:hover:text-white/70">
                    <Download className="w-3.5 h-3.5" /> Export Report
                  </button>
                </div>
                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                  {[
                    { label: 'Phases', value: generatedPlan.sop?.length || '—' },
                    { label: 'Tasks', value: tasks.length || '—' },
                    { label: 'Stakeholders', value: generatedPlan.stakeholders?.length || '—' },
                    { label: 'Efficiency', value: `${generatedPlan.efficiencyScore || 92}%` },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-slate-50 dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/8 text-center">
                      <div className="text-2xl font-display font-bold text-accent">{stat.value}</div>
                      <div className="text-[9px] uppercase tracking-[0.15em] text-slate-400 dark:text-white/40 font-bold mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Summary Highlight */}
                {generatedPlan.summary && (
                  <div className="mb-8 p-5 rounded-2xl bg-accent/5 border border-accent/15 dark:bg-accent/10 dark:border-accent/20">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-accent font-bold mb-2">Strategic Overview</p>
                    <p className="text-sm text-slate-700 dark:text-white/80 leading-relaxed font-medium">{generatedPlan.summary}</p>
                  </div>
                )}

                {/* Detailed Content */}
                <div className="text-slate-600 dark:text-white/70 leading-relaxed text-[15px] summary-content font-medium space-y-1">
                  {renderFormattedText(generatedPlan.detailedSummary)}
                </div>
              </motion.section>
            </div>

            <div className="lg:col-span-4 space-y-8 flex flex-col">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="liquid-glass rounded-[1.5rem] p-7 border border-slate-200/60 bg-gradient-to-br from-accent/[0.03] to-transparent shadow-sm"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold">Operational Velocity</h3>
                  <span className="font-display text-4xl text-accent font-bold tracking-tighter">{generatedPlan.efficiencyScore || 92}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-6">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${generatedPlan.efficiencyScore || 92}%` }}
                    className="h-full bg-accent"
                  />
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/50">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold">High-Bandwidth Reclaim</p>
                    <p className="text-xl font-display font-bold text-slate-900 mt-0.5">{generatedPlan.hoursSaved || '4.2'} <span className="text-xs text-slate-400 font-normal">hrs / week</span></p>
                  </div>
                </div>
              </motion.div>

              {/* SOP Moved to Sidebar for Density */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="liquid-glass rounded-[1.5rem] p-7 border border-slate-200/60 shadow-sm flex-none dark:flex-1"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                    <Activity className="w-5 h-5 text-accent" />
                  </div>
                  <h2 className="font-display text-xl font-bold tracking-tight text-slate-900">SOP Sequence</h2>
                </div>
                <div className="relative">
                  {/* Sticky timeline line — outside scroll container so it doesn't scroll away */}
                  <div className="absolute left-[7px] top-0 bottom-0 w-px bg-slate-100 dark:bg-white/10 pointer-events-none" />
                  <div className="space-y-6 max-h-[520px] overflow-y-auto overflow-x-visible pr-2 pl-1">
                    {generatedPlan.sop?.map((step, idx) => (
                      <div key={idx} className="relative pl-7 group">
                        <div className="absolute left-[3px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-600 group-hover:bg-accent transition-all z-10 shrink-0" />
                        <h4 className="text-[11px] font-bold text-slate-800 dark:text-white/85 uppercase tracking-widest leading-tight">{step.title}</h4>
                        <p className="text-[10px] text-slate-400 dark:text-white/45 leading-relaxed mt-1 group-hover:text-slate-600 dark:group-hover:text-white/65 transition-colors font-medium whitespace-pre-line">{step.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Process Blueprint - Full Width Expansion */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="liquid-glass rounded-[2rem] p-10 border border-slate-200/60 shadow-sm"
          >
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200/50">
                  <Network className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Process Blueprint</h2>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-1 font-bold">Recursive Strategic Mapping</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200/50 rounded-lg text-[9px] uppercase tracking-[0.2em] text-accent font-bold">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Live Visualization
              </div>
            </div>
            <div className="bg-slate-50/50 dark:bg-white/[0.02] rounded-[1.5rem] p-8 border border-slate-200/40 dark:border-white/8 flex items-center justify-center min-h-[600px] w-full overflow-hidden">
              <div className="w-full h-full transform transition-transform duration-700">
                {generatedPlan.mermaidChart ? <MermaidChart chart={generatedPlan.mermaidChart} sop={generatedPlan.sop} /> : <Loader2 className="animate-spin text-accent w-10 h-10" />}
              </div>
            </div>
          </motion.div>

          {/* Stakeholders Protocol - Full Width Grid */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="liquid-glass rounded-[2rem] p-10 border border-slate-200/60 shadow-sm"
          >
            <div className="flex items-center gap-4 mb-10">
               <div className="w-12 h-12 rounded-xl bg-accent/5 flex items-center justify-center border border-accent/10">
                 <Users className="w-6 h-6 text-accent" />
               </div>
               <div>
                 <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Stakeholders Protocol</h2>
                 <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-1 font-bold">Decision Chain & Roles</p>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {groundedStakeholders?.map((s, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 group hover:border-accent/20 hover:shadow-md hover:shadow-accent/5 transition-all">
                  <div className="mb-4">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-accent font-bold mb-1 block">{s.role}</span>
                    <h4 className="text-xl font-bold text-slate-800 group-hover:text-slate-900 transition-colors tracking-tight leading-snug">
                      {s.name || 'Unspecified (not mentioned)'}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed font-medium">{s.responsibility}</p>
                  <div className="pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                       <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                       <p className="text-[9px] text-accent font-bold uppercase tracking-[0.1em]">{s.deliverable}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Decisions & Risks - Even 50/50 Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Key Strategic Decisions */}
            <motion.section
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="liquid-glass rounded-[2rem] p-10 border border-slate-200/60 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-200/50 dark:border-white/10">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white/90">Strategic Pivot Points</h2>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 dark:text-white/40 mt-1 font-bold">Logical Inflection Analysis</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(generatedPlan.keyDecisions?.length ? generatedPlan.keyDecisions : [
                  { decision: "Define Core Deliverables", rationale: "Establish clear scope boundaries and align timelines across all workstreams to prevent drift.", impact: "HIGH" },
                  { decision: "Stakeholder Alignment Session", rationale: "Ensure all decision-makers share strategic objectives before execution begins.", impact: "HIGH" },
                  { decision: "Resource Allocation Review", rationale: "Optimize team bandwidth and identify potential bottlenecks before they become blockers.", impact: "MEDIUM" },
                  { decision: "Communication Protocol Setup", rationale: "Standardize reporting cadence and escalation pathways across all teams.", impact: "MEDIUM" },
                ]).map((d, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-50/50 dark:bg-white/[0.03] border border-slate-200/30 dark:border-white/8 hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-sm transition-all group">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white/85 mb-2 tracking-tight group-hover:text-accent transition-colors">{d.decision}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-white/50 leading-relaxed mb-3 font-medium">{d.rationale}</p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-accent/5 border border-accent/10">
                      <span className="text-[8px] text-accent font-bold uppercase tracking-[0.1em]">IMPACT: {d.impact}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

            {/* Risk Mitigation Protocol */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55 }}
              className="liquid-glass rounded-[2rem] p-10 border border-slate-200/60 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center border border-slate-200/50 dark:border-white/10">
                  <AlertTriangle className="w-6 h-6 text-slate-400 dark:text-white/40" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white/90">Stability Safeguards</h2>
                  <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 dark:text-white/40 mt-1 font-bold">Threat Mitigation Protocol</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(generatedPlan.riskAssessment?.length ? generatedPlan.riskAssessment : [
                  { risk: "Scope Creep", impact: "HIGH", mitigation: "Enforce change control process with documented approval requirements for any new additions.", trigger: "Unplanned feature or task requests surface mid-execution" },
                  { risk: "Resource Constraints", impact: "MEDIUM", mitigation: "Maintain contingency capacity and cross-train team members on critical functions.", trigger: "Team availability drops below 80% of planned hours" },
                  { risk: "Timeline Slippage", impact: "HIGH", mitigation: "Weekly milestone reviews with recovery sprint planning protocols activated immediately.", trigger: "2+ days behind any scheduled checkpoint" },
                  { risk: "Communication Breakdown", impact: "MEDIUM", mitigation: "Daily standups and async update channels enforced for all distributed teams.", trigger: "Missed stakeholder updates exceeding 48 hours" },
                ]).map((r, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-50/50 dark:bg-white/[0.03] border border-slate-200/30 dark:border-white/8 hover:bg-white dark:hover:bg-white/[0.06] hover:shadow-sm transition-all relative overflow-hidden group">
                    <div className={`absolute top-0 right-0 px-3 py-1 text-[7px] font-bold uppercase tracking-widest rounded-bl-lg ${r.impact === 'HIGH' ? 'bg-red-50 dark:bg-red-500/10 text-red-500 border-l border-b border-red-100 dark:border-red-500/20' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/40 dark:border-white/10'}`}>
                      {r.impact} RISK
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white/85 mb-2 pr-10 tracking-tight">{r.risk}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-white/50 group-hover:text-slate-600 dark:group-hover:text-white/65 mb-2 font-medium">{r.mitigation}</p>
                    {r.trigger && (
                      <p className="text-[9px] text-slate-500 dark:text-white/35 mb-2 font-medium leading-relaxed">
                        Trigger: <span className="text-slate-600 dark:text-white/55">{r.trigger}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </motion.section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Tactical Tasks - Reclaiming Space */}
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.65 }}
               className="lg:col-span-12 liquid-glass rounded-[2rem] p-10 border border-slate-200/60 shadow-sm"
            >
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-accent/5 flex items-center justify-center border border-accent/10">
                     <CheckCircle2 className="w-6 h-6 text-accent" />
                   </div>
                   <div>
                     <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Deployment Masterlist</h2>
                     <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 mt-1 font-bold">Operational Tactical Actions</p>
                   </div>
                </div>
                <div className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">
                  {tasks.filter(t => t.completed).length} / {tasks.length} COMPLETED
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tasks.map((task) => (
                   <label key={task.id} className="flex items-center cursor-pointer p-4 bg-white rounded-xl border border-slate-100 hover:border-accent/20 transition-all group relative overflow-hidden shadow-sm hover:shadow-md">
                     <div className={`absolute inset-0 bg-accent/0 group-hover:bg-accent/[0.02] transition-colors duration-500`} />
                     <div className="relative flex items-center shrink-0 w-5 h-5">
                        <input 
                          type="checkbox" 
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          className="peer w-5 h-5 rounded-lg border border-slate-200 bg-slate-50 cursor-pointer appearance-none checked:bg-accent checked:border-accent transition-all"
                        />
                        <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-[3px] top-[3px] stroke-[4]" />
                     </div>
                     <div className="ml-4 relative flex-1">
                        <span className={`block text-[11px] font-bold transition-colors ${task.completed ? 'text-slate-300 line-through' : 'text-slate-700 group-hover:text-slate-900'}`}>
                           {task.title}
                        </span>
                        {task.category && (
                          <span className={`block text-[9px] mt-1 uppercase tracking-[0.1em] ${task.completed ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
                            {task.category}
                          </span>
                        )}
                        {task.description && (
                          <span className={`block text-[9px] mt-1 leading-relaxed ${task.completed ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-400'} line-clamp-2`}>
                            {task.description}
                          </span>
                        )}
                        {(task.owner || task.due) && (
                          <span className={`block text-[9px] mt-1 leading-relaxed ${task.completed ? 'text-slate-400' : 'text-slate-500 group-hover:text-slate-400'}`}>
                            {task.owner ? `Owner: ${task.owner}` : ''}
                            {task.owner && task.due ? ' • ' : ''}
                            {task.due ? `Due: ${task.due}` : ''}
                          </span>
                        )}
                     </div>
                   </label>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* AI Intelligence HUD */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] md:w-[700px] z-50">
        <div className={`liquid-glass-strong rounded-[2rem] p-2.5 flex flex-col gap-2.5 border border-slate-200/60 shadow-2xl transition-all ${isRefining ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 rounded-xl overflow-x-auto no-scrollbar">
            {['Scale Efficiency', 'Simplify Architecture', 'Minimize Risk', 'Optimize Flow'].map((focus) => (
              <button 
                key={focus}
                onClick={() => handleFocusRefine(focus.toLowerCase())}
                className="whitespace-nowrap px-3 py-1.5 rounded-lg hover:bg-white text-[9px] uppercase tracking-widest font-bold text-slate-400 hover:text-accent transition-all border border-transparent hover:border-slate-200 shadow-none hover:shadow-sm"
              >
                {focus}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4 pl-4 pr-2 pb-1.5 pt-1">
            <Sparkles className="w-5 h-5 text-accent shrink-0" />
            <input 
              type="text" 
              value={refineInput}
              onChange={(e) => setRefineInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleFocusRefine(refineInput); }}
              placeholder="Inject strategic instructions..." 
              className="bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 placeholder:text-slate-300 w-full text-sm font-bold tracking-tight"
            />
            <button 
              onClick={() => handleFocusRefine(refineInput)}
              className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20 group"
            >
              <Send className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Notion Portal */}
      {isNotionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl" onClick={() => setIsNotionModalOpen(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-2xl">
             <h2 className="font-display text-3xl font-bold mb-2 text-slate-900 tracking-tight">Notion Connect</h2>
             <p className="text-slate-500 text-sm mb-10 font-medium">Map strategic outputs to your operational database.</p>
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold ml-1">Internal Integration Secret</label>
                  <input type="password" value={notionConfig.apiKey} onChange={e => setNotionConfig({...notionConfig, apiKey: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-900 font-medium focus:outline-none focus:border-accent transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold ml-1">Archive ID</label>
                  <input type="text" value={notionConfig.databaseId} onChange={e => setNotionConfig({...notionConfig, databaseId: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-slate-900 font-medium focus:outline-none focus:border-accent transition-colors" />
                </div>
                <button onClick={saveNotionConfig} className="w-full py-5 rounded-xl bg-slate-900 text-white font-bold hover:bg-black transition-all shadow-xl shadow-slate-200">Enable Sync Engine</button>
             </div>
          </motion.div>
        </div>
      )}

      {toast && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[110] bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl font-display text-sm font-bold flex items-center gap-3 animate-bounce">
           <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
           {toast}
        </div>
      )}
    </div>
  );
}
