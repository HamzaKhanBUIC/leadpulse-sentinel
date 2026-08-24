import React, { useState } from 'react';
import { X, Clock, Send, Calendar, CheckCircle2, XCircle, PhoneCall, ExternalLink, ShieldCheck, MapPin, User, MessageSquare } from 'lucide-react';
import { LeadRecord } from '../../types/index.js';

interface LeadDetailDrawerProps {
  lead: LeadRecord | null;
  onClose: () => void;
  onAction: (leadId: string, action: string, notes?: string) => void;
  onBookSlot: (leadId: string, slotId: string, notes?: string) => void;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  lead,
  onClose,
  onAction,
  onBookSlot,
}) => {
  const [notes, setNotes] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('slot_asap');

  if (!lead) return null;

  const isResolved = ['RESCUED', 'APPOINTMENT_BOOKED', 'LOST_BREACHED'].includes(lead.status);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-xl bg-[#0F1423] border-l border-gray-800 h-full overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-[#0F1423] z-10">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {lead.customer_name}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-mono">
                {lead.trade}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              ID: {lead.id} • Channel: {lead.channel}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 flex-1 text-xs">
          {/* Urgency & Valuation Ribbon */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-gray-900/80 border border-gray-800">
            <div>
              <div className="text-[11px] text-gray-400">Urgency Assessment</div>
              <div className="text-base font-bold text-white flex items-center gap-1.5 mt-0.5">
                <span className={`w-2.5 h-2.5 rounded-full ${lead.urgency_tier === 'CRITICAL' ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`} />
                {lead.urgency_tier} ({lead.l_score}/100)
              </div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400">Estimated Job Value</div>
              <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                ${lead.estimated_job_value_usd.toLocaleString()} USD
              </div>
            </div>
          </div>

          {/* Customer Metadata Card */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Customer & Inbound Record
            </h3>
            <div className="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 space-y-2 text-gray-300">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <span>{lead.customer_name} ({lead.customer_phone})</span>
              </div>
              {lead.customer_address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{lead.customer_address}</span>
                </div>
              )}
              <div className="p-2.5 rounded-lg bg-gray-950 border border-gray-800/80 text-gray-200 mt-2">
                <div className="text-[10px] text-gray-500 font-semibold uppercase mb-1">Raw Customer Inquiry</div>
                "{lead.raw_inquiry_text}"
              </div>
            </div>
          </div>

          {/* Dispatched Auto-Rescue SMS */}
          {lead.rescue_payload && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" /> Dispatched Auto-Rescue SMS
              </h3>
              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/40 text-blue-200">
                <div className="text-xs font-sans whitespace-pre-wrap leading-relaxed">
                  {lead.rescue_payload.message_body}
                </div>
                <div className="mt-3 pt-2.5 border-t border-blue-900/40 flex items-center justify-between text-[11px]">
                  <span className="text-blue-300 font-mono">Status: DELIVERED (&lt;2s)</span>
                  <a
                    href={lead.rescue_payload.interactive_booking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 underline"
                  >
                    Open Customer Booking Link <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Self-Service Arrival Slot Reservation */}
          {!isResolved && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Hold Immediate Arrival Window
              </h3>
              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <label className={`p-2.5 rounded-lg border text-xs cursor-pointer flex flex-col justify-between ${selectedSlot === 'slot_asap' ? 'bg-emerald-600/30 border-emerald-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-400'}`}>
                    <input type="radio" name="slot" value="slot_asap" checked={selectedSlot === 'slot_asap'} onChange={() => setSelectedSlot('slot_asap')} className="sr-only" />
                    <span className="font-bold text-white">⚡ Emergency ASAP</span>
                    <span className="text-[10px] text-emerald-300 mt-1">Arrival in 60–90 mins</span>
                  </label>
                  <label className={`p-2.5 rounded-lg border text-xs cursor-pointer flex flex-col justify-between ${selectedSlot === 'slot_afternoon' ? 'bg-emerald-600/30 border-emerald-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-400'}`}>
                    <input type="radio" name="slot" value="slot_afternoon" checked={selectedSlot === 'slot_afternoon'} onChange={() => setSelectedSlot('slot_afternoon')} className="sr-only" />
                    <span className="font-bold text-white">📅 Today 2:00 - 4:00 PM</span>
                    <span className="text-[10px] text-gray-400 mt-1">Standard Dispatch</span>
                  </label>
                </div>
                <button
                  onClick={() => onBookSlot(lead.id, selectedSlot, 'Reserved by operator in triage drawer')}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirm & Book Arrival Window
                </button>
              </div>
            </div>
          )}

          {/* Audit Event Timeline */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Chronological Audit Trail
            </h3>
            <div className="space-y-2 pl-2 border-l-2 border-gray-800">
              {lead.audit_trail.map((evt, idx) => (
                <div key={idx} className="relative pl-4 pb-2">
                  <div className="absolute -left-[13px] top-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-[#0F1423]" />
                  <div className="font-mono text-[10px] text-gray-500">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="font-semibold text-gray-200 text-xs">
                    {evt.action.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[11px] text-gray-400 font-mono">
                    Actor: {evt.actor}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer Action Footer */}
        <div className="p-4 border-t border-gray-800 bg-[#0B0F19] sticky bottom-0 z-10 flex items-center justify-between gap-2">
          {!isResolved ? (
            <>
              <button
                onClick={() => onAction(lead.id, 'CLAIM_AND_ENGAGE', notes)}
                className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <PhoneCall className="w-4 h-4" /> Claim & Call Lead
              </button>
              <button
                onClick={() => onAction(lead.id, 'MARK_RESCUED', notes)}
                className="py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" /> Mark Rescued
              </button>
              <button
                onClick={() => onAction(lead.id, 'MARK_LOST', notes)}
                className="py-2 px-3 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-500/40 text-red-300 font-semibold flex items-center gap-1 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Lost
              </button>
            </>
          ) : (
            <div className="w-full text-center py-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 rounded-lg border border-emerald-800/40 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Lead Status: {lead.status} (Resolved)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
