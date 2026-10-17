import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  CheckCircle2,
  Download, 
  Trash2, 
  Clock, 
  Volume2, 
  Eye, 
  Filter,
  Check
} from 'lucide-react';
import { SafetyAlert } from '../types';

interface HazardAlertsPanelProps {
  alerts: SafetyAlert[];
  onAcknowledgeAlert: (alertId: string) => void;
  onResolveAlert: (alertId: string) => void;
  onClearAllAlerts: () => void;
  onTriggerCriticalEmergency?: () => void;
}

export const HazardAlertsPanel: React.FC<HazardAlertsPanelProps> = ({
  alerts,
  onAcknowledgeAlert,
  onResolveAlert,
  onClearAllAlerts,
  onTriggerCriticalEmergency,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'CRITICAL' | 'RESOLVED'>('ALL');
  const [previewSnapshot, setPreviewSnapshot] = useState<string | null>(null);

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'ACTIVE') return !alert.resolved;
    if (filter === 'CRITICAL') return alert.severity === 'CRITICAL' && !alert.resolved;
    if (filter === 'RESOLVED') return alert.resolved;
    return true;
  });

  const exportIncidentReport = () => {
    const reportData = {
      project: 'SiteSentry AI Construction Site Safety Monitor',
      generatedAt: new Date().toISOString(),
      totalAlertsCount: alerts.length,
      criticalBreachesCount: alerts.filter((a) => a.severity === 'CRITICAL').length,
      resolvedCount: alerts.filter((a) => a.resolved).length,
      incidents: alerts,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SiteSentry_HSE_Incident_Report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col h-full">
      {/* Panel Header */}
      <div className="bg-slate-950/80 px-5 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <ShieldAlert className="w-5 h-5 text-orange-500" />
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">
              Live Hazard Alerts & Incidents
            </h2>
            <p className="text-[11px] text-slate-400">
              Active PPE violations detected by AI computer vision
            </p>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-mono font-bold">
            {alerts.length}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Filter Pills */}
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === 'ACTIVE' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active ({alerts.filter((a) => !a.resolved).length})
            </button>
            <button
              onClick={() => setFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === 'CRITICAL' ? 'bg-red-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Critical
            </button>
            <button
              onClick={() => setFilter('RESOLVED')}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filter === 'RESOLVED' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Resolved
            </button>
          </div>

          {/* Trigger Emergency Drill Button */}
          {onTriggerCriticalEmergency && (
            <button
              onClick={onTriggerCriticalEmergency}
              className="px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/50 text-red-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Initiate Code Red HSE Emergency Drill"
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>Emergency Drill</span>
            </button>
          )}

          {/* Export JSON Report */}
          <button
            onClick={exportIncidentReport}
            disabled={alerts.length === 0}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
            title="Download Incident Audit Log (JSON)"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Clear All */}
          <button
            onClick={onClearAllAlerts}
            disabled={alerts.length === 0}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-red-400 disabled:opacity-40 transition-colors"
            title="Clear all alerts"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alerts Feed List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[520px]">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Zero Safety Breaches</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              All monitored personnel in camera view are complying with hard hat and safety vest requirements.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border transition-all ${
                alert.resolved
                  ? 'bg-slate-950/60 border-slate-800/80 opacity-60'
                  : alert.severity === 'CRITICAL'
                  ? 'bg-red-950/40 border-red-500/40 shadow-sm shadow-red-500/10'
                  : 'bg-amber-950/30 border-amber-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      alert.resolved
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : alert.severity === 'CRITICAL'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {alert.resolved ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : alert.severity === 'CRITICAL' ? (
                      <ShieldAlert className="w-4 h-4" />
                    ) : (
                      <AlertTriangle className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          alert.resolved
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : alert.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {alert.resolved ? 'RESOLVED' : alert.severity}
                      </span>
                      <span className="text-xs font-bold text-white">{alert.zone}</span>
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {alert.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 mt-1 font-medium leading-relaxed">{alert.message}</p>

                    {/* Violation Badges */}
                    {alert.violations && alert.violations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {alert.violations.map((v, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-900/50 text-red-200 border border-red-700/60"
                          >
                            ✕ {v}
                          </span>
                        ))}
                      </div>
                    )}

                    {alert.resolved && alert.resolvedAt && (
                      <span className="text-[10px] text-emerald-400 block mt-2 font-mono">
                        ✓ Resolved at {alert.resolvedAt}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Actions & Snapshot Preview */}
                <div className="flex flex-col items-end space-y-2 shrink-0">
                  {alert.snapshotDataUrl && (
                    <button
                      onClick={() => setPreviewSnapshot(alert.snapshotDataUrl!)}
                      className="w-14 h-10 rounded-xl overflow-hidden border border-slate-700 hover:border-amber-400 transition-colors group relative cursor-pointer"
                      title="View violation snapshot frame"
                    >
                      <img
                        src={alert.snapshotDataUrl}
                        alt="Violation snapshot"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent flex items-center justify-center transition-colors">
                        <Eye className="w-3.5 h-3.5 text-white" />
                      </div>
                    </button>
                  )}

                  {/* Acknowledge & Resolve Buttons */}
                  <div className="flex items-center space-x-1.5">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      >
                        Ack
                      </button>
                    )}

                    {!alert.resolved ? (
                      <button
                        onClick={() => onResolveAlert(alert.id)}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Resolve</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10">
                        Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Snapshot Preview Modal */}
      {previewSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800">
              <h3 className="text-xs font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Captured Frame Incident Evidence
              </h3>
              <button
                onClick={() => setPreviewSnapshot(null)}
                className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="p-4 bg-black flex items-center justify-center">
              <img
                src={previewSnapshot}
                alt="Enlarged violation snapshot"
                className="max-h-[70vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
