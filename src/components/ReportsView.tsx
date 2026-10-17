import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  HardHat, 
  FileText,
  Search
} from 'lucide-react';
import { DetectionLogRecord, SafetyAlert } from '../types';

interface ReportsViewProps {
  detectionLogs: DetectionLogRecord[];
  alerts: SafetyAlert[];
  overallSafetyIndex: number;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  detectionLogs,
  alerts,
  overallSafetyIndex,
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLogs = detectionLogs.filter((log) => {
    if (selectedZone !== 'ALL' && !log.zone.includes(selectedZone)) return false;
    if (searchQuery && !log.zone.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Export full CSV audit report
  const downloadCsvReport = () => {
    const headers = [
      'Record_ID',
      'Timestamp',
      'Location_Zone',
      'Source_Type',
      'Total_Personnel',
      'Compliant_Count',
      'Violations_Count',
      'Hard_Hat_Rate_Pct',
      'Safety_Vest_Rate_Pct',
      'Hazard_Level',
      'Is_Real_AI',
    ];

    const rows = detectionLogs.map((log) => [
      log.id,
      `"${log.timestamp}"`,
      `"${log.zone}"`,
      `"${log.source}"`,
      log.totalPeople,
      log.compliantCount,
      log.violationsCount,
      `${log.helmetComplianceRate}%`,
      `${log.vestComplianceRate}%`,
      log.hazardLevel,
      log.isRealAi ? 'YES' : 'NO',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SiteSentry_HSE_Audit_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            Safety Audit Reports & Compliance Logs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical logs of computer vision inspections, PPE violations, and exportable HSE compliance metrics
          </p>
        </div>

        <button
          onClick={downloadCsvReport}
          disabled={detectionLogs.length === 0}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-40 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV Audit Report</span>
        </button>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Vision Audits</span>
          <div className="text-2xl font-black text-white">{detectionLogs.length}</div>
          <p className="text-[10px] text-slate-400">Captured inspection frames</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Overall Compliance Index</span>
          <div className="text-2xl font-black text-emerald-400">{overallSafetyIndex}%</div>
          <p className="text-[10px] text-emerald-400/80">Site Safety Benchmark</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Critical Incidents</span>
          <div className="text-2xl font-black text-red-400">
            {alerts.filter((a) => a.severity === 'CRITICAL').length}
          </div>
          <p className="text-[10px] text-red-300">Violations requiring action</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Resolved Incidents</span>
          <div className="text-2xl font-black text-amber-400">
            {alerts.filter((a) => a.resolved).length}
          </div>
          <p className="text-[10px] text-slate-400">Handled by Safety Officer</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400 font-semibold">Filter Zone:</span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
          >
            <option value="ALL">All Construction Zones</option>
            <option value="Zone A">Zone A: Excavation Pit</option>
            <option value="Zone B">Zone B: Scaffolding Tower</option>
            <option value="Zone C">Zone C: Crane Yard</option>
            <option value="Gate">Main Gate Checkpoint</option>
          </select>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Log Table Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Site Zone</th>
                <th className="p-3.5">Camera Source</th>
                <th className="p-3.5">Workers Monitored</th>
                <th className="p-3.5">Hard Hat Rate</th>
                <th className="p-3.5">Vest Rate</th>
                <th className="p-3.5">Hazard Severity</th>
                <th className="p-3.5 text-right">Detection Engine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-sans">
                    No inspection logs match the selected filter. Start camera monitoring to accumulate inspection records.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 text-slate-300">{log.timestamp}</td>
                    <td className="p-3.5 font-bold text-white font-sans">{log.zone}</td>
                    <td className="p-3.5 text-slate-400">{log.source}</td>
                    <td className="p-3.5 text-slate-200">{log.totalPeople}</td>
                    <td className="p-3.5 text-amber-400">{log.helmetComplianceRate}%</td>
                    <td className="p-3.5 text-orange-400">{log.vestComplianceRate}%</td>
                    <td className="p-3.5">
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          log.hazardLevel === 'HIGH'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : log.hazardLevel === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {log.hazardLevel}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="text-[10px] text-slate-400 font-sans">
                        {log.isRealAi ? 'Gemini 3.8 Flash' : 'Benchmark Demo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
