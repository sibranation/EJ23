# EJ23 Streaming Radio (Audio Webinar)

This project contains:

- Angular app: `radio-station-web`
- Node signaling server: `server` (WebSocket-based)

## Prerequisites

- Node.js 18 LTS or 20+ (Angular CLI 17 requires ^18.13 or >=20.9)

## Install & Run

1) Start signaling server:

```bash
cd server
npm install
npm run start
# Server on http://localhost:4000 (WebSocket)
```

2) Start Angular app:

```bash
cd ../radio-station-web
npm install
npm start
# Open http://localhost:4200
```

## Usage

- Home page:
  - Speaker: click "I'm a Speaker" → enter Room ID and optional password → Continue.
  - Guest: enter Room ID to listen.
- Broadcast page: microphone is captured and streamed to all guests in the room. End ends the room.
- Listen page: plays the speaker's audio.

## Notes

- WebRTC uses public STUN `stun:stun.l.google.com:19302`. For production, configure TURN.
- Signaling URL defaults to `ws://localhost:4000`. You can expose `window.SIGNALING_URL` to override.
