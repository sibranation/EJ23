import { Injectable } from '@angular/core';
import { SignalingService } from './signaling.service';

export interface PeerInfo {
	peer: RTCPeerConnection;
	stream?: MediaStream;
}

@Injectable({ providedIn: 'root' })
export class AudioWebrtcService {
	private peers = new Map<string, PeerInfo>();
	private localStream?: MediaStream;
	private clientId?: string;
	private roomId?: string;
	private speakerId?: string;

	constructor(private signaling: SignalingService) {}

	async initAsSpeaker(roomId: string, password: string | null = null) {
		this.roomId = roomId;
		await this.signaling.connect();
		this.signaling.onMessage(async (msg) => {
			if (msg.type === 'room-created') {
				this.clientId = msg.clientId;
			} else if (msg.type === 'signal') {
				await this.handleSignal(msg.from, msg.payload);
			}
		});
		this.signaling.send({ type: 'create-room', roomId, password });
		this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
	}

	async initAsGuest(roomId: string, password: string | null = null, onTrack?: (stream: MediaStream) => void) {
		this.roomId = roomId;
		await this.signaling.connect();
		this.signaling.onMessage(async (msg) => {
			if (msg.type === 'room-joined') {
				this.clientId = msg.clientId;
				this.speakerId = msg.speakerId;
				await this.callSpeaker(onTrack);
			} else if (msg.type === 'signal') {
				await this.handleSignal(msg.from, msg.payload, onTrack);
			} else if (msg.type === 'room-ended') {
				this.cleanup();
			}
		});
		this.signaling.send({ type: 'join-room', roomId, password });
	}

	private async callSpeaker(onTrack?: (stream: MediaStream) => void) {
		if (!this.roomId || !this.speakerId) return;
		const pc = this.createPeer(this.speakerId, onTrack);
		const offer = await pc.createOffer({ offerToReceiveAudio: true });
		await pc.setLocalDescription(offer);
		this.signaling.send({ type: 'signal', roomId: this.roomId, to: this.speakerId, payload: { sdp: pc.localDescription } });
	}

	private createPeer(peerId: string, onTrack?: (stream: MediaStream) => void) {
		const pc = new RTCPeerConnection({
			iceServers: [
				{ urls: 'stun:stun.l.google.com:19302' }
			]
		});
		pc.onicecandidate = (e) => {
			if (e.candidate && this.roomId) {
				this.signaling.send({ type: 'signal', roomId: this.roomId, to: peerId, payload: { candidate: e.candidate } });
			}
		};
		pc.ontrack = (e) => {
			if (onTrack && e.streams[0]) onTrack(e.streams[0]);
		};
		if (this.localStream) {
			for (const track of this.localStream.getTracks()) pc.addTrack(track, this.localStream);
		}
		this.peers.set(peerId, { peer: pc });
		return pc;
	}

	private async handleSignal(from: string, payload: any, onTrack?: (stream: MediaStream) => void) {
		let info = this.peers.get(from);
		if (!info) {
			info = { peer: this.createPeer(from, onTrack) } as PeerInfo;
		}
		const pc = info.peer;
		if (payload.sdp) {
			await pc.setRemoteDescription(payload.sdp);
			if (payload.sdp.type === 'offer') {
				const answer = await pc.createAnswer();
				await pc.setLocalDescription(answer);
				if (this.roomId) this.signaling.send({ type: 'signal', roomId: this.roomId, to: from, payload: { sdp: pc.localDescription } });
			}
		} else if (payload.candidate) {
			try { await pc.addIceCandidate(payload.candidate); } catch {}
		}
	}

	endRoom() {
		if (!this.roomId) return;
		this.signaling.send({ type: 'end-room', roomId: this.roomId });
		this.cleanup();
	}

	cleanup() {
		for (const { peer } of this.peers.values()) peer.close();
		this.peers.clear();
		if (this.localStream) {
			for (const t of this.localStream.getTracks()) t.stop();
		}
		this.localStream = undefined;
	}
}
