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
	/**
	 * Connect to signaling server. Tries multiple known endpoints (Netlify function, Vercel `/api/ws`, local)
	 * to reduce failures when a platform doesn't support WebSocket upgrades at the same path.
	 *
	 * Priority of candidates (first to last):
	 * - explicit `url` passed in
	 * - global `SIGNALING_URL` if provided
	 * - current origin + `/.netlify/functions/ws`
	 * - current origin + `/api/ws`
	 * - current origin + `/ws`
	 * - `ws://localhost:4000` (dev fallback)
	 */
	async connect(url?: string) {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

		const origin = (typeof window !== 'undefined' && location && location.origin) ? location.origin : '';
		const buildWs = (path: string) => origin ? origin.replace(/^http/, 'ws') + path : path;

		const candidates = Array.from(new Set([
			url,
			(globalThis as any).SIGNALING_URL,
			buildWs('/.netlify/functions/ws'),
			buildWs('/api/ws'),
			buildWs('/ws'),
			'ws://localhost:4000'
		].filter(Boolean))) as string[];

		let lastErr: any = null;
		for (const candidate of candidates) {
			try {
				await this.tryOpen(candidate);
				// success — leave this.ws assigned by tryOpen
				return;
			} catch (e) {
				lastErr = e;
				// try next candidate
			}
		}

		// If we reach here, none worked
		throw lastErr || new Error('Unable to connect to signaling server');
	}

	private tryOpen(url: string, timeoutMs = 5000): Promise<void> {
		return new Promise((resolve, reject) => {
			let settled = false;
			let timer: number | undefined;

			const cleanup = () => {
				if (timer) { clearTimeout(timer); }
			};

			try {
				const ws = new WebSocket(url);

				ws.onopen = () => {
					if (settled) return;
					settled = true;
					this.ws = ws;
					cleanup();
					resolve();
				};

				ws.onerror = (ev) => {
					if (settled) return;
					settled = true;
					try { ws.close(); } catch {}
					cleanup();
					reject(new Error(`WebSocket error when connecting to ${url}`));
				};

				// safety timeout — some servers reject without firing 'error'
				timer = window.setTimeout(() => {
					if (settled) return;
					settled = true;
					try { ws.close(); } catch {}
					reject(new Error(`WebSocket connection to ${url} timed out after ${timeoutMs}ms`));
				}, timeoutMs);
			} catch (err) {
				reject(err);
			}
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
