import React, { useState } from 'react';
import { X, Send, PhoneMissed, FileText, Moon, Zap } from 'lucide-react';
import { InboundChannel, ServiceTrade } from '../../types/index.js';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngestCustom: (payload: any) => Promise<void>;
  onClearAndReset: () => Promise<void>;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  isOpen,
  onClose,
  onIngestCustom,
  onClearAndReset,
}) => {
  const [channel, setChannel] = useState<InboundChannel>('MISSED_CALL');
  const [trade, setTrade] = useState<ServiceTrade>('HVAC');
  const [name, setName] = useState('Brandon Taylor');
  const [phone, setPhone] = useState('+1 (555) 789-0123');
  const [address, setAddress] = useState('742 Evergreen Terrace, Springfield');
  const [message, setMessage] = useState('Air conditioning stopped working on the hottest day of the year. House is 88 degrees!');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onIngestCustom({
        channel,
        trade,
        customer_name: name,
        customer_phone: phone,
        customer_address: address,
        raw_inquiry_text: message,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0F1423] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Inbound Webhook Simulator</h3>
              <p className="text-xs text-gray-400">Inject synthetic calls and forms into the live triage engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Channel Selector */}
          <div>
            <label className="block text-gray-400 font-semibold mb-1.5 uppercase tracking-wider text-[10px]">Inbound Channel</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'MISSED_CALL', label: 'Missed Call', icon: PhoneMissed },
                { id: 'WEB_FORM', label: 'Web Quote', icon: FileText },
                { id: 'AFTER_HOURS', label: 'After Hours', icon: Moon },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setChannel(c.id as InboundChannel)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 font-semibold transition-colors ${
                      channel === c.id
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trade & Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">Service Trade</label>
              <select
                value={trade}
                onChange={(e) => setTrade(e.target.value as ServiceTrade)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="HVAC">HVAC</option>
                <option value="PLUMBING">Plumbing</option>
                <option value="ELECTRICAL">Electrical</option>
                <option value="ROOFING">Roofing</option>
                <option value="RESTORATION">Restoration</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">Customer Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Phone & Address */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">Customer Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Inquiry Text */}
          <div>
            <label className="block text-gray-400 font-semibold mb-1 uppercase tracking-wider text-[10px]">Raw Problem Description (NLP Trigger)</label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 font-sans"
              required
            />
          </div>

          <div className="pt-3 border-t border-gray-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={async () => {
                await onClearAndReset();
                onClose();
              }}
              className="text-xs text-gray-500 hover:text-gray-300 underline"
            >
              Reset to Initial Seed Data
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg bg-gray-800 text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/30"
              >
                <Send className="w-3.5 h-3.5" />
                {loading ? 'Ingesting...' : 'Fire Ingestion Webhook'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
