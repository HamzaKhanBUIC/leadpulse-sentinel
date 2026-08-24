import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../../src/server/app.js';
import { globalStore } from '../../src/core/ledger/eventStore.js';
import express from 'express';
import http from 'http';

describe('API Routes Integration Suite', () => {
  let app: express.Express;
  let server: http.Server;
  let baseUrl: string;

  beforeEach(async () => {
    globalStore.clear();
    app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as any;
        baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  afterEach(() => {
    server.close();
  });

  it('POST /api/v1/leads/ingest ingests and normalizes an emergency lead', async () => {
    const res = await fetch(`${baseUrl}/api/v1/leads/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'MISSED_CALL',
        customer_name: 'Arthur Pendelton',
        customer_phone: '+15554321098',
        raw_inquiry_text: 'Burst pipe under kitchen sink flooding hardwood floors',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.lead.urgency_tier).toBe('CRITICAL');
    expect(data.lead.status).toBe('AUTO_RESCUE_SENT');
    expect(data.lead.estimated_job_value_usd).toBeGreaterThanOrEqual(1500);
    expect(data.lead.rescue_payload).toBeDefined();
  });

  it('GET /api/v1/leads returns list with active countdown', async () => {
    const res = await fetch(`${baseUrl}/api/v1/leads`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.leads)).toBe(true);
    expect(data.leads.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/leads/:id/action updates dispatcher status', async () => {
    const listRes = await fetch(`${baseUrl}/api/v1/leads`);
    const listData = await listRes.json();
    const targetLead = listData.leads[0];

    const actionRes = await fetch(`${baseUrl}/api/v1/leads/${targetLead.id}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'MARK_RESCUED', notes: 'Spoke to customer, booked for 3 PM' }),
    });

    expect(actionRes.status).toBe(200);
    const actionData = await actionRes.json();
    expect(actionData.success).toBe(true);
    expect(actionData.lead.status).toBe('RESCUED');
  });

  it('POST /api/v1/leads/:id/book executes customer self-service slot reservation', async () => {
    const listRes = await fetch(`${baseUrl}/api/v1/leads`);
    const listData = await listRes.json();
    const targetLead = listData.leads[0];

    const bookRes = await fetch(`${baseUrl}/api/v1/leads/${targetLead.id}/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slot_id: 'slot_emergency_10am',
        notes: 'Gate code 4321',
      }),
    });

    expect(bookRes.status).toBe(200);
    const bookData = await bookRes.json();
    expect(bookData.success).toBe(true);
    expect(bookData.lead.status).toBe('APPOINTMENT_BOOKED');
  });

  it('GET /api/v1/metrics computes financial ledger KPIs', async () => {
    const res = await fetch(`${baseUrl}/api/v1/metrics`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.metrics.total_inbound_leads).toBeGreaterThan(0);
    expect(data.metrics.pipeline_value_total_usd).toBeGreaterThan(0);
  });
});
