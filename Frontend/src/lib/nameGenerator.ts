const ADJECTIVES = ["cosmic", "swift", "electric", "neon", "silent", "vibrant", "hyper"];
const NOUNS = ["pulse", "wave", "orbit", "beacon", "nexus", "spark", "echo"];

export function generateRoomName(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(100 + Math.random() * 900); // 3-digit suffix

  return `${adj}-${noun}-${num}`;
}