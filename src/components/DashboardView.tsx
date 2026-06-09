import React from 'react';
import { Answer } from '../types';
import { FileCheck, Camera, History } from 'lucide-react';
import * as motion from 'motion/react-client';

interface DashboardViewProps {
  answerKey: Answer[];
  onStartGrading: () => void;
}

export default function DashboardView({ answerKey, onStartGrading }: DashboardViewProps) {
  const hasKey = answerKey.length > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Status Card */}
        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-700"></div>
          <div>
            <div className="w-10 h-10 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 mb-6">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Answer Key</h3>
            {hasKey ? (
              <div className="flex items-center gap-2">
                <div className="status-indicator bg-emerald-500 active-glow"></div>
                <p className="text-slate-300 text-sm">Loaded with <strong className="text-white">{answerKey.length}</strong> questions.</p>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                 <div className="status-indicator bg-rose-500"></div>
                 <p className="text-rose-400 text-sm font-medium">No answer key set. Please configure one first.</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Card */}
        <div className={`p-6 rounded-lg border flex flex-col justify-between relative overflow-hidden transition-colors ${hasKey ? 'bg-slate-800/80 border-emerald-500/50' : 'bg-slate-800/30 border-slate-800 text-slate-500'}`}>
          {hasKey && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 active-glow"></div>}
          <div>
            <div className={`w-10 h-10 rounded flex items-center justify-center mb-6 transition-colors ${hasKey ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-slate-900/50 border border-slate-800 text-slate-600'}`}>
              <Camera className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-400">Grade Exams</h3>
            <p className={`text-sm mb-8 ${hasKey ? 'text-slate-300' : 'text-slate-600'}`}>Use device camera or upload batch photos to process answer sheets.</p>
          </div>
          
          <button 
            onClick={onStartGrading}
            disabled={!hasKey}
            className={`w-full font-bold py-3 px-4 rounded text-xs uppercase tracking-widest transition-colors ${hasKey ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'}`}
          >
            Start Grading
          </button>
        </div>
      </div>

    </motion.div>
  );
}
