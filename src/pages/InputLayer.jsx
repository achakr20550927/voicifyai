import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Download, Wand2, BookOpen, ArrowRight, Twitter, Linkedin, Instagram, Menu, Mic, StopCircle, Upload, Send, ExternalLink } from 'lucide-react';
import { fileStore } from '../lib/openai';

export default function InputLayer() {
  const [text, setText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [file, setFile] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleSubmit = () => {
    if (!text && !file) {
      setError('Please provide text, audio, or a file.');
      return;
    }
    setError('');
    
    if (file && (file.type.startsWith('audio/') || file.type.startsWith('video/'))) {
      // Pass the filename rather than the massive File object to avoid crashing history.pushState memory clone
      fileStore.currentFile = file;
      navigate('/processing', { state: { inputType: 'audioFile', content: file.name } });
    } else {
      navigate('/processing', { state: { inputType: file ? 'file' : 'text', content: text || (file && file.name) } });
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setText('');
      setError('');
    }
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech Recognition is not supported in Chrome/Safari.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      mediaRecorderRef.current = recognition;

      recognition.onstart = () => {
        setIsRecording(true);
        setError('');
        if (!text) setText('');
        setInterimText('');
      };

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript + ' ';
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        
        if (final) setText(prev => prev + final);
        setInterimText(interim);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setError(event.error === 'not-allowed' ? 'Mic access denied.' : 'Error: ' + event.error);
        setIsRecording(false);
        setInterimText('');
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimText('');
      };

      recognition.start();
    } catch (err) {
      setError('Could not initialize mic.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col lg:flex-row p-4 lg:p-6 gap-6 bg-slate-50 overflow-hidden font-body text-slate-900">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.03),transparent_50%)]" />
      <div className="fixed inset-0 noise-bg z-0 opacity-[0.03]" />

      {/* LEFT PANEL */}
      <section className="relative z-10 w-full lg:w-[55%] h-[calc(100vh-3rem)] rounded-[2rem] bg-white p-8 lg:p-12 flex flex-col justify-between border border-slate-200/60 shadow-sm">
        
        {/* Nav */}
        <nav className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
              <span className="text-xl font-bold text-accent">V</span>
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">Voiceify</span>
          </div>
          <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-glass border border-slate-200 hover:bg-slate-50 transition-all active:scale-95 cursor-pointer text-slate-600 font-bold text-xs uppercase tracking-widest">
            <span>Menu</span>
            <Menu className="w-3.5 h-3.5" />
          </button>
        </nav>

        {/* Hero */}
        <div className="flex-1 flex flex-col items-start justify-center text-left mt-12 mb-8 max-w-2xl">
          <div className="w-16 h-16 rounded-2xl bg-accent/5 flex items-center justify-center border border-accent/10 mb-8">
            <Sparkles className="w-7 h-7 text-accent" />
          </div>
          
          <h1 className="text-5xl lg:text-7xl leading-[1.05] font-display font-bold tracking-tight text-slate-900 mb-8">
            Innovating the <em className="font-serif italic text-slate-400 font-normal">spirit</em> of Voiceify AI
          </h1>
          
          <p className="text-lg text-slate-500 mb-10 max-w-lg font-medium leading-relaxed">
            Deploy intelligence immediately via text, voice, or unstructured data dump. Your strategic engine awaits.
          </p>

          <button onClick={() => {}} className="flex items-center gap-3 px-8 py-4 rounded-xl bg-slate-900 text-white hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-200">
            <span className="text-sm font-bold uppercase tracking-widest">Explore Ecosystem</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Quote */}
        <div className="w-full flex items-end justify-between border-t border-slate-100 pt-8 mt-6">
          <div className="flex flex-col gap-2 max-w-xs">
            <span className="text-[9px] tracking-[0.2em] font-bold text-slate-400 uppercase">Visionary Design</span>
            <p className="text-xl text-slate-800 font-medium">
              "We imagined a realm with <span className="font-serif italic text-slate-400">no ending</span>."
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-3 translate-y-1">
            <div className="flex items-center gap-3">
              <div className="w-8 h-px bg-slate-200"></div>
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-400">Marcus Aurelio</span>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="flex space-x-1">
                  {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-accent/20" />)}
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT PANEL */}
      <section className="relative z-10 hidden lg:flex w-[45%] h-[calc(100vh-3rem)] flex-col gap-6">
        
        {/* Top Bar Navigation */}
        <div className="flex items-center justify-between w-full h-16">
          <div className="flex items-center gap-4 px-6 h-12 rounded-xl bg-white border border-slate-200/60 shadow-sm">
            <a href="#" className="text-slate-400 hover:text-accent transition-colors"><Twitter className="w-4 h-4" /></a>
            <a href="#" className="text-slate-400 hover:text-accent transition-colors"><Linkedin className="w-4 h-4" /></a>
            <a href="#" className="text-slate-400 hover:text-accent transition-colors"><Instagram className="w-4 h-4" /></a>
            <div className="w-px h-4 bg-slate-100 mx-1"></div>
            <ArrowRight className="w-4 h-4 text-slate-400 hover:text-accent transition-colors cursor-pointer" />
          </div>
          <button className="w-12 h-12 rounded-xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center hover:scale-105 transition-all cursor-pointer group">
            <Sparkles className="w-5 h-5 text-slate-300 group-hover:text-accent transition-colors" />
          </button>
        </div>

        {/* Input Core */}
        <div className="w-full shrink-0 bg-white rounded-[2rem] p-8 border border-slate-200/60 shadow-sm relative overflow-hidden flex flex-col gap-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mx-10 -my-10 pointer-events-none"></div>
          
          <div className="z-10">
            <h3 className="text-xl font-bold text-slate-900 mb-1 tracking-tight">Deploy Intelligence</h3>
            <p className="text-xs text-slate-500 font-medium">Input unstructured thoughts or mission parameters.</p>
          </div>

          <div className="relative w-full z-10 flex flex-col gap-4">
            <textarea 
              value={text + (isRecording && interimText ? ' ' + interimText : '')}
              onChange={(e) => { setText(e.target.value); setError(''); }}
              placeholder="Dump thoughts here..."
              className="w-full h-32 bg-slate-50 rounded-2xl border border-slate-200/60 p-5 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 resize-none font-medium transition-all"
            />
            {error && <p className="text-xs text-red-500 font-bold px-2">{error}</p>}
            
            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border transition-all font-bold text-[10px] uppercase tracking-widest ${isRecording ? 'bg-red-50 border-red-200 text-red-500 shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-accent/20 hover:text-accent'}`}
                >
                  {isRecording ? <StopCircle className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                  <span>{isRecording ? 'Listening...' : 'Dictate'}</span>
                </button>
                
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:border-accent/20 hover:text-accent transition-all font-bold text-[10px] uppercase tracking-widest">
                  <Upload className="w-4 h-4" />
                  <span className="truncate max-w-[80px]">{file ? file.name : 'Attach'}</span>
                </button>
              </div>
              
              <button 
                onClick={handleSubmit} 
                className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent/20"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links Area */}
        <div className="w-full grow bg-white rounded-[2rem] p-4 flex flex-col gap-4 border border-slate-200/60 shadow-sm mt-auto">
          <div className="flex w-full gap-4 h-32">
            <div onClick={() => navigate('/execution')} className="flex-1 bg-slate-50 rounded-2xl p-6 flex flex-col justify-between border border-slate-100 hover:border-accent/20 transition-all cursor-pointer group shadow-sm hover:shadow-md">
              <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-accent transition-colors">
                <Wand2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-900">Current Plan</span>
            </div>
            
            <div onClick={() => navigate('/library')} className="flex-1 bg-slate-50 rounded-2xl p-6 flex flex-col justify-between border border-slate-100 hover:border-accent/20 transition-all cursor-pointer group shadow-sm hover:shadow-md">
              <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-accent transition-colors">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-900">Archive</span>
            </div>
          </div>
          
          <div className="w-full bg-slate-900 rounded-[1.5rem] p-6 flex items-center justify-between border border-slate-800 group hover:bg-black transition-all cursor-pointer shadow-lg">
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-bold text-white tracking-tight uppercase tracking-widest">Operational Sync</h4>
              <p className="text-[10px] text-white/40 font-medium">Connect external enterprise databases.</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white transition-colors border border-white/5">
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
        </div>

      </section>
      
      {/* Mobile Input Fallback */}
      <section className="relative z-10 lg:hidden w-full bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl flex flex-col gap-4 mt-auto">
         <h3 className="text-lg font-bold text-slate-900">Enter ecosystem</h3>
         <textarea 
            value={text + (isRecording && interimText ? ' ' + interimText : '')}
            onChange={(e) => { setText(e.target.value); setError(''); }}
            placeholder="Type or dictate..."
            className="w-full h-24 bg-slate-50 rounded-xl border border-slate-200 p-4 text-sm text-slate-900 placeholder:text-slate-300 focus:outline-none"
         />
         <div className="flex justify-between items-center gap-3">
            <button onClick={isRecording ? stopRecording : startRecording} className="flex-1 py-3.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-slate-100">
               {isRecording ? 'Stop' : 'Dictate'}
            </button>
            <button onClick={handleSubmit} className="flex-1 py-3.5 rounded-xl bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-black shadow-lg shadow-slate-200">
               Process
            </button>
         </div>
      </section>

    </main>
  );
}
