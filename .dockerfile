#Step 1: Setup Frontend
FROM node:22-alpine AS frontend

ENV CI=true

# Optional TURN relay for WebRTC across restrictive NATs. Vite bakes any
# VITE_* env vars into the bundle at build time (see src/lib/ice-servers.ts).
ARG VITE_TURN_URLS
ARG VITE_TURN_USERNAME
ARG VITE_TURN_CREDENTIAL

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY ./Frontend /app
WORKDIR /app

RUN pnpm install --frozen-lockfile

RUN pnpm build

#Step 2: Setup Backend
FROM node:22-alpine

ENV CI=true

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY ./Backend /app
WORKDIR /app

RUN pnpm install --frozen-lockfile

RUN pnpm build

COPY --from=frontend /app/dist /app/public

CMD ["pnpm", "start"]