import React from 'react';
import { ExamResult } from '../types';
import { downloadCSV } from '../utils';
import { DownloadCloud, ArrowRight, UserSquare2, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import * as motion from 'motion/react-client';

interface ResultsViewProps {
  results: ExamResult[];
  onContinueGrading: () => void;
  onDashboard: () => void;
}

export default function ResultsView({ results, onContinueGrading, onDashboard }: ResultsViewProps) {
  const handleDownload = () => {
    // Flatten result details for simpler CSV or just general summary
    // Typically, teachers want: Student ID | Total Questions | Correct | Score %
    const csvData = results.map(r => ({
      'Student ID': r.studentId,
      'Total Questions': r.totalQuestions,
      'Correct Answers': r.correctAnswers,
      'Score (%)': r.score,
    }));
    downloadCSV(csvData, `OMR_Results_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const getAverageScore = () => {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, curr) => acc + curr.score, 0);
    return (sum / results.length).toFixed(1);
  };

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
         <p className="text-slate-500 mb-4">No results available.</p>
         <button onClick={onDashboard} className="text-indigo-600 font-medium hover:underline">Return to Dashboard</button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-lg text-center flex flex-col justify-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Lote Completo</p>
          <p className="text-3xl font-extrabold text-slate-200 mt-1 mono">{results.length}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 p-5 rounded-lg text-center flex flex-col justify-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Média Global</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-1 mono">{getAverageScore()}%</p>
        </div>
        
        <div className="col-span-2 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={handleDownload}
            className="flex-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white rounded text-xs uppercase tracking-widest font-bold transition-colors flex items-center justify-center gap-2 py-4"
          >
            <DownloadCloud className="w-4 h-4" /> Export CSV (Sheets)
          </button>
          <button 
            onClick={onContinueGrading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs uppercase tracking-widest font-bold transition-colors flex items-center justify-center gap-2 py-4"
          >
             Novo Scanner <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-black/40 border border-slate-700 rounded-lg overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50"></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 border-b border-slate-800 text-[10px] uppercase tracking-widest font-bold text-slate-500">
              <tr>
                <th className="px-6 py-4">ID Candidato</th>
                <th className="px-6 py-4">Resultados</th>
                <th className="px-6 py-4">Matches (AI)</th>
                <th className="px-6 py-4 text-right">Log Traces</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {results.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-slate-200 flex items-center gap-3 text-xs">
                    <UserSquare2 className="w-5 h-5 text-slate-600 group-hover:text-emerald-500 transition-colors" />
                    {r.studentId}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-wider mono border
                       ${r.score >= 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
                         r.score >= 60 ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 
                         'bg-rose-500/10 text-rose-500 border-rose-500/30'}`}
                    >
                      SCORE: {r.score.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 mono text-xs text-slate-400">
                    <span className="text-slate-200">{r.correctAnswers}</span> / {r.totalQuestions}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-500 hover:text-emerald-400 p-1 rounded transition-colors inline-block" title="Expand view">
                       <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </motion.div>
  );
}
