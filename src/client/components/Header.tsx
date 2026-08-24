import React from 'react';
import { ShieldAlert, Activity, PlusCircle, RefreshCw, Radio } from 'lucide-react';

interface HeaderProps {
  onOpenSimulator: () => void;
  onRefresh: () => void;
  onQuickBurst: () => void;
  activeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSimulator,
  onRefresh,
  onQuickBurst,
  activeCount,
}) => {
  return (
    <header className="border-b border-gray-800 bg-[#0F1423] sticky top-0 z-30 px-6 py-3.5 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3.5">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400">
          <ShieldAlert className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              LeadPulse <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">SENTINEL</span>
            </h1>
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              <Radio className="w-3 h-3 animate-pulse" /> 24/7 INGESTION ACTIVE
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Autonomous Inbound Leakage Prevention & Instant Rescue Engine
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block mr-2">
          <div className="text-xs text-gray-400">Monitored Inbound Radar</div>
          <div className="text-xs font-mono font-semibold text-amber-400">
            {activeCount} Active Inbound Inquiries
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white transition-colors"
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        <button
          onClick={onQuickBurst}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 transition-colors"
        >
          <Activity className="w-3.5 h-3.5" />
          +3 Simulated Inbounds
        </button>

        <button
          onClick={onOpenSimulator}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition-colors"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Test Ingestion Webhook
        </button>
      </div>
    </header>
  );
};
