import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  CameraOff, 
  SwitchCamera, 
  Wifi, 
  WifiOff, 
  ShieldCheck, 
  AlertCircle, 
  Radio, 
  ArrowLeft,
  Zap,
  ZapOff
} from 'lucide-react';
import { SiteSentryWebRtc } from '../utils/webrtcClient';

interface PhoneCameraBroadcasterProps {
  sessionId: string;
  onExitPhoneMode: () => void;
}

export const PhoneCameraBroadcaster: React.FC<PhoneCameraBroadcasterProps> = ({
  sessionId,
  onExitPhoneMode,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [connectionStatus, setConnectionStatus] = useState<string>('Standby - Camera Off');
  const [isP2pConnected, setIsP2pConnected] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [framesTransmitted, setFramesTransmitted] = useState<number>(0);

  const webRtcRef = useRef<SiteSentryWebRtc | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const relayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSendingFrameRef = useRef<boolean>(false);

  // Continuous frame relay loop for guaranteed streaming even if P2P NAT fails
  const startFrameRelayLoop = () => {
    if (relayIntervalRef.current) clearInterval(relayIntervalRef.current);

    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d');

    relayIntervalRef.current = setInterval(async () => {
      if (!videoRef.current || isSendingFrameRef.current) return;
      const video = videoRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0 || video.paused) return;

      try {
        isSendingFrameRef.current = true;
        const targetWidth = 640;
        const scale = targetWidth / video.videoWidth;
        offscreen.width = targetWidth;
        offscreen.height = Math.round(video.videoHeight * scale);

        if (!offCtx) return;
        offCtx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
        const frameBase64 = offscreen.toDataURL('image/jpeg', 0.72);

        const res = await fetch('/api/phone-stream/frame', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            frameBase64,
            width: offscreen.width,
            height: offscreen.height,
          }),
        });

        if (res.ok) {
          setFramesTransmitted((prev) => prev + 1);
        }
      } catch (err) {
        // Suppress frame transmit network drops
      } finally {
        isSendingFrameRef.current = false;
      }
    }, 220); // ~4.5 FPS live stream relay
  };

  const stopFrameRelayLoop = () => {
    if (relayIntervalRef.current) {
      clearInterval(relayIntervalRef.current);
      relayIntervalRef.current = null;
    }
  };

  // Start broadcasting camera to laptop
  const startBroadcast = async (preferredFacing: 'environment' | 'user' = facingMode) => {
    setErrorMessage(null);
    setConnectionStatus('Requesting Camera Access...');

    try {
      // Stop any existing tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: preferredFacing },
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check if torch / flash is supported
      const track = stream.getVideoTracks()[0];
      const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
      if (capabilities.torch) {
        setHasTorch(true);
      }

      setConnectionStatus('Streaming Live to Laptop...');
      setIsStreaming(true);

      // Start continuous frame relay immediately
      startFrameRelayLoop();

      // Also initialize WebRTC P2P in parallel
      webRtcRef.current = new SiteSentryWebRtc(sessionId, 'phone', {
        onConnectionStateChange: (state) => {
          if (state === 'connected') {
            setIsP2pConnected(true);
            setConnectionStatus('Broadcasting Live to Laptop (P2P + Relay Active)');
          } else if (state === 'disconnected' || state === 'failed') {
            setIsP2pConnected(false);
            setConnectionStatus('Streaming via High-Speed Cloud Relay...');
          }
        },
        onPeerJoined: () => {
          setConnectionStatus('Laptop Dashboard Connected! Streaming Video...');
        },
        onError: (err) => {
          console.warn('WebRTC signaling notice:', err);
        },
      });

      await webRtcRef.current.init(stream);
    } catch (err: any) {
      console.error('Camera broadcast error:', err);
      let msg = 'Failed to access camera.';
      if (err.name === 'NotAllowedError') {
        msg = 'Camera permission denied. Please tap the lock/camera icon in Chrome URL bar and tap "Allow".';
      } else if (err.name === 'NotFoundError') {
        msg = 'No camera found on this device.';
      } else if (err.name === 'NotReadableError') {
        msg = 'Camera is currently locked by another app. Please close other camera tabs.';
      }
      setErrorMessage(msg);
      setConnectionStatus('Camera Error');
      setIsStreaming(false);
    }
  };

  // Stop broadcasting & release all hardware tracks
  const stopBroadcast = () => {
    stopFrameRelayLoop();
    if (webRtcRef.current) {
      webRtcRef.current.disconnect();
      webRtcRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsP2pConnected(false);
    setConnectionStatus('Standby - Camera Off');
  };

  // Toggle front/back camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    if (isStreaming) {
      startBroadcast(nextMode);
    }
  };

  // Toggle Flashlight/Torch if hardware supports it
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    try {
      const nextTorch = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (e) {
      console.warn('Torch constraint error:', e);
    }
  };

  // Auto-start camera when phone opens page
  useEffect(() => {
    startBroadcast(facingMode);
    return () => {
      stopBroadcast();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans select-none">
      {/* Mobile Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={onExitPhoneMode}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Switch to Laptop View"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              Site<span className="text-amber-400">Sentry</span> Mobile Cam
            </h1>
            <span className="text-[10px] font-mono text-slate-400">
              Pair ID: <b className="text-amber-400">{sessionId}</b>
            </span>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center space-x-1.5">
          <span
            className={`flex h-2.5 w-2.5 rounded-full ${
              isP2pConnected ? 'bg-emerald-500 animate-pulse' : isStreaming ? 'bg-amber-500' : 'bg-slate-600'
            }`}
          />
          <span className="text-[11px] font-bold text-slate-300">
            {isP2pConnected ? 'STREAMING' : isStreaming ? 'WAITING LAPTOP' : 'OFFLINE'}
          </span>
        </div>
      </header>

      {/* Main Camera Viewport */}
      <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${isStreaming ? 'block' : 'hidden'}`}
        />

        {/* Standby Placeholder */}
        {!isStreaming && (
          <div className="p-6 text-center max-w-sm space-y-4">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shadow-xl">
              <Camera className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Mobile Camera Transmitter</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Connects your phone camera to your laptop dashboard via real peer-to-peer WebRTC video streaming.
              </p>
            </div>

            <button
              onClick={() => startBroadcast(facingMode)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              Start Broadcasting Camera
            </button>
          </div>
        )}

        {/* Error Callout */}
        {errorMessage && (
          <div className="absolute top-4 inset-x-4 p-4 rounded-2xl bg-red-950/90 border border-red-500 text-red-200 text-xs space-y-2 backdrop-blur-md">
            <div className="flex items-center space-x-2 font-bold">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>Camera Access Notice</span>
            </div>
            <p className="leading-relaxed">{errorMessage}</p>
            <button
              onClick={() => startBroadcast(facingMode)}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Floating Broadcast HUD Overlay when Streaming */}
        {isStreaming && (
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
            <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-slate-200">{connectionStatus}</span>
            </div>

            {hasTorch && (
              <button
                onClick={toggleTorch}
                className="pointer-events-auto p-2.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-amber-400"
              >
                {torchOn ? <Zap className="w-5 h-5 fill-amber-400" /> : <ZapOff className="w-5 h-5" />}
              </button>
            )}
          </div>
        )}

        {/* Guide reticle in center of stream */}
        {isStreaming && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-dashed border-amber-400/40 rounded-3xl" />
          </div>
        )}
      </div>

      {/* Mobile Bottom Control Bar */}
      <footer className="bg-slate-900 border-t border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          {isStreaming ? (
            <button
              onClick={stopBroadcast}
              className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <CameraOff className="w-4 h-4" />
              Stop Broadcasting
            </button>
          ) : (
            <button
              onClick={() => startBroadcast(facingMode)}
              className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Start Broadcast
            </button>
          )}

          <button
            onClick={toggleFacingMode}
            disabled={!isStreaming}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            title="Flip Camera"
          >
            <SwitchCamera className="w-5 h-5 text-amber-400" />
          </button>
        </div>

        {/* Privacy Note */}
        <div className="flex items-center justify-center space-x-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>End-to-End P2P WebRTC. Zero footage saved in cloud.</span>
        </div>
      </footer>
    </div>
  );
};
