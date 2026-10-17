import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Smartphone, 
  Copy, 
  Check, 
  ShieldCheck, 
  Wifi, 
  Lock, 
  Camera, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface MobileConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileConnectModal: React.FC<MobileConnectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      setCurrentUrl(url);

      QRCode.toDataURL(url, {
        width: 260,
        margin: 2,
        color: {
          dark: '#0B132B',
          light: '#FFFFFF',
        },
      })
        .then((dataUri) => setQrCodeDataUrl(dataUri))
        .catch((err) => console.error('Failed to generate QR code:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Connect Android Phone Camera
              </h3>
              <p className="text-xs text-slate-400">
                Use your mobile phone as a live handheld safety scanner
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* QR Code and Quick URL */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-slate-950 border border-slate-800">
            {/* QR Code */}
            <div className="bg-white p-3 rounded-2xl shadow-md shrink-0 flex items-center justify-center">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code for Mobile Access"
                  className="w-40 h-40 object-contain rounded-lg"
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center text-slate-400 text-xs font-mono">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Instruction Callout */}
            <div className="space-y-3 text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                Zero-App Installation Required
              </div>

              <h4 className="text-sm font-bold text-white">
                Scan with any Android Camera or Browser
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Open your phone camera app or Google Lens, scan the QR code, and open the link in <b>Google Chrome</b> or <b>Brave</b>.
              </p>

              {/* Copy URL Field */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={currentUrl}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-300 w-full select-all focus:outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Mobile Setup Guide (Android & iOS)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">1</span>
                  Open Link
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Open the site URL on your phone. Because it is hosted on HTTPS, camera streaming is fully supported.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">2</span>
                  Allow Camera
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  When Chrome prompts <i>&quot;SiteSentry wants to use your camera&quot;</i>, tap <b>Allow</b>.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                <div className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">3</span>
                  Switch to Rear Cam
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Tap the <b>Rear Cam</b> button to scan workers, hard hats, and vests from across the room or job site.
                </p>
              </div>
            </div>
          </div>

          {/* Wi-Fi & HTTPS Technical Notes for Project Presentation */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-white">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Browser Security & Wi-Fi Protocols (College Viva Note)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Modern mobile browsers enforce the W3C MediaDevices specification: camera access (<code className="text-amber-300">navigator.mediaDevices.getUserMedia</code>) is strictly restricted to <b>Secure Contexts (HTTPS)</b> or <code className="text-amber-300">localhost</code>. If you run the project locally on your PC (<code className="text-slate-300">http://192.168.x.x:3000</code>), you can either:
            </p>
            <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-1 pl-1">
              <li>Use the deployed cloud HTTPS link provided by AI Studio (recommended, works everywhere).</li>
              <li>Or expose local port 3000 using <b>ngrok</b> (<code className="text-slate-300">ngrok http 3000</code>) which gives a temporary HTTPS link.</li>
              <li>Or in Chrome on Android, open <code className="text-slate-300">chrome://flags/#unsafely-treat-insecure-origin-as-secure</code> and add your local IP.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
};
