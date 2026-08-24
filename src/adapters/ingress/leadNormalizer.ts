import { z } from 'zod';
import { LeadRecord, InboundChannel, ServiceTrade, AuditEvent } from '../../types/index.js';
import { classifyInquiry } from '../../core/sentinel/urgencyClassifier.js';
import { estimateJobValueUsd } from '../../core/sentinel/valuationModel.js';
import { generateAutoRescuePayload } from '../../core/rescue/autoRescueDispatcher.js';

export const RawInboundSchema = z.object({
  channel: z.enum(['MISSED_CALL', 'WEB_FORM', 'AFTER_HOURS', 'DIRECT_WEBHOOK']).default('DIRECT_WEBHOOK'),
  customer_name: z.string().min(1).default('Prospective Customer'),
  customer_phone: z.string().min(5),
  customer_email: z.string().email().optional(),
  customer_address: z.string().optional(),
  trade: z.enum(['HVAC', 'PLUMBING', 'ELECTRICAL', 'ROOFING', 'RESTORATION', 'GENERAL_SERVICE']).optional(),
  raw_inquiry_text: z.string().default('Inbound customer inquiry'),
  source_system: z.string().optional(),
});

export type RawInboundInput = z.infer<typeof RawInboundSchema>;

export function normalizeAndEnrichLead(input: RawInboundInput, baseUrl?: string): LeadRecord {
  const validated = RawInboundSchema.parse(input);
  const now = new Date();
  const id = `lead_${Math.random().toString(36).substring(2, 10)}`;

  // Classify Urgency & Trade
  const classification = classifyInquiry(validated.raw_inquiry_text, validated.trade);
  
  // Calculate SLA Deadline
  const expiresAt = new Date(now.getTime() + classification.sla_seconds_total * 1000);

  // Estimate Job Value
  const estimatedValue = estimateJobValueUsd(
    classification.trade,
    classification.urgency_tier,
    validated.raw_inquiry_text
  );

  // Initial Audit Events
  const auditEvents: AuditEvent[] = [
    {
      id: `evt_${Math.random().toString(36).substring(2, 9)}`,
      lead_id: id,
      timestamp: now.toISOString(),
      action: 'INBOUND_LEAD_INGESTED',
      actor: 'SYSTEM_SENTINEL',
      details: {
        channel: validated.channel,
        trade: classification.trade,
        urgency: classification.urgency_tier,
        l_score: classification.l_score,
        estimated_value_usd: estimatedValue,
      },
    },
  ];

  // Auto-Rescue Payload Generation (<2s)
  const rescuePayload = generateAutoRescuePayload(
    {
      id,
      customer_name: validated.customer_name,
      customer_phone: validated.customer_phone,
      trade: classification.trade,
      raw_inquiry_text: validated.raw_inquiry_text,
      urgency_tier: classification.urgency_tier,
    },
    baseUrl
  );

  auditEvents.push({
    id: `evt_${Math.random().toString(36).substring(2, 9)}`,
    lead_id: id,
    timestamp: new Date().toISOString(),
    action: 'AUTO_RESCUE_DISPATCHED',
    actor: 'SYSTEM_SENTINEL',
    details: {
      message_id: rescuePayload.message_id,
      interactive_url: rescuePayload.interactive_booking_url,
    },
  });

  return {
    id,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    channel: validated.channel as InboundChannel,
    trade: classification.trade as ServiceTrade,
    customer_name: validated.customer_name,
    customer_phone: validated.customer_phone,
    customer_email: validated.customer_email,
    customer_address: validated.customer_address,
    raw_inquiry_text: validated.raw_inquiry_text,
    
    urgency_tier: classification.urgency_tier,
    l_score: classification.l_score,
    sla_seconds_total: classification.sla_seconds_total,
    sla_expires_at: expiresAt.toISOString(),
    estimated_job_value_usd: estimatedValue,
    
    status: 'AUTO_RESCUE_SENT',
    rescue_payload: rescuePayload,
    audit_trail: auditEvents,
  };
}
