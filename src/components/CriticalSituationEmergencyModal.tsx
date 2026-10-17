import React from 'react';
import { 
  AlertOctagon, 
  ShieldAlert, 
  Cross, 
  OctagonX, 
  Navigation, 
  Volume2, 
  CheckCircle2, 
  X, 
  Activity, 
  Radio, 
  ArrowRight,
  Flame,
  AlertTriangle
} from 'lucide-react';
import { CriticalSituation } from '../types';
import { notificationService } from '../utils/notificationService';

interface CriticalSituationModalProps {
  situation: CriticalSituation;
  onDispatchMedical: () => void;
  onHaltMachinery: () => void;
  onToggleEvacuation: () => void;
  onResolveSituation: () => void;
  onGoToSiteMap: () => void;
}

export const CriticalSituationEmergencyModal: React.FC<CriticalSituationModalProps> = ({
  situation,
  onDispatchMedical,
  onHaltMachinery,
  onToggleEvacuation,
  onResolveSituation,
  onGoToSiteMap,
}) => {
  if (!situation.isActive) return null;

  const repeatVoiceAnnouncement = () => {
    notificationService.speakAlert(
      `CRITICAL EMERGENCY in ${situation.zone}! Work stoppage ordered. Evacuate perimeter immediately!`
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-950 border-2 border-red-600 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl shadow-red-600/40 my-6 flex flex-col">
        {/* Red & Black Industrial Hazard Stripe Bar */}
        <div className="h-3 w-full bg-[repeating-linear-gradient(45deg,#dc2626,#dc2626_15px,#000_15px,#000_30px)]" />

        {/* Emergency Header */}
        <div className="p-5 sm:p-6 bg-red-950/60 border-b border-red-800/80 flex items-start justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/50 animate-bounce shrink-0">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                  CODE RED EMERGENCY
                </span>
                <span className="text-xs font-mono text-red-200 font-bold">{situation.timestamp}</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-1 tracking-tight">
                CRITICAL SITUATION: WORK STOPPAGE
              </h2>
              <p className="text-xs text-red-200/90 font-medium mt-0.5">
                Immediate HSE incident containment active at: <b className="text-white underline">{situation.zone}</b>
              </p>
            </div>
          </div>

          <button
            onClick={onResolveSituation}
            className="p-1.5 rounded-xl bg-slate-900/80 border border-red-500/40 text-red-300 hover:text-white"
            title="Close Alert Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Emergency Body & Cause */}
        <div className="p-6 space-y-5">
          {/* Breach Cause Box */}
          <div className="p-4 rounded-2xl bg-red-900/20 border border-red-500/40 space-y-1.5">
            <div className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>Safety Breach Identified by AI Vision:</span>
            </div>
            <p className="text-sm font-semibold text-white leading-relaxed">
              {situation.reason}
            </p>
          </div>

          {/* Action Checklist for Safety Officers */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Emergency Command Checklist:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Action 1: Dispatch Medical */}
              <button
                onClick={onDispatchMedical}
                className={`p-3.5 rounded-2xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                  situation.medicalDispatched
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                    : 'bg-slate-900 border-slate-800 hover:border-red-500 text-slate-300'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    situation.medicalDispatched ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  <Cross className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>1. Dispatch Medical Camp</span>
                    {situation.medicalDispatched && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {situation.medicalDispatched ? 'First-aid squad en route' : 'Send trauma team from MED-01'}
                  </div>
                </div>
              </button>

              {/* Action 2: Halt Machinery */}
              <button
                onClick={onHaltMachinery}
                className={`p-3.5 rounded-2xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                  situation.machineryHalted
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                    : 'bg-slate-900 border-slate-800 hover:border-red-500 text-slate-300'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    situation.machineryHalted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'
                  }`}
                >
                  <OctagonX className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>2. Halt Heavy Machinery</span>
                    {situation.machineryHalted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {situation.machineryHalted ? 'Crane & plant power cut' : 'Cut crane/excavator power'}
                  </div>
                </div>
              </button>

              {/* Action 3: Evacuation Route */}
              <button
                onClick={onToggleEvacuation}
                className={`p-3.5 rounded-2xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                  situation.evacuationActive
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                    : 'bg-slate-900 border-slate-800 hover:border-emerald-500 text-slate-300'
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    situation.evacuationActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <span>3. Evacuation Route</span>
                    {situation.evacuationActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {situation.evacuationActive ? 'Emergency Exit path lighted' : 'Display safe path to Exit 2'}
                  </div>
                </div>
              </button>

              {/* Action 4: Audio Voice Alert */}
              <button
                onClick={repeatVoiceAnnouncement}
                className="p-3.5 rounded-2xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-left flex items-start space-x-3 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
                  <Volume2 className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">4. Re-broadcast Voice Alarm</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Play PA system evacuation speech
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onGoToSiteMap}
            className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1.5 cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>Open Blueprint & Trace Evacuation Path</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onResolveSituation}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>RESOLVE EMERGENCY & RESUME</span>
          </button>
        </div>
      </div>
    </div>
  );
};
