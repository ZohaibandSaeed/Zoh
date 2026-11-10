import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getSetting, setSetting } from "@/lib/db";

const SESSION_COOKIE_NAME = "zinks_admin_session";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

function getSecretKey() {
  const secret = process.env.SESSION_SECRET || "default_zinks_session_secret_change_me_32char";
  return new TextEncoder().encode(secret.padEnd(32, "!"));
}

/**
 * Verifies if the provided PIN matches the PIN stored in Database (with .env fallback)
 */
export async function verifyPin(pin: string): Promise<boolean> {
  const dbPin = await getSetting("admin_pin");
  const configuredPin = dbPin || process.env.ADMIN_PIN || "123456";
  return pin.trim() === configuredPin.trim();
}

/**
 * Updates the admin PIN stored in Database
 */
export async function updateAdminPin(newPin: string): Promise<boolean> {
  return await setSetting("admin_pin", newPin.trim());
}

/**
 * Creates an encrypted JWT session token
 */
export async function createSessionToken(): Promise<string> {
  const key = getSecretKey();
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

/**
 * Verifies a given session token
 */
export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    const key = getSecretKey();
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

/**
 * Checks if the current server context (cookies) is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return false;
  return await verifySessionToken(token);
}

export { SESSION_COOKIE_NAME, SESSION_DURATION };

