import React from 'react';
import { 
  HardHat, 
  ShieldCheck, 
  Smartphone, 
  GraduationCap, 
  Volume2, 
  VolumeX, 
  FlaskConical, 
  Radio, 
  ExternalLink 
} from 'lucide-react';
import { soundManager } from '../utils/audioAlert';
import { ModelEngineMode } from '../types';

interface HeaderProps {
  engineMode: ModelEngineMode;
  setEngineMode: (mode: ModelEngineMode) => void;
  isModelConnected: boolean;
  onOpenMobileModal: () => void;
  onOpenProjectLab: () => void;
  onOpenTestBench: () => void;
  activeViolationsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  engineMode,
  setEngineMode,
  isModelConnected,
  onOpenMobileModal,
  onOpenProjectLab,
  onOpenTestBench,
  activeViolationsCount,
}) => {
  const [muted, setMuted] = React.useState(soundManager.isMuted);

  const toggleMute = () => {
    const isNowMuted = soundManager.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      soundManager.playWarning();
    }
  };

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-slate-950/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 shadow-lg shadow-orange-500/20 font-black">
            <HardHat className="w-6 h-6 stroke-[2.2]" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                Site<span className="text-amber-400">Sentry</span>
              </h1>
              <span className="text-[10px] tracking-wider uppercase font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                AI Vision
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Zero-Sensor Computer Vision PPE & Hazard Safety Monitor
            </p>
          </div>
        </div>

        {/* Center Engine Indicator */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setEngineMode('REAL_GEMINI')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              engineMode === 'REAL_GEMINI'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${engineMode === 'REAL_GEMINI' ? 'animate-pulse text-slate-950' : 'text-amber-400'}`} />
            Real AI Engine
            {isModelConnected ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" title="Gemini 3.8 Flash Online" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-700" title="Checking key" />
            )}
          </button>

          <button
            onClick={() => setEngineMode('DEMO_SIMULATION')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              engineMode === 'DEMO_SIMULATION'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-blue-400" />
            Demo / Test Bench
          </button>
        </div>

        {/* Right Tools & Navigation */}
        <div className="flex items-center space-x-2">
          {/* Audio Alarm Mute Toggle */}
          <button
            onClick={toggleMute}
            className={`p-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              muted
                ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
            }`}
            title={muted ? 'Unmute hazard alarm siren' : 'Mute hazard siren'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse text-amber-400" />}
            <span className="hidden lg:inline">{muted ? 'Siren Off' : 'Siren Active'}</span>
          </button>

          {/* Connect Phone Button */}
          <button
            onClick={onOpenMobileModal}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all"
          >
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>Connect Phone</span>
          </button>

          {/* Test Bench Button */}
          <button
            onClick={onOpenTestBench}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:text-white hidden sm:flex items-center gap-1.5 transition-all"
          >
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            <span>Test Images</span>
          </button>

          {/* College Project / Architecture Lab */}
          <button
            onClick={onOpenProjectLab}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
          >
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Project Lab & Guide</span>
            <span className="sm:hidden">Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
};
