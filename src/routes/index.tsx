import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useFileShare } from '../hooks/useFileShare';
import { Navbar }           from '../components/Navbar';
import { LandingPage }      from '../components/LandingPage';
import { RadarScan }        from '../components/RadarScan';
import { ReceiverWait }     from '../components/ReceiverWait';
import { SenderTransfer }   from '../components/SenderTransfer';
import { ReceiverTransfer } from '../components/ReceiverTransfer';

export const Route = createFileRoute('/')({
  component: Home,
});

type View = 'landing' | 'send' | 'receive';

function Home() {
  const {
    myId, myCode, deviceName, role,
    connectionStatus, connectedPeerId, connectedPeerName,
    nearbyDevices, activeTransfers, transferHistory, autoDownload,
    setRole, updateDeviceName,
    connectToPeer, connectByCode, disconnect,
    sendFiles, cancelTransfer, clearHistory, setAutoDownload,
  } = useFileShare();

  const [view, setView] = useState<View>('landing');
  const isConnected = connectionStatus === 'connected';

  // Auto-navigate to landing when disconnected (except on first load)
  useEffect(() => {
    if (connectionStatus === 'idle' || connectionStatus === 'disconnected') {
      // Only redirect if we were previously connected
    }
  }, [connectionStatus]);

  // Check URL for ?connect= query to auto-enter send flow
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('connect')) {
        setView('send');
        setRole('sender');
      }
    }
  }, []);

  const handleSend = () => {
    setRole('sender');
    setView('send');
  };

  const handleReceive = () => {
    setRole('receiver');
    setView('receive');
  };

  const handleBack = () => {
    setRole('idle');
    setView('landing');
  };

  const handleDisconnect = () => {
    disconnect();
    setView('landing');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const renderMain = () => {
    // If connected, show the right transfer view based on role
    if (isConnected) {
      if (role === 'receiver') {
        return (
          <ReceiverTransfer
            connectedPeerName={connectedPeerName}
            activeTransfers={activeTransfers}
            transferHistory={transferHistory}
            autoDownload={autoDownload}
            onDisconnect={handleDisconnect}
            onToggleAutoDownload={setAutoDownload}
            onClearHistory={clearHistory}
          />
        );
      }
      // Sender (default)
      return (
        <SenderTransfer
          connectedPeerName={connectedPeerName}
          activeTransfers={activeTransfers}
          onSendFiles={sendFiles}
          onCancelTransfer={cancelTransfer}
          onDisconnect={handleDisconnect}
        />
      );
    }

    // Not connected
    switch (view) {
      case 'send':
        return (
          <RadarScan
            myCode={myCode}
            connectionStatus={connectionStatus}
            nearbyDevices={nearbyDevices}
            onBack={handleBack}
            onConnect={connectToPeer}
            onConnectByCode={connectByCode}
          />
        );
      case 'receive':
        return (
          <ReceiverWait
            myId={myId}
            myCode={myCode}
            deviceName={deviceName}
            connectionStatus={connectionStatus}
            onBack={handleBack}
            onConnectByCode={connectByCode}
          />
        );
      default:
        return <LandingPage onSend={handleSend} onReceive={handleReceive} />;
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
      <Navbar
        deviceName={deviceName}
        connectionStatus={connectionStatus}
        connectedPeerName={connectedPeerName}
        autoDownload={autoDownload}
        onDisconnect={handleDisconnect}
        onHomeClick={handleBack}
        onUpdateDeviceName={updateDeviceName}
        onToggleAutoDownload={setAutoDownload}
      />

      <main className="flex-1 flex flex-col">
        {renderMain()}
      </main>
    </div>
  );
}