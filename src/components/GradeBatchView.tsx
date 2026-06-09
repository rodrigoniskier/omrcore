import React, { useState, useRef } from 'react';
import { Answer, ExamResult } from '../types';
import { Camera, ImageUp, Loader2, ArrowLeft, CheckCircle2, AlertCircle, X, Check } from 'lucide-react';
import * as motion from 'motion/react-client';

interface GradeBatchViewProps {
  answerKey: Answer[];
  onComplete: (results: ExamResult[]) => void;
  onCancel: () => void;
}

interface PendingFile {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: ExamResult;
  errorStr?: string;
}

export default function GradeBatchView({ answerKey, onComplete, onCancel }: GradeBatchViewProps) {
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const addedFiles: PendingFile[] = Array.from(newFiles).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending'
    }));
    setFiles(prev => [...prev, ...addedFiles]);
  };

  const removeFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProcessing) return;
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processBatch = async () => {
    if (files.length === 0 || isProcessing) return;
    setIsProcessing(true);

    const updatedFiles = [...files];
    const stringifiedKey = JSON.stringify(answerKey);

    for (let i = 0; i < updatedFiles.length; i++) {
        if (updatedFiles[i].status === 'success') continue; // skip already processed

        updatedFiles[i] = { ...updatedFiles[i], status: 'processing' };
        setFiles([...updatedFiles]);

        try {
          const formData = new FormData();
          formData.append('file', updatedFiles[i].file);
          formData.append('answerKey', stringifiedKey);

          const res = await fetch('/api/evaluate-exam', {
            method: 'POST',
            body: formData
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to evaluate');

          updatedFiles[i] = { ...updatedFiles[i], status: 'success', result: data };
        } catch (err: any) {
          updatedFiles[i] = { ...updatedFiles[i], status: 'error', errorStr: err.message };
        }
        
        setFiles([...updatedFiles]);
    }

    setIsProcessing(false);
  };

  const getCompletedCount = () => files.filter(f => f.status === 'success').length;
  const getErrorCount = () => files.filter(f => f.status === 'error').length;
  
  const finishBatch = () => {
    const successResults = files.filter(f => f.status === 'success' && f.result).map(f => f.result!);
    onComplete(successResults);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      
      <div className="flex items-center justify-between">
        <button onClick={onCancel} disabled={isProcessing} className="flex items-center gap-2 text-slate-400 hover:text-white text-xs uppercase tracking-widest font-bold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex flex-col text-right">
           <span className="text-[10px] uppercase text-slate-500 font-bold tracking-widest">Active Key</span>
           <span className="text-xs font-semibold text-emerald-400 mono">{(answerKey.length).toString().padStart(2, '0')} Queries</span>
        </div>
      </div>

      {!isProcessing && files.length === 0 && (
         <div className="grid sm:grid-cols-2 gap-4">
           {/* Camera Capture Option */}
           <div 
             onClick={() => cameraInputRef.current?.click()}
             className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-600 hover:bg-slate-800 transition-colors group relative overflow-hidden"
           >
             <input 
               type="file" 
               ref={cameraInputRef} 
               onChange={(e) => addFiles(e.target.files)} 
               className="hidden" 
               accept="image/*"
               capture="environment"
               multiple={false} 
             />
             <div className="absolute top-0 left-0 w-full h-1 bg-slate-700"></div>
             <div className="bg-slate-900 border border-slate-700 p-4 rounded mb-4 text-slate-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
               <Camera className="w-8 h-8" />
             </div>
             <h3 className="font-bold text-slate-300 text-sm uppercase tracking-widest mb-1">Câmera Dispositivo</h3>
             <p className="text-xs text-slate-500 mt-1">Capture single images</p>
           </div>

           {/* Batch Upload Option */}
           <div 
             onClick={() => fileInputRef.current?.click()}
             className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-slate-600 hover:bg-slate-800 transition-colors group relative overflow-hidden"
           >
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={(e) => addFiles(e.target.files)} 
               className="hidden" 
               accept="image/*,application/pdf"
               multiple
             />
             <div className="absolute top-0 left-0 w-full h-1 bg-slate-700"></div>
             <div className="bg-slate-900 border border-slate-700 p-4 rounded mb-4 text-slate-500 group-hover:text-emerald-400 group-hover:border-emerald-500/30 transition-colors">
               <ImageUp className="w-8 h-8" />
             </div>
             <h3 className="font-bold text-slate-300 text-sm uppercase tracking-widest mb-1">Batch Upload</h3>
             <p className="text-xs text-slate-500 mt-1">Select multiple images</p>
           </div>
         </div>
      )}

      {files.length > 0 && (
         <div className="flex-1 flex flex-col bg-black/40 border border-slate-700 rounded-lg relative overflow-hidden">
             <div className={`absolute top-0 left-0 w-full h-1 ${isProcessing ? 'bg-emerald-500 active-glow' : 'bg-slate-700'}`}></div>
             
             <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                 <div className="flex items-center gap-3">
                     <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Queue Status</span>
                     <span className="mono text-[10px] text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 rounded">QTY: {files.length}</span>
                 </div>
                 <div className="flex items-center gap-3">
                     {!isProcessing && (
                         <button 
                             onClick={() => fileInputRef.current?.click()}
                             className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white border border-slate-700 px-3 py-1.5 rounded bg-slate-800"
                         >
                             + ADD
                         </button>
                     )}
                     <button
                         onClick={isProcessing || getCompletedCount() === files.length ? finishBatch : processBatch}
                         disabled={isProcessing}
                         className={`flex items-center gap-2 px-4 py-2 rounded text-[10px] uppercase tracking-widest font-bold transition-colors ${isProcessing || getCompletedCount() === files.length ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-slate-700 text-white hover:bg-slate-600'} disabled:opacity-50`}
                     >
                         {isProcessing ? (
                             <><Loader2 className="w-4 h-4 animate-spin"/> PROCESSANDO...</>
                         ) : getCompletedCount() > 0 && getCompletedCount() === files.length ? (
                             <><CheckCircle2 className="w-4 h-4"/> FINALIZAR & VER</>
                         ) : (
                             'INICIAR EXECUTOR'
                         )}
                     </button>
                     {(getCompletedCount() > 0 || getErrorCount() > 0) && !isProcessing && getCompletedCount() !== files.length && (
                         <button onClick={finishBatch} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white">
                             EXIT EARLY
                         </button>
                     )}
                 </div>
             </div>

             <div className="p-6">
               <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
                   {files.map((file) => (
                       <div key={file.id} className="relative group rounded overflow-hidden border border-slate-700 aspect-[3/4] bg-slate-900">
                           <img src={file.previewUrl} className="w-full h-full object-cover opacity-80" alt="exam" />
                           
                           {/* Overlay status */}
                           <div className="absolute inset-0 bg-slate-900/40 transition-colors pointer-events-none" />
                           
                           {!isProcessing && file.status === 'pending' && (
                               <button 
                                 onClick={(e) => removeFile(file.id, e)}
                                 className="absolute top-2 right-2 bg-slate-900/80 border border-slate-700 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-900/50 hover:text-rose-400"
                               >
                                 <X className="w-4 h-4" />
                               </button>
                           )}

                           <div className="absolute bottom-2 left-2 right-2 flex justify-end">
                               {file.status === 'pending' && <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded shadow-sm">Ready</span>}
                               {file.status === 'processing' && <span className="bg-slate-800 text-emerald-400 border border-emerald-500/50 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-1 active-glow"><Loader2 className="w-3 h-3 animate-spin"/> Exec</span>}
                               {file.status === 'success' && <span className="bg-emerald-900/80 text-emerald-300 border border-emerald-500/50 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded shadow-sm">Acc: {file.result?.score}%</span>}
                               {file.status === 'error' && <span className="bg-rose-900/80 text-rose-300 border border-rose-500/50 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded shadow-sm" title={file.errorStr}>Fail</span>}
                           </div>
                       </div>
                   ))}
               </div>
             </div>

             {/* Progress footer indicator */}
             {(isProcessing || getCompletedCount() > 0) && (
               <div className="p-4 bg-slate-900/50 border-t border-slate-800">
                   <div className="flex justify-between mb-2">
                       <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Job Execution</span>
                       <span className="text-[10px] text-slate-500 uppercase mono">{Math.round(((getCompletedCount() + getErrorCount()) / files.length) * 100)}%</span>
                   </div>
                   <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                       <div 
                         className="bg-emerald-500 h-full transition-all duration-300 active-glow" 
                         style={{ width: `${((getCompletedCount() + getErrorCount()) / files.length) * 100}%` }}
                       ></div>
                   </div>
               </div>
             )}
         </div>
      )}
    </motion.div>
  );
}
