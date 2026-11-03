import "server-only";
import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

// Single-owner admin. Credentials live in env vars, not the database:
//   ADMIN_EMAIL, ADMIN_PASSWORD_HASH ("scrypt:<saltHex>:<hashHex>"), ADMIN_SESSION_SECRET.
// Generate the last two with `npm run admin:hash`.

const COOKIE = "mc_admin";
const SESSION_SECONDS = 60 * 60 * 8;

const safeEqual = (a: Buffer, b: Buffer) => a.length === b.length && timingSafeEqual(a, b);

function secret(): string | null {
  const s = process.env.ADMIN_SESSION_SECRET;
  return s && s.length >= 32 ? s : null;
}

const sign = (data: string, key: string) => createHmac("sha256", key).update(data).digest("base64url");

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH && secret());
}

function checkPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH ?? "";
  const [scheme, saltHex, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return safeEqual(actual, expected);
}

// Per-instance limiter. On serverless each instance has its own memory, so this slows
// guessing but is not a hard guarantee; the password hash is the real protection.
const attempts = new Map<string, { n: number; first: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-nf-client-connection-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function login(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = secret();
  if (!adminConfigured() || !key) return { ok: false, error: "Admin login is not configured on the server." };

  const ip = await clientKey();
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && now - rec.first < WINDOW_MS && rec.n >= MAX_ATTEMPTS) {
    return { ok: false, error: "Too many attempts. Try again in 15 minutes." };
  }

  // Evaluate both checks every time so response time doesn't reveal which was wrong.
  const emailOk = safeEqual(Buffer.from(email.trim().toLowerCase()), Buffer.from((process.env.ADMIN_EMAIL ?? "").trim().toLowerCase()));
  const passOk = checkPassword(password);
  if (!(emailOk && passOk)) {
    attempts.set(ip, rec && now - rec.first < WINDOW_MS ? { n: rec.n + 1, first: rec.first } : { n: 1, first: now });
    await new Promise((r) => setTimeout(r, 800));
    return { ok: false, error: "Wrong email or password." };
  }

  attempts.delete(ip);
  const exp = Math.floor(now / 1000) + SESSION_SECONDS;
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload, key)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: SESSION_SECONDS,
  });
  return { ok: true };
}

export async function logout() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}

export async function isAdmin(): Promise<boolean> {
  const key = secret();
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!key || !raw) return false;
  const [payload, sig] = raw.split(".");
  if (!payload || !sig) return false;
  if (!safeEqual(Buffer.from(sig), Buffer.from(sign(payload, key)))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof exp === "number" && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

// Call at the top of every admin page AND every admin server action:
// server actions are public POST endpoints, so the page-level check alone isn't enough.
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
