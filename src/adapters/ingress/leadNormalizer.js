import { classifyInquiry } from '../../core/sentinel/urgencyClassifier.js';
import { estimateJobValueUsd } from '../../core/sentinel/valuationModel.js';
import { generateAutoRescuePayload } from '../../core/rescue/autoRescueDispatcher.js';

export function normalizeAndEnrichLead(input, baseUrl = 'http://localhost:3001') {
  if (!input || !input.customer_phone || input.customer_phone.length < 5) {
    throw new Error('Valid customer_phone is required');
  }

  const now = new Date();
  const id = `lead_${Math.random().toString(36).substring(2, 9)}`;
  const rawText = input.raw_inquiry_text || 'Inbound customer inquiry';
  const classification = classifyInquiry(rawText, input.trade);
  const expiresAt = new Date(now.getTime() + classification.sla_seconds_total * 1000);
  const estimatedValue = estimateJobValueUsd(classification.trade, classification.urgency_tier, rawText);

  const rescuePayload = generateAutoRescuePayload({
    id,
    customer_name: input.customer_name,
    customer_phone: input.customer_phone,
    trade: classification.trade,
    raw_inquiry_text: rawText,
    urgency_tier: classification.urgency_tier,
  }, baseUrl);

  return {
    id,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    channel: input.channel || 'DIRECT_WEBHOOK',
    trade: classification.trade,
    customer_name: input.customer_name || 'Prospective Customer',
    customer_phone: input.customer_phone,
    customer_email: input.customer_email,
    customer_address: input.customer_address,
    raw_inquiry_text: rawText,
    urgency_tier: classification.urgency_tier,
    l_score: classification.l_score,
    sla_seconds_total: classification.sla_seconds_total,
    sla_expires_at: expiresAt.toISOString(),
    estimated_job_value_usd: estimatedValue,
    status: 'AUTO_RESCUE_SENT',
    rescue_payload: rescuePayload,
    audit_trail: [
      {
        id: `evt_${Math.random().toString(36).substring(2, 9)}`,
        lead_id: id,
        timestamp: now.toISOString(),
        action: 'INBOUND_LEAD_INGESTED',
        actor: 'SYSTEM_SENTINEL',
        details: { channel: input.channel, urgency: classification.urgency_tier },
      },
      {
        id: `evt_${Math.random().toString(36).substring(2, 9)}`,
        lead_id: id,
        timestamp: now.toISOString(),
        action: 'AUTO_RESCUE_DISPATCHED',
        actor: 'SYSTEM_SENTINEL',
        details: { message: 'SMS Sent to customer' },
      },
    ],
  };
}
