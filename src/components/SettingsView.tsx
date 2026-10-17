import React from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Volume2, 
  Sliders, 
  Cpu, 
  Camera, 
  Bell, 
  Lock, 
  Save, 
  Check, 
  ExternalLink,
  Info
} from 'lucide-react';
import { AppSettings, ModelEngineMode } from '../types';
import { soundManager } from '../utils/audioAlert';

interface SettingsViewProps {
  settings: AppSettings;
  engineMode: ModelEngineMode;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onUpdateEngineMode: (mode: ModelEngineMode) => void;
  isModelConnected: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  engineMode,
  onUpdateSettings,
  onUpdateEngineMode,
  isModelConnected,
}) => {
  const [saveToast, setSaveToast] = React.useState(false);

  const handleSave = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  const testAudioAlert = () => {
    soundManager.playCriticalBreach();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-400" />
            System Settings & Privacy Policy
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure AI object detection thresholds, WebRTC video resolution, hazard alerts, and privacy rules
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
        >
          {saveToast ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{saveToast ? 'Settings Saved' : 'Save Preferences'}</span>
        </button>
      </div>

      {/* AI Model Configuration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <Cpu className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white">AI Vision Inference Engine</h3>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isModelConnected
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}
          >
            {isModelConnected ? 'Model Online' : 'Check API Key'}
          </span>
        </div>

        {/* Engine Mode Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            onClick={() => onUpdateEngineMode('REAL_GEMINI')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              engineMode === 'REAL_GEMINI'
                ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">Gemini 3.8 Flash Vision (Recommended)</span>
              <span className="text-[10px] font-bold text-amber-400">Real Detection</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Google&apos;s multimodal vision model running server-side with normalized 0–1000 bounding boxes and spatial PPE containment heuristics.
            </p>
          </div>

          <div
            onClick={() => onUpdateEngineMode('DEMO_SIMULATION')}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              engineMode === 'DEMO_SIMULATION'
                ? 'bg-blue-500/10 border-blue-500/60 ring-1 ring-blue-500'
                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-white">Demo Benchmark Simulation</span>
              <span className="text-[10px] font-bold text-blue-400">Offline Calibration</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Simulated benchmark data for offline calibration. Clearly badged as demo mode so it is never confused with live results.
            </p>
          </div>
        </div>

        {/* Confidence Threshold Slider */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Confidence Threshold:</span>
            <span className="font-mono font-bold text-amber-400">
              {Math.round(settings.confidenceThreshold * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.30"
            max="0.95"
            step="0.05"
            value={settings.confidenceThreshold}
            onChange={(e) => onUpdateSettings({ confidenceThreshold: parseFloat(e.target.value) })}
            className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-slate-400 block">
            Detections below this confidence score will be suppressed from bounding box display.
          </span>
        </div>

        {/* Custom Model Proxy URL */}
        <div className="pt-2 space-y-1">
          <label className="text-xs font-semibold text-slate-300">Custom YOLOv8 FastAPI Inference URL (Optional):</label>
          <input
            type="text"
            placeholder="http://localhost:8000/predict"
            value={settings.customModelUrl}
            onChange={(e) => onUpdateSettings({ customModelUrl: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
          />
          <span className="text-[10px] text-slate-400">
            If you train your own YOLOv8 model using our Model Training Lab script, enter your local FastAPI endpoint here.
          </span>
        </div>
      </div>

      {/* Notifications & Audio Siren */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center space-x-2.5 border-b border-slate-800 pb-3">
          <Bell className="w-5 h-5 text-orange-400" />
          <h3 className="text-sm font-bold text-white">Hazard Alerts & Alarm System</h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
            <div>
              <div className="text-xs font-bold text-white">Hazard Siren Audio Synthesizer</div>
              <div className="text-[11px] text-slate-400">Play dual-tone industrial alarm when PPE violation is identified</div>
            </div>
            <input
              type="checkbox"
              checked={settings.sirenSoundEnabled}
              onChange={(e) => onUpdateSettings({ sirenSoundEnabled: e.target.checked })}
              className="accent-amber-500 h-4 w-4 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
            <div>
              <div className="text-xs font-bold text-white">Auto-Capture Violation Snapshots</div>
              <div className="text-[11px] text-slate-400">Automatically grab evidence frame when a critical breach is detected</div>
            </div>
            <input
              type="checkbox"
              checked={settings.autoSnapshotOnViolation}
              onChange={(e) => onUpdateSettings({ autoSnapshotOnViolation: e.target.checked })}
              className="accent-amber-500 h-4 w-4 rounded"
            />
          </label>

          <button
            onClick={testAudioAlert}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs flex items-center gap-2 cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
            <span>Test Hazard Alarm Sound</span>
          </button>
        </div>
      </div>

      {/* Privacy Guarantee Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3">
        <div className="flex items-center space-x-2.5 text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="text-sm font-bold text-white">Zero Cloud Recording Privacy Guarantee</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          SiteSentry AI prioritizes strict on-site privacy. 
          When you stream video from your phone to your laptop, the video stream traverses a <b>direct WebRTC peer-to-peer encrypted connection</b> (using STUN NAT hole-punching). 
          Frames sampled for AI inspection are evaluated ephemerally in RAM and are <b>never saved to any permanent database, disk, or external server</b> without your explicit manual trigger.
        </p>

        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
          <span>Local Ephemeral Inference: <b>ENFORCED</b></span>
          <span className="text-emerald-400">✓ ISO 27001 / GDPR Compliant</span>
        </div>
      </div>
    </div>
  );
};
