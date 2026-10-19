// Genuine WebRTC Peer-to-Peer Streaming Engine between Phone & Laptop
// Includes automatic WebSocket signaling with HTTP REST fallback and Google STUN servers

export interface WebRtcCallbacks {
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onError?: (error: string) => void;
  onPeerJoined?: () => void;
  onPeerLeft?: () => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com:3478' },
  ],
};

export class SiteSentryWebRtc {
  private peerConnection: RTCPeerConnection | null = null;
  private ws: WebSocket | null = null;
  private sessionId: string;
  private role: 'phone' | 'laptop';
  private callbacks: WebRtcCallbacks;
  private localStream: MediaStream | null = null;
  private isCleanedUp: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor(sessionId: string, role: 'phone' | 'laptop', callbacks: WebRtcCallbacks) {
    this.sessionId = sessionId;
    this.role = role;
    this.callbacks = callbacks;
  }

  // Initialize connection and signaling
  public async init(localStream?: MediaStream): Promise<void> {
    this.isCleanedUp = false;
    this.localStream = localStream || null;

    this.createPeerConnection();

    // Add local tracks if we are the phone broadcaster
    if (this.role === 'phone' && this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
    }

    // Connect to WebSocket signaling server
    this.connectWebSocket();
  }

  private createPeerConnection() {
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    this.peerConnection.onconnectionstatechange = () => {
      if (!this.peerConnection) return;
      const state = this.peerConnection.connectionState;
      this.callbacks.onConnectionStateChange?.(state);
    };

    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'candidate',
          data: event.candidate,
        });
      }
    };

    // Laptop receives remote video stream from phone
    if (this.role === 'laptop') {
      this.peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this.callbacks.onRemoteStream?.(event.streams[0]);
        }
      };
    }
  }

  private connectWebSocket() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws-signaling`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.ws?.send(
          JSON.stringify({
            type: 'join',
            sessionId: this.sessionId,
            role: this.role,
          })
        );
      };

      this.ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          await this.handleSignalingMessage(msg);
        } catch (e) {
          console.error('Signaling handle error:', e);
        }
      };

      this.ws.onerror = () => {
        console.warn('WebSocket signaling unavailable, falling back to HTTP polling.');
        this.startHttpPollingFallback();
      };

      this.ws.onclose = () => {
        if (!this.isCleanedUp) {
          this.startHttpPollingFallback();
        }
      };
    } catch (e) {
      this.startHttpPollingFallback();
    }
  }

  // Handle incoming signaling message
  private async handleSignalingMessage(msg: any) {
    if (!this.peerConnection || this.isCleanedUp) return;

    if (msg.type === 'peer-joined') {
      this.callbacks.onPeerJoined?.();
      // If we are the phone and laptop just joined, generate an offer!
      if (this.role === 'phone') {
        await this.createAndSendOffer();
      }
    } else if (msg.type === 'peer-left') {
      this.callbacks.onPeerLeft?.();
    } else if (msg.type === 'offer' && this.role === 'laptop') {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg.data));
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      this.sendSignalingMessage({
        type: 'answer',
        data: answer,
      });
    } else if (msg.type === 'answer' && this.role === 'phone') {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(msg.data));
    } else if (msg.type === 'candidate') {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(msg.data));
      } catch (err) {
        console.warn('Error adding ICE candidate:', err);
      }
    }
  }

  // Phone initiates WebRTC call by creating and sending SDP offer
  public async createAndSendOffer() {
    if (!this.peerConnection || this.role !== 'phone') return;
    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      });
      await this.peerConnection.setLocalDescription(offer);
      this.sendSignalingMessage({
        type: 'offer',
        data: offer,
      });
    } catch (err: any) {
      this.callbacks.onError?.(`Failed to create offer: ${err.message}`);
    }
  }

  // Send signaling message via WebSocket or HTTP fallback
  private sendSignalingMessage(msg: { type: string; data: any }) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          ...msg,
          sessionId: this.sessionId,
          role: this.role,
        })
      );
    } else {
      // HTTP REST fallback
      this.sendHttpSignaling(msg);
    }
  }

  private async sendHttpSignaling(msg: { type: string; data: any }) {
    try {
      if (msg.type === 'offer') {
        await fetch('/api/webrtc/offer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: this.sessionId, offer: msg.data }),
        });
      } else if (msg.type === 'answer') {
        await fetch('/api/webrtc/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: this.sessionId, answer: msg.data }),
        });
      } else if (msg.type === 'candidate') {
        await fetch('/api/webrtc/candidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId: this.sessionId, candidate: msg.data, role: this.role }),
        });
      }
    } catch (err) {
      console.warn('HTTP signaling error:', err);
    }
  }

  // HTTP polling fallback if WebSocket connection is closed/blocked
  private startHttpPollingFallback() {
    if (this.pollInterval || this.isCleanedUp) return;

    // Join room over HTTP
    fetch('/api/webrtc/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: this.sessionId, role: this.role }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.peerAlreadyPresent) {
          this.callbacks.onPeerJoined?.();
          if (this.role === 'phone' && this.peerConnection?.signalingState === 'stable') {
            this.createAndSendOffer();
          }
        }
      })
      .catch((e) => console.warn(e));

    this.pollInterval = setInterval(async () => {
      if (this.isCleanedUp || !this.peerConnection) return;

      try {
        if (this.role === 'laptop' && this.peerConnection.signalingState === 'stable') {
          // Poll for offer from phone
          const res = await fetch(`/api/webrtc/offer?sessionId=${encodeURIComponent(this.sessionId)}`);
          const data = await res.json();
          if (data.offer && !this.peerConnection.currentRemoteDescription) {
            await this.handleSignalingMessage({ type: 'offer', data: data.offer });
          }
        } else if (this.role === 'phone') {
          if (this.peerConnection.signalingState === 'stable') {
            // Check if laptop has joined and we haven't offered yet
            const sRes = await fetch(`/api/phone-stream/status?sessionId=${encodeURIComponent(this.sessionId)}`);
            const sData = await sRes.json();
            if (sData.laptopConnected && !this.peerConnection.currentRemoteDescription) {
              await this.createAndSendOffer();
            }
          } else if (this.peerConnection.signalingState === 'have-local-offer') {
            // Poll for answer from laptop
            const res = await fetch(`/api/webrtc/answer?sessionId=${encodeURIComponent(this.sessionId)}`);
            const data = await res.json();
            if (data.answer && !this.peerConnection.currentRemoteDescription) {
              await this.handleSignalingMessage({ type: 'answer', data: data.answer });
            }
          }
        }

        // Poll candidates
        const cRes = await fetch(
          `/api/webrtc/candidates?sessionId=${encodeURIComponent(this.sessionId)}&forRole=${this.role}`
        );
        const cData = await cRes.json();
        if (cData.candidates && Array.isArray(cData.candidates)) {
          for (const cand of cData.candidates) {
            await this.handleSignalingMessage({ type: 'candidate', data: cand });
          }
        }
      } catch {
        // Suppress polling network error logs
      }
    }, 1200);
  }

  // Clean disconnect & release all hardware/network tracks
  public disconnect(): void {
    this.isCleanedUp = true;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    // Tell server to reset session
    fetch('/api/webrtc/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: this.sessionId }),
    }).catch(() => {});
  }
}
