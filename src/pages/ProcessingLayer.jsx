import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { generateExecutionPlan, transcribeAudio, fileStore } from '../lib/openai';
import { saveProcess } from '../lib/storage';
import { Sparkles, Loader2, FileText, CheckSquare, Lightbulb } from 'lucide-react';

export default function ProcessingLayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [timeLeftSec, setTimeLeftSec] = useState(null);
  const [error, setError] = useState('');
  const [currentStage, setCurrentStage] = useState('Initializing extraction engine...');
  
  const inputData = location.state || { inputType: 'text', content: 'Processing standard input...' };
  const hasStartedRef = useRef(false);

  // Master Live UI Countdown Timer based entirely on deterministic processing lengths & 429 timeouts!
  useEffect(() => {
    if (timeLeftSec === null || timeLeftSec <= 0 || progress >= 100) return;
    const t = setInterval(() => {
      setTimeLeftSec(sec => Math.max(0, sec - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [timeLeftSec, progress]);

  useEffect(() => {
    const processInput = async () => {
      try {
        let inputText = inputData.content;
        
        if (inputData.inputType === 'audioFile' || inputData.inputType === 'voice') {
           setCurrentStage('Extracting audio frequencies...');
           const targetAudio = fileStore.currentFile || new File(["dummy"], "audio.mp3", { type: "audio/mp3" });
           inputText = await transcribeAudio(targetAudio, (data) => {
               if (data.status) setCurrentStage(data.status);
               if (data.progress) setProgress(data.progress);
               if (data.setTotalSeconds !== undefined) setTimeLeftSec(data.setTotalSeconds);
               if (data.addSeconds) setTimeLeftSec(prev => (prev || 0) + data.addSeconds);
           });
           fileStore.currentFile = null;
        }

        setCurrentStage('Structuring operational logic...');
        setProgress(80);
        setTimeLeftSec(prev => Math.max(prev !== null ? prev : 30, 15)); // Guarantee at least a baseline UI timeout for LLM parsing
        const plan = await generateExecutionPlan(inputText);

        // Keep a short, locally-stored grounded text for "no hallucinated names" verification later.
        const groundingText =
          typeof inputText === 'string' ? inputText.substring(0, 8000) : JSON.stringify(inputText).substring(0, 8000);
        
        // Save to Library
        saveProcess({
          title: plan.title,
          desc: plan.summary,
          type: inputData.inputType === 'text' ? 'Manual' : (inputData.inputType === 'voice' ? 'Voice Note' : 'File'),
          mockInput: inputData.inputType,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          plan: plan,
          sourceData: { ...inputData, content: groundingText }
        });

        setProgress(100);
        setTimeLeftSec(0);
        setCurrentStage('Execution Ready');
        
        setTimeout(() => {
          navigate('/execution', { state: { sourceData: { ...inputData, content: groundingText }, generatedPlan: plan } });
        }, 600);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to process input. Please try again.');
      }
    };

    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      processInput();
    }
  }, [navigate]);

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center px-6 md:px-40 py-16 bg-slate-50 overflow-hidden font-body text-slate-900">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.03),transparent_50%)]" />
      <div className="fixed inset-0 noise-bg z-0 opacity-[0.03]" />

      <div className="relative z-10 w-full max-w-4xl flex flex-col items-start">
        
        {/* Header */}
        <div className="mb-16 w-full">
          <span className="inline-block px-4 py-1.5 rounded-full bg-accent/5 border border-accent/10 text-accent text-[10px] uppercase tracking-[0.3em] font-bold mb-8">
            Strategic Processing // Active
          </span>
          <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6">
            {error ? 'Extraction Failed.' : (
              <>Refining <em className="font-serif italic text-slate-400 font-normal">Intelligence</em></>
            )}
          </h1>
          <p className="text-slate-500 text-lg font-medium tracking-tight flex items-center gap-3">
            {error ? error : (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-accent" />
                {currentStage}
              </>
            )}
          </p>
          {error && (
            <button onClick={() => navigate('/')} className="mt-10 px-8 py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-slate-200">
              Return Home
            </button>
          )}
        </div>

        {!error && (
          <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
            
            <div className="md:col-span-5 flex flex-col items-center md:items-start relative">
              <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-accent/5 blur-[40px] animate-pulse"></div>
                <div className="absolute inset-4 rounded-full border border-slate-200"></div>
                
                <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 bg-white rounded-full shadow-2xl flex items-center justify-center overflow-hidden border border-slate-100/60">
                  <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 to-transparent"></div>
                  <Sparkles className="w-12 h-12 text-accent animate-pulse" />
                </div>
                
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle className="text-slate-100" cx="50%" cy="50%" fill="transparent" r="48%" stroke="currentColor" strokeWidth="2"></circle>
                  <circle 
                    className="text-accent transition-all duration-300 ease-out" 
                    cx="50%" cy="50%" fill="transparent" r="48%" 
                    stroke="currentColor" strokeDasharray="301" 
                    strokeDashoffset={301 - (301 * progress) / 100}
                    strokeLinecap="round" strokeWidth="3"
                  ></circle>
                </svg>
              </div>
            </div>

            <div className="md:col-span-7 space-y-8 w-full">
              <div className="mb-4">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">
                    {timeLeftSec === null ? 'Calculating...' : `Est: ${Math.floor(timeLeftSec / 60)}m ${timeLeftSec % 60}s`}
                  </span>
                  <span className="font-display text-2xl font-bold text-slate-900">{Math.floor(progress)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="absolute left-0 top-0 h-full bg-accent transition-all duration-300 ease-out"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className={`flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 transition-all duration-500 shadow-sm ${progress >= 30 ? 'opacity-100' : 'opacity-40'}`}>
                  {progress < 50 ? <Loader2 className="w-5 h-5 text-accent animate-spin" /> : <CheckSquare className="w-5 h-5 text-emerald-500" />}
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 tracking-tight">Deconstructing input context...</span>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">{progress < 50 ? 'In Progress' : 'Analysis Complete'}</span>
                  </div>
                </div>

                <div className={`flex items-center gap-4 p-5 rounded-2xl bg-white border transition-all duration-500 shadow-sm ${progress >= 50 ? 'border-slate-200 opacity-100' : 'border-transparent bg-slate-50 opacity-40'}`}>
                  <FileText className={`w-5 h-5 ${progress >= 50 ? 'text-accent' : 'text-slate-300'}`} />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 tracking-tight">Extracting SOP architecture...</span>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">{progress < 80 ? (progress >= 50 ? 'Processing' : 'Waiting') : 'Structured'}</span>
                  </div>
                </div>
                
                <div className={`flex items-center gap-4 p-5 rounded-2xl bg-white border transition-all duration-500 shadow-sm ${progress >= 80 ? 'border-slate-200 opacity-100' : 'border-transparent bg-slate-50 opacity-40'}`}>
                  <CheckSquare className={`w-5 h-5 ${progress >= 80 ? 'text-accent' : 'text-slate-300'}`} />
                   <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-900 tracking-tight">Deploying tactical actions...</span>
                    <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">{progress >= 100 ? 'Dispatched' : (progress >= 80 ? 'Finalizing' : 'Waiting')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-20 w-full bg-white p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-200/60 shadow-sm">
          <div className="flex items-center gap-4 w-full">
            <div className="w-12 h-12 shrink-0 rounded-2xl bg-accent/5 flex items-center justify-center border border-accent/10">
              <Lightbulb className="w-6 h-6 text-accent" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-bold">Founder Insight</span>
              <span className="text-sm text-slate-700 font-medium mt-1">Processing velocity is 2.4x higher than your last session.</span>
            </div>
          </div>
          <button className="px-6 py-3 shrink-0 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all text-[10px] uppercase tracking-[0.2em] text-slate-600 font-bold">
            Live Stream
          </button>
        </div>
      </div>
    </main>
  );
}
