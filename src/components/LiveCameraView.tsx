import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  RefreshCw, 
  SwitchCamera, 
  Scan, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  ShieldAlert, 
  Maximize2, 
  Minimize2,
  Cpu,
  Smartphone,
  Eye,
  Camera as CameraIcon
} from 'lucide-react';
import { DetectedPerson, DetectionResult, ModelEngineMode, SafetyAlert } from '../types';
import { soundManager } from '../utils/audioAlert';

interface LiveCameraViewProps {
  engineMode: ModelEngineMode;
  currentZone: string;
  onDetectionUpdate: (result: DetectionResult, snapshotUrl?: string) => void;
  onTriggerAlert: (alert: SafetyAlert) => void;
  onOpenMobileGuide: () => void;
}

export const LiveCameraView: React.FC<LiveCameraViewProps> = ({
  engineMode,
  currentZone,
  onDetectionUpdate,
  onTriggerAlert,
  onOpenMobileGuide,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState<boolean>(true);
  const [scanIntervalSeconds, setScanIntervalSeconds] = useState<number>(3);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [currentDetections, setCurrentDetections] = useState<DetectedPerson[]>([]);
  const [overallHazard, setOverallHazard] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Start Camera Stream
  const startCamera = async (preferredFacing: 'environment' | 'user' = facingMode) => {
    setCameraError(null);
    try {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: preferredFacing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraActive(true);
        };
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      let message = 'Could not access camera. Please allow camera permissions in your browser.';
      if (err.name === 'NotAllowedError') {
        message = 'Camera permission was denied. Tap the lock icon in the browser address bar to allow camera access.';
      } else if (err.name === 'NotFoundError') {
        message = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        message = 'Camera is currently in use by another application.';
      }
      setCameraError(message);
      setIsCameraActive(false);
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setCurrentDetections([]);
    clearCanvas();
  };

  // Toggle Camera Facing Mode (Front vs Back)
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isCameraActive) {
      startCamera(nextMode);
    }
  };

  // Clear canvas overlay
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  // Draw Bounding Boxes on Overlay Canvas
  const drawBoundingBoxes = useCallback(
    (persons: DetectedPerson[], videoWidth: number, videoHeight: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = videoWidth;
      canvas.height = videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      persons.forEach((person, idx) => {
        // [ymin, xmin, ymax, xmax] in 0-1000
        const [ymin, xmin, ymax, xmax] = person.box2d;
        const boxX = (xmin / 1000) * videoWidth;
        const boxY = (ymin / 1000) * videoHeight;
        const boxW = ((xmax - xmin) / 1000) * videoWidth;
        const boxH = ((ymax - ymin) / 1000) * videoHeight;

        let strokeColor = '#10B981'; // Green for COMPLIANT
        let bgColor = 'rgba(16, 185, 129, 0.15)';
        let badgeText = `Worker #${idx + 1}: Safe (Full PPE)`;

        if (person.status === 'VIOLATION') {
          strokeColor = '#EF4444'; // Red for VIOLATION
          bgColor = 'rgba(239, 68, 68, 0.2)';
          badgeText = `Worker #${idx + 1}: BREACH (${person.violations.join(', ') || 'No PPE'})`;
        } else if (person.status === 'WARNING') {
          strokeColor = '#F59E0B'; // Amber for WARNING
          bgColor = 'rgba(245, 158, 11, 0.18)';
          badgeText = `Worker #${idx + 1}: Warning (${person.violations.join(', ') || 'Partial PPE'})`;
        }

        // Draw Person Bounding Box
        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.fillStyle = bgColor;
        ctx.beginPath();
        // Rounded rectangle for person
        ctx.roundRect(boxX, boxY, boxW, boxH, 8);
        ctx.fill();
        ctx.stroke();

        // Draw Sub-box for Helmet if worn
        if (person.helmetBox && person.helmetBox.length === 4) {
          const [h_ymin, h_xmin, h_ymax, h_xmax] = person.helmetBox;
          const hX = (h_xmin / 1000) * videoWidth;
          const hY = (h_ymin / 1000) * videoHeight;
          const hW = ((h_xmax - h_xmin) / 1000) * videoWidth;
          const hH = ((h_ymax - h_ymin) / 1000) * videoHeight;

          ctx.strokeStyle = '#38BDF8'; // Sky blue for helmet
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 2]);
          ctx.strokeRect(hX, hY, hW, hH);
          ctx.setLineDash([]);
          // Helmet tag
          ctx.fillStyle = '#0284C7';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('✓ Hard Hat', hX + 4, Math.max(hY - 4, 12));
        }

        // Draw Sub-box for Vest if worn
        if (person.vestBox && person.vestBox.length === 4) {
          const [v_ymin, v_xmin, v_ymax, v_xmax] = person.vestBox;
          const vX = (v_xmin / 1000) * videoWidth;
          const vY = (v_ymin / 1000) * videoHeight;
          const vW = ((v_xmax - v_xmin) / 1000) * videoWidth;
          const vH = ((v_ymax - v_ymin) / 1000) * videoHeight;

          ctx.strokeStyle = '#F97316'; // Orange for vest
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 2]);
          ctx.strokeRect(vX, vY, vW, vH);
          ctx.setLineDash([]);
          // Vest tag
          ctx.fillStyle = '#EA580C';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText('✓ Safety Vest', vX + 4, Math.max(vY - 4, 12));
        }

        // Header Label Plate
        ctx.font = 'bold 12px sans-serif';
        const textMetrics = ctx.measureText(badgeText);
        const labelWidth = textMetrics.width + 16;
        const labelHeight = 24;

        ctx.fillStyle = strokeColor;
        ctx.beginPath();
        ctx.roundRect(boxX, Math.max(0, boxY - labelHeight), labelWidth, labelHeight, [4, 4, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(badgeText, boxX + 8, Math.max(0, boxY - labelHeight) + 16);

        // Confidence badge
        const confText = `${Math.round(person.confidence * 100)}% conf`;
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(boxX + boxW - 65, boxY + boxH - 18, 60, 16);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(confText, boxX + boxW - 60, boxY + boxH - 6);

        ctx.restore();
      });
    },
    []
  );

  // Capture frame from video and analyze
  const captureAndAnalyze = useCallback(async () => {
    if (!videoRef.current || !isCameraActive || isAnalyzing) return;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    setIsAnalyzing(true);
    const startTime = Date.now();

    try {
      // Capture frame to offscreen canvas
      const offscreen = document.createElement('canvas');
      // Downscale to 640 width for rapid AI transmission and low latency
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
          }),
        });

        const resData = await response.json();
        const latency = Date.now() - startTime;
        setLastLatency(latency);

        if (response.ok && resData.success && resData.data) {
          const detectedPersons: DetectedPerson[] = resData.data.persons || [];
          const hazard: 'LOW' | 'MEDIUM' | 'HIGH' = resData.data.overallHazardLevel || 'LOW';

          setCurrentDetections(detectedPersons);
          setOverallHazard(hazard);

          // Render Bounding Boxes
          drawBoundingBoxes(detectedPersons, video.videoWidth, video.videoHeight);

          // Notify parent
          onDetectionUpdate(
            {
              persons: detectedPersons,
              overallHazardLevel: hazard,
              safetySummary: resData.data.safetySummary || 'AI analysis completed.',
              actionableAdvice: resData.data.actionableAdvice,
              timestamp: new Date().toISOString(),
              latencyMs: latency,
              isRealAi: true,
              modelName: 'Gemini 3.8 Flash',
            },
            snapshotUrl
          );

          // Trigger audible alerts and incident notifications if violations exist
          const violationsList = detectedPersons.filter((p) => p.status === 'VIOLATION');
          const warningsList = detectedPersons.filter((p) => p.status === 'WARNING');

          if (violationsList.length > 0) {
            soundManager.playCriticalBreach();
            violationsList.forEach((violator) => {
              onTriggerAlert({
                id: `alert-${Date.now()}-${violator.id}`,
                timestamp: new Date().toLocaleTimeString(),
                zone: currentZone,
                severity: 'CRITICAL',
                type: 'CRITICAL_PPE_BREACH',
                message: `Personnel missing mandatory safety gear: ${violator.violations.join(', ')}`,
                personId: violator.id,
                violations: violator.violations,
                snapshotDataUrl: snapshotUrl,
                acknowledged: false,
                resolved: false,
                isRealAi: true,
              });
            });
          } else if (warningsList.length > 0) {
            soundManager.playWarning();
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
                isRealAi: true,
              });
            });
          }
        } else {
          console.warn('Backend returned warning/error:', resData.error);
          setCameraError(resData.error || 'AI analysis response failed.');
        }
      } else {
        // DEMO SIMULATION BENCHMARK MODE
        // Clearly marked as simulated ground truth
        const latency = 120 + Math.floor(Math.random() * 60);
        setLastLatency(latency);

        // Simple demo pattern for testing when offline/no key
        const simulatedPersons: DetectedPerson[] = [
          {
            id: 'worker-demo-1',
            box2d: [150, 280, 850, 720],
            hasHelmet: true,
            hasVest: true,
            helmetBox: [150, 420, 280, 580],
            vestBox: [320, 340, 680, 660],
            confidence: 0.95,
            status: 'COMPLIANT',
            violations: [],
            roleOrActivity: 'Simulated Benchmark Worker',
          },
        ];

        setCurrentDetections(simulatedPersons);
        setOverallHazard('LOW');
        drawBoundingBoxes(simulatedPersons, video.videoWidth, video.videoHeight);

        onDetectionUpdate(
          {
            persons: simulatedPersons,
            overallHazardLevel: 'LOW',
            safetySummary: 'DEMO MODE: Simulated compliance detection for offline testing benchmark.',
            actionableAdvice: 'To run real live detection, switch to Real AI Engine with an attached API key.',
            timestamp: new Date().toISOString(),
            latencyMs: latency,
            isRealAi: false,
            modelName: 'Demo Simulation Benchmark',
          },
          snapshotUrl
        );
      }
    } catch (err: any) {
      console.error('Frame analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [
    isCameraActive,
    isAnalyzing,
    engineMode,
    currentZone,
    drawBoundingBoxes,
    onDetectionUpdate,
    onTriggerAlert,
  ]);

  // Periodic Auto-Scan loop
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isCameraActive && autoScanEnabled && !isAnalyzing) {
      timer = setInterval(() => {
        captureAndAnalyze();
      }, scanIntervalSeconds * 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isCameraActive, autoScanEnabled, scanIntervalSeconds, isAnalyzing, captureAndAnalyze]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => console.warn(err));
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col"
    >
      {/* Feed Header */}
      <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5">
            <span
              className={`h-3 w-3 rounded-full ${
                isCameraActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
              }`}
            />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {isCameraActive ? 'Live Video Stream' : 'Camera Standby'}
            </span>
          </div>

          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono">
            {currentZone}
          </span>
        </div>

        {/* Engine & Latency Badges */}
        <div className="flex items-center space-x-2">
          {engineMode === 'REAL_GEMINI' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
              <Cpu className="w-3 h-3 text-amber-400" />
              Real AI: Gemini 3.8 Flash
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Eye className="w-3 h-3 text-blue-400" />
              Demo Benchmark Mode
            </span>
          )}

          {lastLatency && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
              {lastLatency}ms
            </span>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Video Viewport & Canvas Overlay */}
      <div className="relative bg-black aspect-video sm:min-h-[420px] flex items-center justify-center overflow-hidden">
        {/* HTML5 Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain ${isCameraActive ? 'block' : 'hidden'}`}
        />

        {/* Dynamic Bounding Box Overlay Canvas */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none object-contain ${
            isCameraActive ? 'block' : 'hidden'
          }`}
        />

        {/* Scanning Beam Animation when Analyzing */}
        {isAnalyzing && (
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-bounce opacity-80 pointer-events-none shadow-lg shadow-amber-500" />
        )}

        {/* Inactive / Standby Placeholder */}
        {!isCameraActive && !cameraError && (
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-amber-400">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Camera Feed Inactive</h3>
            <p className="text-xs text-slate-400 mb-6">
              Connect your Android phone camera or computer webcam to begin real-time computer vision analysis for hard hats and safety vests.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => startCamera(facingMode)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CameraIcon className="w-4 h-4" />
                Start Camera
              </button>
              <button
                onClick={onOpenMobileGuide}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                Scan Phone QR Code
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {cameraError && (
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <AlertOctagon className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Camera Access Notice</h3>
            <p className="text-xs text-red-300 mb-6 leading-relaxed">{cameraError}</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => startCamera(facingMode)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Camera
              </button>
              <button
                onClick={onOpenMobileGuide}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                Phone Guide
              </button>
            </div>
          </div>
        )}

        {/* Real-time HUD Status Overlay when Camera is Active */}
        {isCameraActive && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
            <div
              className={`px-3 py-1 rounded-lg backdrop-blur-md border text-xs font-extrabold flex items-center gap-2 ${
                overallHazard === 'HIGH'
                  ? 'bg-red-500/30 border-red-500 text-red-200 animate-pulse'
                  : overallHazard === 'MEDIUM'
                  ? 'bg-amber-500/30 border-amber-500 text-amber-200'
                  : 'bg-emerald-500/30 border-emerald-500 text-emerald-200'
              }`}
            >
              {overallHazard === 'HIGH' ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  <span>CRITICAL PPE HAZARD</span>
                </>
              ) : overallHazard === 'MEDIUM' ? (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>PARTIAL PPE WARNING</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>SITE SAFETY COMPLIANT</span>
                </>
              )}
            </div>

            <div className="bg-slate-950/80 px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-300 border border-slate-800 backdrop-blur-sm">
              Detected Personnel: <span className="font-bold text-white">{currentDetections.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Camera Control Toolbar */}
      <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Camera Start/Stop & Switch Controls */}
        <div className="flex items-center space-x-2">
          {isCameraActive ? (
            <button
              onClick={stopCamera}
              className="px-4 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <CameraOff className="w-4 h-4" />
              Stop Camera
            </button>
          ) : (
            <button
              onClick={() => startCamera(facingMode)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Start Camera
            </button>
          )}

          <button
            onClick={toggleFacingMode}
            disabled={!isCameraActive}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title={`Switch to ${facingMode === 'environment' ? 'Front' : 'Back'} Camera`}
          >
            <SwitchCamera className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">
              {facingMode === 'environment' ? 'Rear Cam' : 'Front Cam'}
            </span>
          </button>
        </div>

        {/* Right: AI Scan & Auto-Scan Controls */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs text-slate-300 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScanEnabled}
              onChange={(e) => setAutoScanEnabled(e.target.checked)}
              disabled={!isCameraActive}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4 disabled:opacity-40"
            />
            <span>Auto-Scan ({scanIntervalSeconds}s)</span>
          </label>

          <button
            onClick={captureAndAnalyze}
            disabled={!isCameraActive || isAnalyzing}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <Scan className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            {isAnalyzing ? 'Scanning Frame...' : 'Scan Frame Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
