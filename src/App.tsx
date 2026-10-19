/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { LiveMonitorView } from './components/LiveMonitorView';
import { SiteMap } from './components/SiteMap';
import { DashboardMetrics } from './components/DashboardMetrics';
import { HazardAlertsPanel } from './components/HazardAlertsPanel';
import { PhonePairingView } from './components/PhonePairingView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { ModelTrainingLab } from './components/ModelTrainingLab';
import { SampleGalleryModal } from './components/SampleGalleryModal';
import { PhoneCameraBroadcaster } from './components/PhoneCameraBroadcaster';
import { MasterDetectionBar } from './components/MasterDetectionBar';
import { CriticalSituationEmergencyModal } from './components/CriticalSituationEmergencyModal';
import { notificationService } from './utils/notificationService';
import { 
  AppSettings, 
  CriticalSituation,
  DetectionLogRecord, 
  DetectionResult, 
  InspectionMode, 
  ModelEngineMode, 
  NavigationView, 
  SafetyAlert, 
  SiteZone 
} from './types';
import { SITE_ZONES } from './data/siteZones';
import { SiteSentryWebRtc } from './utils/webrtcClient';
import { 
  Menu, 
  HardHat, 
  Smartphone, 
  ShieldCheck, 
  ShieldAlert,
  AlertOctagon,
  Radio, 
  Cpu, 
  Volume2, 
  VolumeX, 
  FlaskConical,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { soundManager } from './utils/audioAlert';

function generateRandomSessionId(): string {
  return 'site-' + Math.random().toString(36).substring(2, 7);
}

export default function App() {
  // Check if URL has ?role=camera or ?role=phone
  const [isPhoneBroadcasterMode, setIsPhoneBroadcasterMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('role') === 'camera' || p.get('role') === 'phone';
    }
    return false;
  });

  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('session') || generateRandomSessionId();
    }
    return generateRandomSessionId();
  });

  // Navigation View State
  const [currentView, setCurrentView] = useState<NavigationView>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // AI & Detection Settings State
  const [engineMode, setEngineMode] = useState<ModelEngineMode>('REAL_GEMINI');
  const [isModelConnected, setIsModelConnected] = useState<boolean>(true);
  const [currentZone, setCurrentZone] = useState<string>('Zone A: Foundation & Deep Excavation');
  
  // Master Detection and Camera State
  const [isDetectionRunning, setIsDetectionRunning] = useState<boolean>(true);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);

  // Inspection Mode State (Full PPE vs Helmet Only vs Vest Only)
  const [inspectionMode, setInspectionMode] = useState<InspectionMode>('FULL_PPE');
  const [activeToastAlert, setActiveToastAlert] = useState<SafetyAlert | null>(null);

  // Critical Situation State (Code Red Emergency)
  const [criticalSituation, setCriticalSituation] = useState<CriticalSituation>({
    isActive: false,
    zone: 'Zone A: Foundation & Deep Excavation',
    reason: 'Zero-PPE fall risk detected near open shaft edge. Immediate perimeter evacuation protocol initiated.',
    severity: 'CRITICAL_HAZARD',
    timestamp: '',
    medicalDispatched: false,
    machineryHalted: false,
    evacuationActive: false,
  });

  const handleTriggerCriticalEmergency = (customReason?: string, customZone?: string) => {
    const time = new Date().toLocaleTimeString();
    const zone = customZone || currentZone;
    const reason =
      customReason ||
      `Critical safety breach in ${zone}: Severe PPE violation detected in high-risk construction zone! Immediate work stoppage ordered.`;

    setCriticalSituation({
      isActive: true,
      zone,
      reason,
      severity: 'CRITICAL_HAZARD',
      timestamp: time,
      medicalDispatched: false,
      machineryHalted: false,
      evacuationActive: false,
    });

    soundManager.playCriticalBreach();
    notificationService.speakAlert(
      `CRITICAL SAFETY EMERGENCY at ${zone}! Work stoppage ordered. Evacuate perimeter.`
    );
    notificationService.showDesktopNotification(
      'CODE RED: CRITICAL SITE EMERGENCY',
      `Immediate incident containment at ${zone}: ${reason}`
    );
  };

  const handleDispatchMedical = () => {
    setCriticalSituation((prev) => ({ ...prev, medicalDispatched: true }));
    notificationService.speakAlert('Medical emergency trauma squad dispatched from MED-01 camp.');
  };

  const handleHaltMachinery = () => {
    setCriticalSituation((prev) => ({ ...prev, machineryHalted: true }));
    notificationService.speakAlert('Emergency machinery shutoff triggered. Crane and excavator power halted.');
  };

  const handleToggleEvacuation = () => {
    setCriticalSituation((prev) => {
      const next = !prev.evacuationActive;
      if (next) {
        notificationService.speakAlert('Emergency evacuation path illuminated towards Emergency Exit 02.');
      }
      return { ...prev, evacuationActive: next };
    });
  };

  const handleResolveCriticalEmergency = () => {
    setCriticalSituation((prev) => ({ ...prev, isActive: false }));
    notificationService.speakAlert('Critical emergency resolved. Normal monitoring resumed.');
  };

  const handleToggleDetection = () => {
    const nextState = !isDetectionRunning;
    setIsDetectionRunning(nextState);
    if (nextState) {
      setIsCameraActive(true);
      notificationService.speakAlert('AI Safety Detection activated.');
    } else {
      notificationService.speakAlert('AI Safety Detection paused.');
    }
  };

  const handleToggleCamera = () => {
    setIsCameraActive((prev) => !prev);
  };

  const [settings, setSettings] = useState<AppSettings>({
    confidenceThreshold: 0.5,
    preferredResolution: '720p',
    sirenSoundEnabled: true,
    speechAlertsEnabled: true,
    desktopNotificationsEnabled: true,
    autoSnapshotOnViolation: true,
    customModelUrl: 'http://localhost:8000/predict',
    privacyLocalOnly: true,
    alertEmailOrWebhook: '',
    inspectionMode: 'FULL_PPE',
  });

  // WebRTC Laptop Receiver & Live Frame Relay State
  const [remotePhoneStream, setRemotePhoneStream] = useState<MediaStream | null>(null);
  const [latestPhoneFrame, setLatestPhoneFrame] = useState<string | null>(null);
  const [phoneStreamSourceType, setPhoneStreamSourceType] = useState<'webrtc' | 'relay' | 'none'>('none');
  const [isPhoneConnected, setIsPhoneConnected] = useState<boolean>(false);
  const [webrtcState, setWebrtcState] = useState<RTCPeerConnectionState>('new');
  const [signalingLogs, setSignalingLogs] = useState<string[]>([]);
  const laptopRtcRef = useRef<SiteSentryWebRtc | null>(null);

  // Metrics & Stats
  const [totalPersonnel, setTotalPersonnel] = useState<number>(1);
  const [compliantCount, setCompliantCount] = useState<number>(1);
  const [violationCount, setViolationCount] = useState<number>(0);
  const [warningCount, setWarningCount] = useState<number>(0);
  const [helmetAdherencePct, setHelmetAdherencePct] = useState<number>(100);
  const [vestAdherencePct, setVestAdherencePct] = useState<number>(100);

  // Safety Alerts Feed
  const [alerts, setAlerts] = useState<SafetyAlert[]>([
    {
      id: 'init-alert-1',
      timestamp: '09:30:15 AM',
      zone: 'Zone B: Elevated Scaffolding & Tower',
      severity: 'WARNING',
      type: 'PARTIAL_PPE_WARNING',
      message: 'Worker on landing platform detected without high-visibility safety vest.',
      violations: ['Missing Hi-Vis Vest'],
      acknowledged: true,
      resolved: false,
      isRealAi: false,
    },
  ]);

  // Detection History Logs for Reports
  const [detectionLogs, setDetectionLogs] = useState<DetectionLogRecord[]>([
    {
      id: 'log-001',
      timestamp: '09:30:15 AM',
      zone: 'Zone B: Elevated Scaffolding & Tower',
      totalPeople: 2,
      compliantCount: 1,
      violationsCount: 1,
      helmetComplianceRate: 100,
      vestComplianceRate: 50,
      hazardLevel: 'MEDIUM',
      source: 'Test Bench',
      isRealAi: false,
    },
  ]);

  // Modals
  const [isTestBenchOpen, setIsTestBenchOpen] = useState<boolean>(false);
  const [isTrainingLabModalOpen, setIsTrainingLabModalOpen] = useState<boolean>(false);

  // Check Backend Status
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'online') {
          setIsModelConnected(Boolean(data.hasApiKey));
        }
      })
      .catch((e) => console.warn('Status check warning:', e));
  }, []);

  const addSignalingLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSignalingLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 20)]);
  };

  // Continuous listener for live phone stream relay frames via SSE + HTTP Polling
  useEffect(() => {
    if (isPhoneBroadcasterMode) return;

    let eventSource: EventSource | null = null;
    let pollTimer: NodeJS.Timeout | null = null;
    let lastFrameTime = 0;

    try {
      eventSource = new EventSource(`/api/phone-stream/events?sessionId=${encodeURIComponent(sessionId)}`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.frameBase64) {
            setLatestPhoneFrame(data.frameBase64);
            setIsPhoneConnected(true);
            setPhoneStreamSourceType((prev) => (prev === 'webrtc' ? 'webrtc' : 'relay'));
            lastFrameTime = Date.now();
          }
        } catch {}
      };
      eventSource.onerror = () => {
        // SSE transient error, polling backup handles
      };
    } catch {}

    // Polling backup to guarantee frames arrive regardless of network/proxy
    pollTimer = setInterval(async () => {
      try {
        const res = await fetch(`/api/phone-stream/latest?sessionId=${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (data.frame) {
          setLatestPhoneFrame(data.frame);
          setIsPhoneConnected(true);
          setPhoneStreamSourceType((prev) => (prev === 'webrtc' ? 'webrtc' : 'relay'));
          lastFrameTime = Date.now();
        } else if (Date.now() - lastFrameTime > 12000 && !remotePhoneStream) {
          // If no frame and no WebRTC track for 12 seconds, update status
          setIsPhoneConnected(false);
          setPhoneStreamSourceType('none');
        }
      } catch {}
    }, 1200);

    return () => {
      if (eventSource) eventSource.close();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [sessionId, isPhoneBroadcasterMode, remotePhoneStream]);

  // Initialize WebRTC on Laptop Dashboard to receive stream from paired phone
  useEffect(() => {
    if (isPhoneBroadcasterMode) return;

    addSignalingLog(`Registered as laptop receiver for session: ${sessionId}`);

    laptopRtcRef.current = new SiteSentryWebRtc(sessionId, 'laptop', {
      onRemoteStream: (stream) => {
        addSignalingLog('Remote camera video track received from mobile phone!');
        setRemotePhoneStream(stream);
        setIsPhoneConnected(true);
        setPhoneStreamSourceType('webrtc');
      },
      onConnectionStateChange: (state) => {
        setWebrtcState(state);
        addSignalingLog(`P2P Connection State: ${state}`);
        if (state === 'connected') {
          setIsPhoneConnected(true);
          setPhoneStreamSourceType('webrtc');
        } else if (state === 'disconnected' || state === 'failed') {
          // Keep relay active if frames are coming
          setRemotePhoneStream(null);
        }
      },
      onPeerJoined: () => {
        addSignalingLog('Mobile phone has joined signaling session.');
      },
      onPeerLeft: () => {
        addSignalingLog('Mobile phone disconnected.');
        if (!latestPhoneFrame) {
          setIsPhoneConnected(false);
        }
        setRemotePhoneStream(null);
      },
      onError: (err) => {
        addSignalingLog(`Signaling notice: ${err}`);
      },
    });

    laptopRtcRef.current.init().catch((e) => console.warn(e));

    return () => {
      laptopRtcRef.current?.disconnect();
      laptopRtcRef.current = null;
    };
  }, [sessionId, isPhoneBroadcasterMode, latestPhoneFrame]);

  // Handle Detection Updates
  const handleDetectionUpdate = useCallback(
    (result: DetectionResult, _snapshotUrl?: string) => {
      const persons = result.persons || [];
      const total = persons.length;
      const compliant = persons.filter((p) => p.status === 'COMPLIANT').length;
      const violations = persons.filter((p) => p.status === 'VIOLATION').length;
      const warnings = persons.filter((p) => p.status === 'WARNING').length;

      const wearingHelmet = persons.filter((p) => p.hasHelmet).length;
      const wearingVest = persons.filter((p) => p.hasVest).length;

      setTotalPersonnel(total);
      setCompliantCount(compliant);
      setViolationCount(violations);
      setWarningCount(warnings);

      const hRate = total > 0 ? Math.round((wearingHelmet / total) * 100) : 100;
      const vRate = total > 0 ? Math.round((wearingVest / total) * 100) : 100;
      setHelmetAdherencePct(hRate);
      setVestAdherencePct(vRate);

      // Append to Detection Log
      setDetectionLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          zone: currentZone,
          totalPeople: total,
          compliantCount: compliant,
          violationsCount: violations + warnings,
          helmetComplianceRate: hRate,
          vestComplianceRate: vRate,
          hazardLevel: result.overallHazardLevel,
          source: isPhoneConnected ? 'Live Camera' : 'Laptop Webcam',
          isRealAi: result.isRealAi,
        },
        ...prev.slice(0, 99),
      ]);
    },
    [currentZone, isPhoneConnected]
  );

  const handleTriggerAlert = useCallback((alert: SafetyAlert) => {
    setAlerts((prev) => [alert, ...prev.slice(0, 49)]);
    setActiveToastAlert(alert);
    // Auto dismiss after 6 seconds
    setTimeout(() => {
      setActiveToastAlert((current) => (current?.id === alert.id ? null : current));
    }, 6000);
  }, []);

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
    );
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              resolved: true,
              acknowledged: true,
              resolvedAt: new Date().toLocaleTimeString(),
            }
          : a
      )
    );
  };

  const handleClearAllAlerts = () => {
    setAlerts([]);
  };

  const handleGenerateNewSession = () => {
    const nextSession = generateRandomSessionId();
    setSessionId(nextSession);
    setRemotePhoneStream(null);
    setIsPhoneConnected(false);
  };

  const handleDisconnectPhone = () => {
    laptopRtcRef.current?.disconnect();
    setRemotePhoneStream(null);
    setLatestPhoneFrame(null);
    setPhoneStreamSourceType('none');
    setIsPhoneConnected(false);
    handleGenerateNewSession();
  };

  // If URL specified phone broadcaster role, render the phone camera view directly
  if (isPhoneBroadcasterMode) {
    return (
      <PhoneCameraBroadcaster
        sessionId={sessionId}
        onExitPhoneMode={() => {
          window.history.pushState({}, '', '/');
          setIsPhoneBroadcasterMode(false);
        }}
      />
    );
  }

  // Calculate overall Site Safety Index
  const totalIssues = violationCount * 2 + warningCount;
  let safetyScore = 100;
  if (totalPersonnel > 0) {
    const penalty = (totalIssues / (totalPersonnel * 2)) * 100;
    safetyScore = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        isPhoneConnected={isPhoneConnected}
        activeViolationsCount={alerts.filter((a) => !a.resolved).length}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="bg-slate-950/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-300 hidden sm:inline">Active Zone:</span>
              <select
                value={currentZone}
                onChange={(e) => setCurrentZone(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-semibold text-amber-400 focus:outline-none"
              >
                {SITE_ZONES.map((z) => (
                  <option key={z.id} value={z.name}>
                    {z.name} ({z.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Status Actions */}
          <div className="flex items-center space-x-2.5">
            {/* Phone WebRTC Pill */}
            <button
              onClick={() => setCurrentView('phone')}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isPhoneConnected
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isPhoneConnected ? 'Phone: Streaming' : 'Pair Phone'}
              </span>
            </button>

            {/* Test Bench Button */}
            <button
              onClick={() => setIsTestBenchOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-cyan-400 hover:text-cyan-300 hidden sm:flex items-center gap-1.5"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Test Images</span>
            </button>

            {/* Engine Mode Pill */}
            <div className="hidden md:flex items-center space-x-1.5 bg-slate-900 border border-slate-800 px-3 py-1 rounded-xl text-xs">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-300">
                {engineMode === 'REAL_GEMINI' ? 'Gemini 3.8 Flash' : 'Demo Benchmark'}
              </span>
            </div>
          </div>
        </header>

        {/* View Router */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
          {/* Active Code Red Emergency Announcement Banner */}
          {criticalSituation.isActive && (
            <div className="p-4 sm:p-5 rounded-3xl bg-red-950/80 border-2 border-red-500 shadow-2xl shadow-red-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 rounded-2xl bg-red-600 text-white shrink-0 shadow-lg shadow-red-600/50">
                  <AlertOctagon className="w-6 h-6 animate-spin" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-600 text-white">
                      CODE RED EMERGENCY ACTIVE
                    </span>
                    <span className="text-xs font-mono text-red-200 font-bold">{criticalSituation.zone}</span>
                  </div>
                  <p className="text-xs font-semibold text-white mt-1">
                    {criticalSituation.reason}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 shrink-0">
                <button
                  onClick={() => soundManager.playCriticalBreach()}
                  className="px-3.5 py-2 rounded-xl bg-red-900/60 hover:bg-red-800 border border-red-500/40 text-xs font-bold text-red-200 cursor-pointer flex items-center gap-1.5"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Siren Alarm</span>
                </button>
                <button
                  onClick={handleResolveCriticalEmergency}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Clear Emergency
                </button>
              </div>
            </div>
          )}

          {currentView === 'dashboard' && (
            <div className="space-y-6">
              {/* Master 1-Click Detection Bar & Camera Quick Guide */}
              <MasterDetectionBar
                isDetectionRunning={isDetectionRunning}
                onToggleDetection={handleToggleDetection}
                isCameraActive={isCameraActive}
                onToggleCamera={handleToggleCamera}
                isPhoneConnected={isPhoneConnected}
                inspectionMode={inspectionMode}
                onUpdateInspectionMode={setInspectionMode}
                onOpenPhonePairing={() => setCurrentView('phone')}
                onOpenTestBench={() => setIsTestBenchOpen(true)}
                onTriggerCriticalEmergency={() => handleTriggerCriticalEmergency()}
                isCriticalEmergencyActive={criticalSituation.isActive}
              />

              {/* Executive KPI Cards */}
              <DashboardMetrics
                totalPersonnel={totalPersonnel}
                compliantCount={compliantCount}
                violationCount={violationCount}
                warningCount={warningCount}
                helmetAdherencePct={helmetAdherencePct}
                vestAdherencePct={vestAdherencePct}
                engineMode={engineMode}
                isModelConnected={isModelConnected}
              />

              {/* Split View: Live Monitor Card + Hazard Alerts Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Live Video Stream & AI Bounding Boxes
                    </h3>
                    <button
                      onClick={() => setCurrentView('camera')}
                      className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Full Monitor</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <LiveMonitorView
                    remotePhoneStream={remotePhoneStream}
                    latestPhoneFrame={latestPhoneFrame}
                    phoneStreamSourceType={phoneStreamSourceType}
                    isPhoneConnected={isPhoneConnected}
                    engineMode={engineMode}
                    currentZone={currentZone}
                    confidenceThreshold={settings.confidenceThreshold}
                    inspectionMode={inspectionMode}
                    onUpdateInspectionMode={setInspectionMode}
                    onDetectionUpdate={handleDetectionUpdate}
                    onTriggerAlert={handleTriggerAlert}
                    onOpenPhonePairing={() => setCurrentView('phone')}
                    isDetectionRunning={isDetectionRunning}
                    onToggleDetection={handleToggleDetection}
                  />
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Active Safety Incidents
                    </h3>
                    <button
                      onClick={() => setCurrentView('alerts')}
                      className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>All Alerts</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <HazardAlertsPanel
                    alerts={alerts}
                    onAcknowledgeAlert={handleAcknowledgeAlert}
                    onResolveAlert={handleResolveAlert}
                    onClearAllAlerts={handleClearAllAlerts}
                    onTriggerCriticalEmergency={() => handleTriggerCriticalEmergency()}
                  />
                </div>
              </div>

              {/* Interactive Construction Site Blueprint */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Interactive Construction Site Map & Checkpoints
                  </h3>
                  <button
                    onClick={() => setCurrentView('sitemap')}
                    className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Inspect Blueprint</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <SiteMap
                  activeZoneId={currentZone}
                  onSelectZone={(zone) => setCurrentZone(zone.name)}
                  activeViolationsZone={violationCount > 0 ? currentZone : null}
                />
              </div>
            </div>
          )}

          {currentView === 'camera' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-white">Live Camera Safety Monitor</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time video feed with AI-detected worker, helmet, and safety vest bounding boxes
                  </p>
                </div>

                {!isPhoneConnected && (
                  <button
                    onClick={() => setCurrentView('phone')}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>Pair Phone Camera</span>
                  </button>
                )}
              </div>

              <LiveMonitorView
                remotePhoneStream={remotePhoneStream}
                latestPhoneFrame={latestPhoneFrame}
                phoneStreamSourceType={phoneStreamSourceType}
                isPhoneConnected={isPhoneConnected}
                engineMode={engineMode}
                currentZone={currentZone}
                confidenceThreshold={settings.confidenceThreshold}
                inspectionMode={inspectionMode}
                onUpdateInspectionMode={setInspectionMode}
                onDetectionUpdate={handleDetectionUpdate}
                onTriggerAlert={handleTriggerAlert}
                onOpenPhonePairing={() => setCurrentView('phone')}
                isDetectionRunning={isDetectionRunning}
                onToggleDetection={handleToggleDetection}
              />
            </div>
          )}

          {currentView === 'phone' && (
            <PhonePairingView
              sessionId={sessionId}
              isPhoneConnected={isPhoneConnected}
              webrtcState={webrtcState}
              signalingLogs={signalingLogs}
              onGenerateNewSession={handleGenerateNewSession}
              onDisconnectPhone={handleDisconnectPhone}
              onGoToLiveMonitor={() => setCurrentView('camera')}
            />
          )}

          {currentView === 'sitemap' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">Construction Site Blueprint</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Interactive hazard zones, Main Gate, Medical Camp, Emergency Exit, and Safety Office
                </p>
              </div>

              <SiteMap
                activeZoneId={currentZone}
                onSelectZone={(zone) => setCurrentZone(zone.name)}
                activeViolationsZone={violationCount > 0 ? currentZone : null}
              />
            </div>
          )}

          {currentView === 'alerts' && (
            <div className="space-y-4 max-w-5xl">
              <div>
                <h2 className="text-xl font-extrabold text-white">Incident Command & Alerts</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage detected safety violations with Acknowledge and Resolve controls
                </p>
              </div>

              <HazardAlertsPanel
                alerts={alerts}
                onAcknowledgeAlert={handleAcknowledgeAlert}
                onResolveAlert={handleResolveAlert}
                onClearAllAlerts={handleClearAllAlerts}
                onTriggerCriticalEmergency={() => handleTriggerCriticalEmergency()}
              />
            </div>
          )}

          {currentView === 'reports' && (
            <ReportsView
              detectionLogs={detectionLogs}
              alerts={alerts}
              overallSafetyIndex={safetyScore}
            />
          )}

          {currentView === 'training' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">Model Training & Architecture Lab</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Custom YOLOv8 training pipelines, spatial PPE containment algorithms, and college viva preparation
                </p>
              </div>

              <ModelTrainingLab
                isOpen={true}
                onClose={() => setCurrentView('dashboard')}
              />
            </div>
          )}

          {currentView === 'settings' && (
            <SettingsView
              settings={settings}
              engineMode={engineMode}
              onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
              onUpdateEngineMode={setEngineMode}
              isModelConnected={isModelConnected}
            />
          )}
        </main>
      </div>

      {/* Real-time Safety Alert Notification Toast */}
      {activeToastAlert && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full bg-slate-900 border-2 border-red-500/80 rounded-2xl p-4 shadow-2xl shadow-red-500/25 backdrop-blur-md animate-bounce select-none">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-red-500/20 text-red-400 shrink-0">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-500/20 text-red-300">
                    {activeToastAlert.severity}
                  </span>
                  <span className="text-xs font-bold text-white">{activeToastAlert.zone}</span>
                </div>
                <p className="text-xs text-slate-200 mt-1 font-semibold leading-relaxed">
                  {activeToastAlert.message}
                </p>
                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800 text-[10px]">
                  <span className="text-amber-400 font-mono">
                    Mode: {inspectionMode.replace('_', ' ')}
                  </span>
                  <button
                    onClick={() => {
                      setCurrentView('alerts');
                      setActiveToastAlert(null);
                    }}
                    className="text-amber-400 font-bold hover:underline"
                  >
                    View in Alerts &rarr;
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setActiveToastAlert(null)}
              className="text-slate-400 hover:text-white text-xs font-bold p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Global Benchmark Image Test Bench Modal */}
      <SampleGalleryModal
        isOpen={isTestBenchOpen}
        onClose={() => setIsTestBenchOpen(false)}
        engineMode={engineMode}
        onApplyScenarioResult={(res, img, z) => {
          setCurrentZone(z);
          handleDetectionUpdate(res, img);
        }}
      />

      {/* Critical Situation Emergency / Code Red Incident Containment Modal */}
      <CriticalSituationEmergencyModal
        situation={criticalSituation}
        onDispatchMedical={handleDispatchMedical}
        onHaltMachinery={handleHaltMachinery}
        onToggleEvacuation={handleToggleEvacuation}
        onResolveSituation={handleResolveCriticalEmergency}
        onGoToSiteMap={() => {
          setCriticalSituation((prev) => ({ ...prev, isActive: false }));
          setCurrentView('sitemap');
        }}
      />
    </div>
  );
}
