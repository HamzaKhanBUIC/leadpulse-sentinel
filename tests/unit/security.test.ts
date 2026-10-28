import { describe, it, expect } from 'vitest';
import { escapeHtml, isValidLeadId } from '../../src/server/security.js';

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
