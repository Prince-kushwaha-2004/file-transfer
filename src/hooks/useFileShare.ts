import { useState, useRef, useEffect, useCallback } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import {
  registerDeviceServerFn,
  getNearbyDevicesServerFn,
  getDeviceByCodeServerFn,
  unregisterDeviceServerFn,
  type DiscoveredDevice,
  type DeviceRole,
} from '../utils/discoveryServer';
import {
  getDefaultDeviceName, getDeviceType, getOperatingSystem,
  getBrowserName, saveDeviceName,
} from '../utils/device';

export type TransferStatus = 'queued' | 'sending' | 'receiving' | 'completed' | 'cancelled' | 'error';

export interface TransferItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  direction: 'upload' | 'download';
  status: TransferStatus;
  progress: number;
  bytesTransferred: number;
  speed: number;
  eta: number;
  url?: string;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

const CHUNK_SIZE = 64 * 1024;
const MAX_BUFFERED_AMOUNT = 512 * 1024;

export function useFileShare() {
  const [myId, setMyId]                           = useState('');
  const [myCode, setMyCode]                       = useState('');
  const [deviceName, setDeviceNameState]          = useState('');
  const [currentRoom]                             = useState('default');
  const [role, setRole]                           = useState<DeviceRole>('idle');
  const [connectionStatus, setConnectionStatus]   = useState<
    'idle' | 'initializing' | 'connecting' | 'connected' | 'disconnected'
  >('initializing');
  const [connectedPeerId, setConnectedPeerId]     = useState('');
  const [connectedPeerName, setConnectedPeerName] = useState('');
  const [nearbyDevices, setNearbyDevices]         = useState<DiscoveredDevice[]>([]);
  const [activeTransfers, setActiveTransfers]     = useState<TransferItem[]>([]);
  const [transferHistory, setTransferHistory]     = useState<TransferItem[]>([]);
  const [autoDownload, setAutoDownload]           = useState(false);

  // ── Refs (never stale in callbacks) ──────────────────────────────────────
  const roleRef              = useRef<DeviceRole>('idle');
  const peerRef              = useRef<Peer | null>(null);
  const connectionRef        = useRef<DataConnection | null>(null);
  const connectingTargetRef  = useRef<string | null>(null);
  const connectionTimeoutRef = useRef<any>(null);
  const broadcastChannelRef  = useRef<BroadcastChannel | null>(null);
  const deviceNameRef        = useRef('');
  const autoDownloadRef      = useRef(true);
  const activeTransfersRef   = useRef<Record<string, { cancelled: boolean }>>({});
  const receivingFilesRef    = useRef<Record<string, {
    meta: { id: string; name: string; size: number; mimeType: string };
    chunks: BlobPart[];
    receivedBytes: number;
    lastUpdate: number;
    lastBytes: number;
  }>>({});

  // Keep refs in sync
  useEffect(() => { roleRef.current = role; }, [role]);
  useEffect(() => { deviceNameRef.current = deviceName; }, [deviceName]);
  useEffect(() => { autoDownloadRef.current = autoDownload; }, [autoDownload]);

  // ── Init: 6-digit code + device name ──────────────────────────────────────
  useEffect(() => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setMyCode(code);
    const name = getDefaultDeviceName();
    setDeviceNameState(name);
    deviceNameRef.current = name;
  }, []);

  // ── Confetti ──────────────────────────────────────────────────────────────
  const triggerConfetti = useCallback(() => {
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#2563eb', '#10b981', '#6366f1'] });
    } catch {}
  }, []);

  // ── Update device name ────────────────────────────────────────────────────
  const updateDeviceName = useCallback((name: string) => {
    const trimmed = name.trim() || 'My Device';
    setDeviceNameState(trimmed);
    deviceNameRef.current = trimmed;
    saveDeviceName(trimmed);
  }, []);

  // ── Handle incoming data ───────────────────────────────────────────────────
  const handleIncomingData = useCallback((data: any) => {
    if (!data || typeof data !== 'object') return;

    // Handshake
    if (data.type === 'peer_handshake') {
      if (data.name) {
        setConnectedPeerName(data.name);
        toast.success(`Paired with ${data.name}!`, { id: 'peer-connect' });
      }
      return;
    }

    // Cancel
    if (data.type === 'file_cancel') {
      const { id } = data;
      if (id) {
        delete receivingFilesRef.current[id];
        setActiveTransfers(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' as TransferStatus } : t));
        toast.error('Transfer cancelled by sender');
      }
      return;
    }

    // File meta
    if (data.type === 'file_meta') {
      const { id, name, size, mimeType } = data;
      receivingFilesRef.current[id] = {
        meta: { id, name, size, mimeType },
        chunks: [],
        receivedBytes: 0,
        lastUpdate: Date.now(),
        lastBytes: 0,
      };
      setActiveTransfers(prev => [
        { id, name, size, mimeType: mimeType || 'application/octet-stream', direction: 'download', status: 'receiving', progress: 0, bytesTransferred: 0, speed: 0, eta: 0, startedAt: Date.now() },
        ...prev.filter(t => t.id !== id),
      ]);
      toast(`Receiving "${name}"…`, { icon: '📥' });
      return;
    }

    // Chunk
    if (data.type === 'file_chunk') {
      const { id, index, data: chunk } = data;
      const entry = receivingFilesRef.current[id];
      if (!entry) return;

      entry.chunks[index] = chunk;
      entry.receivedBytes += chunk.byteLength || 0;

      const now = Date.now();
      const elapsed = (now - entry.lastUpdate) / 1000;
      if (elapsed >= 0.25 || entry.receivedBytes >= entry.meta.size) {
        const speed = elapsed > 0 ? (entry.receivedBytes - entry.lastBytes) / elapsed : 0;
        const eta = speed > 0 ? Math.max(0, entry.meta.size - entry.receivedBytes) / speed : 0;
        entry.lastUpdate = now;
        entry.lastBytes = entry.receivedBytes;
        const progress = Math.min(100, Math.round(entry.receivedBytes / entry.meta.size * 100));
        setActiveTransfers(prev => prev.map(t => t.id === id ? { ...t, progress, bytesTransferred: entry.receivedBytes, speed, eta } : t));
      }
      return;
    }

    // Complete
    if (data.type === 'file_complete') {
      const { id } = data;
      const entry = receivingFilesRef.current[id];
      if (!entry) return;

      const blob = new Blob(entry.chunks, { type: entry.meta.mimeType });
      const url  = URL.createObjectURL(blob);
      const now  = Date.now();

      if (autoDownloadRef.current) {
        const a = document.createElement('a');
        a.href = url; a.download = entry.meta.name;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
      }

      triggerConfetti();
      toast.success(`"${entry.meta.name}" received!`, { icon: '🎉' });

      const done: TransferItem = {
        id, name: entry.meta.name, size: entry.meta.size, mimeType: entry.meta.mimeType,
        direction: 'download', status: 'completed', progress: 100,
        bytesTransferred: entry.meta.size, speed: 0, eta: 0, url,
        startedAt: now - 1000, completedAt: now,
      };

      setActiveTransfers(prev => prev.filter(t => t.id !== id));
      setTransferHistory(prev => [done, ...prev]);
      delete receivingFilesRef.current[id];
    }
  }, [triggerConfetti]);

  // ── Setup a DataConnection ─────────────────────────────────────────────────
  const setupConnection = useCallback((conn: DataConnection) => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }

    if (connectionRef.current && connectionRef.current !== conn) {
      try { connectionRef.current.close(); } catch {}
    }
    connectionRef.current = conn;
    setConnectionStatus('connecting');

    const onOpen = () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      if (connectionRef.current !== conn) return;
      connectingTargetRef.current = null;
      setConnectedPeerId(conn.peer);
      setConnectionStatus('connected');
      // Send our name to the other side
      try {
        conn.send({ type: 'peer_handshake', name: deviceNameRef.current || getDefaultDeviceName() });
      } catch {}
      toast.success('Connection established!', { id: 'peer-connect' });
    };

    conn.on('open', onOpen);
    // Guard: if already open (rare but can happen on re-connection)
    if ((conn as any).open === true) onOpen();
    else {
      connectionTimeoutRef.current = setTimeout(() => {
        if (connectionRef.current === conn && connectionStatus !== 'connected') {
          toast.error('Connection timed out. Please try again.', { id: 'peer-error' });
          try { conn.close(); } catch {}
          setConnectionStatus('idle');
          connectingTargetRef.current = null;
          connectionRef.current = null;
        }
      }, 10000);
    }

    conn.on('data', handleIncomingData);

    conn.on('close', () => {
      if (connectionRef.current !== conn) return;
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      setConnectedPeerId('');
      setConnectedPeerName('');
      setConnectionStatus('idle');
      connectingTargetRef.current = null;
      connectionRef.current = null;
      toast('Session ended', { icon: '🔌', id: 'peer-disconnect' });
    });

    conn.on('error', err => {
      if (connectionRef.current !== conn) return;
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      console.error('DataConnection error:', err);
      setConnectionStatus('idle');
      connectingTargetRef.current = null;
      toast.error('Connection error. Please try again.', { id: 'peer-error' });
    });
  }, [handleIncomingData, connectionStatus]);

  // ── PeerJS init ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const peer = new Peer({
      debug: 0,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
      },
    });

    peerRef.current = peer;

    peer.on('open', id => {
      setMyId(id);
      setConnectionStatus('idle');

      // Auto-connect from URL ?connect=<peerId>
      const params = new URLSearchParams(window.location.search);
      const targetPeer = params.get('connect');
      if (targetPeer && targetPeer !== id) {
        try {
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('connect');
          window.history.replaceState({}, document.title, newUrl.pathname + (newUrl.search ? newUrl.search : ''));
        } catch {}

        setRole('sender');
        setTimeout(() => {
          connectToPeer(targetPeer);
        }, 500);
      }
    });

    peer.on('connection', conn => setupConnection(conn));

    peer.on('error', err => {
      console.warn('PeerJS error:', (err as any).type, err);
      if ((err as any).type === 'peer-unavailable') {
        toast.error('Device not found. Make sure the receiver is waiting.', { id: 'peer-error' });
        setConnectionStatus('idle');
      } else if ((err as any).type === 'network' || (err as any).type === 'server-error') {
        toast.error('Network error. Check your connection.', { id: 'peer-error' });
        setConnectionStatus('idle');
      }
    });

    // BroadcastChannel (same-machine / same-tab multi-window discovery)
    try {
      const bc = new BroadcastChannel('filesync_mesh_v2');
      broadcastChannelRef.current = bc;
      bc.onmessage = e => {
        const msg = e.data;
        if (!msg || !msg.id) return;
        if (msg.type === 'announce') {
          if (roleRef.current === 'sender' && msg.role !== 'receiver') return;
          if (roleRef.current === 'receiver' && msg.role !== 'sender') return;
          
          setNearbyDevices(prev => {
            const filtered = prev.filter(d => d.id !== msg.id);
            return [...filtered, { id: msg.id, code: msg.code, name: msg.name, deviceType: msg.deviceType, role: msg.role, room: msg.room, os: msg.os, browser: msg.browser, lastSeen: Date.now() }];
          });
        }
      };
    } catch {}

    return () => {
      broadcastChannelRef.current?.close();
      peer.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Heartbeat + server discovery (every 3s) ───────────────────────────────
  useEffect(() => {
    if (!myId) return;
    let alive = true;

    const sync = async () => {
      try {
        const name = deviceNameRef.current || getDefaultDeviceName();
        if (role !== 'idle') {
          await registerDeviceServerFn({ data: { id: myId, code: myCode, name, deviceType: getDeviceType(), role, room: currentRoom, os: getOperatingSystem(), browser: getBrowserName() } });
          broadcastChannelRef.current?.postMessage({ type: 'announce', id: myId, code: myCode, name, deviceType: getDeviceType(), role, room: currentRoom, os: getOperatingSystem(), browser: getBrowserName() });
        } else {
          await unregisterDeviceServerFn({ data: { id: myId } });
        }
        const targetRole = role === 'sender' ? 'receiver' : (role === 'receiver' ? 'sender' : undefined);
        const res = await getNearbyDevicesServerFn({ data: { room: currentRoom, excludeId: myId, roleFilter: targetRole } });
        if (alive && res?.devices) setNearbyDevices(res.devices);
      } catch {}
    };

    sync();
    const iv = setInterval(sync, 3000);
    const onUnload = () => { try { unregisterDeviceServerFn({ data: { id: myId } }); } catch {} };
    window.addEventListener('beforeunload', onUnload);

    return () => { 
      alive = false; 
      clearInterval(iv); 
      window.removeEventListener('beforeunload', onUnload);
      try { unregisterDeviceServerFn({ data: { id: myId } }); } catch {}
    };
  }, [myId, myCode, role, currentRoom]);

  // ── Connect by Peer ID ────────────────────────────────────────────────────
  const connectToPeer = useCallback((targetId: string, nameHint?: string) => {
    if (!peerRef.current) { toast.error('Still initializing…', { id: 'peer-error' }); return; }
    if (targetId === myId) { toast.error('Cannot connect to yourself.', { id: 'peer-error' }); return; }
    if (connectionRef.current?.open && connectedPeerId === targetId) { toast('Already connected.', { id: 'peer-status' }); return; }
    if (connectingTargetRef.current === targetId && connectionStatus === 'connecting') return;

    connectingTargetRef.current = targetId;
    setConnectionStatus('connecting');
    if (nameHint) setConnectedPeerName(nameHint);

    try {
      const conn = peerRef.current.connect(targetId);
      setupConnection(conn);
    } catch {
      connectingTargetRef.current = null;
      setConnectionStatus('idle');
      toast.error('Failed to initiate connection.', { id: 'peer-error' });
    }
  }, [myId, connectedPeerId, connectionStatus, setupConnection]);

  // ── Connect by 6-digit code ───────────────────────────────────────────────
  const connectByCode = useCallback(async (code: string) => {
    const clean = code.replace(/\s+/g, '').trim();
    if (!clean) { toast.error('Please enter a code', { id: 'peer-error' }); return; }

    // Check local devices first
    const local = nearbyDevices.find(d => d.code?.replace(/\s+/g, '') === clean);
    if (local) { connectToPeer(local.id, local.name); return; }

    setConnectionStatus('connecting');
    try {
      const res = await getDeviceByCodeServerFn({ data: { code: clean } });
      if (res?.found && res.device) {
        connectToPeer(res.device.id, res.device.name);
      } else {
        setConnectionStatus('idle');
        toast.error('No device found with that code.', { id: 'peer-error' });
      }
    } catch {
      setConnectionStatus('idle');
      toast.error('Could not verify code.', { id: 'peer-error' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nearbyDevices, connectToPeer]);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    connectingTargetRef.current = null;
    try { connectionRef.current?.close(); } catch {}
    connectionRef.current = null;
    setConnectedPeerId('');
    setConnectedPeerName('');
    setConnectionStatus('idle');
    toast('Disconnected', { id: 'peer-disconnect' });
  }, []);

  // ── Send a file (streaming chunks) ───────────────────────────────────────
  const sendSingleFile = useCallback(async (file: File) => {
    const conn = connectionRef.current;
    if (!conn?.open) { toast.error('No active connection.'); return; }

    const fileId   = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const mimeType = file.type || 'application/octet-stream';
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    activeTransfersRef.current[fileId] = { cancelled: false };
    setActiveTransfers(prev => [
      { id: fileId, name: file.name, size: file.size, mimeType, direction: 'upload', status: 'sending', progress: 0, bytesTransferred: 0, speed: 0, eta: 0, startedAt: Date.now() },
      ...prev,
    ]);

    conn.send({ type: 'file_meta', id: fileId, name: file.name, size: file.size, mimeType, totalChunks });

    const dc = (conn as any).dataChannel as RTCDataChannel | undefined;
    let offset = 0, chunkIdx = 0, lastTime = Date.now(), lastBytes = 0;

    const waitDrain = () => new Promise<void>(resolve => {
      if (!dc || dc.bufferedAmount <= MAX_BUFFERED_AMOUNT) { resolve(); return; }
      dc.bufferedAmountLowThreshold = 128 * 1024;
      const h = () => { dc.removeEventListener('bufferedamountlow', h); resolve(); };
      dc.addEventListener('bufferedamountlow', h);
      setTimeout(() => { dc?.removeEventListener('bufferedamountlow', h); resolve(); }, 50);
    });

    try {
      while (offset < file.size) {
        if (activeTransfersRef.current[fileId]?.cancelled) {
          conn.send({ type: 'file_cancel', id: fileId });
          return;
        }
        if (dc && dc.bufferedAmount > MAX_BUFFERED_AMOUNT) await waitDrain();

        const end = Math.min(offset + CHUNK_SIZE, file.size);
        const buf = await file.slice(offset, end).arrayBuffer();
        conn.send({ type: 'file_chunk', id: fileId, index: chunkIdx, data: buf });
        offset = end; chunkIdx++;

        const now = Date.now();
        const elapsed = (now - lastTime) / 1000;
        if (elapsed >= 0.25 || offset >= file.size) {
          const speed = elapsed > 0 ? (offset - lastBytes) / elapsed : 0;
          const eta = speed > 0 ? (file.size - offset) / speed : 0;
          const progress = Math.min(100, Math.round(offset / file.size * 100));
          lastTime = now; lastBytes = offset;
          setActiveTransfers(prev => prev.map(t => t.id === fileId ? { ...t, progress, bytesTransferred: offset, speed, eta } : t));
        }
      }

      conn.send({ type: 'file_complete', id: fileId });
      triggerConfetti();
      toast.success(`"${file.name}" sent!`, { icon: '🚀' });

      const done: TransferItem = {
        id: fileId, name: file.name, size: file.size, mimeType, direction: 'upload',
        status: 'completed', progress: 100, bytesTransferred: file.size,
        speed: 0, eta: 0, startedAt: Date.now() - 1000, completedAt: Date.now(),
      };
      setActiveTransfers(prev => prev.filter(t => t.id !== fileId));
      setTransferHistory(prev => [done, ...prev]);
      delete activeTransfersRef.current[fileId];
    } catch (err: any) {
      setActiveTransfers(prev => prev.map(t => t.id === fileId ? { ...t, status: 'error', error: err?.message } : t));
      toast.error(`Failed to send "${file.name}"`);
    }
  }, [triggerConfetti]);

  const sendFiles = useCallback(async (files: File[]) => {
    for (const f of files) await sendSingleFile(f);
  }, [sendSingleFile]);

  const cancelTransfer = useCallback((id: string) => {
    if (activeTransfersRef.current[id]) activeTransfersRef.current[id].cancelled = true;
    connectionRef.current?.send({ type: 'file_cancel', id });
    setActiveTransfers(prev => prev.map(t => t.id === id ? { ...t, status: 'cancelled' as TransferStatus } : t));
    toast('Transfer cancelled');
  }, []);

  const clearHistory = useCallback(() => setTransferHistory([]), []);

  return {
    myId, myCode, deviceName, role, connectionStatus,
    connectedPeerId, connectedPeerName,
    nearbyDevices, activeTransfers, transferHistory, autoDownload,
    setRole, updateDeviceName,
    connectToPeer, connectByCode, disconnect,
    sendFiles, sendSingleFile, cancelTransfer, clearHistory, setAutoDownload,
  };
}
