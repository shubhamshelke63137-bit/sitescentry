import React from 'react';
import { 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  HardHat, 
  Activity, 
  Sparkles,
  Info
} from 'lucide-react';
import { ModelEngineMode } from '../types';

interface DashboardMetricsProps {
  totalPersonnel: number;
  compliantCount: number;
  violationCount: number;
  warningCount: number;
  helmetAdherencePct: number;
  vestAdherencePct: number;
  engineMode: ModelEngineMode;
  isModelConnected: boolean;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({
  totalPersonnel,
  compliantCount,
  violationCount,
  warningCount,
  helmetAdherencePct,
  vestAdherencePct,
  engineMode,
  isModelConnected,
}) => {
  // Compute overall Site Safety Index
  const totalIssues = violationCount * 2 + warningCount;
  let safetyScore = 100;
  if (totalPersonnel > 0) {
    const penalty = (totalIssues / (totalPersonnel * 2)) * 100;
    safetyScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  }

  return (
    <div className="space-y-4">
      {/* Engine Status Banner */}
      <div
        className={`px-4 py-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          engineMode === 'REAL_GEMINI'
            ? isModelConnected
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200'
            : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
        }`}
      >
        <div className="flex items-center space-x-2.5">
          <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
          <div>
            <span className="font-bold uppercase tracking-wider">
              {engineMode === 'REAL_GEMINI'
                ? 'Active AI Engine: Gemini 3.8 Flash Vision (Real Detection)'
                : 'Active Engine: Offline Test Bench (Simulated Ground Truth)'}
            </span>
            <p className="text-[11px] opacity-80 mt-0.5">
              {engineMode === 'REAL_GEMINI'
                ? 'Camera frames are processed server-side with zero sensor dependencies to identify workers, hard hats, and vests.'
                : 'Running benchmark calibration scenarios. Switch to Real AI Engine to analyze live camera frames with the Gemini model.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono">
            {engineMode === 'REAL_GEMINI' ? 'Live CV Proxy: Online' : 'Benchmark Mode'}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Personnel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Personnel</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {totalPersonnel}
            </span>
            <span className="text-xs text-slate-400 font-medium">in camera frame</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Automated headcount via vision bounding box
          </div>
        </div>

        {/* Card 2: Compliant Personnel */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Compliant (Full PPE)</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
              {compliantCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {totalPersonnel > 0 ? `${Math.round((compliantCount / totalPersonnel) * 100)}%` : '100%'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-400/80 font-medium">
            Hard hat + high-vis safety vest verified
          </div>
        </div>

        {/* Card 3: Active PPE Breaches */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">PPE Violations</span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-red-400 tracking-tight">
              {violationCount + warningCount}
            </span>
            <span className="text-xs text-red-300 font-medium">
              ({violationCount} Critical, {warningCount} Warn)
            </span>
          </div>
          <div className="mt-2 text-[11px] text-red-400/80 font-medium">
            Requires supervisor intervention
          </div>
        </div>

        {/* Card 4: Site Safety Index */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Safety Index</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                safetyScore >= 80 ? 'text-emerald-400' : safetyScore >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}
            >
              {safetyScore}%
            </span>
            <span className="text-xs text-slate-400 font-medium">Rating</span>
          </div>
          {/* Mini progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                safetyScore >= 80 ? 'bg-emerald-500' : safetyScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${safetyScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sub-Metric Breakdowns: Hard Hat & Vest Rates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <HardHat className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-xs font-bold text-white">Hard Hat Compliance Rate</div>
              <div className="text-[11px] text-slate-400">Head protection adherence</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-extrabold text-amber-400">{helmetAdherencePct}%</div>
            <div className="text-[10px] text-slate-400">ISO 3873 Spec</div>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-5 h-5 rounded-md bg-orange-500/20 text-orange-400 flex items-center justify-center font-black text-xs">
              V
            </div>
            <div>
              <div className="text-xs font-bold text-white">High-Vis Vest Compliance</div>
              <div className="text-[11px] text-slate-400">Torso retroreflective gear</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-extrabold text-orange-400">{vestAdherencePct}%</div>
            <div className="text-[10px] text-slate-400">EN ISO 20471 Spec</div>
          </div>
        </div>
      </div>
    </div>
  );
};
