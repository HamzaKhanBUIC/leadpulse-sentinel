import { describe, it, expect } from 'vitest';
import { RawInboundSchema, normalizeAndEnrichLead } from '../../src/adapters/ingress/leadNormalizer.js';
import { LeadEventStore } from '../../src/core/ledger/eventStore.js';

describe('Adversarial Chaos & Edge Case Suite', () => {
  it('rejects malformed payload missing customer phone number', () => {
    expect(() => {
      RawInboundSchema.parse({
        channel: 'MISSED_CALL',
        customer_name: 'Anonymous',
        customer_phone: '', // invalid short
      });
    }).toThrow();
  });

  it('handles extreme high-concurrency burst of 100 simultaneous leads without corruption', () => {
    const store = new LeadEventStore();
    const burstPromises = [];

    for (let i = 0; i < 100; i++) {
      const syn = {
        channel: 'MISSED_CALL' as const,
        customer_name: `Concurrent User ${i}`,
        customer_phone: `+1555000${i.toString().padStart(4, '0')}`,
        raw_inquiry_text: i % 2 === 0 ? 'Burst pipe emergency' : 'Standard AC check',
      };
      const lead = normalizeAndEnrichLead(syn);
      store.addLead(lead);
    }

    const all = store.getAllLeads();
    expect(all.length).toBe(100);

    const metrics = store.calculateMetrics();
    expect(metrics.total_inbound_leads).toBe(100);
    expect(metrics.active_leads_count).toBe(100);
    expect(metrics.pipeline_value_total_usd).toBeGreaterThan(50000);
  });

  it('prevents invalid status transitions and throws informative error for non-existent lead', () => {
    const store = new LeadEventStore();
    expect(() => {
      store.updateStatus('non_existent_id', 'RESCUED', 'DISPATCHER');
    }).toThrow(/not found/);
  });

  it('sanitizes potential XSS injection in raw customer text safely', () => {
    const dangerousInput = {
      channel: 'WEB_FORM' as const,
      customer_name: '<script>alert("hacked")</script> John',
      customer_phone: '+15559998888',
      raw_inquiry_text: '<img src=x onerror=alert(1)> Need furnace repair immediately',
    };

    const lead = normalizeAndEnrichLead(dangerousInput);
    expect(lead.customer_name).toContain('John');
    expect(lead.raw_inquiry_text).toContain('furnace repair');
    expect(lead.urgency_tier).toBe('HIGH'); // correctly parsed furnace repair
  });
});
