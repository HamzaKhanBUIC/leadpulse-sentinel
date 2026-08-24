import React, { useState, useEffect } from 'react';
import { PhoneMissed, FileText, Moon, Globe, Clock, CheckCircle2, XCircle, ChevronRight, AlertCircle, PhoneCall, Send } from 'lucide-react';
import { LeadRecord, InboundChannel, UrgencyTier } from '../../types/index.js';

interface TriageTableProps {
  leads: LeadRecord[];
  onSelectLead: (lead: LeadRecord) => void;
  onAction: (leadId: string, action: string) => void;
}

export const TriageTable: React.FC<TriageTableProps> = ({
  leads,
  onSelectLead,
  onAction,
}) => {
  const [filter, setFilter] = useState<'ACTIVE' | 'CRITICAL' | 'HIGH' | 'RESCUED' | 'ALL'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [now, setNow] = useState(Date.now());

  // Tick every second to drive the live SLA countdown clocks
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const filteredLeads = leads.filter((lead) => {
    // Status / urgency filter
    if (filter === 'ACTIVE') {
      if (['RESCUED', 'LOST_BREACHED', 'APPOINTMENT_BOOKED'].includes(lead.status)) return false;
    } else if (filter === 'CRITICAL') {
      if (lead.urgency_tier !== 'CRITICAL') return false;
    } else if (filter === 'HIGH') {
      if (lead.urgency_tier !== 'HIGH') return false;
    } else if (filter === 'RESCUED') {
      if (!['RESCUED', 'APPOINTMENT_BOOKED'].includes(lead.status)) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = lead.customer_name.toLowerCase().includes(q);
      const matchPhone = lead.customer_phone.includes(q);
      const matchText = lead.raw_inquiry_text.toLowerCase().includes(q);
      const matchTrade = lead.trade.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchText && !matchTrade) return false;
    }

    return true;
  });

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
      {/* Table Filter & Search Toolbar */}
      <div className="p-4 border-b border-gray-800 flex flex-wrap items-center justify-between gap-3 bg-[#131B2E]">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ACTIVE', 'CRITICAL', 'HIGH', 'RESCUED', 'ALL'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-gray-200'
              }`}
            >
              {f === 'ACTIVE' && '⚡ Live Triage Queue'}
              {f === 'CRITICAL' && '🔥 Critical Only'}
              {f === 'HIGH' && '⚠️ High Priority'}
              {f === 'RESCUED' && '✅ Rescued & Booked'}
              {f === 'ALL' && '📋 All History'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search leads, phone, issues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 w-60"
          />
        </div>
      </div>

      {/* Table Main */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-800 bg-[#0F1423] text-gray-400 font-semibold tracking-wider uppercase text-[10px]">
              <th className="py-3 px-4">Channel</th>
              <th className="py-3 px-4">Customer & Trade</th>
              <th className="py-3 px-4 min-w-[280px]">Inbound Issue Summary</th>
              <th className="py-3 px-4">Urgency & Score</th>
              <th className="py-3 px-4">Est. Value</th>
              <th className="py-3 px-4">SLA Countdown</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Quick Triage</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60 font-sans">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-gray-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                  No leads matching the current filter.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => {
                const slaExpiry = new Date(lead.sla_expires_at).getTime();
                const secondsLeft = Math.max(0, Math.floor((slaExpiry - now) / 1000));
                const isResolved = ['RESCUED', 'APPOINTMENT_BOOKED', 'LOST_BREACHED'].includes(lead.status);

                return (
                  <tr
                    key={lead.id}
                    className={`hover:bg-[#1A2238] transition-colors cursor-pointer group ${
                      lead.urgency_tier === 'CRITICAL' && !isResolved
                        ? 'bg-red-950/10'
                        : ''
                    }`}
                    onClick={() => onSelectLead(lead)}
                  >
                    {/* Channel */}
                    <td className="py-3 px-4">
                      <ChannelIcon channel={lead.channel} />
                    </td>

                    {/* Customer & Trade */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white group-hover:text-blue-300 transition-colors">
                        {lead.customer_name}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                        <span className="px-1.5 py-0.2 rounded bg-gray-800 text-gray-300 font-sans text-[10px]">
                          {lead.trade}
                        </span>
                        <span>{lead.customer_phone}</span>
                      </div>
                    </td>

                    {/* Summary */}
                    <td className="py-3 px-4">
                      <div className="line-clamp-2 text-gray-300 text-xs">
                        {lead.raw_inquiry_text}
                      </div>
                      {lead.customer_address && (
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          📍 {lead.customer_address}
                        </div>
                      )}
                    </td>

                    {/* Urgency */}
                    <td className="py-3 px-4">
                      <UrgencyBadge tier={lead.urgency_tier} score={lead.l_score} />
                    </td>

                    {/* Est Value */}
                    <td className="py-3 px-4 font-mono font-semibold text-white">
                      ${lead.estimated_job_value_usd.toLocaleString()}
                    </td>

                    {/* SLA Countdown */}
                    <td className="py-3 px-4">
                      <CountdownTimer
                        secondsLeft={secondsLeft}
                        isResolved={isResolved}
                        status={lead.status}
                      />
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <StatusBadge status={lead.status} />
                    </td>

                    {/* Quick Triage Buttons */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {!isResolved ? (
                          <>
                            <button
                              onClick={() => onAction(lead.id, 'CLAIM_AND_ENGAGE')}
                              className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 hover:text-white transition-colors"
                              title="Claim & Dial Callback"
                            >
                              <PhoneCall className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onAction(lead.id, 'MARK_RESCUED')}
                              className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 hover:text-white transition-colors"
                              title="Mark Rescued"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onAction(lead.id, 'MARK_LOST')}
                              className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 hover:text-white transition-colors"
                              title="Mark Lost"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-gray-500 font-mono">Resolved</span>
                        )}
                        <button
                          onClick={() => onSelectLead(lead)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                          title="Open Detail Inspector"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* Helper Components */

function ChannelIcon({ channel }: { channel: InboundChannel }) {
  switch (channel) {
    case 'MISSED_CALL':
      return (
        <span className="inline-flex p-2 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30" title="Missed Call">
          <PhoneMissed className="w-4 h-4" />
        </span>
      );
    case 'WEB_FORM':
      return (
        <span className="inline-flex p-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30" title="Web Form">
          <FileText className="w-4 h-4" />
        </span>
      );
    case 'AFTER_HOURS':
      return (
        <span className="inline-flex p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30" title="After Hours">
          <Moon className="w-4 h-4" />
        </span>
      );
    default:
      return (
        <span className="inline-flex p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" title="Direct Webhook">
          <Globe className="w-4 h-4" />
        </span>
      );
  }
}

function UrgencyBadge({ tier, score }: { tier: UrgencyTier; score: number }) {
  const map = {
    CRITICAL: 'bg-red-950/80 border-red-600 text-red-400 animate-pulse',
    HIGH: 'bg-amber-950/80 border-amber-600 text-amber-400',
    MEDIUM: 'bg-blue-950/80 border-blue-600 text-blue-400',
    LOW: 'bg-gray-800 border-gray-700 text-gray-400',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${map[tier]}`}>
      <span className="font-mono">{score}</span> {tier}
    </span>
  );
}

function CountdownTimer({
  secondsLeft,
  isResolved,
  status,
}: {
  secondsLeft: number;
  isResolved: boolean;
  status: string;
}) {
  if (isResolved) {
    if (status === 'LOST_BREACHED') {
      return <span className="font-mono text-xs text-red-500 font-bold">BREACHED (LOST)</span>;
    }
    return <span className="font-mono text-xs text-emerald-400 font-bold">RESCUED</span>;
  }

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  let colorClass = 'text-emerald-400 bg-emerald-950/50 border-emerald-800/60';
  if (secondsLeft <= 60) {
    colorClass = 'text-red-400 bg-red-950/60 border-red-700 animate-pulse font-bold';
  } else if (secondsLeft <= 180) {
    colorClass = 'text-amber-400 bg-amber-950/60 border-amber-700';
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono text-xs border ${colorClass}`}>
      <Clock className="w-3 h-3" />
      {formatted}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'AUTO_RESCUE_SENT':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 bg-blue-950/50 border border-blue-800/50 px-2 py-0.5 rounded">
          <Send className="w-3 h-3" /> Auto-Rescue Sent
        </span>
      );
    case 'APPOINTMENT_BOOKED':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded font-semibold">
          <CheckCircle2 className="w-3 h-3" /> Slot Booked
        </span>
      );
    case 'DISPATCHER_ENGAGED':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/50 border border-amber-800/50 px-2 py-0.5 rounded">
          <PhoneCall className="w-3 h-3" /> Dispatcher Engaged
        </span>
      );
    case 'RESCUED':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2 py-0.5 rounded font-semibold">
          <CheckCircle2 className="w-3 h-3" /> Rescued
        </span>
      );
    case 'LOST_BREACHED':
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-red-400 bg-red-950/50 border border-red-800/50 px-2 py-0.5 rounded">
          <XCircle className="w-3 h-3" /> Leaked to Competitor
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
          {status}
        </span>
      );
  }
}
