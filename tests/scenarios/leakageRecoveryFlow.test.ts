import { describe, it, expect } from 'vitest';
import { LeadEventStore } from '../../src/core/ledger/eventStore.js';
import { normalizeAndEnrichLead } from '../../src/adapters/ingress/leadNormalizer.js';

describe('End-to-End Leakage Recovery Scenario', () => {
  it('successfully rescues a missed call and updates pipeline metrics', () => {
    const store = new LeadEventStore();

    // 1. Inbound Missed Call arrives
    const rawInbound = {
      channel: 'MISSED_CALL' as const,
      customer_name: 'Jessica Alba',
      customer_phone: '+1 (555) 789-1234',
      customer_address: '90210 Beverly Hills Blvd',
      trade: 'HVAC' as const,
      raw_inquiry_text: 'Central AC stopped blowing cold air and indoor temp is 92 degrees. Need emergency dispatch!',
    };

    // 2. Normalization & Sentinel Triage (<10ms)
    const lead = normalizeAndEnrichLead(rawInbound, 'https://apexservice.com');
    store.addLead(lead);

    expect(lead.status).toBe('AUTO_RESCUE_SENT');
    expect(lead.urgency_tier).toBe('CRITICAL');
    expect(lead.l_score).toBe(95);
    expect(lead.estimated_job_value_usd).toBe(1850);
    expect(lead.rescue_payload?.message_body).toContain('https://apexservice.com/book/');

    // Initial metrics: Pipeline at risk
    let metrics = store.calculateMetrics();
    expect(metrics.total_inbound_leads).toBe(1);
    expect(metrics.active_leads_count).toBe(1);
    expect(metrics.pipeline_value_at_risk_usd).toBe(1850);
    expect(metrics.pipeline_value_rescued_usd).toBe(0);

    // 3. Customer clicks SMS link and reserves slot
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

    expect(updatedLead.status).toBe('APPOINTMENT_BOOKED');
    expect(updatedLead.booked_slot?.slot_id).toBe('slot_now_30m');

    // 4. Final metrics: Pipeline Rescued!
    metrics = store.calculateMetrics();
    expect(metrics.active_leads_count).toBe(0);
    expect(metrics.rescued_leads_count).toBe(1);
    expect(metrics.pipeline_value_rescued_usd).toBe(1850);
    expect(metrics.pipeline_value_at_risk_usd).toBe(0);
    expect(metrics.recovery_rate_pct).toBe(100);
    expect(metrics.leakage_rate_pct).toBe(0);
  });
});
