/**
 * Simple JWT-based auth helpers (no external auth library needed)
 * Uses Web Crypto API available in Next.js Edge/Node runtime
 */

import { NextRequest } from "next/server";

const SECRET = process.env.JWT_SECRET || "enterprise-rag-secret-change-in-production";

// ── Encode base64url ─────────────────────────────
function b64url(str: string) {
  return Buffer.from(str).toString("base64url");
}
function fromB64url(str: string) {
  return Buffer.from(str, "base64url").toString("utf8");
}

// ── Simple HMAC-SHA256 JWT (no external deps) ────
async function sign(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return Buffer.from(sig).toString("base64url");
}

export async function createToken(payload: Record<string, unknown>): Promise<string> {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body   = b64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 86400 * 7 }));
  const sig    = await sign(`${header}.${body}`);
  return `${header}.${body}.${sig}`;
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const [header, body, sig] = token.split(".");
    const expected = await sign(`${header}.${body}`);
    if (expected !== sig) return null;
    const payload = JSON.parse(fromB64url(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getAuthUser(req: NextRequest): Promise<{ id: string; email: string; role: string; name: string } | null> {
  const authHeader = req.headers.get("authorization");
  const cookieToken = req.cookies.get("auth_token")?.value;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : cookieToken;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return {
    id:    payload.id    as string,
    email: payload.email as string,
    role:  payload.role  as string,
    name:  payload.name  as string,
  };
}

// ── Password hashing (bcrypt-like with crypto) ───
export async function hashPassword(password: string): Promise<string> {
  const salt   = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Buffer.from(salt).toString("hex");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(password + saltHex), { name: "PBKDF2" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(saltHex), iterations: 100000, hash: "SHA-256" },
    key, 256
  );
  return `${saltHex}:${Buffer.from(bits).toString("hex")}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [saltHex, storedHash] = hash.split(":");
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(password + saltHex), { name: "PBKDF2" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(saltHex), iterations: 100000, hash: "SHA-256" },
    key, 256
  );
  return Buffer.from(bits).toString("hex") === storedHash;
}
