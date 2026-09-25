import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRightLeft, Settings, Sun, Moon, X, Laptop,
  Menu, Send, Download, Info, Mail,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SettingsModal } from './SettingsModal';
import { Tooltip } from 'antd';

interface NavbarProps {
  deviceName: string;
  connectionStatus: 'idle' | 'initializing' | 'connecting' | 'connected' | 'disconnected';
  connectedPeerName: string;
  autoDownload: boolean;
  onDisconnect: () => void;
  onHomeClick: () => void;
  onUpdateDeviceName: (name: string) => void;
  onToggleAutoDownload: (v: boolean) => void;
}

const NAV_LINKS = [
  { icon: <Send className="w-3.5 h-3.5" />, label: 'Send', id: 'send' },
  { icon: <Download className="w-3.5 h-3.5" />, label: 'Receive', id: 'receive' },
  { icon: <Info className="w-3.5 h-3.5" />, label: 'How It Works', id: 'how' },
  { icon: <Mail className="w-3.5 h-3.5" />, label: 'Contact', id: 'contact' },
];

export function Navbar({
  deviceName,
  connectionStatus,
  connectedPeerName,
  autoDownload,
  onDisconnect,
  onHomeClick,
  onUpdateDeviceName,
  onToggleAutoDownload,
}: NavbarProps) {
  const { isDark, toggleTheme } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isConnected = connectionStatus === 'connected';

  // Detect scroll for floating effect intensity
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* ── Floating pill navbar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 w-full flex justify-center px-4 py-3 pointer-events-none">
        <header
          className={`
            pointer-events-auto w-full max-w-5xl
            rounded-2xl border
            transition-all duration-300
            ${scrolled
              ? 'bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-blue-400/20 dark:border-blue-500/20 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/15'
              : 'bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl border-zinc-200/60 dark:border-zinc-800/60 shadow-sm'
            }
          `}
          style={{
            boxShadow: scrolled
              ? '0 4px 32px -4px rgba(99,102,241,0.15), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.08)'
              : undefined,
          }}
        >
          <div className="px-4 sm:px-5 h-14 flex items-center justify-between gap-3">

            {/* Brand */}
            <button
              onClick={onHomeClick}
              className="flex items-center gap-2.5 group focus:outline-none shrink-0"
            >
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 group-hover:scale-105 group-hover:shadow-blue-500/60 transition-all duration-300">
                <ArrowRightLeft className="w-4.5 h-4.5 group-hover:rotate-180 transition-transform duration-500" style={{ width: 18, height: 18 }} />
                {/* glow ring */}
                <span className="absolute inset-0 rounded-xl ring-2 ring-blue-400/30 dark:ring-blue-400/20 animate-pulse" style={{ animationDuration: '3s' }} />
              </div>
              <span className="text-[17px] font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
                FileSync
              </span>
            </button>

            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
              {NAV_LINKS.map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 transition-all"
                >
                  {link.icon}
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Right cluster */}
            <div className="flex items-center gap-1.5 shrink-0">

              {/* Device name / Connected pill */}
              {isConnected ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="hidden sm:inline max-w-[100px] truncate">{connectedPeerName || 'Device'}</span>
                  <button
                    onClick={onDisconnect}
                    className="p-0.5 rounded-full hover:bg-emerald-500/20 transition-colors"
                    title="Disconnect"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                  <Laptop className="w-3 h-3 shrink-0" />
                  <span className="max-w-[100px] truncate">{deviceName}</span>
                </div>
              )}

              <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block mx-0.5" />

              {/* Theme toggle */}
              <Tooltip title={isDark ? 'Light mode' : 'Dark mode'}>
                <button
                  onClick={toggleTheme}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-90"
                >
                  {isDark
                    ? <Sun className="w-4 h-4 text-amber-400" />
                    : <Moon className="w-4 h-4" />
                  }
                </button>
              </Tooltip>

              {/* Settings */}
              <Tooltip title="Settings">
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-90"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </Tooltip>

              {/* Hamburger (mobile) */}
              <button
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-90"
                onClick={() => setMenuOpen(v => !v)}
                aria-label="Menu"
              >
                {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Mobile slide-down drawer */}
          <div
            ref={menuRef}
            className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${menuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
          >
            <div className="px-4 pb-3 pt-1 border-t border-zinc-100 dark:border-zinc-800/60 space-y-1">
              {/* Device name on mobile */}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 mb-1.5">
                <Laptop className="w-4 h-4 text-zinc-400" />
                <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate">{deviceName}</span>
              </div>
              {NAV_LINKS.map(link => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-all text-left"
                >
                  <span className="text-zinc-400">{link.icon}</span>
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        </header>
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        deviceName={deviceName}
        autoDownload={autoDownload}
        onUpdateDeviceName={onUpdateDeviceName}
        onToggleAutoDownload={onToggleAutoDownload}
      />
    </>
  );
}
