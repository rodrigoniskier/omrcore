import React, { useState, useRef } from 'react';
import { Answer } from '../types';
import { Upload, FileText, Check, Loader2, AlertCircle, Edit2 } from 'lucide-react';
import * as motion from 'motion/react-client';

interface SetupKeyViewProps {
  onSave: (key: Answer[]) => void;
  initialKey: Answer[];
}

export default function SetupKeyView({ onSave, initialKey }: SetupKeyViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [extractedKey, setExtractedKey] = useState<Answer[]>(initialKey);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setExtractedKey([]);
      setError(null);
    }
  };

  const handleExtract = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/parse-key', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to extract key');
      
      setExtractedKey(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (index: number, newAns: string) => {
    const updated = [...extractedKey];
    updated[index].correctAnswer = newAns.toUpperCase();
    setExtractedKey(updated);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-700"></div>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Configuração do Gabarito Oficial</h3>
        <p className="text-slate-500 text-sm mb-6">Upload a photo or PDF of the official answer key. Engine will extract values.</p>
        
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed rounded p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${file ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/80 bg-slate-900/50'}`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*,application/pdf"
          />
          
          {file ? (
            <>
              <div className="bg-emerald-500/20 p-3 rounded mb-3 text-emerald-400">
                <Check className="w-6 h-6" />
              </div>
              <p className="font-semibold text-slate-200">{file.name}</p>
              <p className="text-xs text-slate-500 mt-1 mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </>
          ) : (
            <>
              <div className="bg-slate-800 p-3 rounded mb-3 text-slate-500 border border-slate-700">
                <Upload className="w-6 h-6" />
              </div>
              <p className="font-medium text-slate-300 text-sm">Click to upload answer key</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-2 font-bold">Image (JPEG/PNG) / PDF</p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 p-4 bg-rose-900/20 text-rose-400 rounded flex items-start gap-3 border border-rose-900/50">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-xs font-mono">{error}</div>
          </div>
        )}

        {file && extractedKey.length === 0 && (
          <div className="mt-6 flex justify-end">
            <button 
              onClick={handleExtract} 
              disabled={loading}
              className="bg-slate-700 hover:bg-slate-600 text-white px-5 py-3 rounded text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                 <><Loader2 className="w-4 h-4 animate-spin" /> Processando IA...</>
              ) : (
                 <><FileText className="w-4 h-4" /> Start Extraction</>
              )}
            </button>
          </div>
        )}
      </div>

      {extractedKey.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-800/50 border border-slate-700 p-6 rounded-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 active-glow"></div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Validate Extracted Key</h3>
              <div className="flex items-center gap-2 mt-1">
                 <div className="status-indicator bg-emerald-500 active-glow"></div>
                 <span className="text-slate-300 mono text-xs">{extractedKey.length} QUERIES EXTRACTED</span>
              </div>
            </div>
            <button 
              onClick={() => onSave(extractedKey)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded text-xs uppercase tracking-widest font-bold transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Save Key
            </button>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {extractedKey.map((ans, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded p-2">
                <span className="text-slate-500 font-mono text-xs w-6 text-right">{ans.questionNumber}.</span>
                <input 
                  type="text" 
                  value={ans.correctAnswer} 
                  onChange={(e) => handleAnswerChange(idx, e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-center font-bold text-slate-200 uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                  maxLength={1}
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
