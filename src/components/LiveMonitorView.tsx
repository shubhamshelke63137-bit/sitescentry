import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  Smartphone, 
  Upload, 
  Scan, 
  SwitchCamera, 
  Maximize2, 
  Minimize2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Cpu, 
  Pause,
  Play,
  Volume2,
  VolumeX,
  Bell,
  HardHat,
  Shield,
  Layers,
  Sparkles,
  Square
} from 'lucide-react';
import { 
  DetectedPerson, 
  DetectionResult, 
  InspectionMode, 
  ModelEngineMode, 
  SafetyAlert 
} from '../types';
import { notificationService } from '../utils/notificationService';

interface LiveMonitorViewProps {
  remotePhoneStream: MediaStream | null;
  isPhoneConnected: boolean;
  engineMode: ModelEngineMode;
  currentZone: string;
  confidenceThreshold: number;
  inspectionMode: InspectionMode;
  onUpdateInspectionMode: (mode: InspectionMode) => void;
  onDetectionUpdate: (result: DetectionResult, snapshotUrl?: string) => void;
  onTriggerAlert: (alert: SafetyAlert) => void;
  onOpenPhonePairing: () => void;
  isDetectionRunning?: boolean;
  onToggleDetection?: () => void;
}

export const LiveMonitorView: React.FC<LiveMonitorViewProps> = ({
  remotePhoneStream,
  isPhoneConnected,
  engineMode,
  currentZone,
  confidenceThreshold,
  inspectionMode,
  onUpdateInspectionMode,
  onDetectionUpdate,
  onTriggerAlert,
  onOpenPhonePairing,
  isDetectionRunning = true,
  onToggleDetection,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  type StreamSource = 'phone_webrtc' | 'laptop_webcam' | 'uploaded_media';
  const [sourceType, setSourceType] = useState<StreamSource>(
    isPhoneConnected ? 'phone_webrtc' : 'laptop_webcam'
  );

  const [isMonitoring, setIsMonitoring] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [autoScanInterval, setAutoScanInterval] = useState<number>(8); // default to 8s to conserve quota
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [localWebcamStream, setLocalWebcamStream] = useState<MediaStream | null>(null);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [currentDetections, setCurrentDetections] = useState<DetectedPerson[]>([]);
  const [overallHazard, setOverallHazard] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [desktopNotifGranted, setDesktopNotifGranted] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });

  // Switch to phone stream if phone becomes connected
  useEffect(() => {
    if (isPhoneConnected && remotePhoneStream) {
      setSourceType('phone_webrtc');
      if (videoRef.current) {
        videoRef.current.srcObject = remotePhoneStream;
        videoRef.current.play().catch((e) => console.warn(e));
      }
    }
  }, [isPhoneConnected, remotePhoneStream]);

  // Handle stream source changes
  useEffect(() => {
    if (sourceType === 'phone_webrtc') {
      if (localWebcamStream) {
        localWebcamStream.getTracks().forEach((t) => t.stop());
        setLocalWebcamStream(null);
      }
      if (videoRef.current && remotePhoneStream) {
        videoRef.current.srcObject = remotePhoneStream;
        videoRef.current.play().catch((e) => console.warn(e));
      }
    } else if (sourceType === 'laptop_webcam') {
      startLaptopWebcam(facingMode);
    }
  }, [sourceType]);

  // Helper to wrap getUserMedia with a safe timeout
  const getMediaStreamWithTimeout = (
    constraints: MediaStreamConstraints,
    timeoutMs: number = 4500
  ): Promise<MediaStream> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Timeout starting video source'));
      }, timeoutMs);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        clearTimeout(timer);
        reject(new Error('MediaDevices API not supported in this browser environment.'));
        return;
      }

      navigator.mediaDevices
        .getUserMedia(constraints)
        .then((stream) => {
          clearTimeout(timer);
          resolve(stream);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  };

  // Start local laptop webcam with multi-tier fallback
  const startLaptopWebcam = async (facing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    try {
      if (localWebcamStream) {
        localWebcamStream.getTracks().forEach((t) => t.stop());
      }

      let stream: MediaStream;
      try {
        // Tier 1: Try requested facing mode and resolution with 4.5s timeout
        stream = await getMediaStreamWithTimeout(
          {
            video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          },
          4500
        );
      } catch (firstErr: any) {
        console.warn('High-res webcam constraints timed out or unsupported, trying basic video fallback:', firstErr?.message);
        // Tier 2: Try basic video constraints with 3.5s timeout
        stream = await getMediaStreamWithTimeout({ video: true, audio: false }, 3500);
      }

      setLocalWebcamStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => console.warn(e));
      }
      setCameraError(null);
    } catch (err: any) {
      console.warn('Webcam initialization notice:', err?.message || err);
      let errorDesc = 'Laptop camera is unavailable or timed out.';
      if (err?.name === 'NotAllowedError') {
        errorDesc = 'Camera permission not granted. Please allow camera access in your browser.';
      } else if (err?.name === 'NotFoundError') {
        errorDesc = 'No physical webcam detected on this device.';
      } else if (err?.message?.includes('Timeout')) {
        errorDesc = 'Webcam initialization timed out. Connect your phone camera or use the Test Bench gallery!';
      }
      setCameraError(errorDesc);
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (localWebcamStream) {
      localWebcamStream.getTracks().forEach((t) => t.stop());
      setLocalWebcamStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    clearCanvas();
  };

  const resumeMonitoring = () => {
    setIsMonitoring(true);
    if (sourceType === 'laptop_webcam') {
      startLaptopWebcam(facingMode);
    } else if (sourceType === 'phone_webrtc' && remotePhoneStream && videoRef.current) {
      videoRef.current.srcObject = remotePhoneStream;
      videoRef.current.play().catch((e) => console.warn(e));
    }
  };

  const toggleFacingMode = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    if (sourceType === 'laptop_webcam') {
      startLaptopWebcam(next);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Toggle voice announcements
  const toggleVoiceAlerts = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    notificationService.speechEnabled = next;
    if (next) {
      notificationService.speakAlert('Voice safety alerts enabled');
    }
  };

  // Enable desktop push notifications
  const handleEnableDesktopNotifications = async () => {
    const granted = await notificationService.requestDesktopPermission();
    setDesktopNotifGranted(granted);
    if (granted) {
      notificationService.showDesktopNotification(
        'SiteSentry AI Notifications Active',
        'You will receive instant alerts when a worker violates PPE safety requirements.'
      );
    }
  };

  // Draw Bounding Boxes with PPE Tags based on current Inspection Mode
  const drawBoundingBoxes = useCallback(
    (persons: DetectedPerson[], videoWidth: number, videoHeight: number, mode: InspectionMode) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = videoWidth;
      canvas.height = videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      persons.forEach((person, idx) => {
        const [ymin, xmin, ymax, xmax] = person.box2d;
        const boxX = (xmin / 1000) * videoWidth;
        const boxY = (ymin / 1000) * videoHeight;
        const boxW = ((xmax - xmin) / 1000) * videoWidth;
        const boxH = ((ymax - ymin) / 1000) * videoHeight;

        let strokeColor = '#10B981'; // Green
        let bgColor = 'rgba(16, 185, 129, 0.15)';
        let badgeText = `Worker #${idx + 1} [COMPLIANT: Full PPE]`;

        // Apply Inspection Mode filter to visual tags
        if (mode === 'HELMET_ONLY') {
          if (person.hasHelmet) {
            strokeColor = '#10B981';
            bgColor = 'rgba(16, 185, 129, 0.18)';
            badgeText = `Worker #${idx + 1} [✓ HELMET SECURE]`;
          } else {
            strokeColor = '#EF4444';
            bgColor = 'rgba(239, 68, 68, 0.22)';
            badgeText = `Worker #${idx + 1} [✕ MISSING HELMET!]`;
          }
        } else if (mode === 'VEST_ONLY') {
          if (person.hasVest) {
            strokeColor = '#10B981';
            bgColor = 'rgba(16, 185, 129, 0.18)';
            badgeText = `Worker #${idx + 1} [✓ SAFETY JACKET SECURE]`;
          } else {
            strokeColor = '#EF4444';
            bgColor = 'rgba(239, 68, 68, 0.22)';
            badgeText = `Worker #${idx + 1} [✕ MISSING SAFETY JACKET!]`;
          }
        } else {
          // Full PPE mode
          if (person.status === 'VIOLATION') {
            strokeColor = '#EF4444';
            bgColor = 'rgba(239, 68, 68, 0.22)';
            badgeText = `Worker #${idx + 1} [BREACH: ${person.violations.join(', ') || 'No PPE'}]`;
          } else if (person.status === 'WARNING') {
            strokeColor = '#F59E0B';
            bgColor = 'rgba(245, 158, 11, 0.18)';
            badgeText = `Worker #${idx + 1} [WARN: ${person.violations.join(', ') || 'Partial PPE'}]`;
          }
        }

        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();

        // Draw Helmet Sub-Box (relevant for HELMET_ONLY and FULL_PPE)
        if (mode !== 'VEST_ONLY' && person.helmetBox && person.helmetBox.length === 4) {
          const [h_ymin, h_xmin, h_ymax, h_xmax] = person.helmetBox;
          const hX = (h_xmin / 1000) * videoWidth;
          const hY = (h_ymin / 1000) * videoHeight;
          const hW = ((h_xmax - h_xmin) / 1000) * videoWidth;
          const hH = ((h_ymax - h_ymin) / 1000) * videoHeight;

          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 2]);
          ctx.strokeRect(hX, hY, hW, hH);
          ctx.setLineDash([]);
          ctx.fillStyle = '#0284C7';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('✓ Hard Hat', hX + 4, Math.max(hY - 4, 12));
        }

        // Draw Vest Sub-Box (relevant for VEST_ONLY and FULL_PPE)
        if (mode !== 'HELMET_ONLY' && person.vestBox && person.vestBox.length === 4) {
          const [v_ymin, v_xmin, v_ymax, v_xmax] = person.vestBox;
          const vX = (v_xmin / 1000) * videoWidth;
          const vY = (v_ymin / 1000) * videoHeight;
          const vW = ((v_xmax - v_xmin) / 1000) * videoWidth;
          const vH = ((v_ymax - v_ymin) / 1000) * videoHeight;

          ctx.strokeStyle = '#F97316';
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 2]);
          ctx.strokeRect(vX, vY, vW, vH);
          ctx.setLineDash([]);
          ctx.fillStyle = '#EA580C';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('✓ Safety Jacket', vX + 4, Math.max(vY - 4, 12));
        }

        // Header Label Plate
        ctx.font = 'bold 12px sans-serif';
        const labelWidth = ctx.measureText(badgeText).width + 16;
        const labelHeight = 24;

        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.roundRect(boxX, Math.max(0, boxY - labelHeight), labelWidth, labelHeight, [4, 4, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(badgeText, boxX + 8, Math.max(0, boxY - labelHeight) + 16);

        // Confidence Tag
        const confText = `${Math.round(person.confidence * 100)}% conf`;
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(boxX + boxW - 65, boxY + boxH - 18, 60, 16);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(confText, boxX + boxW - 60, boxY + boxH - 6);

        ctx.restore();
      });
    },
    []
  );

  // Capture frame and send to AI Object Detection API
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || isAnalyzing || !isMonitoring) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    setIsAnalyzing(true);
    const startTime = Date.now();

    try {
      const offscreen = document.createElement('canvas');
      const targetWidth = 640;
      const scale = targetWidth / video.videoWidth;
      offscreen.width = targetWidth;
      offscreen.height = video.videoHeight * scale;

      const offCtx = offscreen.getContext('2d');
      if (!offCtx) {
        setIsAnalyzing(false);
        return;
      }

      offCtx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
      const snapshotUrl = offscreen.toDataURL('image/jpeg', 0.85);

      if (engineMode === 'REAL_GEMINI') {
        const response = await fetch('/api/analyze-frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: snapshotUrl,
            mimeType: 'image/jpeg',
            locationZone: currentZone,
            minConfidence: confidenceThreshold,
          }),
        });

        const resData = await response.json();
        const latency = Date.now() - startTime;
        setLastLatency(latency);

        if (response.ok && resData.success && resData.data) {
          let detectedPersons: DetectedPerson[] = resData.data.persons || [];

          // Re-evaluate person status and violations according to user's InspectionMode!
          detectedPersons = detectedPersons.map((person) => {
            if (inspectionMode === 'HELMET_ONLY') {
              if (person.hasHelmet) {
                return { ...person, status: 'COMPLIANT', violations: [] };
              } else {
                return { ...person, status: 'VIOLATION', violations: ['Missing Safety Helmet'] };
              }
            } else if (inspectionMode === 'VEST_ONLY') {
              if (person.hasVest) {
                return { ...person, status: 'COMPLIANT', violations: [] };
              } else {
                return { ...person, status: 'VIOLATION', violations: ['Missing Safety Jacket'] };
              }
            }
            return person; // default full PPE mode
          });

          // Compute overall hazard according to active mode
          let hazard: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
          if (detectedPersons.some((p) => p.status === 'VIOLATION')) {
            hazard = 'HIGH';
          } else if (detectedPersons.some((p) => p.status === 'WARNING')) {
            hazard = 'MEDIUM';
          }

          setCurrentDetections(detectedPersons);
          setOverallHazard(hazard);

          drawBoundingBoxes(detectedPersons, video.videoWidth, video.videoHeight, inspectionMode);

          const isQuota = Boolean(resData.isQuotaExceeded);
          if (isQuota) {
            setIsQuotaExceeded(true);
          }
          setCameraError(null);

          onDetectionUpdate(
            {
              persons: detectedPersons,
              overallHazardLevel: hazard,
              safetySummary: resData.data.safetySummary || 'AI analysis completed.',
              actionableAdvice: resData.data.actionableAdvice,
              timestamp: new Date().toISOString(),
              latencyMs: latency,
              isRealAi: !isQuota,
              modelName: resData.modelName || (isQuota ? 'Local Vision Fallback' : 'Gemini Vision AI'),
            },
            snapshotUrl
          );

          // Dispatch multi-channel notifications (Sound + Voice Speech + Desktop Push + Vibration)
          const violationsList = detectedPersons.filter((p) => p.status === 'VIOLATION');
          const warningsList = detectedPersons.filter((p) => p.status === 'WARNING');

          if (violationsList.length > 0) {
            const allBreaches = Array.from(new Set(violationsList.flatMap((v) => v.violations)));
            notificationService.dispatchViolationNotice(currentZone, allBreaches, true);

            violationsList.forEach((violator) => {
              onTriggerAlert({
                id: `alert-${Date.now()}-${violator.id}`,
                timestamp: new Date().toLocaleTimeString(),
                zone: currentZone,
                severity: 'CRITICAL',
                type: 'CRITICAL_PPE_BREACH',
                message: `Worker in ${currentZone} missing required gear: ${violator.violations.join(', ')}`,
                personId: violator.id,
                violations: violator.violations,
                snapshotDataUrl: snapshotUrl,
                acknowledged: false,
                resolved: false,
                isRealAi: !isQuota,
              });
            });
          } else if (warningsList.length > 0) {
            const allWarns = Array.from(new Set(warningsList.flatMap((w) => w.violations)));
            notificationService.dispatchViolationNotice(currentZone, allWarns, false);

            warningsList.forEach((warn) => {
              onTriggerAlert({
                id: `alert-${Date.now()}-${warn.id}`,
                timestamp: new Date().toLocaleTimeString(),
                zone: currentZone,
                severity: 'WARNING',
                type: 'PARTIAL_PPE_WARNING',
                message: `Partial PPE identified: ${warn.violations.join(', ')}`,
                personId: warn.id,
                violations: warn.violations,
                snapshotDataUrl: snapshotUrl,
                acknowledged: false,
                resolved: false,
                isRealAi: !isQuota,
              });
            });
          }
        } else if (!resData.success && !resData.isQuotaExceeded) {
          setCameraError(resData.error || 'AI analysis failed.');
        }
      } else {
        // DEMO BENCHMARK MODE
        const latency = 120 + Math.floor(Math.random() * 50);
        setLastLatency(latency);

        let simulated: DetectedPerson[] = [
          {
            id: 'demo-worker-1',
            box2d: [160, 260, 860, 740],
            hasHelmet: true,
            hasVest: true,
            helmetBox: [160, 420, 290, 580],
            vestBox: [330, 320, 690, 670],
            confidence: 0.94,
            status: 'COMPLIANT',
            violations: [],
            roleOrActivity: 'Benchmark Worker',
          },
        ];

        if (inspectionMode === 'HELMET_ONLY') {
          simulated[0].violations = [];
          simulated[0].status = 'COMPLIANT';
        } else if (inspectionMode === 'VEST_ONLY') {
          simulated[0].violations = [];
          simulated[0].status = 'COMPLIANT';
        }

        setCurrentDetections(simulated);
        setOverallHazard('LOW');
        drawBoundingBoxes(simulated, video.videoWidth, video.videoHeight, inspectionMode);

        onDetectionUpdate(
          {
            persons: simulated,
            overallHazardLevel: 'LOW',
            safetySummary: 'Demo Mode: Simulated calibration.',
            timestamp: new Date().toISOString(),
            latencyMs: latency,
            isRealAi: false,
            modelName: 'Demo Simulation Benchmark',
          },
          snapshotUrl
        );
      }
    } catch (err: any) {
      console.error('Frame analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    isMonitoring,
    isAnalyzing,
    engineMode,
    currentZone,
    confidenceThreshold,
    inspectionMode,
    drawBoundingBoxes,
    onDetectionUpdate,
    onTriggerAlert,
  ]);

  // Auto-scan timer
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isMonitoring && isDetectionRunning && !isAnalyzing) {
      timer = setInterval(() => {
        captureAndAnalyze();
      }, autoScanInterval * 1000);
    } else if (!isDetectionRunning) {
      clearCanvas();
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isMonitoring, isDetectionRunning, autoScanInterval, isAnalyzing, captureAndAnalyze]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    setSourceType('uploaded_media');

    if (file.type.startsWith('video/')) {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = fileUrl;
        videoRef.current.loop = true;
        videoRef.current.play().catch((e) => console.warn(e));
      }
    } else {
      const img = new Image();
      img.onload = () => {
        if (canvasRef.current) {
          canvasRef.current.width = img.width;
          canvasRef.current.height = img.height;
          const ctx = canvasRef.current.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          captureAndAnalyze();
        }
      };
      img.src = fileUrl;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Inspection Mode Selector Bar (KEY REQUIREMENT: HELMET ONLY vs JACKET ONLY vs FULL PPE) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3.5 shadow-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-400" />
            Detection Mode:
          </span>

          <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-semibold gap-1">
            <button
              onClick={() => onUpdateInspectionMode('FULL_PPE')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                inspectionMode === 'FULL_PPE'
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Full PPE (Helmet + Jacket)</span>
            </button>

            <button
              onClick={() => onUpdateInspectionMode('HELMET_ONLY')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                inspectionMode === 'HELMET_ONLY'
                  ? 'bg-sky-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Checks specifically if someone is wearing a safety helmet/hard hat"
            >
              <HardHat className="w-3.5 h-3.5" />
              <span>Check Helmet Only</span>
            </button>

            <button
              onClick={() => onUpdateInspectionMode('VEST_ONLY')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                inspectionMode === 'VEST_ONLY'
                  ? 'bg-orange-500 text-slate-950 font-extrabold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Checks specifically if someone is wearing a safety jacket/vest"
            >
              <div className="w-3 h-3 rounded bg-orange-400 text-slate-950 font-black text-[9px] flex items-center justify-center">
                V
              </div>
              <span>Check Safety Jacket Only</span>
            </button>
          </div>
        </div>

        {/* Quick Notification Controls: Voice Speech & Desktop Push */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={toggleVoiceAlerts}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
              voiceEnabled
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
            title="Spoken voice alert announcements on detection"
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-400 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{voiceEnabled ? 'Voice Alerts ON' : 'Voice Muted'}</span>
          </button>

          {!desktopNotifGranted && (
            <button
              onClick={handleEnableDesktopNotifications}
              className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Allow browser notifications"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline">Enable Push Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* Stream Source Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setSourceType('phone_webrtc')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              sourceType === 'phone_webrtc'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Phone WebRTC Stream</span>
            {isPhoneConnected && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
            )}
          </button>

          <button
            onClick={() => setSourceType('laptop_webcam')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              sourceType === 'laptop_webcam'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Laptop Webcam</span>
          </button>

          <label className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload Media</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Latency and Zone */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 border border-slate-800 font-mono">
            {currentZone}
          </span>

          {lastLatency && (
            <span className="px-2 py-1 rounded-lg bg-slate-950 text-slate-400 border border-slate-800 font-mono">
              {lastLatency}ms latency
            </span>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Video Viewport Card */}
      <div
        ref={containerRef}
        className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col"
      >
        <div className="relative bg-black aspect-video sm:min-h-[460px] flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-contain ${isMonitoring ? 'block' : 'hidden'}`}
          />

          <canvas
            ref={canvasRef}
            className={`absolute inset-0 w-full h-full pointer-events-none object-contain ${
              isMonitoring ? 'block' : 'hidden'
            }`}
          />

          {isAnalyzing && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-bounce opacity-85 shadow-lg shadow-amber-500 pointer-events-none" />
          )}

          {sourceType === 'phone_webrtc' && !isPhoneConnected && (
            <div className="p-8 text-center max-w-md space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shadow-xl">
                <Smartphone className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">No Phone Stream Connected</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Open the pairing screen on your laptop, scan the QR code with your phone camera, and tap &quot;Start Broadcasting&quot;.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={onOpenPhonePairing}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Open Phone Pairing QR Code
                </button>
                <button
                  onClick={() => setSourceType('laptop_webcam')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
                >
                  Use Laptop Webcam
                </button>
              </div>
            </div>
          )}

          {!isMonitoring && (
            <div className="p-8 text-center max-w-sm space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center">
                <CameraOff className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-white">Monitoring Paused</h4>
              <p className="text-xs text-slate-400">Camera tracks released. Tap Resume to re-engage.</p>
              <button
                onClick={resumeMonitoring}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Resume Monitoring
              </button>
            </div>
          )}

          {/* Webcam Timeout / Error Fallback Notice */}
          {cameraError && sourceType === 'laptop_webcam' && (
            <div className="p-6 text-center max-w-md space-y-3 bg-slate-900/95 border border-slate-700 rounded-3xl backdrop-blur-md z-10 m-4 shadow-2xl">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <CameraOff className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">Camera Hardware Notice</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={onOpenPhonePairing}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Use Phone Camera (WebRTC)</span>
                </button>
                <button
                  onClick={() => startLaptopWebcam(facingMode)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
                >
                  Retry Camera
                </button>
                <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs cursor-pointer flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Media</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Quota Exceeded Notification Badge */}
          {isQuotaExceeded && (
            <div className="absolute top-4 right-4 bg-amber-950/90 border border-amber-500/50 text-amber-200 text-[11px] font-semibold px-3 py-1.5 rounded-xl backdrop-blur-md shadow-lg flex items-center gap-1.5 z-10 pointer-events-none">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Gemini Quota Exceeded (Free Tier: 20/day) • Local Vision Active</span>
            </div>
          )}

          {/* Real-time HUD Status Plate */}
          {isMonitoring && (
            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
              <div
                className={`px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs font-black flex items-center gap-2 shadow-lg ${
                  overallHazard === 'HIGH'
                    ? 'bg-red-500/30 border-red-500 text-red-100 animate-pulse'
                    : overallHazard === 'MEDIUM'
                    ? 'bg-amber-500/30 border-amber-500 text-amber-100'
                    : 'bg-emerald-500/30 border-emerald-500 text-emerald-100'
                }`}
              >
                {overallHazard === 'HIGH' ? (
                  <>
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>
                      {inspectionMode === 'HELMET_ONLY'
                        ? 'HELMET BREACH DETECTED'
                        : inspectionMode === 'VEST_ONLY'
                        ? 'SAFETY JACKET BREACH DETECTED'
                        : 'CRITICAL HAZARD DETECTED'}
                    </span>
                  </>
                ) : overallHazard === 'MEDIUM' ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>PARTIAL PPE WARNING</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      {inspectionMode === 'HELMET_ONLY'
                        ? 'ALL HELMETS VERIFIED'
                        : inspectionMode === 'VEST_ONLY'
                        ? 'ALL SAFETY JACKETS VERIFIED'
                        : 'SITE SAFETY COMPLIANT'}
                    </span>
                  </>
                )}
              </div>

              <div className="bg-slate-950/80 px-3 py-1 rounded-lg text-xs font-mono text-slate-300 border border-slate-800 backdrop-blur-sm flex items-center gap-2">
                <span>Mode: <b className="text-amber-400">{inspectionMode.replace('_', ' ')}</b></span>
                <span>•</span>
                <span>Workers: <b className="text-white">{currentDetections.length}</b></span>
              </div>
            </div>
          )}
        </div>

        {/* Viewport Control Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {onToggleDetection && (
              <button
                onClick={onToggleDetection}
                className={`px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                  isDetectionRunning
                    ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                }`}
              >
                {isDetectionRunning ? <Square className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-slate-950" />}
                <span>{isDetectionRunning ? 'STOP DETECTION' : 'START AI DETECTION'}</span>
              </button>
            )}

            {isMonitoring ? (
              <button
                onClick={stopMonitoring}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Pause camera feed"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={resumeMonitoring}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Resume Feed</span>
              </button>
            )}

            {sourceType === 'laptop_webcam' && (
              <button
                onClick={toggleFacingMode}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
                title="Flip Webcam"
              >
                <SwitchCamera className="w-4 h-4 text-amber-400" />
                <span>{facingMode === 'environment' ? 'Rear' : 'Front'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-3 text-xs text-slate-300">
            <span className="text-slate-400 hidden sm:inline">Scan Rate:</span>
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {[5, 8, 15, 30].map((sec) => (
                <button
                  key={sec}
                  onClick={() => setAutoScanInterval(sec)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                    autoScanInterval === sec
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={captureAndAnalyze}
              disabled={isAnalyzing || !isMonitoring}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-40 cursor-pointer"
            >
              <Scan className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing Frame...' : 'Scan Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
