import React, { useState, useRef } from 'react';
import {
  UploadCloud, File as FileIcon, X, Send,
  FileText, FileArchive, FileCode, FileImage, FileVideo, FileAudio,
  CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';
import type { TransferItem } from '../hooks/useFileShare';
import { formatBytes, formatSpeed, formatEta, getFileCategory } from '../utils/format';
import { Progress } from 'antd';

interface SenderTransferProps {
  connectedPeerName: string;
  activeTransfers: TransferItem[];
  onSendFiles: (files: File[]) => void;
  onCancelTransfer: (id: string) => void;
  onDisconnect: () => void;
}

function FileTypeIcon({ name, mime }: { name: string; mime?: string }) {
  const cat = getFileCategory(name, mime);
  const cls = 'w-5 h-5 shrink-0';
  if (cat === 'image')    return <FileImage   className={`${cls} text-purple-500`} />;
  if (cat === 'video')    return <FileVideo   className={`${cls} text-rose-500`} />;
  if (cat === 'audio')    return <FileAudio   className={`${cls} text-amber-500`} />;
  if (cat === 'archive')  return <FileArchive className={`${cls} text-blue-500`} />;
  if (cat === 'code')     return <FileCode    className={`${cls} text-emerald-500`} />;
  if (cat === 'document' || cat === 'pdf')
                          return <FileText    className={`${cls} text-indigo-500`} />;
  return <FileIcon className={`${cls} text-zinc-400`} />;
}

export function SenderTransfer({
  connectedPeerName, activeTransfers, onSendFiles, onCancelTransfer, onDisconnect,
}: SenderTransferProps) {
  const [staged, setStaged] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: File[]) => {
    setStaged(prev => {
      const filtered = newFiles.filter(nf => !prev.some(pf => pf.name === nf.name && pf.size === nf.size));
      return [...prev, ...filtered];
    });
  };

  const handleSend = () => {
    if (staged.length === 0) return;
    onSendFiles(staged);
    setStaged([]);
  };

  const totalSize = staged.reduce((a, f) => a + f.size, 0);
  const isSending = activeTransfers.some(t => t.status === 'sending');

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 animate-fade-up">
      {/* Session banner */}
      <div className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 mb-6">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>
          <div>
            <p className="text-base font-bold text-emerald-800 dark:text-emerald-300">
              Connected to {connectedPeerName || 'Device'}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-500">
              Encrypted P2P session active · Direct transfer
            </p>
          </div>
        </div>
        <button
          onClick={onDisconnect}
          className="text-xs font-semibold text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors px-3.5 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 border border-red-200/50 dark:border-red-900/30"
        >
          Disconnect
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left — Dropzone */}
        <div className="space-y-4">
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={e => { e.preventDefault(); setIsDragOver(false); addFiles(Array.from(e.dataTransfer.files)); }}
            onClick={() => fileRef.current?.click()}
            className={`group cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-blue-400 dark:hover:border-blue-600 bg-zinc-50/50 dark:bg-zinc-900/40'
            }`}
          >
            <input ref={fileRef} type="file" multiple className="hidden" onChange={e => {
              if (e.target.files) addFiles(Array.from(e.target.files));
              e.target.value = '';
            }} />
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-7 h-7" />
            </div>
            <p className="text-base font-bold text-zinc-800 dark:text-zinc-200">
              Drop files here to send
            </p>
            <p className="text-xs text-zinc-400 mt-1">or click to browse your files</p>
          </div>

          {/* Staged list */}
          {staged.length > 0 && (
            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                  {staged.length} file{staged.length > 1 ? 's' : ''} staged · {formatBytes(totalSize)}
                </span>
                <button
                  onClick={() => setStaged([])}
                  className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {staged.map((f, i) => (
                  <div key={`${f.name}_${i}`} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs">
                    <FileTypeIcon name={f.name} mime={f.type} />
                    <span className="flex-1 truncate font-medium text-zinc-800 dark:text-zinc-200">{f.name}</span>
                    <span className="text-xs text-zinc-400 shrink-0">{formatBytes(f.size)}</span>
                    <button onClick={() => setStaged(prev => prev.filter((_, idx) => idx !== i))} className="text-zinc-300 hover:text-red-500 shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSend}
                disabled={isSending}
                className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Send {staged.length} File{staged.length > 1 ? 's' : ''} to {connectedPeerName || 'Device'}
              </button>
            </div>
          )}
        </div>

        {/* Right — Transfer progress */}
        <div>
          <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 min-h-[240px]">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
              Transfer Activity
            </p>

            {activeTransfers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <UploadCloud className="w-10 h-10 text-zinc-200 dark:text-zinc-700 mb-3" />
                <p className="text-xs text-zinc-400">Select files to begin transferring</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTransfers.map(t => (
                  <div key={t.id}>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileTypeIcon name={t.name} mime={t.mimeType} />
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {t.status === 'sending' && (
                          <>
                            <span className="text-[11px] font-mono font-bold text-blue-500">{formatSpeed(t.speed)}</span>
                            <button onClick={() => onCancelTransfer(t.id)} className="text-zinc-300 hover:text-red-500">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {t.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                        {t.status === 'cancelled' && <XCircle className="w-4 h-4 text-red-400" />}
                        {t.status === 'error'     && <AlertCircle className="w-4 h-4 text-amber-400" />}
                      </div>
                    </div>
                    <Progress
                      percent={t.progress}
                      showInfo={false}
                      size="small"
                      strokeColor={t.status === 'cancelled' || t.status === 'error' ? '#ef4444' : '#2563eb'}
                    />
                    {t.status === 'sending' && (
                      <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5 font-mono">
                        <span>{formatBytes(t.bytesTransferred)} / {formatBytes(t.size)}</span>
                        <span>ETA {formatEta(t.eta)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
