import React, { useState } from 'react';
import {
  Send, Download, Shield, Zap, Globe, ArrowRight, CheckCircle,
  Mail, User, MessageSquare, Loader2, Code2, AtSign, Camera,
  Lock, FileText, Smartphone,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface LandingPageProps {
  onSend: () => void;
  onReceive: () => void;
}

/* ── Inline SVG product illustration ─────────────────────────────────────── */
function ProductIllustration() {
  return (
    <div className="relative w-full max-w-xl mx-auto h-64 sm:h-72 select-none my-6" aria-hidden>
      <svg viewBox="0 0 500 200" className="w-full h-full" fill="none">
        {/* Left device — laptop */}
        <rect x="30" y="50" width="140" height="90" rx="10" className="fill-zinc-100 dark:fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1.5" />
        <rect x="42" y="62" width="116" height="66" rx="5" className="fill-white dark:fill-zinc-900" />
        <rect x="54" y="74" width="60" height="6" rx="3" className="fill-zinc-200 dark:fill-zinc-700" />
        <rect x="54" y="86" width="40" height="6" rx="3" className="fill-zinc-200 dark:fill-zinc-700" />
        <rect x="54" y="98" width="50" height="6" rx="3" className="fill-blue-200 dark:fill-blue-900/60" />
        <rect x="20" y="140" width="160" height="8" rx="4" className="fill-zinc-200 dark:fill-zinc-700" />
        <rect x="80" y="139" width="40" height="2" rx="1" className="fill-zinc-300 dark:fill-zinc-600" />

        {/* Right device — phone */}
        <rect x="330" y="30" width="80" height="140" rx="14" className="fill-zinc-100 dark:fill-zinc-800 stroke-zinc-300 dark:stroke-zinc-700" strokeWidth="1.5" />
        <rect x="340" y="46" width="60" height="108" rx="6" className="fill-white dark:fill-zinc-900" />
        <rect x="350" y="58" width="40" height="6" rx="3" className="fill-zinc-200 dark:fill-zinc-700" />
        <rect x="350" y="70" width="30" height="6" rx="3" className="fill-zinc-200 dark:fill-zinc-700" />
        <rect x="350" y="100" width="40" height="18" rx="6" className="fill-emerald-200 dark:fill-emerald-900/60" />
        <circle cx="370" cy="82" r="12" className="fill-zinc-100 dark:fill-zinc-700" />
        <rect x="354" y="158" width="32" height="3" rx="1.5" className="fill-zinc-300 dark:fill-zinc-600" />

        {/* Transfer path */}
        <path d="M 175 95 C 230 60, 280 60, 328 95" className="stroke-blue-500 dark:stroke-blue-400" strokeWidth="2.5" strokeDasharray="6 4" strokeLinecap="round" />
        <g className="fill-blue-600 dark:fill-blue-400">
          <circle cx="220" cy="78" r="4.5" opacity="0.9" />
          <circle cx="250" cy="68" r="4.5" opacity="0.7" />
          <circle cx="280" cy="72" r="4.5" opacity="0.9" />
        </g>
        <path d="M322 92 L333 97 L320 102" className="fill-blue-600 dark:fill-blue-400" />

        {/* Lock badge */}
        <circle cx="252" cy="120" r="18" className="fill-white dark:fill-zinc-900 stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="1.5" />
        <path d="M246 121v-5a6 6 0 0 1 12 0v5" className="stroke-blue-600 dark:stroke-blue-400" strokeWidth="2" strokeLinecap="round" />
        <rect x="242" y="121" width="20" height="13" rx="3.5" className="fill-blue-600 dark:fill-blue-400" />
        <circle cx="252" cy="127.5" r="2" fill="white" />

        {/* Speed badge */}
        <rect x="180" y="140" width="80" height="24" rx="12" className="fill-white dark:fill-zinc-800 stroke-zinc-200 dark:stroke-zinc-700" strokeWidth="1" />
        <text x="220" y="156" textAnchor="middle" className="fill-zinc-700 dark:fill-zinc-300" style={{ fontSize: 10, fontFamily: 'sans-serif', fontWeight: 700 }}>Direct P2P</text>
      </svg>
    </div>
  );
}

const FEATURES = [
  {
    icon: <Zap className="w-5 h-5" />,
    color: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
    title: 'Instant Discovery',
    desc: 'Nearby devices appear automatically on the radar — no manual configuration or room setup needed.',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    color: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
    title: 'End-to-End Encrypted',
    desc: 'Transfers are encrypted with DTLS 1.2 WebRTC channels. Files stay between your devices.',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    color: 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400',
    title: 'Universal Access',
    desc: 'Works across iOS, Android, macOS, Windows, Linux, and ChromeOS right in the browser.',
  },
  {
    icon: <Lock className="w-5 h-5" />,
    color: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
    title: 'Zero Server Storage',
    desc: 'No file ever touches our servers. Pure browser-to-browser — 100% private by design.',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    color: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
    title: 'Any File Type',
    desc: 'Send photos, videos, documents, archives, code — any file type, any size, no restrictions.',
  },
  {
    icon: <Smartphone className="w-5 h-5" />,
    color: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400',
    title: 'Cross-Device',
    desc: 'Share between phone and laptop, Mac and Windows, or any two browsers seamlessly.',
  },
];

const STEPS = [
  { num: '01', text: 'Open FileSync on both devices' },
  { num: '02', text: 'Click Send on one, Receive on the other' },
  { num: '03', text: 'Devices appear on your radar automatically' },
  { num: '04', text: 'Click device & send files at high speed' },
];

/* ── Contact Form ──────────────────────────────────────────────────────────── */
function ContactSection() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSending(true);
    try {
      const payload = { ...formData, access_key: 'e87d74b1-e8ec-4dfb-a003-850b929cb834' };
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success) {
        toast.success('Message sent successfully!');
        setFormData({ name: '', email: '', message: '' });
      } else {
        toast.error('Unable to send message right now.');
      }
    } catch {
      toast.error('Something went wrong while sending.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contact" className="relative py-24 px-4 sm:px-6 overflow-hidden">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full bg-indigo-500/5 dark:bg-indigo-500/8 blur-3xl" />
      </div>
      <div className="relative max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-4">
            <Mail className="w-3.5 h-3.5" />
            Get in touch
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-3">Contact Us</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Have a question, feedback, or feature request? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start">
          {/* Left info */}
          <div className="md:col-span-2 space-y-4">
            {[
              { icon: <Zap className="w-5 h-5" />, color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400', title: 'Bug Reports', desc: 'Found a connection issue? Let us know.' },
              { icon: <Shield className="w-5 h-5" />, color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400', title: 'Security', desc: 'Privacy or security concerns.' },
              { icon: <Globe className="w-5 h-5" />, color: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400', title: 'Feature Ideas', desc: 'Suggest new features & improvements.' },
              { icon: <Mail className="w-5 h-5" />, color: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400', title: 'Feedback', desc: 'General feedback — good or bad!' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700 shadow-sm hover:shadow-md transition-all duration-200">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-zinc-800 dark:text-zinc-100">{item.title}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Right form */}
          <form
            onSubmit={handleSubmit}
            className="md:col-span-3 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-6 sm:p-8 space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5" htmlFor="contact-name">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5" htmlFor="contact-email">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5" htmlFor="contact-message">
                Message
              </label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
                <textarea
                  id="contact-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Tell us what's on your mind…"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                : <><Send className="w-4 h-4" /> Send Message</>
              }
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export function LandingPage({ onSend, onReceive }: LandingPageProps) {
  return (
    <div className="flex flex-col w-full">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section id="send" className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center py-12 px-4 sm:px-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="w-[700px] h-[700px] rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-3xl" />
        </div>

        <div className="relative w-full max-w-4xl mx-auto text-center my-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Browser-to-browser · Zero Cloud · Instant Transfer
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white leading-[1.1] mb-6">
            Send files to any device.{' '}
            <span className="gradient-text">Instantly.</span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-8">
            No accounts. No server storage. Files move directly peer-to-peer between your devices with end-to-end encryption.
          </p>

          <div id="receive" className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={onSend}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-base shadow-xl shadow-blue-500/25 transition-all"
            >
              <Send className="w-4 h-4" />
              Send Files
              <ArrowRight className="w-4 h-4 opacity-70" />
            </button>
            <button
              onClick={onReceive}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-[0.98] text-zinc-800 dark:text-zinc-100 font-bold text-base border border-zinc-200 dark:border-zinc-700 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              Receive Files
            </button>
          </div>

          {/* Trust badges — styled cards */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            {[
              { icon: <Shield className="w-4 h-4 text-emerald-500" />, label: 'No account needed', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/70 dark:border-emerald-800/50' },
              { icon: <Lock className="w-4 h-4 text-blue-500" />, label: 'End-to-end encrypted', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200/70 dark:border-blue-800/50' },
              { icon: <Zap className="w-4 h-4 text-violet-500" />, label: 'No file size limit', color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200/70 dark:border-violet-800/50' },
            ].map(b => (
              <span key={b.label} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-semibold shadow-sm ${b.color}`}>
                {b.icon}
                {b.label}
              </span>
            ))}
          </div>

          <ProductIllustration />
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 bg-zinc-50/60 dark:bg-zinc-900/40 border-t border-zinc-100 dark:border-zinc-800/60">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">Why FileSync</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
              Built for speed and privacy
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-5`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how" className="py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-2">Seamless experience</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
              How it works
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {STEPS.map(s => (
              <div key={s.num} className="flex items-start gap-4 p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                <span className="text-4xl font-black text-blue-500/25 dark:text-blue-400/20 font-mono leading-none mt-0.5 select-none">
                  {s.num}
                </span>
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 leading-snug pt-1">
                  {s.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <button
              onClick={onSend}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
            >
              Start Transfer Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Contact ───────────────────────────────────────────────────────── */}
      <ContactSection />

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-100 dark:border-zinc-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 dark:text-zinc-500">
          <span><strong className="text-zinc-600 dark:text-zinc-300">FileSync</strong> · Direct P2P file transfer</span>
          <span>No cloud · No limits · End-to-end encrypted</span>
        </div>
      </footer>
    </div>
  );
}
