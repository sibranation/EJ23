import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// In-memory rooms: roomId -> { speakerId, clients: Set(ws), password }
const rooms = new Map();

function send(ws, type, payload) {
	try {
		ws.send(JSON.stringify({ type, ...payload }));
	} catch {}
}

function broadcastToRoom(roomId, message, excludeWs) {
	const room = rooms.get(roomId);
	if (!room) return;
	for (const client of room.clients) {
		if (client.readyState === 1 && client !== excludeWs) {
			client.send(message);
		}
	}
}

wss.on('connection', (ws) => {
	ws.id = uuidv4();
	ws.roomId = null;
	ws.role = 'guest';

	ws.on('message', (raw) => {
		let data;
		try { data = JSON.parse(raw); } catch { return; }

		switch (data.type) {
			case 'create-room': {
				const { roomId, password } = data;
				if (rooms.has(roomId)) {
					return send(ws, 'error', { message: 'Room already exists' });
				}
				rooms.set(roomId, { speakerId: ws.id, clients: new Set([ws]), password: password || '' });
				ws.roomId = roomId;
				ws.role = 'speaker';
				return send(ws, 'room-created', { roomId, clientId: ws.id });
			}
			case 'join-room': {
				const { roomId, password } = data;
				const room = rooms.get(roomId);
				if (!room) return send(ws, 'error', { message: 'Room not found' });
				if (room.password && room.password !== (password || '')) {
					return send(ws, 'error', { message: 'Invalid room password' });
				}
				room.clients.add(ws);
				ws.roomId = roomId;
				ws.role = 'guest';
				return send(ws, 'room-joined', { roomId, clientId: ws.id, speakerId: room.speakerId });
			}
			case 'signal': {
				// Forward WebRTC signaling within the room
				const { roomId, to, payload } = data;
				const room = rooms.get(roomId);
				if (!room) return;
				const message = JSON.stringify({ type: 'signal', from: ws.id, payload });
				if (to) {
					for (const client of room.clients) {
						if (client.id === to && client.readyState === 1) client.send(message);
					}
				} else {
					broadcastToRoom(roomId, message, ws);
				}
				break;
			}
			case 'end-room': {
				const { roomId } = data;
				const room = rooms.get(roomId);
				if (!room) return;
				if (room.speakerId !== ws.id) return send(ws, 'error', { message: 'Only speaker can end' });
				for (const client of room.clients) {
					if (client.readyState === 1) send(client, 'room-ended', { roomId });
					client.close();
				}
				rooms.delete(roomId);
				break;
			}
			default:
				break;
		}
	});

	ws.on('close', () => {
		const roomId = ws.roomId;
		if (!roomId) return;
		const room = rooms.get(roomId);
		if (!room) return;
		room.clients.delete(ws);
		// If speaker disconnects, end the room
		if (room.speakerId === ws.id) {
			for (const client of room.clients) {
				if (client.readyState === 1) send(client, 'room-ended', { roomId });
				client.close();
			}
			rooms.delete(roomId);
		}
	});
});

app.get('/health', (_, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});
