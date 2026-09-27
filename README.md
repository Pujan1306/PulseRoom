# StreamRoom

A real-time live streaming platform built with React, WebRTC, and Socket.IO. Host a stream, share your camera, microphone, or screen, and let viewers join instantly with a room code — no sign-up required.

## Features

- **Host / Audience roles** — one host drives the stage; viewers join as an audience
- **Instant room codes** — generate or join a room with a short code (no accounts)
- **Live audio & video** — peer-to-peer media via WebRTC, signaled over Socket.IO
- **Screen sharing** — share your screen with the room
- **Real-time chat** — in-room chat panel
- **Live reactions** — send floating reactions
- **Media controls** — mute/unmute mic, toggle camera
- **Docker support** — single-container deployment with the bundled `.dockerfile`

## Tech Stack

| Layer    | Tools                                                                  |
| -------- | ---------------------------------------------------------------------- |
| Frontend | React 19, Vite, TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion   |
| Backend  | Node.js, Express 5, Socket.IO 4, TypeScript                            |
| Realtime | WebRTC (media), Socket.IO (signaling), pnpm workspaces-ready structure |

## Project Structure

```
.
├── .dockerfile            # Multi-stage Docker build (frontend → backend)
├── Backend/               # Express + Socket.IO signaling server
│   └── src/
│       ├── server.ts      # HTTP + static serving + health check
│       └── lib/
│           ├── socket-io.ts
│           ├── codeGenerator.ts
│           └── socket-handlers/   # join-room, chat, webrtc, media-state, ...
└── Frontend/              # React + Vite client
    └── src/
        ├── pages/         # LandingPage, RoomPage
        ├── components/    # pre-join, room UI (host/audience, chat, grid)
        ├── hooks/         # use-webrtc, use-room-events
        └── lib/           # socket client, generators
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) (enable with `corepack enable`)

### 1. Run the backend

```bash
cd Backend
pnpm install
pnpm dev          # dev server with hot reload on http://localhost:3000
```

### 2. Run the frontend

In a second terminal:

```bash
cd Frontend
pnpm install
pnpm dev          # Vite dev server
```

Open the printed URL, create a room, and share the code with viewers.

> The frontend connects to the backend via `Frontend/src/lib/socket-io-client.ts`. If you deploy the backend to a different origin, point the client at its URL there.

### Production build

```bash
# Backend
cd Backend
pnpm build        # compiles TS to dist/
pnpm start        # serves the API and ./public

# Frontend
cd Frontend
pnpm build        # outputs to dist/
```

### Docker

The provided `.dockerfile` builds the frontend, compiles the backend, and serves the frontend bundle from the backend server on port 3000:

```bash
docker build -f .dockerfile -t streamroom .
docker run -p 3000:3000 streamroom
```

## Scripts

### Backend (`/Backend`)

| Command     | Description                          |
| ----------- | ------------------------------------ |
| `pnpm dev`  | Start dev server with watch mode     |
| `pnpm build`| Compile TypeScript to `dist/`        |
| `pnpm start`| Run the compiled server              |

### Frontend (`/Frontend`)

| Command      | Description                    |
| ------------ | ------------------------------ |
| `pnpm dev`   | Start Vite dev server with HMR |
| `pnpm build` | Type-check and build for prod  |
| `pnpm lint`  | Run Oxlint                     |
| `pnpm preview`| Preview the production build  |

## License

[ISC](LICENSE)
