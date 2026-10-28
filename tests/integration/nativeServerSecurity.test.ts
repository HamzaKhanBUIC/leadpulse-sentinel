import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createHttpServer } from '../../src/server/nativeServer.js';

const XSS_TEXT = '<img src=x onerror=alert(1)> leak';
const XSS_NAME = '<svg onload=alert(2)> Eve';

describe('Native server output escaping', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createHttpServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  async function ingest(body: Record<string, unknown>) {
    const res = await fetch(`${baseUrl}/api/v1/leads/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    expect(res.status).toBe(201);
    return (await res.json()).lead;
  }

  it('escapes stored lead text on the customer booking page', async () => {
    const lead = await ingest({ customer_phone: '+15550001111', customer_name: XSS_NAME, raw_inquiry_text: XSS_TEXT });

    const html = await (await fetch(`${baseUrl}/book/${lead.id}`)).text();

    expect(html).not.toContain('<img src=x');
    expect(html).not.toContain('<svg onload');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt; leak');
    expect(html).toContain('Hi &lt;svg, hold an arrival window');
  });

  it('escapes booked slot labels and customer fields on the confirmed booking page', async () => {
    const lead = await ingest({ customer_phone: '<b>555</b>-0000', customer_name: XSS_NAME });
    const bookRes = await fetch(`${baseUrl}/api/v1/leads/${lead.id}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: '<script>alert(3)</script>' }),
    });
    expect(bookRes.status).toBe(200);

    const html = await (await fetch(`${baseUrl}/book/${lead.id}`)).text();

    expect(html).not.toContain('<script>alert(3)</script>');
    expect(html).toContain('&lt;script&gt;alert(3)&lt;/script&gt;');
    expect(html).toContain('&lt;b&gt;555&lt;/b&gt;-0000');
    expect(html).toContain('&lt;svg onload=alert(2)&gt; Eve');
  });

  it('returns 404 for booking ids that are not lead ids instead of reflecting them', async () => {
    const res = await fetch(`${baseUrl}/book/x');alert(1);//`);
    expect(res.status).toBe(404);
    expect(await res.text()).not.toContain('alert(1)');
  });

  it('ships the escaping helper to the dashboard and uses it for lead fields', async () => {
    const html = await (await fetch(`${baseUrl}/`)).text();
    const fn = html.match(/function escapeHtml\(value\) \{[\s\S]*?\n\}/);
    expect(fn).not.toBeNull();

    const clientEscape = new Function(`${fn![0]}; return escapeHtml;`)();
    expect(clientEscape(XSS_TEXT)).toBe('&lt;img src=x onerror=alert(1)&gt; leak');

    expect(html).toContain('${escapeHtml(lead.raw_inquiry_text)}');
    expect(html).toContain('${escapeHtml(lead.customer_name)}');
    expect(html).toContain('${escapeHtml(msg.text)}');
    expect(html).not.toMatch(/\$\{(lead|selectedLead)\.(customer_name|raw_inquiry_text|customer_phone)\}/);
  });
});

describe('Native server simulator route guard', () => {
  const TOKEN = 'test-token-0123456789abcdef';
  let server: Server;
  let baseUrl: string;
  let savedToken: string | undefined;

  beforeAll(async () => {
    savedToken = process.env.LEADPULSE_ADMIN_TOKEN;
    server = createHttpServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterEach(() => {
    if (savedToken === undefined) delete process.env.LEADPULSE_ADMIN_TOKEN;
    else process.env.LEADPULSE_ADMIN_TOKEN = savedToken;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const post = (path: string, headers: Record<string, string> = {}, body: object = {}) =>
    fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });

  const leadCount = async () => (await (await fetch(`${baseUrl}/api/v1/leads`)).json()).total_count;

  it('refuses /simulate/clear with 403 when LEADPULSE_ADMIN_TOKEN is unset, and keeps the data', async () => {
    delete process.env.LEADPULSE_ADMIN_TOKEN;
    const before = await leadCount();
    const res = await post('/api/v1/simulate/clear', { 'X-Admin-Token': TOKEN });
    expect(res.status).toBe(403);
    expect(await leadCount()).toBe(before);
    expect(before).toBeGreaterThan(0);
  });

  it('refuses /simulate/burst with 403 when LEADPULSE_ADMIN_TOKEN is unset', async () => {
    delete process.env.LEADPULSE_ADMIN_TOKEN;
    expect((await post('/api/v1/simulate/burst', {}, { count: 3 })).status).toBe(403);
  });

  it('rejects a missing or wrong token with 401', async () => {
    process.env.LEADPULSE_ADMIN_TOKEN = TOKEN;
    expect((await post('/api/v1/simulate/clear')).status).toBe(401);
    expect((await post('/api/v1/simulate/clear', { 'X-Admin-Token': 'wrong-token-0123456789' })).status).toBe(401);
  });

  it('caps the burst size and runs with the right token', async () => {
    process.env.LEADPULSE_ADMIN_TOKEN = TOKEN;
    const res = await post('/api/v1/simulate/burst', { 'X-Admin-Token': TOKEN }, { count: 100000 });
    expect(res.status).toBe(200);
    expect((await res.json()).count).toBe(50);
  });

  it('clears the store with the right token', async () => {
    process.env.LEADPULSE_ADMIN_TOKEN = TOKEN;
    const res = await post('/api/v1/simulate/clear', { 'X-Admin-Token': TOKEN });
    expect(res.status).toBe(200);
    expect(await leadCount()).toBe(0);
  });
});

describe('Native server request hardening', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createHttpServer();
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const ingestRaw = (body: string) =>
    fetch(`${baseUrl}/api/v1/leads/ingest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });

  it('treats a JSON null body as empty instead of crashing the process', async () => {
    expect((await ingestRaw('null')).status).toBe(400);
    expect((await fetch(`${baseUrl}/api/v1/metrics`)).status).toBe(200);
  });

  it('rejects bodies over 64 KB with 413', async () => {
    const huge = JSON.stringify({ customer_phone: '+15550001111', raw_inquiry_text: 'x'.repeat(70 * 1024) });
    expect((await ingestRaw(huge)).status).toBe(413);
    expect((await fetch(`${baseUrl}/api/v1/metrics`)).status).toBe(200);
  });
});
