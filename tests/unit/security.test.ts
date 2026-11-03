import { describe, it, expect } from 'vitest';
import * as jsImpl from '../../src/server/security.js';
import * as tsImpl from '../../src/server/security.ts';

const { escapeHtml, isValidLeadId, checkAdminToken, MIN_ADMIN_TOKEN_LENGTH } = jsImpl;

describe('escapeHtml', () => {
  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml(`<img src=x onerror="alert('1')"> & co`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt; &amp; co'
    );
  });

  it('escapes ampersands first so entities are not double-decoded', () => {
    expect(escapeHtml('&lt;script&gt;')).toBe('&amp;lt;script&amp;gt;');
  });

  it('returns an empty string for null and undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('stringifies non-string values', () => {
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml({ toString: () => '<b>' })).toBe('&lt;b&gt;');
  });

  it('is self-contained so it can be shipped to the browser with toString()', () => {
    const shipped = new Function(`${escapeHtml.toString()}; return escapeHtml;`)();
    expect(shipped('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});

describe('isValidLeadId', () => {
  it('accepts server-generated lead ids', () => {
    expect(isValidLeadId('lead_abc123')).toBe(true);
  });

  it('rejects ids that could break out of HTML or JS contexts', () => {
    expect(isValidLeadId("x');alert(1);//")).toBe(false);
    expect(isValidLeadId('lead_abc"><script>')).toBe(false);
    expect(isValidLeadId('LEAD_ABC')).toBe(false);
    expect(isValidLeadId('')).toBe(false);
    expect(isValidLeadId(undefined)).toBe(false);
  });
});

describe('checkAdminToken', () => {
  const TOKEN = 'test-token-0123456789abcdef';

  it('fails closed with 403 when no token is configured', () => {
    expect(checkAdminToken(TOKEN, undefined)).toMatchObject({ ok: false, status: 403 });
    expect(checkAdminToken('', '')).toMatchObject({ ok: false, status: 403 });
  });

  it('fails closed with 403 when the configured token is too short', () => {
    const short = 'x'.repeat(MIN_ADMIN_TOKEN_LENGTH - 1);
    expect(checkAdminToken(short, short)).toMatchObject({ ok: false, status: 403 });
  });

  it('rejects a missing or wrong token with 401', () => {
    expect(checkAdminToken(undefined, TOKEN)).toMatchObject({ ok: false, status: 401 });
    expect(checkAdminToken('', TOKEN)).toMatchObject({ ok: false, status: 401 });
    expect(checkAdminToken(TOKEN + 'x', TOKEN)).toMatchObject({ ok: false, status: 401 });
    expect(checkAdminToken('short', TOKEN)).toMatchObject({ ok: false, status: 401 });
  });

  it('accepts the configured token, including as the first of repeated headers', () => {
    expect(checkAdminToken(TOKEN, TOKEN)).toEqual({ ok: true });
    expect(checkAdminToken([TOKEN, 'other'], TOKEN)).toEqual({ ok: true });
  });
});

describe('security.js and security.ts stay in sync', () => {
  const inputs = ['<a href="x">\'&</a>', null, undefined, 7, 'lead_abc123', "x');//", 'lead_'];

  it('exports the same constants', () => {
    for (const key of ['ADMIN_TOKEN_ENV', 'ADMIN_TOKEN_HEADER', 'MIN_ADMIN_TOKEN_LENGTH', 'MAX_BODY_BYTES', 'MAX_BURST_COUNT'] as const) {
      expect(tsImpl[key]).toBe(jsImpl[key]);
    }
  });

  it('escapes and validates identically', () => {
    for (const input of inputs) {
      expect(tsImpl.escapeHtml(input)).toBe(jsImpl.escapeHtml(input));
      expect(tsImpl.isValidLeadId(input)).toBe(jsImpl.isValidLeadId(input));
    }
  });

  it('checks admin tokens identically', () => {
    const token = 'test-token-0123456789abcdef';
    for (const [header, configured] of [[token, token], ['nope', token], [undefined, token], [token, undefined], [token, 'short']] as const) {
      expect(tsImpl.checkAdminToken(header, configured)).toEqual(jsImpl.checkAdminToken(header, configured));
    }
  });
});
