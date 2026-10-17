import React, { useState } from 'react';
import { 
  Play, 
  Square, 
  Camera, 
  CameraOff, 
  Smartphone, 
  HardHat, 
  Shield, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Radio,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { InspectionMode } from '../types';
import { AlertOctagon } from 'lucide-react';

interface MasterDetectionBarProps {
  isDetectionRunning: boolean;
  onToggleDetection: () => void;
  isCameraActive: boolean;
  onToggleCamera: () => void;
  isPhoneConnected: boolean;
  inspectionMode: InspectionMode;
  onUpdateInspectionMode: (mode: InspectionMode) => void;
  onOpenPhonePairing: () => void;
  onOpenTestBench: () => void;
  onTriggerCriticalEmergency: () => void;
  isCriticalEmergencyActive?: boolean;
}

export const MasterDetectionBar: React.FC<MasterDetectionBarProps> = ({
  isDetectionRunning,
  onToggleDetection,
  isCameraActive,
  onToggleCamera,
  isPhoneConnected,
  inspectionMode,
  onUpdateInspectionMode,
  onOpenPhonePairing,
  onOpenTestBench,
  onTriggerCriticalEmergency,
  isCriticalEmergencyActive = false,
}) => {
  const [showHowToGuide, setShowHowToGuide] = useState<boolean>(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
      {/* Top Main Master Actions Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Huge Tactile Master START / STOP DETECTION Button */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onToggleDetection}
            className={`px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 shadow-xl transition-all duration-300 cursor-pointer ${
              isDetectionRunning
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-500/30'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-orange-500/30 scale-100 hover:scale-[1.02]'
            }`}
          >
            {isDetectionRunning ? (
              <>
                <Square className="w-5 h-5 fill-white" />
                <span>STOP AI DETECTION</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-slate-950" />
                <span>START AI DETECTION</span>
              </>
            )}
          </button>

          {/* Camera Status Badge & Toggle Button */}
          <button
            onClick={onToggleCamera}
            className={`px-4 py-3 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isCameraActive
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title={isCameraActive ? 'Turn Camera Off' : 'Turn Camera On'}
          >
            {isCameraActive ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Camera: ON</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                <CameraOff className="w-4 h-4" />
                <span>Turn Camera ON</span>
              </>
            )}
          </button>

          {/* Phone Stream Status Badge */}
          <button
            onClick={onOpenPhonePairing}
            className={`px-3.5 py-3 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isPhoneConnected
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-amber-400 hover:border-amber-500/40 hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{isPhoneConnected ? 'Phone: Streaming Live' : 'Use Phone Camera'}</span>
          </button>

          {/* Critical Situation / Code Red Trigger Button */}
          <button
            onClick={onTriggerCriticalEmergency}
            className={`px-3.5 py-3 rounded-2xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isCriticalEmergencyActive
                ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-600/40 animate-bounce'
                : 'bg-red-950/40 hover:bg-red-900/50 border-red-600/50 text-red-300 hover:text-white'
            }`}
            title="Trigger Code Red Critical Emergency Protocol"
          >
            <AlertOctagon className={`w-4 h-4 ${isCriticalEmergencyActive ? 'animate-spin text-white' : 'text-red-400'}`} />
            <span>{isCriticalEmergencyActive ? 'EMERGENCY ACTIVE' : '🚨 Critical Emergency'}</span>
          </button>
        </div>

        {/* Center / Right: Simple Inspection Mode Tabs */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 hidden sm:inline">
            Mode:
          </span>

          <button
            onClick={() => onUpdateInspectionMode('FULL_PPE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              inspectionMode === 'FULL_PPE'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Check Both Hard Hat & Safety Jacket"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Both (Full PPE)</span>
          </button>

          <button
            onClick={() => onUpdateInspectionMode('HELMET_ONLY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              inspectionMode === 'HELMET_ONLY'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Check if worker is wearing a safety helmet"
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>Helmet Mode</span>
          </button>

          <button
            onClick={() => onUpdateInspectionMode('VEST_ONLY')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              inspectionMode === 'VEST_ONLY'
                ? 'bg-orange-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Check if worker is wearing a safety jacket / vest"
          >
            <div className="w-3.5 h-3.5 rounded bg-orange-400 text-slate-950 font-black text-[9px] flex items-center justify-center">
              V
            </div>
            <span>Safety Jacket Mode</span>
          </button>
        </div>
      </div>

      {/* Quick Helper Toggle Bar: How to make cameras turn on */}
      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
        <button
          onClick={() => setShowHowToGuide(!showHowToGuide)}
          className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Simple Guide: How to turn camera on (Phone vs Laptop)</span>
          {showHowToGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={onOpenTestBench}
            className="text-slate-400 hover:text-slate-200 hover:underline flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test with Sample Photos</span>
          </button>
        </div>
      </div>

      {/* Expandable Simple Guide Card */}
      {showHowToGuide && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-xs animate-in fade-in duration-200">
          <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            3 Easy Ways to Turn On Camera & Run Detection:
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Method 1: Laptop Webcam */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="text-amber-400 font-bold flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                <span>1. Laptop Webcam</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Click <b>&quot;Turn Camera ON&quot;</b> above. When the browser prompts, tap <b>Allow</b>. Then click the large <b>START AI DETECTION</b> button.
              </p>
            </div>

            {/* Method 2: Phone Camera via WebRTC */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="text-amber-400 font-bold flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                <span>2. Phone Camera (Handheld)</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Click <b>&quot;Use Phone Camera&quot;</b> to view the QR code. Scan it with your phone, allow camera access, and your phone live-streams video to your laptop!
              </p>
            </div>

            {/* Method 3: Upload Photos or Test Bench */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
              <div className="text-amber-400 font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>3. Test Images (No Camera Needed)</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Click <b>&quot;Test with Sample Photos&quot;</b> to immediately test compliant workers or missing helmet violations without pointing a camera.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
