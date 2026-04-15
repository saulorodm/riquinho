import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

import { env } from "../config/env.js";

const TOKEN_TTL_IN_SECONDS = 60 * 60 * 24 * 30;

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [salt, originalHash] = storedHash.split(":");

  if (!salt || !originalHash) {
    return false;
  }

  const derivedHash = scryptSync(password, salt, 64);
  const originalHashBuffer = Buffer.from(originalHash, "hex");

  if (derivedHash.length !== originalHashBuffer.length) {
    return false;
  }

  return timingSafeEqual(derivedHash, originalHashBuffer);
}

export function createAuthToken(userId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_IN_SECONDS;
  const payload = `${userId}.${expiresAt}`;
  const signature = createHmac("sha256", env.AUTH_SECRET).update(payload).digest("base64url");

  return `${toBase64Url(payload)}.${signature}`;
}

export function verifyAuthToken(token: string) {
  const [encodedPayload, providedSignature] = token.split(".");

  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const payload = fromBase64Url(encodedPayload);
  const expectedSignature = createHmac("sha256", env.AUTH_SECRET).update(payload).digest("base64url");

  const providedSignatureBuffer = Buffer.from(providedSignature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (providedSignatureBuffer.length !== expectedSignatureBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(providedSignatureBuffer, expectedSignatureBuffer)) {
    return null;
  }

  const [userId, expiresAt] = payload.split(".");
  const expiresAtNumber = Number(expiresAt);

  if (!userId || !expiresAtNumber || expiresAtNumber < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return { userId, expiresAt: expiresAtNumber };
}
