import crypto from "node:crypto";

export function generateAudienceCode(length = 6): string {
  try {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let result = "";

      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
      return result;
  } catch (error) {
    console.error("Error generating audience code:", error);
    throw error;
  }
}

export function generateHostToken(): string {
  try {
    return crypto.randomBytes(32).toString("hex");
  } catch (error) {
    console.error("Error generating host token:", error);
    throw error;
  }
}
