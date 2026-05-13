import { useState } from 'react';
import IntelStatCards from './intel/IntelStatCards';
import GlobalActivityFeed from './intel/GlobalActivityFeed';
import ThreatQueue from './intel/ThreatQueue';
import FinancialIntelPanel from './intel/FinancialIntelPanel';
import RemoteCommandPanel from './intel/RemoteCommandPanel';
import { Activity, ShieldAlert, TrendingUp, Power } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'intel', label: 'INTEL', icon: Activity },
  { id: 'threats', label: 'THREATS', icon: ShieldAlert },
  { id: 'finance', label: 'FINANCE', icon: TrendingUp },
  { id: 'command', label: 'COMMAND', icon: Power },
];

export default function VaultIntelligence() {
  const [tab, setTab] = useState('intel');

  return (
    <div className="space-y-4" style={{ fontFamily: 'Cairo, ui-monospace, monospace' }}>
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-black via-[#0a0f0a] to-black border border-[#39FF14]/20 p-5">
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(57,255,20,0.04) 2px, rgba(57,255,20,0.04) 3px)',
        }} />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[10px] font-mono tracking-[0.3em] text-[#39FF14]/60">CYBER COMMAND • G3142-AF26-0x99</p>
            <h2 className="text-xl font-bold text-white mt-1 font-mono">INTELLIGENCE & MONITORING</h2>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/40">
            <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse" /> SYSTEM ACTIVE
          </div>
        </div>
      </div>

      <IntelStatCards />

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono tracking-widest transition',
              tab === t.id ? 'bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/25'
                : 'text-white/40 hover:text-white/70 border border-transparent')}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'intel' && <GlobalActivityFeed />}
      {tab === 'threats' && <ThreatQueue />}
      {tab === 'finance' && <FinancialIntelPanel />}
      {tab === 'command' && <RemoteCommandPanel />}
    </div>
  );
}
