import React, { useState } from 'react';
import { 
  MapPin, 
  ShieldAlert, 
  ShieldCheck, 
  Cross, 
  DoorOpen, 
  Building2, 
  AlertTriangle, 
  Layers, 
  Navigation,
  Compass,
  Camera
} from 'lucide-react';
import { SiteZone } from '../types';
import { SITE_ZONES } from '../data/siteZones';

interface SiteMapProps {
  activeZoneId: string;
  onSelectZone: (zone: SiteZone) => void;
  activeViolationsZone?: string | null;
}

export const SiteMap: React.FC<SiteMapProps> = ({
  activeZoneId,
  onSelectZone,
  activeViolationsZone,
}) => {
  const [showEvacuationRoutes, setShowEvacuationRoutes] = useState<boolean>(true);
  const [selectedZone, setSelectedZone] = useState<SiteZone>(
    SITE_ZONES.find((z) => z.name === activeZoneId) || SITE_ZONES[0]
  );

  const handleZoneClick = (zone: SiteZone) => {
    setSelectedZone(zone);
    onSelectZone(zone);
  };

  // Helper icon for category
  const renderZoneIcon = (category: string) => {
    switch (category) {
      case 'medical':
        return <Cross className="w-4 h-4 text-emerald-400" />;
      case 'entrance':
        return <DoorOpen className="w-4 h-4 text-blue-400" />;
      case 'evacuation':
        return <Navigation className="w-4 h-4 text-green-400" />;
      case 'admin':
        return <Building2 className="w-4 h-4 text-purple-400" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Map Header */}
      <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            Interactive Site Blueprint & Safety Checkpoints
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowEvacuationRoutes(!showEvacuationRoutes)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showEvacuationRoutes
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Evacuation Routes {showEvacuationRoutes ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Blueprint Visual Area */}
      <div className="relative flex-1 min-h-[360px] bg-slate-950 p-4 flex items-center justify-center overflow-hidden">
        {/* Architectural Blueprint Grid Pattern */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />
        
        {/* SVG Site Layout Graphic */}
        <svg
          viewBox="0 0 1000 650"
          className="w-full h-full max-h-[500px] select-none"
        >
          <defs>
            <pattern id="diagonalHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#f59e0b" strokeWidth="1" opacity="0.15" />
            </pattern>
            <linearGradient id="fenceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          {/* Outer Construction Site Perimeter Wall */}
          <rect
            x="40"
            y="40"
            width="920"
            height="570"
            rx="16"
            fill="url(#fenceGradient)"
            stroke="#334155"
            strokeWidth="3"
            strokeDasharray="8 4"
          />

          {/* Inner Roadway / Circulation Arterial */}
          <path
            d="M 120 540 L 400 540 L 400 300 L 750 300 L 750 540 L 880 540"
            fill="none"
            stroke="#1e293b"
            strokeWidth="36"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 120 540 L 400 540 L 400 300 L 750 300 L 750 540 L 880 540"
            fill="none"
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="12 8"
            strokeLinecap="round"
          />

          {/* Excavation Pit Zone A Ground Graphic */}
          <rect
            x="200"
            y="180"
            width="220"
            height="180"
            rx="8"
            fill="url(#diagonalHatch)"
            stroke="#d97706"
            strokeWidth="2"
          />
          <text x="220" y="210" fill="#fbbf24" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
            ZONE A: EXCAVATION PIT
          </text>
          <text x="220" y="230" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">
            Depth: 8.5m • Shoring Active
          </text>

          {/* Scaffolding High-Rise Zone B Ground Graphic */}
          <rect
            x="520"
            y="140"
            width="200"
            height="170"
            rx="8"
            fill="url(#diagonalHatch)"
            stroke="#ef4444"
            strokeWidth="2"
          />
          <text x="535" y="170" fill="#f87171" fontSize="13" fontWeight="bold" fontFamily="sans-serif">
            ZONE B: SCAFFOLDING TOWER
          </text>
          <text x="535" y="190" fill="#94a3b8" fontSize="11" fontFamily="sans-serif">
            Height: 24m • Fall Risk
          </text>

          {/* Heavy Machinery Yard Zone C */}
          <circle
            cx="750"
            cy="420"
            r="90"
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            strokeDasharray="6 4"
          />
          <text x="690" y="415" fill="#fb923c" fontSize="12" fontWeight="bold" fontFamily="sans-serif">
            ZONE C: CRANE YARD
          </text>
          <text x="690" y="435" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
            Radius: 35m Swing
          </text>

          {/* Evacuation Routes (if toggled) */}
          {showEvacuationRoutes && (
            <g className="transition-opacity duration-300">
              {/* Route from Zone A to Emergency Exit */}
              <path
                d="M 310 180 L 310 90 L 920 90 L 920 140"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeDasharray="6 4"
                className="animate-pulse"
              />
              {/* Route from Zone B to Emergency Exit */}
              <path
                d="M 620 140 L 620 90 L 920 90"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeDasharray="6 4"
                className="animate-pulse"
              />
              {/* Route from Zone C to Emergency Exit */}
              <path
                d="M 750 330 L 750 200 L 900 200 L 900 160"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeDasharray="6 4"
                className="animate-pulse"
              />
            </g>
          )}

          {/* Compass Rose */}
          <g transform="translate(80, 80)">
            <circle cx="0" cy="0" r="24" fill="#0f172a" stroke="#334155" strokeWidth="2" />
            <polygon points="0,-18 5,0 -5,0" fill="#f59e0b" />
            <polygon points="0,18 5,0 -5,0" fill="#64748b" />
            <text x="-4" y="-22" fill="#f59e0b" fontSize="10" fontWeight="bold">N</text>
          </g>
        </svg>

        {/* Dynamic Interactive Zone Marker Badges on Map */}
        {SITE_ZONES.map((zone) => {
          const isSelected = selectedZone.id === zone.id;
          const isActiveFeed = activeZoneId.includes(zone.name) || activeZoneId === zone.name;
          const hasHazard = zone.activeBreaches > 0 || (activeViolationsZone && activeViolationsZone.includes(zone.code));

          return (
            <div
              key={zone.id}
              onClick={() => handleZoneClick(zone)}
              style={{
                left: `${zone.coordinates.x}%`,
                top: `${zone.coordinates.y}%`,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20 transition-transform duration-200 hover:scale-110`}
            >
              {/* Pulsing Hazard Glow */}
              {hasHazard && (
                <span className="absolute -inset-2 rounded-full bg-red-500/40 animate-ping pointer-events-none" />
              )}

              {/* Marker Button */}
              <div
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border shadow-lg backdrop-blur-md transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400 font-bold scale-105 shadow-amber-500/30'
                    : hasHazard
                    ? 'bg-red-950/90 text-red-200 border-red-500 hover:bg-red-900'
                    : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                }`}
              >
                {hasHazard ? (
                  <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
                ) : (
                  renderZoneIcon(zone.category)
                )}

                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold leading-none whitespace-nowrap">
                    {zone.name}
                  </span>
                  <span
                    className={`text-[9px] font-mono leading-none mt-0.5 ${
                      isSelected ? 'text-slate-900 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {zone.code} • {zone.assignedWorkers} workers
                  </span>
                </div>

                {isActiveFeed && (
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 ml-1" title="Active Camera View" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Zone Details Drawer */}
      <div className="bg-slate-950 p-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                {selectedZone.code}
              </span>
              <h3 className="text-sm font-bold text-white">{selectedZone.name}</h3>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                  selectedZone.riskLevel === 'critical'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : selectedZone.riskLevel === 'high'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                {selectedZone.riskLevel} Risk
              </span>
            </div>
            <p className="text-xs text-slate-400">{selectedZone.description}</p>
          </div>

          {/* Action button */}
          <div className="flex items-center space-x-2 self-end sm:self-center">
            <button
              onClick={() => onSelectZone(selectedZone)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Assign Feed to {selectedZone.code}</span>
            </button>
          </div>
        </div>

        {/* Required PPE Tags */}
        <div className="mt-3 pt-3 border-t border-slate-900 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400">Required Gear:</span>
          {selectedZone.requiredPpe.map((gear, i) => (
            <span
              key={i}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300"
            >
              ✓ {gear}
            </span>
          ))}

          <span className="text-[11px] font-semibold text-slate-400 ml-auto">
            Evacuation to: <span className="text-emerald-400 font-medium">{selectedZone.evacuationRouteTo}</span>
          </span>
        </div>
      </div>
    </div>
  );
};
