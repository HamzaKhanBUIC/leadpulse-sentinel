import React, { useState, useEffect } from 'react';
import { ShieldCheck, Calendar, Clock, CheckCircle2, PhoneCall, AlertCircle } from 'lucide-react';
import { LeadRecord } from '../../types/index.js';

interface SelfBookingViewProps {
  leadId: string;
  onBackToDashboard: () => void;
}

export const SelfBookingView: React.FC<SelfBookingViewProps> = ({
  leadId,
  onBackToDashboard,
}) => {
  const [lead, setLead] = useState<LeadRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState('slot_asap');
  const [notes, setNotes] = useState('');
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/leads/${leadId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLead(data.lead);
          if (data.lead.status === 'APPOINTMENT_BOOKED' || data.lead.status === 'RESCUED') {
            setBooked(true);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [leadId]);

  const handleConfirm = async () => {
    try {
      const res = await fetch(`/api/v1/leads/${leadId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: selectedSlot,
          label: selectedSlot === 'slot_asap' ? 'Emergency Dispatch (Next 60 Mins)' : 'Today 2:00 - 4:00 PM',
          notes,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBooked(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-4">
        <div className="text-sm font-mono text-gray-400 animate-pulse">Loading Customer Intake...</div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold">Booking Link Expired or Not Found</h2>
          <button onClick={onBackToDashboard} className="mt-4 px-4 py-2 bg-gray-800 rounded-lg text-xs">
            Back to Operator View
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#111827] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-[#131B2E] border-b border-gray-800 text-center">
          <div className="inline-flex p-3 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 mb-2">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Apex {lead.trade} Services
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Priority Emergency Dispatch Portal
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {booked ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">Arrival Window Confirmed!</h2>
              <p className="text-gray-300">
                Hi <span className="font-semibold text-white">{lead.customer_name}</span>, a certified technician has been reserved for your emergency window.
              </p>
              <div className="p-3 bg-gray-900 rounded-xl border border-gray-800 text-left text-[11px] text-gray-300">
                <div>📍 <span className="text-white">{lead.customer_address || 'On file'}</span></div>
                <div className="mt-1">📞 Contact: <span className="text-white">{lead.customer_phone}</span></div>
                <div className="mt-1">⚡ Service: <span className="text-emerald-400 font-semibold">{lead.trade} Emergency</span></div>
              </div>
              <p className="text-[11px] text-gray-500 pt-2">
                Our dispatcher is reviewing your ticket right now. You will receive a live technician ETA text shortly.
              </p>
            </div>
          ) : (
            <>
              <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-800/40 text-blue-200">
                <div className="font-semibold text-white text-xs mb-0.5">We Missed Your Call!</div>
                <p className="text-[11px] text-gray-300">
                  Select an immediate arrival window below and our dispatcher will lock in your slot right now.
                </p>
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-2 uppercase tracking-wider text-[10px]">
                  Select Guaranteed Arrival Window
                </label>
                <div className="space-y-2">
                  <label
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      selectedSlot === 'slot_asap'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white'
                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="slot"
                        value="slot_asap"
                        checked={selectedSlot === 'slot_asap'}
                        onChange={() => setSelectedSlot('slot_asap')}
                        className="text-emerald-500 focus:ring-0"
                      />
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          ⚡ Emergency Priority Window
                        </div>
                        <div className="text-[11px] text-emerald-400">
                          Arrival in next 60–90 minutes
                        </div>
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      selectedSlot === 'slot_afternoon'
                        ? 'bg-emerald-950/40 border-emerald-500 text-white'
                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="slot"
                        value="slot_afternoon"
                        checked={selectedSlot === 'slot_afternoon'}
                        onChange={() => setSelectedSlot('slot_afternoon')}
                        className="text-emerald-500 focus:ring-0"
                      />
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          📅 Today 2:00 PM – 4:00 PM
                        </div>
                        <div className="text-[11px] text-gray-400">
                          Standard afternoon window
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">
                  Special Instructions / Gate Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dog in backyard, side gate open"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                onClick={handleConfirm}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-colors"
              >
                <CheckCircle2 className="w-5 h-5" />
                Hold My Arrival Window
              </button>
            </>
          )}

          <div className="pt-4 border-t border-gray-800 text-center">
            <button
              onClick={onBackToDashboard}
              className="text-[11px] text-gray-500 hover:text-gray-300 underline"
            >
              ← Back to Dispatcher Dashboard View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
