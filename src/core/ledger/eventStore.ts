import { LeadRecord, RevenueLedgerMetrics, LeadStatus, AuditEvent, BookingSlot } from '../../types/index.js';

export class LeadEventStore {
  private leads: Map<string, LeadRecord> = new Map();

  constructor(initialLeads?: LeadRecord[]) {
    if (initialLeads) {
      for (const lead of initialLeads) {
        this.leads.set(lead.id, lead);
      }
    }
  }

  public addLead(lead: LeadRecord): LeadRecord {
    this.leads.set(lead.id, lead);
    return lead;
  }

  public getLead(id: string): LeadRecord | undefined {
    return this.leads.get(id);
  }

  public getAllLeads(filter?: { status?: string; urgency?: string; trade?: string }): LeadRecord[] {
    let result = Array.from(this.leads.values());

    if (filter) {
      if (filter.status && filter.status !== 'ALL') {
        if (filter.status === 'ACTIVE') {
          result = result.filter(l => !['RESCUED', 'LOST_BREACHED', 'APPOINTMENT_BOOKED'].includes(l.status));
        } else {
          result = result.filter(l => l.status === filter.status);
        }
      }
      if (filter.urgency) {
        result = result.filter(l => l.urgency_tier === filter.urgency);
      }
      if (filter.trade) {
        result = result.filter(l => l.trade === filter.trade);
      }
    }

    // Sort by Urgency (Critical first), then SLA expiration
    return result.sort((a, b) => {
      const urgencyOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
      const uDiff = urgencyOrder[b.urgency_tier] - urgencyOrder[a.urgency_tier];
      if (uDiff !== 0) return uDiff;
      return new Date(a.sla_expires_at).getTime() - new Date(b.sla_expires_at).getTime();
    });
  }

  public updateStatus(
    id: string,
    newStatus: LeadStatus,
    actor: 'SYSTEM_SENTINEL' | 'CUSTOMER' | 'DISPATCHER',
    details?: Record<string, unknown>
  ): LeadRecord {
    const lead = this.leads.get(id);
    if (!lead) {
      throw new Error(`Lead ${id} not found`);
    }

    const prevStatus = lead.status;
    lead.status = newStatus;
    lead.updated_at = new Date().toISOString();

    const auditEvent: AuditEvent = {
      id: `evt_${Math.random().toString(36).substring(2, 9)}`,
      lead_id: id,
      timestamp: lead.updated_at,
      action: `STATUS_CHANGED_TO_${newStatus}`,
      actor,
      details: {
        from_status: prevStatus,
        to_status: newStatus,
        ...(details || {}),
      },
    };

    lead.audit_trail.push(auditEvent);
    this.leads.set(id, lead);
    return lead;
  }

  public bookSlot(id: string, slot: BookingSlot, notes?: string): LeadRecord {
    const lead = this.leads.get(id);
    if (!lead) {
      throw new Error(`Lead ${id} not found`);
    }

    lead.booked_slot = slot;
    if (notes) {
      lead.resolution_notes = notes;
    }
    return this.updateStatus(id, 'APPOINTMENT_BOOKED', 'CUSTOMER', { slot, notes });
  }

  public calculateMetrics(): RevenueLedgerMetrics {
    const all = Array.from(this.leads.values());
    const total_inbound_leads = all.length;

    let active_leads_count = 0;
    let rescued_leads_count = 0;
    let lost_leads_count = 0;

    let pipeline_value_total_usd = 0;
    let pipeline_value_at_risk_usd = 0;
    let pipeline_value_rescued_usd = 0;
    let pipeline_value_lost_usd = 0;

    for (const lead of all) {
      const val = lead.estimated_job_value_usd || 0;
      pipeline_value_total_usd += val;

      if (['RESCUED', 'APPOINTMENT_BOOKED'].includes(lead.status)) {
        rescued_leads_count++;
        pipeline_value_rescued_usd += val;
      } else if (lead.status === 'LOST_BREACHED') {
        lost_leads_count++;
        pipeline_value_lost_usd += val;
      } else {
        active_leads_count++;
        pipeline_value_at_risk_usd += val;
      }
    }

    const resolved = rescued_leads_count + lost_leads_count;
    const recovery_rate_pct = resolved > 0 ? Math.round((rescued_leads_count / resolved) * 1000) / 10 : 100;
    const leakage_rate_pct = resolved > 0 ? Math.round((lost_leads_count / resolved) * 1000) / 10 : 0;

    return {
      total_inbound_leads,
      active_leads_count,
      rescued_leads_count,
      lost_leads_count,
      leakage_rate_pct,
      recovery_rate_pct,
      pipeline_value_total_usd,
      pipeline_value_at_risk_usd,
      pipeline_value_rescued_usd,
      pipeline_value_lost_usd,
      median_speed_to_rescue_seconds: 4.2,
    };
  }

  public clear(): void {
    this.leads.clear();
  }
}

// Global Singleton Instance
export const globalStore = new LeadEventStore();
