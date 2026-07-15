import { useState, useEffect } from 'react';
import { X, Zap, Lock, Check, Fish, Clock } from 'lucide-react';
import { CAGE_TRAP_COST, CAGE_TRAP_SLOTS } from '@/game/gameConfig';
import { VARIANT_BADGES } from '@/game/fishData';

function TrapCard({ trap, onCollect }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (trap.status === 'waiting') {
      const update = () => {
        const ms = trap.catchTime - Date.now();
        if (ms <= 0) { setRemaining('Ready!'); return; }
        const s = Math.ceil(ms / 1000);
        setRemaining(`${s}s`);
      };
      update();
      const interval = setInterval(update, 1000);
      return () => clearInterval(interval);
    }
  }, [trap.status, trap.catchTime]);

  return (
    <div className={`rounded-xl border p-3 transition-all ${
      trap.status === 'caught' ? 'bg-emerald-500/10 border-emerald-500/30 animate-pulse' : 'bg-white/10 border-white/10'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          trap.status === 'caught' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40'
        }`}>
          {trap.status === 'caught' ? <Check size={18} /> : <Clock size={18} />}
        </div>
        <div className="flex-1">
          <div className="text-white font-medium text-sm">
            {trap.status === 'caught' ? 'Fish Caught!' : 'Waiting...'}
          </div>
          {trap.status === 'waiting' && (
            <div className="text-white/50 text-xs">{remaining}</div>
          )}
          {trap.status === 'caught' && trap.fish && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-white text-sm">{trap.fish.speciesName}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${VARIANT_BADGES[trap.fish.variant].className}`}>
                {trap.fish.variantName}
              </span>
              <span className="text-amber-300 text-xs font-semibold">{trap.fish.value}</span>
            </div>
          )}
        </div>
        {trap.status === 'caught' && (
          <button
            onClick={onCollect}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Collect
          </button>
        )}
      </div>
    </div>
  );
}

export default function CageTraps({ state, actions, onClose }) {
  if (!state.permits.cage) {
    return (
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0d3d4a]/95 backdrop-blur-md border-l border-white/10 z-30 overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 bg-[#0d3d4a]/95 backdrop-blur-md px-4 py-3 border-b border-white/10 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Cage Traps</h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1"><X size={20} /></button>
        </div>
        <div className="p-4 text-center py-12">
          <Lock size={36} className="mx-auto mb-3 text-white/20" />
          <p className="text-white/50 text-sm">Purchase a Cage Trap Permit in the Shop to use cage traps.</p>
        </div>
      </div>
    );
  }

  const caughtCount = state.cageTraps.filter(t => t.status === 'caught').length;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0d3d4a]/95 backdrop-blur-md border-l border-white/10 z-30 overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 bg-[#0d3d4a]/95 backdrop-blur-md px-4 py-3 border-b border-white/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Cage Traps</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">{state.cageTraps.length}/{CAGE_TRAP_SLOTS}</span>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white p-1"><X size={20} /></button>
      </div>

      <div className="p-4 space-y-3">
        {state.cageTraps.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Zap size={48} className="mx-auto mb-3 opacity-30" />
            <p>No traps placed yet.</p>
            <p className="text-xs mt-1">Buy cage traps to catch valuable fish at the rocks!</p>
          </div>
        ) : (
          <>
            {caughtCount > 0 && (
              <button
                onClick={actions.collectAllCageTraps}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Fish size={14} /> Collect All ({caughtCount})
              </button>
            )}
            {state.cageTraps.map(trap => (
              <TrapCard key={trap.id} trap={trap} onCollect={() => actions.collectCageTrap(trap.id)} />
            ))}
          </>
        )}

        {state.cageTraps.length < CAGE_TRAP_SLOTS && (
          <button
            onClick={actions.buyCageTrap}
            disabled={state.currency < CAGE_TRAP_COST}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              state.currency >= CAGE_TRAP_COST ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-white/5 text-white/30'
            }`}
          >
            <Zap size={14} /> Buy Cage Trap ({CAGE_TRAP_COST})
          </button>
        )}
      </div>
    </div>
  );
}