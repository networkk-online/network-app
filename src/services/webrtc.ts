import { supabase } from '@/integrations/supabase/client';

interface RTCConfig {
  iceServers: RTCIceServer[];
}

const defaultConfig: RTCConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export interface CallSignal {
  id: string;
  call_id: string;
  from_user_id: string;
  to_user_id: string;
  signal_type: string;
  signal_data: any;
  created_at: string;
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callId: string | null = null;
  private currentUserId: string | null = null;
  private remoteUserId: string | null = null;
  private signalChannel: any = null;

  public onLocalStream: ((stream: MediaStream) => void) | null = null;
  public onRemoteStream: ((stream: MediaStream) => void) | null = null;
  public onConnectionStateChange: ((state: RTCPeerConnectionState) => void) | null = null;
  public onCallEnded: (() => void) | null = null;
  public onIncomingCall: ((callerId: string, callId: string, callType: 'voice' | 'video') => void) | null = null;

  async initialize(userId: string): Promise<void> {
    this.currentUserId = userId;
    await this.subscribeToSignals();
  }

  private async subscribeToSignals(): Promise<void> {
    if (!this.currentUserId) return;

    this.signalChannel = supabase
      .channel(`call-signals-${this.currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'call_signals',
          filter: `to_user_id=eq.${this.currentUserId}`,
        },
        async (payload) => {
          const signal = payload.new as CallSignal;
          await this.handleSignal(signal);
        }
      )
      .subscribe();
  }

  private async handleSignal(signal: CallSignal): Promise<void> {
    console.log('Received signal:', signal.signal_type);

    switch (signal.signal_type) {
      case 'call-request':
        this.callId = signal.call_id;
        this.remoteUserId = signal.from_user_id;
        if (this.onIncomingCall) {
          this.onIncomingCall(
            signal.from_user_id,
            signal.call_id,
            signal.signal_data?.callType || 'voice'
          );
        }
        break;

      case 'call-accepted':
        await this.handleCallAccepted();
        break;

      case 'call-rejected':
      case 'call-ended':
        await this.cleanup();
        if (this.onCallEnded) {
          this.onCallEnded();
        }
        break;

      case 'offer':
        await this.handleOffer(signal.signal_data);
        break;

      case 'answer':
        await this.handleAnswer(signal.signal_data);
        break;

      case 'ice-candidate':
        await this.handleIceCandidate(signal.signal_data);
        break;
    }
  }

  async startCall(
    remoteUserId: string,
    callType: 'voice' | 'video',
    noiseReduction: boolean = true,
    echoCancellation: boolean = true
  ): Promise<string> {
    this.remoteUserId = remoteUserId;
    this.callId = crypto.randomUUID();

    // Get local media stream
    this.localStream = await this.getMediaStream(callType, noiseReduction, echoCancellation);
    if (this.onLocalStream) {
      this.onLocalStream(this.localStream);
    }

    // Send call request
    await this.sendSignal('call-request', { callType });

    return this.callId;
  }

  async acceptCall(callType: 'voice' | 'video'): Promise<void> {
    if (!this.callId || !this.remoteUserId) {
      throw new Error('No incoming call to accept');
    }

    // Get local media stream
    this.localStream = await this.getMediaStream(callType, true, true);
    if (this.onLocalStream) {
      this.onLocalStream(this.localStream);
    }

    // Send acceptance signal
    await this.sendSignal('call-accepted', { callType });

    // Create peer connection and wait for offer
    await this.createPeerConnection();
  }

  async rejectCall(): Promise<void> {
    if (!this.callId || !this.remoteUserId) return;

    await this.sendSignal('call-rejected', {});
    await this.cleanup();
  }

  async endCall(): Promise<void> {
    if (!this.callId || !this.remoteUserId) return;

    await this.sendSignal('call-ended', {});
    await this.cleanup();
    
    if (this.onCallEnded) {
      this.onCallEnded();
    }
  }

  private async handleCallAccepted(): Promise<void> {
    // Create peer connection and send offer
    await this.createPeerConnection();

    if (this.localStream && this.peerConnection) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // Create and send offer
    const offer = await this.peerConnection!.createOffer();
    await this.peerConnection!.setLocalDescription(offer);
    await this.sendSignal('offer', offer);
  }

  private async handleOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      await this.createPeerConnection();
    }

    if (this.localStream && this.peerConnection) {
      this.localStream.getTracks().forEach((track) => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await this.peerConnection!.createAnswer();
    await this.peerConnection!.setLocalDescription(answer);
    await this.sendSignal('answer', answer);
  }

  private async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) return;
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  }

  private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection) return;
    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  private async createPeerConnection(): Promise<void> {
    this.peerConnection = new RTCPeerConnection(defaultConfig);

    // Set up remote stream
    this.remoteStream = new MediaStream();

    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach((track) => {
        this.remoteStream!.addTrack(track);
      });
      if (this.onRemoteStream) {
        this.onRemoteStream(this.remoteStream!);
      }
    };

    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        await this.sendSignal('ice-candidate', event.candidate.toJSON());
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      if (this.onConnectionStateChange && this.peerConnection) {
        this.onConnectionStateChange(this.peerConnection.connectionState);
      }

      if (this.peerConnection?.connectionState === 'failed' || 
          this.peerConnection?.connectionState === 'disconnected') {
        this.cleanup();
        if (this.onCallEnded) {
          this.onCallEnded();
        }
      }
    };
  }

  private async getMediaStream(
    callType: 'voice' | 'video',
    noiseReduction: boolean,
    echoCancellation: boolean
  ): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation,
        noiseSuppression: noiseReduction,
        autoGainControl: true,
      },
      video: callType === 'video' ? {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      } : false,
    };

    return navigator.mediaDevices.getUserMedia(constraints);
  }

  private async sendSignal(type: string, data: any): Promise<void> {
    if (!this.currentUserId || !this.remoteUserId || !this.callId) return;

    await supabase.from('call_signals').insert({
      call_id: this.callId,
      from_user_id: this.currentUserId,
      to_user_id: this.remoteUserId,
      signal_type: type,
      signal_data: data,
    });
  }

  toggleMute(): boolean {
    if (!this.localStream) return false;
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return !audioTrack.enabled;
    }
    return false;
  }

  toggleVideo(): boolean {
    if (!this.localStream) return false;
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return !videoTrack.enabled;
    }
    return false;
  }

  async switchCamera(): Promise<void> {
    if (!this.localStream) return;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (!videoTrack) return;

    const currentFacingMode = videoTrack.getSettings().facingMode;
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: newFacingMode },
    });

    const newVideoTrack = newStream.getVideoTracks()[0];
    
    // Replace track in peer connection
    if (this.peerConnection) {
      const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }
    }

    // Replace track in local stream
    this.localStream.removeTrack(videoTrack);
    videoTrack.stop();
    this.localStream.addTrack(newVideoTrack);

    if (this.onLocalStream) {
      this.onLocalStream(this.localStream);
    }
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  private async cleanup(): Promise<void> {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach((track) => track.stop());
      this.remoteStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Delete signals for this call
    if (this.callId && this.currentUserId) {
      await supabase
        .from('call_signals')
        .delete()
        .or(`from_user_id.eq.${this.currentUserId},to_user_id.eq.${this.currentUserId}`)
        .eq('call_id', this.callId);
    }

    this.callId = null;
    this.remoteUserId = null;
  }

  destroy(): void {
    this.cleanup();
    if (this.signalChannel) {
      supabase.removeChannel(this.signalChannel);
      this.signalChannel = null;
    }
  }
}

// Singleton instance
export const webRTCService = new WebRTCService();
