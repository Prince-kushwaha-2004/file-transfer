import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowLeft, Laptop, Smartphone, Tablet, ChevronRight,
  RefreshCw, QrCode, X, Camera, CameraOff, KeyRound, CheckCircle,
} from 'lucide-react';
import type { DiscoveredDevice } from '../utils/discoveryServer';

interface RadarScanProps {
  connectionStatus: 'idle' | 'initializing' | 'connecting' | 'connected' | 'disconnected';
  nearbyDevices: DiscoveredDevice[];
  myCode: string;
  onBack: () => void;
  onConnect: (id: string, name?: string) => void;
  onConnectByCode: (code: string) => void;
}

/* ── Device icon ─────────────────────────────────────────────────────────── */
function DeviceIcon({ type, size = 18 }: { type?: string; size?: number }) {
  if (type === 'mobile') return <Smartphone style={{ width: size, height: size, color: '#2563eb' }} />;
  if (type === 'tablet') return <Tablet     style={{ width: size, height: size, color: '#7c3aed' }} />;
  return <Laptop style={{ width: size, height: size, color: '#2563eb' }} />;
}

/* ── Camera QR Scanner ────────────────────────────────────────────────────── */
function CameraScanner({ onScan, onClose }: { onScan: (text: string) => void; onClose: () => void }) {
  const videoRef      = useRef<HTMLVideoElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const rafRef        = useRef<number>(0);
  const hasScannedRef = useRef<boolean>(false);
  const [error, setError] = useState('');

  const stopStream = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    if (hasScannedRef.current) return;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    import('jsqr').then(({ default: jsQR }) => {
      if (hasScannedRef.current) return;
      const code = jsQR(img.data, img.width, img.height);
      if (code?.data) {
        hasScannedRef.current = true;
        stopStream();
        onScan(code.data);
        return;
      }
      if (!hasScannedRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }).catch(() => {
      if (!hasScannedRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      }
    });
  }, [onScan, stopStream]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          rafRef.current = requestAnimationFrame(tick);
        }
      })
      .catch(() => setError('Camera access denied. Allow camera permission and try again.'));

    return () => {
      stopStream();
    };
  }, [tick, stopStream]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-700 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700">
          <span className="text-sm font-bold text-white flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-400" />
            Scan QR Code
          </span>
          <button onClick={() => { stopStream(); onClose(); }} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="relative bg-black">
          {error ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 px-6 text-center">
              <CameraOff className="w-10 h-10 text-zinc-500" />
              <p className="text-sm text-zinc-400">{error}</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} className="w-full object-cover" muted playsInline style={{ height: 280 }} />
              <canvas ref={canvasRef} className="hidden" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-48 h-48">
                  <div className="absolute inset-0 border-2 border-blue-400 rounded-xl opacity-60" />
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
                </div>
              </div>
            </>
          )}
        </div>
        <p className="text-center text-xs text-zinc-400 py-3">Point at the receiver's QR code</p>
      </div>
    </div>
  );
}

/* ── Device blip on radar ─────────────────────────────────────────────────── */
function RadarBlip({ device, angle, radius, onClick, disabled }: {
  device: DiscoveredDevice;
  angle: number;
  radius: number;
  onClick: () => void;
  disabled?: boolean;
}) {
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const labelBelow = y >= 0;

  return (
    <div
      className="absolute z-30 pointer-events-auto"
      style={{
        left: '50%',
        top: '50%',
        transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))`,
      }}
    >
      {/* Name tag */}
      <div
        className="absolute left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap z-30"
        style={{ [labelBelow ? 'top' : 'bottom']: '115%' }}
      >
        <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-100 bg-white dark:bg-zinc-800 px-2.5 py-1 rounded-full shadow-md border border-zinc-200 dark:border-zinc-700">
          {device.name}
        </span>
      </div>

      {/* Interactive blip button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        disabled={disabled}
        className="relative z-30 flex items-center justify-center w-13 h-13 rounded-full bg-white dark:bg-zinc-800 border-2 border-blue-500 shadow-xl shadow-blue-500/30 hover:scale-115 hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        title={`Connect to ${device.name}`}
      >
        <DeviceIcon type={device.deviceType} size={24} />
      </button>

      {/* Pulse effect */}
      <span className="absolute inset-0 rounded-full border-2 border-blue-400/60 animate-ping pointer-events-none" style={{ animationDuration: '1.6s' }} />
    </div>
  );
}

/* ── Main RadarScan ───────────────────────────────────────────────────────── */
export function RadarScan({
  connectionStatus, nearbyDevices, myCode, onBack, onConnect, onConnectByCode,
}: RadarScanProps) {
  const [showManual, setShowManual] = useState(false);
  const [showMyCode, setShowMyCode] = useState(false);
  const [codeInput, setCod] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const scanLockRef = useRef(false);
  const isConnecting = connectionStatus === 'connecting';

  useEffect(() => {
    if (connectionStatus === 'idle' || connectionStatus === 'disconnected') {
      scanLockRef.current = false;
    }
  }, [connectionStatus]);

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (codeInput.trim()) { onConnectByCode(codeInput.trim()); setCod(''); }
  };

  const handleQrScan = (text: string) => {
    if (scanLockRef.current || isConnecting) return;
    scanLockRef.current = true;
    setShowCamera(false);
    try {
      const url = new URL(text);
      const id  = url.searchParams.get('connect');
      if (id) { onConnect(id); return; }
    } catch {}
    onConnectByCode(text.trim());
  };

  // Position devices around radius = 100px (radar is 300px wide)
  const RADAR_R = 150;
  const BLIP_R  = RADAR_R * 0.65;

  const deviceBlips = nearbyDevices.map((device, i) => {
    const angle = (i / Math.max(nearbyDevices.length, 1)) * 2 * Math.PI - Math.PI / 2;
    return { device, angle };
  });

  return (
    <>
      {showCamera && <CameraScanner onScan={handleQrScan} onClose={() => setShowCamera(false)} />}

      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10 animate-fade-up">
        {/* Nav row */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
            Sender Mode
          </span>
        </div>

        {/* Radar container */}
        <div className="flex flex-col items-center">
          <div className="relative flex items-center justify-center mb-6" style={{ width: 300, height: 300 }}>
            {/* Static background rings (pointer events disabled) */}
            {[300, 200, 100].map(d => (
              <div
                key={d}
                className="absolute rounded-full border border-blue-300/40 dark:border-blue-500/20 pointer-events-none"
                style={{ width: d, height: d }}
              />
            ))}

            {/* Rotating sweep cone (pointer events disabled) */}
            <div
              className="absolute rounded-full radar-cone animate-radar-sweep pointer-events-none"
              style={{ width: 300, height: 300, transformOrigin: 'center' }}
            />

            {/* Center icon (This Device) */}
            <div className="relative z-10 w-16 h-16 rounded-full bg-white dark:bg-zinc-900 border-2 border-blue-500 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              {isConnecting ? (
                <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
              ) : (
                <Laptop className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              )}
            </div>

            {/* Device blips on the radar (z-30 pointer-events-auto) */}
            {deviceBlips.map(({ device, angle }) => (
              <RadarBlip
                key={device.id}
                device={device}
                angle={angle}
                radius={BLIP_R}
                disabled={isConnecting}
                onClick={() => onConnect(device.id, device.name)}
              />
            ))}
          </div>

          {/* Status text */}
          <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 text-center mb-1">
            {isConnecting
              ? 'Connecting to device…'
              : nearbyDevices.length > 0
                ? `${nearbyDevices.length} device${nearbyDevices.length > 1 ? 's' : ''} ready on radar`
                : 'Searching for nearby devices…'
            }
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center mb-8">
            {isConnecting
              ? 'Establishing secure WebRTC connection'
              : 'Click any device blip on the radar or from the list below'
            }
          </p>

          {/* Nearby Devices Cards List (Secondary quick-click) */}
          {nearbyDevices.length > 0 && (
            <div className="w-full max-w-md space-y-3 mb-8">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 text-center mb-2">
                Available Nearby Devices
              </p>
              {nearbyDevices.map(device => (
                <div
                  key={device.id}
                  onClick={() => !isConnecting && onConnect(device.id, device.name)}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <DeviceIcon type={device.deviceType} size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {device.name}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        {device.os || 'Device'} · {device.browser || 'Browser'}
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={isConnecting}
                    className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white shadow-sm transition shrink-0 disabled:opacity-50"
                  >
                    {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                    Connect
                    {!isConnecting && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Manual connect / QR scan row */}
          <div className="w-full max-w-md border-t border-zinc-100 dark:border-zinc-800 pt-5">
          <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
            <button
              onClick={() => setShowManual(v => { setShowMyCode(false); return !v; })}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors px-2 py-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Enter code
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showManual ? 'rotate-90' : ''}`} />
            </button>

            <button
              onClick={() => { setShowManual(false); setShowMyCode(v => !v); }}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors px-2 py-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              Show my code
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showMyCode ? 'rotate-90' : ''}`} />
            </button>

            <button
              onClick={() => setShowCamera(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition shadow-sm"
            >
              <QrCode className="w-3.5 h-3.5" />
              Scan QR
            </button>
          </div>

          {showMyCode && (
            <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl animate-fade-up border border-zinc-100 dark:border-zinc-800 mb-2">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Your Pairing Code</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-black tracking-[0.2em] font-mono text-zinc-900 dark:text-white">
                  {myCode ? `${myCode.slice(0, 3)} ${myCode.slice(3)}` : '— — —'}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(myCode);
                    import('react-hot-toast').then(({ default: toast }) => toast.success('Code copied!'));
                  }}
                  className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-500 dark:text-zinc-300 transition-colors"
                  title="Copy code"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {showManual && (
              <form onSubmit={handleCodeSubmit} className="flex gap-2 animate-fade-up">
                <input
                  type="text"
                  value={codeInput}
                  onChange={e => setCod(e.target.value)}
                  placeholder="6-digit pairing code…"
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-sm"
                />
                <button
                  type="submit"
                  disabled={isConnecting || !codeInput.trim()}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
                >
                  Connect
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
