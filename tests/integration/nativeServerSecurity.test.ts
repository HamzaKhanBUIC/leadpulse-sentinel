import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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
