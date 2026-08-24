import http from 'node:http';
import { classifyInquiry } from '../core/sentinel/urgencyClassifier.js';
import { estimateJobValueUsd } from '../core/sentinel/valuationModel.js';
import { generateAutoRescuePayload } from '../core/rescue/autoRescueDispatcher.js';
import { LeadEventStore } from '../core/ledger/eventStore.js';
import { SAMPLE_SCENARIOS, generateRandomSyntheticLead } from '../core/simulator/leadEmitter.js';

export const serverStore = new LeadEventStore();

// Seed initial realistic enterprise leads
for (const sample of SAMPLE_SCENARIOS) {
  const classification = classifyInquiry(sample.raw_inquiry_text, sample.trade);
  const now = new Date();
  const id = `lead_${Math.random().toString(36).substring(2, 9)}`;
  const expiresAt = new Date(now.getTime() + classification.sla_seconds_total * 1000);
  const estimatedValue = estimateJobValueUsd(classification.trade, classification.urgency_tier, sample.raw_inquiry_text);

  const lead = {
    id,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    channel: sample.channel,
    trade: classification.trade,
    customer_name: sample.customer_name,
    customer_phone: sample.customer_phone,
    customer_email: sample.customer_email,
    customer_address: sample.customer_address,
    raw_inquiry_text: sample.raw_inquiry_text,
    urgency_tier: classification.urgency_tier,
    l_score: classification.l_score,
    sla_seconds_total: classification.sla_seconds_total,
    sla_expires_at: expiresAt.toISOString(),
    estimated_job_value_usd: estimatedValue,
    status: 'AUTO_RESCUE_SENT',
    rescue_payload: generateAutoRescuePayload({
      id,
      customer_name: sample.customer_name,
      customer_phone: sample.customer_phone,
      trade: classification.trade,
      raw_inquiry_text: sample.raw_inquiry_text,
      urgency_tier: classification.urgency_tier,
    }),
    audit_trail: [
      {
        id: `evt_${Math.random().toString(36).substring(2, 9)}`,
        lead_id: id,
        timestamp: now.toISOString(),
        action: 'INBOUND_LEAD_INGESTED',
        actor: 'SYSTEM_SENTINEL',
        details: { channel: sample.channel, urgency: classification.urgency_tier },
      },
      {
        id: `evt_${Math.random().toString(36).substring(2, 9)}`,
        lead_id: id,
        timestamp: new Date(now.getTime() + 1200).toISOString(),
        action: 'AUTO_RESCUE_DISPATCHED',
        actor: 'AUTO_RESCUE_ENGINE',
        details: { message: 'SMS Sent to customer with interactive booking token' },
      },
    ],
  };
  serverStore.addLead(lead);
}

export function createHttpServer() {
  return http.createServer(async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsed = new URL(req.url || '/', 'http://localhost');
    const pathname = parsed.pathname;
    const query = Object.fromEntries(parsed.searchParams);

    const sendJson = (statusCode, data) => {
      res.writeHead(statusCode, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    const readBody = () => new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
    });

    // --- API ROUTES ---

    // 1. GET /api/v1/leads
    if (req.method === 'GET' && pathname === '/api/v1/leads') {
      const leads = serverStore.getAllLeads(query);
      return sendJson(200, {
        success: true,
        leads,
        total_count: leads.length,
        server_timestamp: new Date().toISOString(),
      });
    }

    // 2. POST /api/v1/leads/ingest
    if (req.method === 'POST' && pathname === '/api/v1/leads/ingest') {
      const body = await readBody();
      if (!body.customer_phone || body.customer_phone.length < 5) {
        return sendJson(400, { success: false, error: 'Valid customer_phone is required' });
      }

      const now = new Date();
      const id = `lead_${Math.random().toString(36).substring(2, 9)}`;
      const rawText = body.raw_inquiry_text || 'Inbound customer inquiry';
      const classification = classifyInquiry(rawText, body.trade);
      const expiresAt = new Date(now.getTime() + classification.sla_seconds_total * 1000);
      const estimatedValue = estimateJobValueUsd(classification.trade, classification.urgency_tier, rawText);

      const lead = {
        id,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        channel: body.channel || 'DIRECT_WEBHOOK',
        trade: classification.trade,
        customer_name: body.customer_name || 'Prospective Customer',
        customer_phone: body.customer_phone,
        customer_email: body.customer_email,
        customer_address: body.customer_address,
        raw_inquiry_text: rawText,
        urgency_tier: classification.urgency_tier,
        l_score: classification.l_score,
        sla_seconds_total: classification.sla_seconds_total,
        sla_expires_at: expiresAt.toISOString(),
        estimated_job_value_usd: estimatedValue,
        status: 'AUTO_RESCUE_SENT',
        rescue_payload: generateAutoRescuePayload({
          id,
          customer_name: body.customer_name,
          customer_phone: body.customer_phone,
          trade: classification.trade,
          raw_inquiry_text: rawText,
          urgency_tier: classification.urgency_tier,
        }),
        audit_trail: [
          {
            id: `evt_${Math.random().toString(36).substring(2, 9)}`,
            lead_id: id,
            timestamp: now.toISOString(),
            action: 'INBOUND_LEAD_INGESTED',
            actor: 'SYSTEM_SENTINEL',
            details: { channel: body.channel, urgency: classification.urgency_tier },
          },
          {
            id: `evt_${Math.random().toString(36).substring(2, 9)}`,
            lead_id: id,
            timestamp: now.toISOString(),
            action: 'AUTO_RESCUE_DISPATCHED',
            actor: 'AUTO_RESCUE_ENGINE',
            details: { message: 'SMS Sent to customer' },
          },
        ],
      };

      serverStore.addLead(lead);
      return sendJson(201, { success: true, lead });
    }

    // 3. GET /api/v1/leads/:id
    if (req.method === 'GET' && pathname?.startsWith('/api/v1/leads/')) {
      const id = pathname.replace('/api/v1/leads/', '');
      const lead = serverStore.getLead(id);
      if (!lead) return sendJson(404, { success: false, error: 'Lead not found' });
      return sendJson(200, { success: true, lead });
    }

    // 4. POST /api/v1/leads/:id/action
    if (req.method === 'POST' && pathname?.includes('/action')) {
      const id = pathname.split('/')[4];
      const body = await readBody();
      let targetStatus = 'DISPATCHER_ENGAGED';
      if (body.action === 'MARK_RESCUED') targetStatus = 'RESCUED';
      if (body.action === 'MARK_LOST') targetStatus = 'LOST_BREACHED';

      try {
        const lead = serverStore.updateStatus(id, targetStatus, 'DISPATCHER', body);
        return sendJson(200, { success: true, lead });
      } catch (err) {
        return sendJson(404, { success: false, error: err.message });
      }
    }

    // 5. POST /api/v1/leads/:id/book
    if (req.method === 'POST' && pathname?.includes('/book')) {
      const id = pathname.split('/')[4];
      const body = await readBody();
      try {
        const slot = {
          slot_id: body.slot_id || 'slot_asap',
          label: body.label || 'Emergency Priority Window',
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 7200000).toISOString(),
          is_emergency: true,
        };
        const lead = serverStore.bookSlot(id, slot, body.notes);
        return sendJson(200, { success: true, lead });
      } catch (err) {
        return sendJson(404, { success: false, error: err.message });
      }
    }

    // 6. GET /api/v1/metrics
    if (req.method === 'GET' && pathname === '/api/v1/metrics') {
      const metrics = serverStore.calculateMetrics();
      return sendJson(200, { success: true, metrics });
    }

    // 7. POST /api/v1/simulate/burst
    if (req.method === 'POST' && pathname === '/api/v1/simulate/burst') {
      const body = await readBody();
      const count = Number(body.count) || 3;
      const generated = [];
      for (let i = 0; i < count; i++) {
        const syn = generateRandomSyntheticLead();
        const classification = classifyInquiry(syn.raw_inquiry_text, syn.trade);
        const now = new Date();
        const id = `lead_${Math.random().toString(36).substring(2, 9)}`;
        const expiresAt = new Date(now.getTime() + classification.sla_seconds_total * 1000);
        const estimatedValue = estimateJobValueUsd(classification.trade, classification.urgency_tier, syn.raw_inquiry_text);

        const lead = {
          id,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          channel: syn.channel,
          trade: classification.trade,
          customer_name: syn.customer_name,
          customer_phone: syn.customer_phone,
          customer_email: syn.customer_email,
          customer_address: syn.customer_address,
          raw_inquiry_text: syn.raw_inquiry_text,
          urgency_tier: classification.urgency_tier,
          l_score: classification.l_score,
          sla_seconds_total: classification.sla_seconds_total,
          sla_expires_at: expiresAt.toISOString(),
          estimated_job_value_usd: estimatedValue,
          status: 'AUTO_RESCUE_SENT',
          rescue_payload: generateAutoRescuePayload({
            id,
            customer_name: syn.customer_name,
            customer_phone: syn.customer_phone,
            trade: classification.trade,
            raw_inquiry_text: syn.raw_inquiry_text,
            urgency_tier: classification.urgency_tier,
          }),
          audit_trail: [
            {
              id: `evt_${Math.random().toString(36).substring(2, 9)}`,
              lead_id: id,
              timestamp: now.toISOString(),
              action: 'INBOUND_LEAD_INGESTED',
              actor: 'SYSTEM_SENTINEL',
              details: { channel: syn.channel, urgency: classification.urgency_tier },
            },
          ],
        };
        serverStore.addLead(lead);
        generated.push(lead);
      }
      return sendJson(200, { success: true, count: generated.length, leads: generated });
    }

    // 8. POST /api/v1/simulate/clear
    if (req.method === 'POST' && pathname === '/api/v1/simulate/clear') {
      serverStore.clear();
      return sendJson(200, { success: true, message: 'Database reset' });
    }

    // 9. Serve Customer Self-Booking Portal (/book/:id)
    if (req.method === 'GET' && pathname?.startsWith('/book/')) {
      const id = pathname.replace('/book/', '');
      const lead = serverStore.getLead(id);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(renderCustomerBookingHtml(lead, id));
    }

    // 10. Serve World-Class Standalone Web UI (Dashboard)
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderWorldClassHtml());
  });
}

function renderCustomerBookingHtml(lead, id) {
  const name = lead?.customer_name ? lead.customer_name.split(' ')[0] : 'there';
  const trade = lead?.trade || 'Emergency Home';
  const issue = lead?.raw_inquiry_text || 'emergency service situation';
  const isAlreadyBooked = lead?.status === 'APPOINTMENT_BOOKED';

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apex 24/7 Emergency Dispatch — Priority Booking</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #080C14; color: #F8FAFC; -webkit-font-smoothing: antialiased; }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .glass-card {
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(10, 16, 30, 0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.7);
    }
  </style>
</head>
<body class="min-h-screen flex items-center justify-center p-4 selection:bg-blue-600/30">
  <div class="max-w-lg w-full space-y-5">
    
    <!-- Verified Contractor Header -->
    <div class="text-center space-y-2">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-semibold">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        24/7 VERIFIED EMERGENCY DISPATCH
      </div>
      <h1 class="text-2xl font-extrabold text-white tracking-tight">Apex ${trade} Services</h1>
      <p class="text-xs text-slate-400">Licensed • Insured • 5-Star Rated Trade Contractors</p>
    </div>

    <!-- Booking Card Container -->
    <div id="booking-container" class="glass-card rounded-2xl p-6 relative overflow-hidden space-y-6">
      <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-blue-500"></div>

      ${isAlreadyBooked ? `
        <!-- Already Booked State -->
        <div class="text-center space-y-4 py-4">
          <div class="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
            ✓
          </div>
          <div>
            <h2 class="text-xl font-bold text-white">Arrival Window Confirmed!</h2>
            <p class="text-xs text-slate-300 mt-1">Technician on standby. We will text you 15 minutes before arrival.</p>
          </div>
          <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-left space-y-2 font-mono text-xs">
            <div class="flex justify-between"><span class="text-slate-400">Customer:</span><span class="text-white font-bold">${lead?.customer_name}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Phone:</span><span class="text-white">${lead?.customer_phone}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">Window:</span><span class="text-emerald-400 font-bold">${lead?.booked_slot?.label || 'Immediate Priority'}</span></div>
          </div>
        </div>
      ` : `
        <!-- Active Booking Flow -->
        <div class="space-y-4">
          <div>
            <span class="text-xs font-mono uppercase text-emerald-400 font-bold">⚡ Priority Dispatch Ready</span>
            <h2 class="text-lg font-bold text-white mt-1">Hi ${name}, hold an arrival window</h2>
            <p class="text-xs text-slate-300 leading-relaxed mt-1">We noticed we just missed your call regarding your <span class="text-blue-300 font-medium">${issue}</span>. Select a dispatch window below to hold your place in the priority queue.</p>
          </div>

          <!-- Selectable Window Options -->
          <div class="space-y-2.5">
            <label class="block p-3.5 rounded-xl border border-blue-500/50 bg-blue-950/20 hover:bg-blue-950/40 cursor-pointer transition-all">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <input type="radio" name="arrival_slot" value="slot_now_30m" checked class="text-blue-500 focus:ring-0">
                  <div>
                    <div class="text-xs font-bold text-white flex items-center gap-2">
                      <span>⚡ Immediate Emergency Dispatch</span>
                      <span class="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">Next 45-60 Mins</span>
                    </div>
                    <p class="text-[11px] text-slate-400 mt-0.5">Technician Jake Miller on active standby</p>
                  </div>
                </div>
              </div>
            </label>

            <label class="block p-3.5 rounded-xl border border-white/[0.08] bg-slate-900/60 hover:bg-slate-900 cursor-pointer transition-all">
              <div class="flex items-center gap-3">
                <input type="radio" name="arrival_slot" value="slot_today_2pm" class="text-blue-500 focus:ring-0">
                <div>
                  <div class="text-xs font-bold text-white">Today Afternoon (2:00 PM – 4:00 PM)</div>
                  <p class="text-[11px] text-slate-400 mt-0.5">Standard service call window</p>
                </div>
              </div>
            </label>

            <label class="block p-3.5 rounded-xl border border-white/[0.08] bg-slate-900/60 hover:bg-slate-900 cursor-pointer transition-all">
              <div class="flex items-center gap-3">
                <input type="radio" name="arrival_slot" value="slot_tomorrow_morning" class="text-blue-500 focus:ring-0">
                <div>
                  <div class="text-xs font-bold text-white">Tomorrow Morning (8:00 AM – 10:00 AM)</div>
                  <p class="text-[11px] text-slate-400 mt-0.5">First appointment of the day</p>
                </div>
              </div>
            </label>
          </div>

          <!-- Notes & Gate Access Input -->
          <div class="space-y-1.5">
            <label class="text-[11px] font-mono text-slate-400 uppercase">Property Access Notes / Gate Code (Optional)</label>
            <input type="text" id="cust-notes" placeholder="e.g. Gate code #4321, dogs in backyard" class="w-full bg-slate-900/90 border border-white/[0.1] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
          </div>

          <!-- Submit Action -->
          <button onclick="confirmBooking('${id}')" id="btn-submit-booking" class="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xl shadow-blue-600/30 transition-all flex items-center justify-center gap-2 active:scale-98">
            <span>Lock In Priority Arrival Window →</span>
          </button>
        </div>
      `}
    </div>

    <!-- Trust Badges -->
    <div class="text-center text-[11px] text-slate-500 font-mono flex items-center justify-center gap-4">
      <span>🔒 256-Bit Encrypted</span>
      <span>•</span>
      <span>✓ Verified Dispatcher</span>
      <span>•</span>
      <span>⭐ 4.9/5 Average Rating</span>
    </div>
  </div>

  <script>
    async function confirmBooking(leadId) {
      const btn = document.getElementById('btn-submit-booking');
      btn.disabled = true;
      btn.innerHTML = '<span>Reserving Dispatch Slot...</span>';

      const selectedSlot = document.querySelector('input[name="arrival_slot"]:checked')?.value || 'slot_now_30m';
      const notes = document.getElementById('cust-notes')?.value || '';

      const slotLabels = {
        'slot_now_30m': 'Immediate Emergency (Next 45-60 Mins)',
        'slot_today_2pm': 'Today 2:00 PM – 4:00 PM',
        'slot_tomorrow_morning': 'Tomorrow 8:00 AM – 10:00 AM'
      };

      try {
        const res = await fetch('/api/v1/leads/' + leadId + '/book', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slot_id: selectedSlot,
            label: slotLabels[selectedSlot],
            notes: notes
          })
        });
        const data = await res.json();
        if (data.success) {
          window.location.reload();
        }
      } catch (err) {
        alert('Booking error, please call dispatch directly.');
        btn.disabled = false;
        btn.innerHTML = '<span>Lock In Priority Arrival Window →</span>';
      }
    }
  </script>
</body>
</html>`;
}

function renderWorldClassHtml() {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LeadPulse Sentinel — Enterprise Mission Control</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          },
          colors: {
            canvas: '#080C14',
            surface: '#0F172A',
            'surface-elevated': '#162036',
            brand: '#3B82F6',
            crimson: '#FF2D55',
            topaz: '#FFB000',
            emerald: '#10B981',
          }
        }
      }
    }
  </script>
  <style>
    body {
      background-color: #080C14;
      color: #F8FAFC;
      font-family: 'Plus Jakarta Sans', sans-serif;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    .font-mono { font-family: 'JetBrains Mono', monospace; }
    .glass-card {
      background: linear-gradient(180deg, rgba(15, 23, 42, 0.9) 0%, rgba(10, 16, 30, 0.95) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
      box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
    }
    .glass-card-hover {
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .glass-card-hover:hover {
      border-color: rgba(59, 130, 246, 0.3);
      box-shadow: 0 8px 30px -4px rgba(0, 0, 0, 0.7), inset 0 1px 0 0 rgba(255, 255, 255, 0.15);
      transform: translateY(-1px);
    }
    .glow-critical {
      box-shadow: 0 0 15px rgba(255, 45, 85, 0.25), inset 0 0 10px rgba(255, 45, 85, 0.15);
    }
    .glow-brand {
      box-shadow: 0 0 15px rgba(59, 130, 246, 0.25);
    }
    .glow-emerald {
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.25);
    }
    /* Custom Scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: #080C14; }
    ::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: #334155; }
  </style>
</head>
<body class="min-h-screen flex flex-col selection:bg-blue-600/30 selection:text-blue-200">

  <!-- Application Shell -->
  <div id="app" class="flex-1 flex flex-col">

    <!-- Top Navigation Command Bar -->
    <header class="border-b border-white/[0.08] bg-[#0A101D]/90 backdrop-blur-xl sticky top-0 z-40 px-6 py-3 shadow-2xl">
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        <!-- Brand & System Telemetry Status -->
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner relative">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                  LeadPulse <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">SENTINEL</span>
                </span>
                <span class="text-[11px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  24/7 INGESTION ACTIVE
                </span>
              </div>
              <p class="text-[11px] text-slate-400 font-normal">Autonomous Inbound Sentinel & Lead Leakage Recovery</p>
            </div>
          </div>
        </div>

        <!-- Global Telemetry Status Pills -->
        <div class="hidden lg:flex items-center gap-3 font-mono text-[11px] text-slate-400">
          <div class="px-2.5 py-1 rounded bg-slate-900/60 border border-slate-800 flex items-center gap-1.5">
            <span class="text-slate-500">Latency:</span>
            <span class="text-blue-400 font-semibold">1.4ms</span>
          </div>
          <div class="px-2.5 py-1 rounded bg-slate-900/60 border border-slate-800 flex items-center gap-1.5">
            <span class="text-slate-500">SLA Health:</span>
            <span class="text-emerald-400 font-semibold">98.2%</span>
          </div>
        </div>

        <!-- Quick Action Controls & Global Search Trigger -->
        <div class="flex items-center gap-2.5">
          <!-- Command Palette Trigger -->
          <button onclick="openCommandPalette()" class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 text-xs transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Search leads...</span>
            <kbd class="font-mono text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">⌘K</kbd>
          </button>

          <!-- Quick Burst Simulation Button -->
          <button onclick="triggerQuickBurst()" class="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 border border-blue-400/30 flex items-center gap-1.5 active:scale-95 transition-all">
            <svg class="w-3.5 h-3.5 text-blue-200 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>+3 Simulated Leads</span>
          </button>

          <!-- Simulator Bench Modal Trigger -->
          <button onclick="openSimulatorModal()" class="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors" title="Open Simulation Bench">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>

          <!-- Audio Toggle -->
          <button id="audio-toggle-btn" onclick="toggleAudio()" class="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors" title="Toggle Dispatch Sound Chimes">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Dashboard Container -->
    <main class="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">

      <!-- KPI Metrics Quad with Dynamic SVG Sparklines -->
      <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Card 1: Pipeline Rescued -->
        <div class="glass-card glass-card-hover rounded-xl p-4.5 relative overflow-hidden group">
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-emerald-300"></div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pipeline Rescued
            </span>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">+18.4%</span>
          </div>
          <div id="kpi-rescued" class="text-2xl font-bold font-mono text-white tracking-tight">$0</div>
          <div class="flex items-end justify-between mt-2">
            <span class="text-[11px] text-slate-400">Captured before competitor leak</span>
            <!-- Sparkline SVG -->
            <svg class="w-20 h-6 text-emerald-400" viewBox="0 0 80 24" fill="none">
              <path d="M0 20 L15 16 L30 18 L45 10 L60 12 L80 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M0 20 L15 16 L30 18 L45 10 L60 12 L80 2 L80 24 L0 24 Z" fill="currentColor" fill-opacity="0.1"/>
            </svg>
          </div>
        </div>

        <!-- Card 2: Active Value at Risk -->
        <div class="glass-card glass-card-hover rounded-xl p-4.5 relative overflow-hidden group">
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 to-rose-500"></div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Active at Risk
            </span>
            <span id="kpi-active-count" class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40">0 Leads</span>
          </div>
          <div id="kpi-risk" class="text-2xl font-bold font-mono text-white tracking-tight">$0</div>
          <div class="flex items-end justify-between mt-2">
            <span class="text-[11px] text-slate-400">Decaying SLA window in progress</span>
            <!-- Sparkline SVG -->
            <svg class="w-20 h-6 text-amber-400" viewBox="0 0 80 24" fill="none">
              <path d="M0 8 L15 14 L30 10 L45 18 L60 6 L80 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M0 8 L15 14 L30 10 L45 18 L60 6 L80 15 L80 24 L0 24 Z" fill="currentColor" fill-opacity="0.1"/>
            </svg>
          </div>
        </div>

        <!-- Card 3: Recovery Rate -->
        <div class="glass-card glass-card-hover rounded-xl p-4.5 relative overflow-hidden group">
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 to-cyan-400"></div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-blue-400 font-mono flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Recovery Rate
            </span>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/40">SLA 95%+</span>
          </div>
          <div id="kpi-rate" class="text-2xl font-bold font-mono text-white tracking-tight">100%</div>
          <div class="flex items-end justify-between mt-2">
            <span id="kpi-leakage" class="text-[11px] text-slate-400">0% lost to competitor</span>
            <!-- Sparkline SVG -->
            <svg class="w-20 h-6 text-blue-400" viewBox="0 0 80 24" fill="none">
              <path d="M0 18 L15 12 L30 14 L45 8 L60 4 L80 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M0 18 L15 12 L30 14 L45 8 L60 4 L80 2 L80 24 L0 24 Z" fill="currentColor" fill-opacity="0.1"/>
            </svg>
          </div>
        </div>

        <!-- Card 4: Speed to Rescue -->
        <div class="glass-card glass-card-hover rounded-xl p-4.5 relative overflow-hidden group">
          <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-indigo-400"></div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-bold uppercase tracking-wider text-purple-400 font-mono flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Speed to Rescue
            </span>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">&lt; 60s Target</span>
          </div>
          <div id="kpi-speed" class="text-2xl font-bold font-mono text-white tracking-tight">4.2s</div>
          <div class="flex items-end justify-between mt-2">
            <span class="text-[11px] text-slate-400">Sub-second automated SMS rescue</span>
            <!-- Sparkline SVG -->
            <svg class="w-20 h-6 text-purple-400" viewBox="0 0 80 24" fill="none">
              <path d="M0 6 L20 4 L40 5 L60 3 L80 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M0 6 L20 4 L40 5 L60 3 L80 2 L80 24 L0 24 Z" fill="currentColor" fill-opacity="0.1"/>
            </svg>
          </div>
        </div>

      </section>

      <!-- Filter Rail & Channel Tabs -->
      <section class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1 border-b border-white/[0.06]">
        <div class="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
          <button onclick="setFilter('channel', 'ALL')" id="tab-all" class="channel-tab px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white border border-slate-700 flex items-center gap-1.5">
            All Inbounds <span id="count-all" class="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-300">0</span>
          </button>
          <button onclick="setFilter('channel', 'MISSED_CALL')" id="tab-calls" class="channel-tab px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-850 flex items-center gap-1.5">
            📞 Calls <span id="count-calls" class="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400">0</span>
          </button>
          <button onclick="setFilter('channel', 'WEB_FORM')" id="tab-forms" class="channel-tab px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-850 flex items-center gap-1.5">
            📝 Forms <span id="count-forms" class="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400">0</span>
          </button>
          <button onclick="setFilter('channel', 'AFTER_HOURS')" id="tab-after" class="channel-tab px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-850 flex items-center gap-1.5">
            🌙 After-Hours <span id="count-after" class="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-900 text-slate-400">0</span>
          </button>
        </div>

        <!-- Trade & Urgency Selectors -->
        <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select id="filter-trade" onchange="applyFilters()" class="text-xs bg-slate-900/90 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500">
            <option value="ALL">All Trades</option>
            <option value="HVAC">HVAC</option>
            <option value="PLUMBING">Plumbing</option>
            <option value="ELECTRICAL">Electrical</option>
            <option value="ROOFING">Roofing</option>
            <option value="RESTORATION">Restoration</option>
          </select>
          <select id="filter-urgency" onchange="applyFilters()" class="text-xs bg-slate-900/90 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500">
            <option value="ALL">All Urgencies</option>
            <option value="CRITICAL">🔴 Critical Only</option>
            <option value="HIGH">🟠 High</option>
            <option value="MEDIUM">🔵 Medium</option>
            <option value="LOW">⚪ Low</option>
          </select>
        </div>
      </section>

      <!-- Live Triage Radar Table Container -->
      <section class="glass-card rounded-xl overflow-hidden shadow-2xl">
        <div class="p-4 border-b border-white/[0.08] bg-[#0C1322] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <h2 class="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono">Live Inbound Triage Radar</h2>
          </div>
          <span id="filtered-count-badge" class="text-xs font-mono text-slate-400">Showing 0 of 0 leads</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-white/[0.06] bg-[#0A101D] text-slate-400 font-mono uppercase text-[10px] tracking-wider">
                <th class="py-3 px-4">Channel</th>
                <th class="py-3 px-4 min-w-[180px]">Customer & Trade</th>
                <th class="py-3 px-4 min-w-[280px]">Inbound Problem Breakdown</th>
                <th class="py-3 px-4">Urgency & Score</th>
                <th class="py-3 px-4">Est. Value</th>
                <th class="py-3 px-4 min-w-[130px]">SLA Countdown</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4 text-right">Quick Triage Actions</th>
              </tr>
            </thead>
            <tbody id="triage-body" class="divide-y divide-white/[0.04]">
              <!-- Injected via JavaScript -->
            </tbody>
          </table>
        </div>
      </section>
    </main>

    <!-- Slide-Over Lead Detail Inspector Drawer -->
    <div id="inspector-drawer" class="fixed inset-y-0 right-0 max-w-xl w-full bg-[#0D1527] border-l border-white/[0.12] shadow-2xl z-50 transform translate-x-full transition-transform duration-300 ease-in-out flex flex-col">
      <!-- Injected via JavaScript -->
    </div>
    <div id="drawer-backdrop" onclick="closeDrawer()" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 hidden transition-opacity"></div>

    <!-- Simulator & Chaos Bench Modal -->
    <div id="simulator-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 hidden">
      <div onclick="closeSimulatorModal()" class="fixed inset-0 bg-black/70 backdrop-blur-md"></div>
      <div class="glass-card rounded-2xl max-w-2xl w-full p-6 relative z-10 space-y-6 shadow-2xl border border-white/[0.15]">
        <div class="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">🎛️</div>
            <div>
              <h3 class="text-base font-bold text-white">Ingress Chaos Simulator & Telemetry Bench</h3>
              <p class="text-xs text-slate-400">Inject high-concurrency synthetic inbounds to test triage SLA decay</p>
            </div>
          </div>
          <button onclick="closeSimulatorModal()" class="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        <!-- 4 Quick Emergency Presets -->
        <div class="space-y-2">
          <label class="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">⚡ 1-Click Scenario Injections</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button onclick="injectPreset('BURST_PIPE')" class="p-3 text-left rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all group">
              <div class="flex items-center justify-between text-xs font-bold text-white group-hover:text-blue-400">
                <span>💥 Burst Pipe Disaster</span>
                <span class="font-mono text-rose-400">60s SLA</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1">Plumbing emergency • Basement flooding • Est. $1,600</p>
            </button>

            <button onclick="injectPreset('AC_FAIL')" class="p-3 text-left rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all group">
              <div class="flex items-center justify-between text-xs font-bold text-white group-hover:text-blue-400">
                <span>🔥 Heatwave AC Breakdown</span>
                <span class="font-mono text-amber-400">180s SLA</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1">HVAC priority • 95° indoor heat • Est. $1,850</p>
            </button>

            <button onclick="injectPreset('ROOF_LEAK')" class="p-3 text-left rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all group">
              <div class="flex items-center justify-between text-xs font-bold text-white group-hover:text-blue-400">
                <span>⛈️ Storm Shingle Collapse</span>
                <span class="font-mono text-amber-400">180s SLA</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1">Roofing emergency • Water penetrating master bed • Est. $2,800</p>
            </button>

            <button onclick="injectPreset('SPARKING_PANEL')" class="p-3 text-left rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all group">
              <div class="flex items-center justify-between text-xs font-bold text-white group-hover:text-blue-400">
                <span>⚡ Sparking Breaker Box</span>
                <span class="font-mono text-rose-400">60s SLA</span>
              </div>
              <p class="text-[11px] text-slate-400 mt-1">Electrical hazard • Main breaker tripping • Est. $1,400</p>
            </button>
          </div>
        </div>

        <!-- Burst Trigger -->
        <div class="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-4">
          <button onclick="triggerQuickBurst(5)" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2">
            <span>⚡ Fire +5 Concurrent Inbounds</span>
          </button>
          <button onclick="clearDatabase()" class="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-medium transition-colors">
            🗑️ Reset & Clear Store
          </button>
        </div>
      </div>
    </div>

    <!-- Command Palette (Cmd+K) Modal -->
    <div id="command-palette" class="fixed inset-0 z-50 flex items-start justify-center pt-24 p-4 hidden">
      <div onclick="closeCommandPalette()" class="fixed inset-0 bg-black/70 backdrop-blur-md"></div>
      <div class="glass-card rounded-2xl max-w-xl w-full p-4 relative z-10 space-y-3 shadow-2xl border border-white/[0.15]">
        <div class="flex items-center gap-3 px-3 py-2 bg-slate-900/80 rounded-xl border border-slate-800">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input id="command-input" oninput="handleCommandSearch(this.value)" type="text" placeholder="Type a command, customer name, or trade..." class="w-full bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-500 font-sans" autofocus />
          <kbd class="font-mono text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>
        <div id="command-results" class="max-h-72 overflow-y-auto space-y-1 text-xs">
          <!-- Dynamic Command list -->
        </div>
      </div>
    </div>

  </div>

  <!-- Client JavaScript Engine -->
  <script>
    let allLeads = [];
    let activeFilter = { channel: 'ALL', trade: 'ALL', urgency: 'ALL', search: '' };
    let selectedLead = null;
    let audioEnabled = true;

    // Web Audio Sound Synthesizer
    const audioCtx = (window.AudioContext || window.webkitAudioContext) ? new (window.AudioContext || window.webkitAudioContext)() : null;

    function playSound(type) {
      if (!audioEnabled || !audioCtx) return;
      try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'rescue') {
          osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
          osc.frequency.exponentialRampToValueAtTime(880.00, audioCtx.currentTime + 0.15); // A5
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.25);
        } else if (type === 'burst') {
          osc.frequency.setValueAtTime(440, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(659.25, audioCtx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.2);
        }
      } catch (e) {
        console.warn('Audio play error:', e);
      }
    }

    function toggleAudio() {
      audioEnabled = !audioEnabled;
      const btn = document.getElementById('audio-toggle-btn');
      btn.className = audioEnabled 
        ? 'p-1.5 text-emerald-400 rounded-lg bg-slate-900 border border-slate-800' 
        : 'p-1.5 text-slate-500 rounded-lg bg-slate-900 border border-slate-800';
    }

    async function fetchState() {
      try {
        const [leadsRes, metricsRes] = await Promise.all([
          fetch('/api/v1/leads'),
          fetch('/api/v1/metrics')
        ]);
        const leadsJson = await leadsRes.json();
        const metricsJson = await metricsRes.json();

        if (metricsJson.success) {
          const m = metricsJson.metrics;
          document.getElementById('kpi-rescued').innerText = '$' + m.pipeline_value_rescued_usd.toLocaleString();
          document.getElementById('kpi-risk').innerText = '$' + m.pipeline_value_at_risk_usd.toLocaleString();
          document.getElementById('kpi-rate').innerText = m.recovery_rate_pct + '%';
          document.getElementById('kpi-leakage').innerText = m.leakage_rate_pct + '% lost to competitor';
          document.getElementById('kpi-speed').innerText = m.median_speed_to_rescue_seconds + 's';
          document.getElementById('kpi-active-count').innerText = m.active_leads_count + ' Leads';
        }

        if (leadsJson.success) {
          allLeads = leadsJson.leads;
          updateCounts();
          renderTable();
          if (selectedLead) {
            const updated = allLeads.find(l => l.id === selectedLead.id);
            if (updated) {
              selectedLead = updated;
              renderDrawerContent();
            }
          }
        }
      } catch (err) {
        console.error('Fetch error:', err);
      }
    }

    function updateCounts() {
      document.getElementById('count-all').innerText = allLeads.length;
      document.getElementById('count-calls').innerText = allLeads.filter(l => l.channel === 'MISSED_CALL').length;
      document.getElementById('count-forms').innerText = allLeads.filter(l => l.channel === 'WEB_FORM').length;
      document.getElementById('count-after').innerText = allLeads.filter(l => l.channel === 'AFTER_HOURS').length;
    }

    function setFilter(key, val) {
      activeFilter[key] = val;
      document.querySelectorAll('.channel-tab').forEach(t => {
        t.className = 'channel-tab px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 flex items-center gap-1.5';
      });
      if (val === 'ALL') document.getElementById('tab-all').className = 'channel-tab px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white border border-slate-700 flex items-center gap-1.5';
      if (val === 'MISSED_CALL') document.getElementById('tab-calls').className = 'channel-tab px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white border border-slate-700 flex items-center gap-1.5';
      if (val === 'WEB_FORM') document.getElementById('tab-forms').className = 'channel-tab px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white border border-slate-700 flex items-center gap-1.5';
      if (val === 'AFTER_HOURS') document.getElementById('tab-after').className = 'channel-tab px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white border border-slate-700 flex items-center gap-1.5';
      renderTable();
    }

    function applyFilters() {
      activeFilter.trade = document.getElementById('filter-trade').value;
      activeFilter.urgency = document.getElementById('filter-urgency').value;
      renderTable();
    }

    function getFilteredLeads() {
      return allLeads.filter(lead => {
        if (activeFilter.channel !== 'ALL' && lead.channel !== activeFilter.channel) return false;
        if (activeFilter.trade !== 'ALL' && lead.trade !== activeFilter.trade) return false;
        if (activeFilter.urgency !== 'ALL' && lead.urgency_tier !== activeFilter.urgency) return false;
        if (activeFilter.search) {
          const s = activeFilter.search.toLowerCase();
          const match = lead.customer_name.toLowerCase().includes(s) ||
                        lead.customer_phone.includes(s) ||
                        lead.raw_inquiry_text.toLowerCase().includes(s) ||
                        lead.trade.toLowerCase().includes(s);
          if (!match) return false;
        }
        return true;
      });
    }

    function renderTable() {
      const tbody = document.getElementById('triage-body');
      const filtered = getFilteredLeads();
      document.getElementById('filtered-count-badge').innerText = \`Showing \${filtered.length} of \${allLeads.length} leads\`;
      const now = Date.now();

      if (filtered.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="8" class="text-center py-12 text-slate-500 font-mono text-xs">
              No inbound leads matching current filter criteria.
            </td>
          </tr>
        \`;
        return;
      }

      tbody.innerHTML = filtered.map(lead => {
        const expiresAt = new Date(lead.sla_expires_at).getTime();
        const totalSla = (lead.sla_seconds_total || 60) * 1000;
        const msLeft = Math.max(0, expiresAt - now);
        const secondsLeft = Math.floor(msLeft / 1000);
        const fractionLeft = Math.min(1, Math.max(0, msLeft / totalSla));
        const isResolved = ['RESCUED', 'APPOINTMENT_BOOKED', 'LOST_BREACHED'].includes(lead.status);

        // Circular Gauge SVG constants
        const strokeDashoffset = 88 - (88 * fractionLeft);

        let urgencyBadge = 'bg-slate-800/80 text-slate-400 border-slate-700';
        if (lead.urgency_tier === 'CRITICAL') urgencyBadge = 'bg-rose-950/80 text-rose-300 border-rose-600/80 glow-critical font-bold';
        else if (lead.urgency_tier === 'HIGH') urgencyBadge = 'bg-amber-950/80 text-amber-300 border-amber-600 font-bold';
        else if (lead.urgency_tier === 'MEDIUM') urgencyBadge = 'bg-blue-950/80 text-blue-300 border-blue-600 font-medium';

        let channelIcon = '📞';
        let channelLabel = 'Missed Call';
        if (lead.channel === 'WEB_FORM') { channelIcon = '📝'; channelLabel = 'Web Form'; }
        if (lead.channel === 'AFTER_HOURS') { channelIcon = '🌙'; channelLabel = 'After Hours'; }

        let timerColor = 'stroke-emerald-400 text-emerald-400';
        if (secondsLeft <= 60 && !isResolved) timerColor = 'stroke-rose-500 text-rose-400 animate-pulse';
        else if (secondsLeft <= 180 && !isResolved) timerColor = 'stroke-amber-400 text-amber-400';

        const timerText = isResolved 
          ? (lead.status === 'LOST_BREACHED' ? 'BREACHED' : 'RESOLVED')
          : \`\${Math.floor(secondsLeft/60)}:\${secondsLeft%60 < 10 ? '0' : ''}\${secondsLeft%60}\`;

        return \`
          <tr onclick="openLeadDetail('\${lead.id}')" class="hover:bg-slate-850/60 cursor-pointer transition-colors \${lead.urgency_tier === 'CRITICAL' && !isResolved ? 'bg-rose-950/10' : ''}">
            <td class="py-3 px-4 font-mono text-[11px] text-slate-400">
              <div class="flex items-center gap-1.5">
                <span class="text-sm">\${channelIcon}</span>
                <span>\${channelLabel}</span>
              </div>
            </td>
            <td class="py-3 px-4">
              <div class="font-bold text-white text-xs hover:text-blue-400 transition-colors">\${lead.customer_name}</div>
              <div class="text-[10px] text-slate-400 font-mono">\${lead.trade} • \${lead.customer_phone}</div>
            </td>
            <td class="py-3 px-4 text-slate-300 text-xs line-clamp-1 max-w-sm">
              \${lead.raw_inquiry_text}
            </td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 rounded border text-[10px] font-mono \${urgencyBadge}">
                \${lead.l_score} \${lead.urgency_tier}
              </span>
            </td>
            <td class="py-3 px-4 font-mono font-bold text-white text-xs">
              $\${lead.estimated_job_value_usd ? lead.estimated_job_value_usd.toLocaleString() : '500'}
            </td>
            <td class="py-3 px-4">
              <div class="flex items-center gap-2">
                <svg class="w-6 h-6 transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="14" fill="none" class="stroke-slate-800" stroke-width="3" />
                  <circle cx="18" cy="18" r="14" fill="none" class="\${timerColor}" stroke-width="3" stroke-dasharray="88" stroke-dashoffset="\${isResolved ? 0 : strokeDashoffset}" stroke-linecap="round" />
                </svg>
                <span class="font-mono text-xs font-semibold \${isResolved ? 'text-slate-400' : timerColor.replace('stroke-', 'text-')}">\${timerText}</span>
              </div>
            </td>
            <td class="py-3 px-4">
              <span class="px-2 py-0.5 rounded text-[10px] font-mono font-medium \${lead.status === 'APPOINTMENT_BOOKED' || lead.status === 'RESCUED' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60' : lead.status === 'LOST_BREACHED' ? 'bg-rose-950/80 text-rose-300 border border-rose-700/60' : 'bg-blue-950/80 text-blue-300 border border-blue-700/60'}">
                \${lead.status}
              </span>
            </td>
            <td class="py-3 px-4 text-right" onclick="event.stopPropagation()">
              \${!isResolved ? \`
                <div class="flex items-center justify-end gap-1.5">
                  <button onclick="handleQuickAction('\${lead.id}', 'MARK_RESCUED')" class="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-[11px] font-semibold transition-all shadow-sm">
                    ✓ Rescue
                  </button>
                  <button onclick="openLeadDetail('\${lead.id}')" class="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-[11px] transition-all">
                    ⚡ Inspect
                  </button>
                </div>
              \` : \`
                <button onclick="openLeadDetail('\${lead.id}')" class="text-slate-500 hover:text-slate-300 font-mono text-[11px]">
                  View Trail →
                </button>
              \`}
            </td>
          </tr>
        \`;
      }).join('');
    }

    async function handleQuickAction(leadId, action) {
      playSound('rescue');
      await fetch(\`/api/v1/leads/\${leadId}/action\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, dispatcher_name: 'LeadPulse Operator' })
      });
      fetchState();
    }

    function openLeadDetail(leadId) {
      selectedLead = allLeads.find(l => l.id === leadId);
      if (!selectedLead) return;
      renderDrawerContent();
      document.getElementById('inspector-drawer').classList.remove('translate-x-full');
      document.getElementById('drawer-backdrop').classList.remove('hidden');
    }

    function closeDrawer() {
      document.getElementById('inspector-drawer').classList.add('translate-x-full');
      document.getElementById('drawer-backdrop').classList.add('hidden');
      selectedLead = null;
    }

    function renderDrawerContent() {
      if (!selectedLead) return;
      const drawer = document.getElementById('inspector-drawer');
      const now = Date.now();
      const expiresAt = new Date(selectedLead.sla_expires_at).getTime();
      const secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
      const bookingUrl = \`http://localhost:3001/book/\${selectedLead.id}\`;

      drawer.innerHTML = \`
        <!-- Drawer Header -->
        <div class="p-5 border-b border-white/[0.08] bg-[#0A101D] flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-lg">
              🛡️
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-base font-bold text-white">\${selectedLead.customer_name}</h3>
                <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-600">\${selectedLead.l_score} \${selectedLead.urgency_tier}</span>
              </div>
              <p class="text-xs text-slate-400 font-mono">\${selectedLead.trade} • \${selectedLead.customer_phone}</p>
            </div>
          </div>
          <button onclick="closeDrawer()" class="text-slate-400 hover:text-white p-1 rounded-lg">✕</button>
        </div>

        <!-- Drawer Body Tabs -->
        <div class="flex-1 overflow-y-auto p-5 space-y-6">
          <!-- Customer Dossier & Valuation -->
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span class="text-[10px] font-mono uppercase text-slate-500">Estimated Job Value</span>
              <div class="text-lg font-bold font-mono text-white mt-0.5">$\${selectedLead.estimated_job_value_usd?.toLocaleString()}</div>
            </div>
            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span class="text-[10px] font-mono uppercase text-slate-500">SLA Decay Clock</span>
              <div class="text-lg font-bold font-mono text-emerald-400 mt-0.5">⏱️ \${secondsLeft}s remaining</div>
            </div>
          </div>

          <!-- Problem Ingress Text -->
          <div class="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
            <span class="text-[10px] font-mono uppercase text-slate-500">Raw Inbound Inquiry</span>
            <p class="text-xs text-slate-200 mt-1 leading-relaxed">\${selectedLead.raw_inquiry_text}</p>
          </div>

          <!-- Live SMS Auto-Rescue Stream -->
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-mono font-semibold uppercase text-slate-300 flex items-center gap-1.5">
                💬 Automated SMS Rescue Thread
              </span>
              <span class="text-[10px] font-mono text-emerald-400">DELIVERED (Sub-2s)</span>
            </div>

            <div class="p-4 rounded-xl bg-[#090E1A] border border-slate-800 space-y-3">
              <!-- Outbound Sentinel SMS -->
              <div class="flex flex-col items-end">
                <div class="max-w-md p-3 rounded-2xl rounded-tr-sm bg-blue-600 text-white text-xs shadow-md">
                  <p>\${selectedLead.rescue_payload?.message_body || 'Hi there, we noticed we just missed your call...'}</p>
                </div>
                <span class="text-[10px] font-mono text-slate-500 mt-1">LeadPulse Sentinel • 14:02:11</span>
              </div>

              <!-- Customer Simulated Reply -->
              <div class="flex flex-col items-start">
                <div class="max-w-md p-3 rounded-2xl rounded-tl-sm bg-slate-800 text-slate-200 text-xs border border-slate-700">
                  <p>Yes please, we need someone immediately! How soon can a technician get here?</p>
                </div>
                <span class="text-[10px] font-mono text-slate-500 mt-1">\${selectedLead.customer_name} • 14:02:48</span>
              </div>
            </div>

            <!-- Customer Booking Portal Link Trigger -->
            <div class="p-3 rounded-xl bg-blue-950/30 border border-blue-800/40 flex items-center justify-between">
              <div>
                <span class="text-xs font-semibold text-blue-300">Customer Self-Booking Portal</span>
                <p class="text-[10px] text-slate-400 font-mono">Token: \${bookingUrl}</p>
              </div>
              <a href="/book/\${selectedLead.id}" target="_blank" class="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors">
                Open Portal ↗
              </a>
            </div>
          </div>

          <!-- Chronological Audit Trail -->
          <div class="space-y-2">
            <span class="text-xs font-mono font-semibold uppercase text-slate-300">📜 Immutable Audit Log</span>
            <div class="space-y-1.5 font-mono text-[11px]">
              \${(selectedLead.audit_trail || []).map(evt => \`
                <div class="p-2 rounded bg-slate-900/60 border border-slate-800/60 flex items-center justify-between text-slate-300">
                  <span>\${evt.action}</span>
                  <span class="text-slate-500 text-[10px]">\${new Date(evt.timestamp).toLocaleTimeString()}</span>
                </div>
              \`).join('')}
            </div>
          </div>
        </div>

        <!-- Drawer Action Footer -->
        <div class="p-4 border-t border-white/[0.08] bg-[#0A101D] flex items-center justify-between gap-3">
          <button onclick="handleQuickAction('\${selectedLead.id}', 'MARK_RESCUED')" class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5">
            ✓ Complete Rescue & Hold
          </button>
          <button onclick="handleQuickAction('\${selectedLead.id}', 'MARK_LOST')" class="py-2.5 px-4 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 text-xs font-medium transition-colors">
            Mark Lost
          </button>
        </div>
      \`;
    }

    function openSimulatorModal() {
      document.getElementById('simulator-modal').classList.remove('hidden');
    }
    function closeSimulatorModal() {
      document.getElementById('simulator-modal').classList.add('hidden');
    }

    async function injectPreset(preset) {
      playSound('burst');
      let payload = {
        channel: 'MISSED_CALL',
        customer_name: 'Robert Vance',
        customer_phone: '+1 (555) 234-5678',
        trade: 'PLUMBING',
        raw_inquiry_text: 'Basement flooding from ruptured pipe right now!'
      };
      if (preset === 'AC_FAIL') {
        payload = {
          channel: 'WEB_FORM',
          customer_name: 'Elena Rostova',
          customer_phone: '+1 (555) 890-1234',
          trade: 'HVAC',
          raw_inquiry_text: 'Central AC down during 98 degree heatwave, indoor temp 92!'
        };
      } else if (preset === 'ROOF_LEAK') {
        payload = {
          channel: 'AFTER_HOURS',
          customer_name: 'Marcus Sterling',
          customer_phone: '+1 (555) 345-6789',
          trade: 'ROOFING',
          raw_inquiry_text: 'Wind storm blew shingles off, water pouring through ceiling!'
        };
      } else if (preset === 'SPARKING_PANEL') {
        payload = {
          channel: 'MISSED_CALL',
          customer_name: 'David Chen',
          customer_phone: '+1 (555) 901-2345',
          trade: 'ELECTRICAL',
          raw_inquiry_text: 'Main electrical breaker panel sparking and smelling like smoke!'
        };
      }

      await fetch('/api/v1/leads/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      closeSimulatorModal();
      fetchState();
    }

    async function triggerQuickBurst(count = 3) {
      playSound('burst');
      await fetch('/api/v1/simulate/burst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });
      fetchState();
    }

    async function clearDatabase() {
      await fetch('/api/v1/simulate/clear', { method: 'POST' });
      closeSimulatorModal();
      fetchState();
    }

    // Command Palette Logic
    function openCommandPalette() {
      document.getElementById('command-palette').classList.remove('hidden');
      document.getElementById('command-input').focus();
      handleCommandSearch('');
    }
    function closeCommandPalette() {
      document.getElementById('command-palette').classList.add('hidden');
    }

    function handleCommandSearch(val) {
      const container = document.getElementById('command-results');
      const commands = [
        { label: '⚡ Trigger +3 Inbound Leads Burst', action: 'triggerQuickBurst()' },
        { label: '🎛️ Open Simulator & Chaos Bench', action: 'openSimulatorModal(); closeCommandPalette()' },
        { label: '🔴 Filter: Critical Urgency Only', action: 'setFilter("urgency", "CRITICAL"); closeCommandPalette()' },
        { label: '📞 Filter: Missed Calls Only', action: 'setFilter("channel", "MISSED_CALL"); closeCommandPalette()' },
        { label: '🗑️ Clear & Reset Lead Store', action: 'clearDatabase(); closeCommandPalette()' },
      ];

      const filtered = commands.filter(c => c.label.toLowerCase().includes((val || '').toLowerCase()));
      container.innerHTML = filtered.map(c => \`
        <button onclick="\${c.action}" class="w-full text-left p-2.5 rounded-lg hover:bg-slate-800 text-slate-200 flex items-center justify-between group">
          <span>\${c.label}</span>
          <span class="text-[10px] font-mono text-slate-500 group-hover:text-blue-400">Select ↵</span>
        </button>
      \`).join('');
    }

    // Global Keybindings (Cmd+K / ESC)
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openCommandPalette();
      }
      if (e.key === 'Escape') {
        closeCommandPalette();
        closeDrawer();
        closeSimulatorModal();
      }
    });

    // Initialize Telemetry Poll & Timer Tick
    fetchState();
    setInterval(fetchState, 3000);
    setInterval(renderTable, 1000);
  </script>
</body>
</html>`;
}
