import React from 'react';
import { DollarSign, ShieldCheck, AlertTriangle, Zap } from 'lucide-react';
import { RevenueLedgerMetrics } from '../../types/index.js';

interface KpiMetricsQuadProps {
  metrics: RevenueLedgerMetrics;
}

export const KpiMetricsQuad: React.FC<KpiMetricsQuadProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Rescued Pipeline */}
      <div className="p-4 rounded-xl bg-[#111827] border border-emerald-900/40 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span className="font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Pipeline Rescued
          </span>
          <span className="font-mono text-emerald-400/80 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
            {metrics.rescued_leads_count} Leads
          </span>
        </div>
        <div className="text-2xl font-bold font-mono text-white tracking-tight">
          ${metrics.pipeline_value_rescued_usd.toLocaleString()}
        </div>
        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <span>Saved from competitor leak</span>
        </div>
      </div>

      {/* 2. Pipeline at Risk */}
      <div className="p-4 rounded-xl bg-[#111827] border border-amber-900/40 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span className="font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Active at Risk
          </span>
          <span className="font-mono text-amber-400/80 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/40">
            {metrics.active_leads_count} Pending
          </span>
        </div>
        <div className="text-2xl font-bold font-mono text-white tracking-tight">
          ${metrics.pipeline_value_at_risk_usd.toLocaleString()}
        </div>
        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <span>SLA decay in progress</span>
        </div>
      </div>

      {/* 3. Recovery Rate */}
      <div className="p-4 rounded-xl bg-[#111827] border border-blue-900/40 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span className="font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> Recovery Rate
          </span>
          <span className="font-mono text-blue-400/80 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-800/40">
            {metrics.total_inbound_leads} Inbounds
          </span>
        </div>
        <div className="text-2xl font-bold font-mono text-white tracking-tight">
          {metrics.recovery_rate_pct}%
        </div>
        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <span>{metrics.leakage_rate_pct}% lost to SLA breach</span>
        </div>
      </div>

      {/* 4. Median Speed to Rescue */}
      <div className="p-4 rounded-xl bg-[#111827] border border-cyan-900/40 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span className="font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Speed to Rescue
          </span>
          <span className="font-mono text-cyan-400/80 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
            HBR Target &lt;60s
          </span>
        </div>
        <div className="text-2xl font-bold font-mono text-white tracking-tight">
          {metrics.median_speed_to_rescue_seconds}s
        </div>
        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <span>Autonomous response dispatch</span>
        </div>
      </div>
    </div>
  );
};
