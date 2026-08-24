import express, { Request, Response } from 'express';
import cors from 'cors';
import { normalizeAndEnrichLead, RawInboundSchema } from '../adapters/ingress/leadNormalizer.js';
import { globalStore } from '../core/ledger/eventStore.js';
import { SAMPLE_SCENARIOS, generateRandomSyntheticLead } from '../core/simulator/leadEmitter.js';
import { LeadStatus } from '../types/index.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Seed default sample leads if empty
  if (globalStore.getAllLeads().length === 0) {
    for (const sample of SAMPLE_SCENARIOS) {
      const lead = normalizeAndEnrichLead(sample);
      globalStore.addLead(lead);
    }
  }

  // 1. Ingestion Endpoint
  app.post('/api/v1/leads/ingest', (req: Request, res: Response) => {
    try {
      const validated = RawInboundSchema.parse(req.body);
      const lead = normalizeAndEnrichLead(validated);
      globalStore.addLead(lead);
      res.status(201).json({ success: true, lead });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 2. Query Leads List
  app.get('/api/v1/leads', (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const urgency = req.query.urgency as string | undefined;
    const trade = req.query.trade as string | undefined;

    const leads = globalStore.getAllLeads({ status, urgency, trade });
    res.json({
      success: true,
      leads,
      total_count: leads.length,
      server_timestamp: new Date().toISOString(),
    });
  });

  // 3. Single Lead Detail
  app.get('/api/v1/leads/:id', (req: Request, res: Response) => {
    const lead = globalStore.getLead(req.params.id);
    if (!lead) {
      res.status(404).json({ success: false, error: 'Lead not found' });
      return;
    }
    res.json({ success: true, lead });
  });

  // 4. Operator Triage Action
  app.post('/api/v1/leads/:id/action', (req: Request, res: Response) => {
    const { action, dispatcher_name, notes } = req.body;
    try {
      let targetStatus: LeadStatus = 'DISPATCHER_ENGAGED';
      if (action === 'MARK_RESCUED') targetStatus = 'RESCUED';
      if (action === 'MARK_LOST') targetStatus = 'LOST_BREACHED';
      if (action === 'AUTO_RESCUE') targetStatus = 'AUTO_RESCUE_SENT';

      const lead = globalStore.updateStatus(
        req.params.id,
        targetStatus,
        'DISPATCHER',
        { dispatcher_name: dispatcher_name || 'Operator', notes, original_action: action }
      );
      res.json({ success: true, lead });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  });

  // 5. Customer Self-Service Booking Slot
  app.post('/api/v1/leads/:id/book', (req: Request, res: Response) => {
    const { slot_id, label, start_time, end_time, notes } = req.body;
    try {
      const slot = {
        slot_id: slot_id || `slot_${Date.now()}`,
        label: label || 'Immediate Emergency Window (Next 2 Hours)',
        start_time: start_time || new Date().toISOString(),
        end_time: end_time || new Date(Date.now() + 7200000).toISOString(),
        is_emergency: true,
      };

      const lead = globalStore.bookSlot(req.params.id, slot, notes);
      res.json({ success: true, lead });
    } catch (err: any) {
      res.status(404).json({ success: false, error: err.message });
    }
  });

  // 6. Metrics & Financial Ledger
  app.get('/api/v1/metrics', (_req: Request, res: Response) => {
    const metrics = globalStore.calculateMetrics();
    res.json({ success: true, metrics });
  });

  // 7. Simulation Ingestion Burst
  app.post('/api/v1/simulate/burst', (req: Request, res: Response) => {
    const count = Number(req.body.count) || 3;
    const generated = [];
    for (let i = 0; i < count; i++) {
      const syn = generateRandomSyntheticLead();
      const lead = normalizeAndEnrichLead(syn);
      globalStore.addLead(lead);
      generated.push(lead);
    }
    res.json({ success: true, count: generated.length, leads: generated });
  });

  // 8. Simulation Reset / Clear
  app.post('/api/v1/simulate/clear', (_req: Request, res: Response) => {
    globalStore.clear();
    for (const sample of SAMPLE_SCENARIOS) {
      const lead = normalizeAndEnrichLead(sample);
      globalStore.addLead(lead);
    }
    res.json({ success: true, message: 'Reset to standard test scenario' });
  });

  return app;
}
