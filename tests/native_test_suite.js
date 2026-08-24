import test, { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { classifyInquiry } from '../src/core/sentinel/urgencyClassifier.js';
import { estimateJobValueUsd } from '../src/core/sentinel/valuationModel.js';
import { generateAutoRescuePayload } from '../src/core/rescue/autoRescueDispatcher.js';
import { normalizeAndEnrichLead, RawInboundSchema } from '../src/adapters/ingress/leadNormalizer.js';
import { LeadEventStore } from '../src/core/ledger/eventStore.js';
import { createApp } from '../src/server/app.js';
import http from 'node:http';

describe('1. Urgency Classifier & NLP Triage Engine', () => {
  it('classifies a critical plumbing emergency with burst pipe keywords', () => {
    const result = classifyInquiry('Basement is flooding right now from burst water heater pipe!');
    assert.equal(result.urgency_tier, 'CRITICAL');
    assert.equal(result.l_score, 95);
    assert.equal(result.sla_seconds_total, 60);
    assert.equal(result.trade, 'PLUMBING');
    assert.ok(result.matched_keywords.length > 0);
  });

  it('classifies high-priority HVAC AC failure during heatwave', () => {
    const result = classifyInquiry('Our AC down and not cooling the upstairs at all.', 'HVAC');
    assert.equal(result.urgency_tier, 'HIGH');
    assert.equal(result.l_score, 80);
    assert.equal(result.sla_seconds_total, 180);
    assert.equal(result.trade, 'HVAC');
  });

  it('classifies routine maintenance as medium urgency with longer SLA', () => {
    const result = classifyInquiry('Looking to schedule an annual maintenance tune-up next week.');
    assert.equal(result.urgency_tier, 'MEDIUM');
    assert.equal(result.l_score, 55);
    assert.equal(result.sla_seconds_total, 900);
  });

  it('falls back gracefully on empty text without crashing', () => {
    const result = classifyInquiry('');
    assert.equal(result.urgency_tier, 'LOW');
    assert.equal(result.l_score, 25);
    assert.equal(result.sla_seconds_total, 3600);
    assert.equal(result.trade, 'GENERAL_SERVICE');
  });
});

describe('2. Financial Valuation Model', () => {
  it('estimates high ticket value for full HVAC system replacement', () => {
    const value = estimateJobValueUsd('HVAC', 'MEDIUM', 'Looking for a new system replacement quote for 4 ton unit');
    assert.equal(value, 8500);
  });

  it('estimates high value for roofing re-roofing projects', () => {
    const value = estimateJobValueUsd('ROOFING', 'HIGH', 'Need a full re-roof on our two story home after hail storm');
    assert.equal(value, 12000);
  });

  it('estimates emergency repair values accurately', () => {
    const plumbingEmergency = estimateJobValueUsd('PLUMBING', 'CRITICAL', 'Slab leak in bathroom');
    assert.equal(plumbingEmergency, 1600);

    const hvacEmergency = estimateJobValueUsd('HVAC', 'CRITICAL', 'Furnace dead during winter freeze');
    assert.equal(hvacEmergency, 1850);
  });

  it('estimates routine service calls appropriately', () => {
    const routine = estimateJobValueUsd('ELECTRICAL', 'LOW', 'Replace two light fixtures');
    assert.equal(routine, 120);
  });
});

describe('3. AutoRescue Dispatcher Engine', () => {
  it('generates personalized emergency rescue SMS with booking link', () => {
    const payload = generateAutoRescuePayload({
      id: 'lead_test123',
      customer_name: 'Sarah Connor',
      customer_phone: '+15551234567',
      trade: 'PLUMBING',
      raw_inquiry_text: 'Main water pipe burst in front yard',
      urgency_tier: 'CRITICAL',
    }, 'https://leadpulse.app');

    assert.equal(payload.recipient_phone, '+15551234567');
    assert.equal(payload.interactive_booking_url, 'https://leadpulse.app/book/lead_test123');
    assert.ok(payload.message_body.includes('Hi Sarah'));
    assert.ok(payload.message_body.includes('emergency plumbing situation'));
    assert.equal(payload.delivery_status, 'DELIVERED');
  });
});

describe('4. Ingress Normalization & Zod Validation', () => {
  it('normalizes a missed call payload into LeadRecord with SLA', () => {
    const lead = normalizeAndEnrichLead({
      channel: 'MISSED_CALL',
      customer_name: 'David Ortiz',
      customer_phone: '+15559876543',
      raw_inquiry_text: 'Flooding in garage from ruptured hot water pipe',
    });

    assert.equal(lead.channel, 'MISSED_CALL');
    assert.equal(lead.urgency_tier, 'CRITICAL');
    assert.equal(lead.status, 'AUTO_RESCUE_SENT');
    assert.ok(lead.estimated_job_value_usd >= 1600);
    assert.equal(lead.audit_trail.length, 2);
  });

  it('rejects malformed payload missing customer phone number', () => {
    assert.throws(() => {
      RawInboundSchema.parse({
        channel: 'MISSED_CALL',
        customer_name: 'Anonymous',
        customer_phone: '',
      });
    });
  });
});

describe('5. End-to-End Leakage Recovery & Financial Ledger Scenario', () => {
  it('processes full lifecycle: Ingestion -> Urgency -> Auto-Rescue -> Self-Booking -> Rescued Revenue Ledger', () => {
    const store = new LeadEventStore();

    // 1. Inbound Missed Call arrives
    const rawInbound = {
      channel: 'MISSED_CALL',
      customer_name: 'Jessica Alba',
      customer_phone: '+1 (555) 789-1234',
      customer_address: '90210 Beverly Hills Blvd',
      trade: 'HVAC',
      raw_inquiry_text: 'Central AC stopped blowing cold air and indoor temp is 92 degrees. Need emergency dispatch!',
    };

    // 2. Normalization & Sentinel Triage (<10ms)
    const lead = normalizeAndEnrichLead(rawInbound, 'https://apexservice.com');
    store.addLead(lead);

    assert.equal(lead.status, 'AUTO_RESCUE_SENT');
    assert.equal(lead.urgency_tier, 'CRITICAL');
    assert.equal(lead.l_score, 95);
    assert.equal(lead.estimated_job_value_usd, 1850);

    // Initial metrics: Pipeline at risk
    let metrics = store.calculateMetrics();
    assert.equal(metrics.total_inbound_leads, 1);
    assert.equal(metrics.active_leads_count, 1);
    assert.equal(metrics.pipeline_value_at_risk_usd, 1850);
    assert.equal(metrics.pipeline_value_rescued_usd, 0);

    // 3. Customer self-books via link
    const updatedLead = store.bookSlot(
      lead.id,
      {
        slot_id: 'slot_now_30m',
        label: 'Immediate Arrival (Next 60-90 Mins)',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 5400000).toISOString(),
        is_emergency: true,
      },
      'Customer confirmed gate code 7788'
    );

    assert.equal(updatedLead.status, 'APPOINTMENT_BOOKED');
    assert.equal(updatedLead.booked_slot?.slot_id, 'slot_now_30m');

    // 4. Final metrics: Pipeline Rescued!
    metrics = store.calculateMetrics();
    assert.equal(metrics.active_leads_count, 0);
    assert.equal(metrics.rescued_leads_count, 1);
    assert.equal(metrics.pipeline_value_rescued_usd, 1850);
    assert.equal(metrics.pipeline_value_at_risk_usd, 0);
    assert.equal(metrics.recovery_rate_pct, 100);
    assert.equal(metrics.leakage_rate_pct, 0);
  });
});

describe('6. Full API Server & REST Endpoints', () => {
  it('serves ingestion, triage actions, booking, and metrics endpoints', async () => {
    const app = createApp();
    const server = http.createServer(app);

    await new Promise((resolve) => server.listen(0, resolve));
    const address = server.address();
    const baseUrl = `http://localhost:${address.port}`;

    try {
      // 1. Ingest via API
      const ingestRes = await fetch(`${baseUrl}/api/v1/leads/ingest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'MISSED_CALL',
          customer_name: 'Arthur Pendelton',
          customer_phone: '+15554321098',
          raw_inquiry_text: 'Burst pipe under kitchen sink flooding hardwood floors',
        }),
      });
      assert.equal(ingestRes.status, 201);
      const ingestData = await ingestRes.json();
      assert.equal(ingestData.success, true);
      assert.equal(ingestData.lead.urgency_tier, 'CRITICAL');

      // 2. Query List
      const listRes = await fetch(`${baseUrl}/api/v1/leads`);
      assert.equal(listRes.status, 200);
      const listData = await listRes.json();
      assert.ok(listData.leads.length > 0);

      // 3. Action
      const actionRes = await fetch(`${baseUrl}/api/v1/leads/${ingestData.lead.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_RESCUED', notes: 'Operator resolved' }),
      });
      assert.equal(actionRes.status, 200);
      const actionData = await actionRes.json();
      assert.equal(actionData.lead.status, 'RESCUED');

      // 4. Metrics
      const metricsRes = await fetch(`${baseUrl}/api/v1/metrics`);
      assert.equal(metricsRes.status, 200);
      const metricsData = await metricsRes.json();
      assert.ok(metricsData.metrics.pipeline_value_rescued_usd > 0);
    } finally {
      server.close();
    }
  });
});
