import React, { useState } from 'react';
import {
  Download, FileText, FileArchive, FileCode, FileImage, FileVideo,
  FileAudio, File as FileIcon, CheckCircle2, Trash2, Eye,
  InboxIcon,
} from 'lucide-react';
import type { TransferItem } from '../hooks/useFileShare';
import { formatBytes, getFileCategory } from '../utils/format';
import { Progress, Switch, Modal } from 'antd';

interface ReceiverTransferProps {
  connectedPeerName: string;
  activeTransfers: TransferItem[];
  transferHistory: TransferItem[];
  autoDownload: boolean;
  onDisconnect: () => void;
  onToggleAutoDownload: (v: boolean) => void;
  onClearHistory: () => void;
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

export function ReceiverTransfer({
  connectedPeerName, activeTransfers, transferHistory, autoDownload,
  onDisconnect, onToggleAutoDownload, onClearHistory,
}: ReceiverTransferProps) {
  const [preview, setPreview] = useState<TransferItem | null>(null);

  const incoming = activeTransfers.filter(t => t.direction === 'download');
  const received = transferHistory.filter(t => t.direction === 'download');

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
              Waiting for them to send files
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

      {/* Active incoming transfers */}
      {incoming.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6 mb-6">
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">
            Receiving Files
          </p>
          <div className="space-y-4">
            {incoming.map(t => (
              <div key={t.id}>
                <div className="flex items-center gap-2 mb-1.5">
                  <FileTypeIcon name={t.name} mime={t.mimeType} />
                  <span className="flex-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{t.name}</span>
                  <span className="text-[11px] text-zinc-400">{formatBytes(t.size)}</span>
                </div>
                <Progress
                  percent={t.progress}
                  showInfo={false}
                  size="small"
                  strokeColor="#10b981"
                />
                <div className="flex justify-between text-[10px] text-zinc-400 mt-0.5 font-mono">
                  <span>{formatBytes(t.bytesTransferred)} / {formatBytes(t.size)}</span>
                  <span>{t.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waiting illustration when no activity */}
      {incoming.length === 0 && received.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-8">
          <div className="relative mb-5">
            <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <InboxIcon className="w-9 h-9 text-zinc-300 dark:text-zinc-600" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 items-center justify-center">
                <span className="text-[8px] text-white font-bold">✓</span>
              </span>
            </span>
          </div>
          <p className="text-base font-bold text-zinc-800 dark:text-zinc-200 mb-1">
            Waiting for {connectedPeerName || 'the sender'}…
          </p>
          <p className="text-xs text-zinc-400 max-w-sm">
            Files will appear here as soon as they start sending. Downloads start automatically.
          </p>
        </div>
      )}

      {/* Received files */}
      {received.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Received ({received.length})
            </p>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer">
                <Switch size="small" checked={autoDownload} onChange={onToggleAutoDownload} />
                Auto-download
              </label>
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {received.map(t => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs">
                <FileTypeIcon name={t.name} mime={t.mimeType} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{t.name}</p>
                  <p className="text-[11px] text-zinc-400">{formatBytes(t.size)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {t.url && getFileCategory(t.name, t.mimeType) === 'image' && (
                    <button onClick={() => setPreview(t)} className="p-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {t.url && (
                    <a
                      href={t.url}
                      download={t.name}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Save
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Image preview modal */}
      <Modal open={!!preview} onCancel={() => setPreview(null)} footer={null} title={preview?.name} centered>
        {preview?.url && (
          <div className="flex justify-center p-2">
            <img src={preview.url} alt={preview.name} className="max-h-[70vh] rounded-xl object-contain" />
          </div>
        )}
      </Modal>
    </div>
  );
}
