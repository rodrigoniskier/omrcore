import React, { useState, useEffect } from 'react';
import SetupKeyView from './components/SetupKeyView';
import DashboardView from './components/DashboardView';
import GradeBatchView from './components/GradeBatchView';
import ResultsView from './components/ResultsView';
import { Answer, ExamResult } from './types';
import { CheckCircle2, LayoutDashboard, Settings } from 'lucide-react';

export type AppView = 'setup-key' | 'dashboard' | 'grade' | 'results';

export default function App() {
  const [view, setView] = useState<AppView>('dashboard');
  const [answerKey, setAnswerKey] = useState<Answer[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);

  // Load saved key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('omr_answer_key');
    if (savedKey) {
      try {
        const parsed = JSON.parse(savedKey);
        setAnswerKey(parsed);
      } catch (e) {
        console.error("Failed to parse saved key");
      }
    } else {
      setView('setup-key');
    }
  }, []);

  const handleSaveKey = (key: Answer[]) => {
    setAnswerKey(key);
    localStorage.setItem('omr_answer_key', JSON.stringify(key));
    setView('dashboard');
  };

  const handleStartGrading = () => {
    setResults([]);
    setView('grade');
  };

  const handleBatchComplete = (batchResults: ExamResult[]) => {
    setResults((prev) => [...prev, ...batchResults]);
    setView('results');
  };

  // Basic Top Navigation
  return (
    <div className="min-h-screen font-sans text-slate-50 flex flex-col geometric-bg">
      <header className="flex justify-between items-end border-b border-slate-700/80 bg-slate-900/50 backdrop-blur-md px-6 py-4 sticky top-0 z-10 mb-6">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('dashboard')}>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Sistema de Processamento OMR</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tighter flex items-center gap-2">
              OMR<span className="text-emerald-500">CORE</span><span className="text-slate-400 font-light text-lg sm:text-xl">v2.4</span>
            </h1>
          </div>
        </div>
        
        <nav className="flex items-center gap-2">
          <button 
            onClick={() => setView('dashboard')}
            className={`px-3 py-2 rounded flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${view === 'dashboard' ? 'bg-slate-800/80 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-700 hover:bg-slate-800/50'}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <button 
            onClick={() => setView('setup-key')}
            className={`px-3 py-2 rounded flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors ${view === 'setup-key' ? 'bg-slate-800/80 text-emerald-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-700 hover:bg-slate-800/50'}`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Answer Key</span>
          </button>
        </nav>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-6 md:p-8 min-h-0">
        {view === 'setup-key' && <SetupKeyView onSave={handleSaveKey} initialKey={answerKey} />}
        {view === 'dashboard' && <DashboardView answerKey={answerKey} onStartGrading={handleStartGrading} />}
        {view === 'grade' && <GradeBatchView answerKey={answerKey} onComplete={handleBatchComplete} onCancel={() => setView('dashboard')} />}
        {view === 'results' && <ResultsView results={results} onContinueGrading={handleStartGrading} onDashboard={() => setView('dashboard')} />}
      </main>
    </div>
  );
}
