import { Injectable, inject } from '@angular/core';

export type SignalMessage = {
	type: 'signal';
	from: string;
	payload: any;
};

export type ServerMessage =
	| { type: 'room-created'; roomId: string; clientId: string }
	| { type: 'room-joined'; roomId: string; clientId: string; speakerId: string }
	| { type: 'room-ended'; roomId: string }
	| { type: 'error'; message: string }
	| SignalMessage;

@Injectable({ providedIn: 'root' })
export class SignalingService {
	private ws?: WebSocket;
	private resolveOpen?: () => void;

	connect(url?: string) {
		const defaultUrl = typeof window !== 'undefined' && location.origin ? (location.origin.replace(/^http/, 'ws') + '/.netlify/functions/ws') : 'ws://localhost:4000';
		const target = url || (globalThis as any).SIGNALING_URL || defaultUrl;
		if (this.ws && this.ws.readyState === WebSocket.OPEN) return Promise.resolve();
		this.ws = new WebSocket(target);
		return new Promise<void>((resolve, reject) => {
			this.resolveOpen = resolve;
			this.ws!.onopen = () => resolve();
			this.ws!.onerror = (e) => reject(e);
		});
	}

	send(obj: any) {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) throw new Error('WS not open');
		this.ws.send(JSON.stringify(obj));
	}

	onMessage(cb: (msg: ServerMessage) => void) {
		if (!this.ws) throw new Error('WS not open');
		this.ws.onmessage = (ev) => {
			try { cb(JSON.parse(ev.data)); } catch {}
		};
	}
}
