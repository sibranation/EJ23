export const config = { runtime: 'edge' };

const rooms = new Map();

function json(data) { return JSON.stringify(data); }

export default async function handler(req) {
	if (req.headers.get('upgrade') !== 'websocket') {
		return new Response('Expected WebSocket', { status: 426 });
	}
	const { socket, response } = Deno.upgradeWebSocket(req);
	socket.id = crypto.randomUUID();
	socket.roomId = null;
	socket.role = 'guest';

	socket.onmessage = (ev) => {
		let data; try { data = JSON.parse(ev.data); } catch { return; }
		if (data.type === 'create-room') {
			const { roomId, password } = data;
			if (rooms.has(roomId)) { socket.send(json({ type: 'error', message: 'Room already exists' })); return; }
			rooms.set(roomId, { speakerId: socket.id, clients: new Set([socket]), password: password || '' });
			socket.roomId = roomId; socket.role = 'speaker';
			socket.send(json({ type: 'room-created', roomId, clientId: socket.id }));
		} else if (data.type === 'join-room') {
			const { roomId, password } = data;
			const room = rooms.get(roomId);
			if (!room) { socket.send(json({ type: 'error', message: 'Room not found' })); return; }
			if (room.password && room.password !== (password || '')) { socket.send(json({ type: 'error', message: 'Invalid room password' })); return; }
			room.clients.add(socket); socket.roomId = roomId; socket.role = 'guest';
			socket.send(json({ type: 'room-joined', roomId, clientId: socket.id, speakerId: room.speakerId }));
		} else if (data.type === 'signal') {
			const { roomId, to, payload } = data;
			const room = rooms.get(roomId); if (!room) return;
			const msg = json({ type: 'signal', from: socket.id, payload });
			if (to) {
				for (const c of room.clients) { if (c.id === to) try { c.send(msg); } catch {} }
			} else {
				for (const c of room.clients) { if (c !== socket) try { c.send(msg); } catch {} }
			}
		} else if (data.type === 'end-room') {
			const room = rooms.get(data.roomId); if (!room) return;
			if (room.speakerId !== socket.id) { try { socket.send(json({ type: 'error', message: 'Only speaker can end' })); } catch {} return; }
			for (const c of room.clients) { try { c.send(json({ type: 'room-ended', roomId: data.roomId })); c.close(); } catch {} }
			rooms.delete(data.roomId);
		}
	};

	socket.onclose = () => {
		const roomId = socket.roomId; if (!roomId) return;
		const room = rooms.get(roomId); if (!room) return;
		room.clients.delete(socket);
		if (room.speakerId === socket.id) {
			for (const c of room.clients) { try { c.send(json({ type: 'room-ended', roomId })); c.close(); } catch {} }
			rooms.delete(roomId);
		}
	};

	return response;
}
