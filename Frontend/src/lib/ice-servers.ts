// ICE (STUN/TURN) configuration for WebRTC.
//
// STUN-only setups work on localhost but routinely fail across real
// networks: browsers hide local IPs behind mDNS candidates that are
// unresolvable off-network, and symmetric NATs break server-reflexive
// candidates. Without a TURN relay the media simply never arrives —
// e.g. a host's screen share leaves viewers stuck on "Waiting for…".
//
// The backend injects the config at build time via `define` (see
// vite.config.ts): VITE_TURN_URLS / VITE_TURN_USERNAME / VITE_TURN_CREDENTIAL.
// Set VITE_TURN_URLS in the Docker build env (e.g. a Cloudflare Calls or
// Twilio NTS turn: URL) to enable relay; the free defaults cover dev use.

interface IceServerConfig {
  urls: string | string[];
  username?: string;
  credential?: string;
}

function buildIceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [];

  const turnUrls = import.meta.env.VITE_TURN_URLS as string | undefined;
  if (turnUrls) {
    const server: IceServerConfig = { urls: turnUrls.split(",").map((u) => u.trim()) };
    const username = import.meta.env.VITE_TURN_USERNAME as string | undefined;
    const credential = import.meta.env.VITE_TURN_CREDENTIAL as string | undefined;
    if (username) server.username = username;
    if (credential) server.credential = credential;
    servers.push(server as RTCIceServer);
  }

  // STUN helps peers discover their public address; it can't relay media.
  servers.push({ urls: "stun:stun.l.google.com:19302" });

  return servers;
}

export const ICE_SERVERS: RTCIceServer[] = buildIceServers();
