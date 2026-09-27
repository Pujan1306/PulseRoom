export function generateRoomCode(length = 6): string {
  try {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);

    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
    }
    return result;
  } catch (error) {
    console.error("Error generating audience code:", error);
    throw error;
  }
}
