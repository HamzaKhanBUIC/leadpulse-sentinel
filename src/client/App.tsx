import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.js';
import { KpiMetricsQuad } from './components/KpiMetricsQuad.js';
import { TriageTable } from './components/TriageTable.js';
import { LeadDetailDrawer } from './components/LeadDetailDrawer.js';
import { SimulatorModal } from './components/SimulatorModal.js';
import { SelfBookingView } from './components/SelfBookingView.js';
import { LeadRecord, RevenueLedgerMetrics } from '../types/index.js';

export const App: React.FC = () => {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [metrics, setMetrics] = useState<RevenueLedgerMetrics>({
    total_inbound_leads: 0,
    active_leads_count: 0,
    rescued_leads_count: 0,
    lost_leads_count: 0,
    leakage_rate_pct: 0,
    recovery_rate_pct: 100,
    pipeline_value_total_usd: 0,
    pipeline_value_at_risk_usd: 0,
    pipeline_value_rescued_usd: 0,
    pipeline_value_lost_usd: 0,
    median_speed_to_rescue_seconds: 4.2,
  });
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [customerBookingLeadId, setCustomerBookingLeadId] = useState<string | null>(null);

  // Check URL path for customer booking portal (e.g. /book/:id)
  useEffect(() => {
    const path = window.location.pathname;
    if (path.startsWith('/book/')) {
      const id = path.replace('/book/', '');
      if (id) {
        setCustomerBookingLeadId(id);
      }
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [leadsRes, metricsRes] = await Promise.all([
        fetch('/api/v1/leads'),
        fetch('/api/v1/metrics'),
      ]);
      const leadsData = await leadsRes.json();
      const metricsData = await metricsRes.json();

      if (leadsData.success) {
        setLeads(leadsData.leads);
        // Refresh active lead in drawer if open
        if (selectedLead) {
          const updated = leadsData.leads.find((l: LeadRecord) => l.id === selectedLead.id);
          if (updated) setSelectedLead(updated);
        }
      }
      if (metricsData.success) {
        setMetrics(metricsData.metrics);
      }
    } catch (err) {
      console.error('Error fetching LeadPulse data:', err);
    }
  }, [selectedLead]);

  // Polling every 3 seconds for real-time telemetry
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleAction = async (leadId: string, action: string, notes?: string) => {
    try {
      await fetch(`/api/v1/leads/${leadId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes, dispatcher_name: 'Sarah (Office Dispatch)' }),
      });
      fetchData();
    } catch (err) {
      console.error('Action error:', err);
    }
  };

  const handleBookSlot = async (leadId: string, slotId: string, notes?: string) => {
    try {
      await fetch(`/api/v1/leads/${leadId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: slotId,
          label: slotId === 'slot_asap' ? 'Emergency Dispatch (Next 60-90 Mins)' : 'Today 2:00 - 4:00 PM',
          notes,
        }),
      });
      fetchData();
    } catch (err) {
      console.error('Booking error:', err);
    }
  };

  const handleQuickBurst = async () => {
    try {
      await fetch('/api/v1/simulate/burst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: 3 }),
      });
      fetchData();
    } catch (err) {
      console.error('Burst error:', err);
    }
  };

  const handleIngestCustom = async (payload: any) => {
    await fetch('/api/v1/leads/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    fetchData();
  };

  const handleClearAndReset = async () => {
    await fetch('/api/v1/simulate/clear', { method: 'POST' });
    fetchData();
  };

  // If viewing customer self-service booking portal
  if (customerBookingLeadId) {
    return (
      <SelfBookingView
        leadId={customerBookingLeadId}
        onBackToDashboard={() => {
          window.history.pushState({}, '', '/');
          setCustomerBookingLeadId(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F9FAFB] flex flex-col font-sans">
      <Header
        onOpenSimulator={() => setSimulatorOpen(true)}
        onRefresh={fetchData}
        onQuickBurst={handleQuickBurst}
        activeCount={metrics.active_leads_count}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <KpiMetricsQuad metrics={metrics} />

        <TriageTable
          leads={leads}
          onSelectLead={(lead) => setSelectedLead(lead)}
          onAction={handleAction}
        />
      </main>

      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onAction={handleAction}
        onBookSlot={handleBookSlot}
      />

      <SimulatorModal
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
        onIngestCustom={handleIngestCustom}
        onClearAndReset={handleClearAndReset}
      />
    </div>
  );
};

export default App;
