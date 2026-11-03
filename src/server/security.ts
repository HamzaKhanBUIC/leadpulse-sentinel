import { createHash, timingSafeEqual } from 'node:crypto';

// Keep in sync with security.js (tests/unit/security.test.ts checks both).

export const ADMIN_TOKEN_ENV = 'LEADPULSE_ADMIN_TOKEN';
export const ADMIN_TOKEN_HEADER = 'x-admin-token';
export const MIN_ADMIN_TOKEN_LENGTH = 16;
export const MAX_BODY_BYTES = 64 * 1024;
export const MAX_BURST_COUNT = 50;

const LEAD_ID_PATTERN = /^lead_[a-z0-9]{1,32}$/;

export type AdminCheckResult = { ok: true } | { ok: false; status: 401 | 403; error: string };

export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function isValidLeadId(id: unknown): boolean {
  return typeof id === 'string' && LEAD_ID_PATTERN.test(id);
}

// Fails closed: with no token (or a short one) configured, every request is refused.
export function checkAdminToken(
  headerValue: string | string[] | undefined,
  configuredToken: string | undefined = process.env[ADMIN_TOKEN_ENV]
): AdminCheckResult {
  if (typeof configuredToken !== 'string' || configuredToken.length < MIN_ADMIN_TOKEN_LENGTH) {
    return {
      ok: false,
      status: 403,
      error: `Simulator routes are disabled. Set ${ADMIN_TOKEN_ENV} (${MIN_ADMIN_TOKEN_LENGTH}+ characters) to enable them.`,
    };
  }
  const supplied = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  if (typeof supplied !== 'string' || supplied.length === 0) {
    return { ok: false, status: 401, error: 'Missing or invalid admin token' };
  }
  // Hash both sides so timingSafeEqual always compares equal-length buffers.
  const suppliedDigest = createHash('sha256').update(supplied).digest();
  const expectedDigest = createHash('sha256').update(configuredToken).digest();
  if (!timingSafeEqual(suppliedDigest, expectedDigest)) {
    return { ok: false, status: 401, error: 'Missing or invalid admin token' };
  }
  return { ok: true };
}
