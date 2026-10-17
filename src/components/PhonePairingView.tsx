import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Smartphone, 
  Copy, 
  Check, 
  ExternalLink, 
  RefreshCw, 
  Wifi, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Radio, 
  Play, 
  Square,
  Lock,
  ArrowRight
} from 'lucide-react';

interface PhonePairingViewProps {
  sessionId: string;
  isPhoneConnected: boolean;
  webrtcState: RTCPeerConnectionState;
  signalingLogs: string[];
  onGenerateNewSession: () => void;
  onDisconnectPhone: () => void;
  onGoToLiveMonitor: () => void;
}

export const PhonePairingView: React.FC<PhonePairingViewProps> = ({
  sessionId,
  isPhoneConnected,
  webrtcState,
  signalingLogs,
  onGenerateNewSession,
  onDisconnectPhone,
  onGoToLiveMonitor,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [pairingUrl, setPairingUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/?role=camera&session=${sessionId}`;
      setPairingUrl(url);

      QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#0B132B',
          light: '#FFFFFF',
        },
      })
        .then((dataUri) => setQrCodeDataUrl(dataUri))
        .catch((err) => console.error('Failed to generate pairing QR:', err));
    }
  }, [sessionId]);

  const copyPairingUrl = () => {
    navigator.clipboard.writeText(pairingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openSimulatedPhoneTab = () => {
    window.open(pairingUrl, '_blank', 'width=420,height=780');
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-amber-400" />
            Connect Phone Camera (WebRTC P2P)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pair your Android or iOS smartphone to stream live site video directly to this laptop dashboard
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {isPhoneConnected && (
            <button
              onClick={onGoToLiveMonitor}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <span>View Live Stream</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onGenerateNewSession}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Session Key</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Pairing QR + Instructions & Live WebRTC State */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Code Card (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center text-center space-y-4">
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Mobile Pairing Portal
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                isPhoneConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}
            >
              <Radio className={`w-3 h-3 ${isPhoneConnected ? 'animate-pulse text-emerald-400' : ''}`} />
              {isPhoneConnected ? 'P2P Video Active' : 'Waiting for Scan'}
            </span>
          </div>

          {/* QR Code Container */}
          <div className="bg-white p-4 rounded-3xl shadow-xl relative group">
            {qrCodeDataUrl ? (
              <img
                src={qrCodeDataUrl}
                alt="Scan to pair mobile phone camera"
                className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-xl"
              />
            ) : (
              <div className="w-56 h-56 sm:w-64 sm:h-64 flex items-center justify-center text-slate-400 font-mono text-xs">
                Generating QR...
              </div>
            )}

            {isPhoneConnected && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center p-4 text-emerald-400">
                <CheckCircle2 className="w-12 h-12 mb-2" />
                <span className="text-sm font-bold text-white">Phone Connected!</span>
                <span className="text-xs text-slate-300 mt-1">Live camera video is streaming</span>
                <button
                  onClick={onGoToLiveMonitor}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  Open Live Monitor
                </button>
              </div>
            )}
          </div>

          {/* Session Token & Link */}
          <div className="w-full space-y-2 pt-2 text-left">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Session Pairing Code:</span>
              <span className="font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                {sessionId}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="text"
                readOnly
                value={pairingUrl}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 w-full select-all focus:outline-none"
              />
              <button
                onClick={copyPairingUrl}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                title="Copy Pairing URL"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Test On Same Device Button */}
          <div className="w-full pt-2">
            <button
              onClick={openSimulatedPhoneTab}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Test in Separate Window (Self-Pair)</span>
            </button>
          </div>
        </div>

        {/* Right Column: Connection Diagnostics & Instructions (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 3-Step Setup Instructions */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              How Phone-to-Laptop Connection Works
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center">
                  1
                </div>
                <h4 className="text-xs font-bold text-white">Scan QR Code</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Open your Android phone camera or Google Lens and scan the QR code to open the transmitter web page.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center">
                  2
                </div>
                <h4 className="text-xs font-bold text-white">Allow Camera</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  When Chrome prompts for camera permission, tap <b>Allow</b>. The phone automatically activates the rear camera.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center">
                  3
                </div>
                <h4 className="text-xs font-bold text-white">Live AI Analysis</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Video streams peer-to-peer over WebRTC to your laptop. The laptop runs AI object detection and logs violations.
                </p>
              </div>
            </div>
          </div>

          {/* WebRTC Diagnostics & Signaling Console */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">WebRTC P2P Diagnostics</h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                Peer State: <b className={isPhoneConnected ? 'text-emerald-400' : 'text-amber-400'}>{webrtcState}</b>
              </span>
            </div>

            {/* Diagnostic Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Signaling Server</span>
                <span className="text-emerald-400 font-bold">Online (ws/http)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">NAT Traversal</span>
                <span className="text-cyan-400 font-bold">Google STUN</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">P2P Encryption</span>
                <span className="text-amber-400 font-bold">DTLS / SRTP</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Video Codec</span>
                <span className="text-slate-200 font-bold">VP8 / H.264</span>
              </div>
            </div>

            {/* Live Signaling Event Terminal */}
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-slate-400">Signaling Event Log:</div>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-slate-300 space-y-1 max-h-32 overflow-y-auto">
                {signalingLogs.length === 0 ? (
                  <div className="text-slate-400">Waiting for phone to scan QR code...</div>
                ) : (
                  signalingLogs.map((log, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-slate-400">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {isPhoneConnected && (
              <div className="flex justify-end pt-1">
                <button
                  onClick={onDisconnectPhone}
                  className="px-3 py-1.5 rounded-xl bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Disconnect Phone
                </button>
              </div>
            )}
          </div>

          {/* Network & HTTPS College Presentation Explainer */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center space-x-2 font-bold text-white">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>College Viva Notes: Network Architecture</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              WebRTC (Web Real-Time Communication) provides direct UDP streaming without routing heavy video frames through a central media server. 
              The laptop and phone exchange SDP (Session Description Protocol) offers/answers through our lightweight signaling backend, then establish an encrypted peer-to-peer mesh. Because the app is served over HTTPS, camera permissions are granted seamlessly on mobile Chrome.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
