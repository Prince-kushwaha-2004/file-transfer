import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Copy, Check, QrCode, Laptop, RefreshCw, X, KeyRound } from 'lucide-react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';

interface ReceiverWaitProps {
  myId: string;
  myCode: string;
  deviceName: string;
  connectionStatus: 'idle' | 'initializing' | 'connecting' | 'connected' | 'disconnected';
  onBack: () => void;
  onConnectByCode: (code: string) => void;
}

export function ReceiverWait({
  myId, myCode, deviceName, connectionStatus, onBack, onConnectByCode,
}: ReceiverWaitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showManualCode, setShowManualCode] = useState(false);
  const [senderCode, setSenderCode] = useState('');

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?connect=${myId}`
    : '';

  useEffect(() => {
    if (showQrModal && canvasRef.current && shareUrl) {
      QRCode.toCanvas(canvasRef.current, shareUrl, {
        width: 220,
        margin: 1,
        color: { dark: '#18181b', light: '#ffffff' },
      }).catch(console.error);
    }
  }, [showQrModal, shareUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    toast.success('Code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (senderCode.trim()) onConnectByCode(senderCode.trim());
  };

  const isConnecting = connectionStatus === 'connecting';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 animate-fade-up">
      {/* Nav */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          Receiver Mode
        </span>
      </div>

      {/* Receiver Radar View */}
      <div className="flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center mb-6" style={{ width: 280, height: 280 }}>
          {/* Static rings */}
          {[280, 186, 93].map(d => (
            <div
              key={d}
              className="absolute rounded-full border border-emerald-300/40 dark:border-emerald-500/20"
              style={{ width: d, height: d }}
            />
          ))}

          {/* Rotating sweep */}
          <div
            className="absolute rounded-full radar-cone animate-radar-sweep"
            style={{
              width: 280,
              height: 280,
              transformOrigin: 'center',
              background: 'conic-gradient(from 0deg, transparent 0deg, transparent 260deg, rgba(16,185,129,0.1) 300deg, rgba(16,185,129,0.4) 360deg)',
            }}
          />

          {/* Center icon */}
          <div className="relative z-10 w-16 h-16 rounded-full bg-white dark:bg-zinc-900 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
            {isConnecting ? (
              <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
            ) : (
              <Laptop className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            {isConnecting ? 'Connecting...' : 'Visible to nearby senders'}
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
            {deviceName || 'This Device'} is waiting to receive
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Senders looking for nearby devices can find and pair with you automatically.
          </p>
        </div>

        {/* Actions row */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <button
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all"
          >
            <QrCode className="w-4 h-4" />
            Show QR Code & Pairing Code
          </button>
          
          <button
            onClick={() => setShowManualCode(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all"
          >
            <KeyRound className="w-4 h-4" />
            Enter Sender's Code
          </button>
        </div>

        {/* Enter sender code form */}
        {showManualCode && (
          <form onSubmit={handleSubmit} className="w-full max-w-sm flex gap-2 animate-fade-up mb-6">
            <input
              type="text"
              value={senderCode}
              onChange={e => setSenderCode(e.target.value)}
              placeholder="Sender's 6-digit code..."
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono shadow-sm"
            />
            <button
              type="submit"
              disabled={isConnecting || !senderCode.trim()}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
            >
              Connect
            </button>
          </form>
        )}
      </div>

      {/* QR & Pairing Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-fade-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-500" />
                Scan to Connect
              </span>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Scan this QR code with the sender's camera to establish a direct connection.
              </p>

              <div className="flex justify-center mb-6">
                <div className="p-3 bg-white rounded-2xl border border-zinc-100 shadow-inner">
                  <canvas ref={canvasRef} className="rounded-lg block" />
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">
                  Or use 6-Digit Pairing Code
                </p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-3xl font-black tracking-[0.2em] font-mono text-zinc-900 dark:text-white">
                    {myCode ? `${myCode.slice(0, 3)} ${myCode.slice(3)}` : '— — —'}
                  </span>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors"
                    title="Copy code"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
