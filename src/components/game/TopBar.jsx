import { Coins, Worm, MapPin, Fish, Anchor } from 'lucide-react';
import { RODS, LOCATIONS } from '@/game/gameConfig';

export default function TopBar({ state, view, setView }) {
  const rod = RODS[state.rodTier];
  const availableLocations = LOCATIONS.filter(loc => !loc.requiresPermit || state.permits[loc.requiresPermit]);

  return (
    <>
      <div className="absolute top-0 left-0 right-0 z-10 px-3 py-2 bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
              <Coins size={16} className="text-amber-400" />
              <span className="text-white font-semibold text-sm tabular-nums">{state.currency.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
              <Worm size={16} className="text-orange-400" />
              <span className="text-white font-semibold text-sm tabular-nums">{state.bait}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
              <Fish size={16} className="text-cyan-400" />
              <span className="text-white font-semibold text-sm tabular-nums">{state.caughtInventory.length}/{rod.inventoryCap}</span>
            </div>
          </div>
        </div>
      </div>

      {view === 'fishing' && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 flex gap-1">
          {availableLocations.map(loc => (
            <button
              key={loc.id}
              onClick={() => {
                if (state.location !== loc.id) {
                  document.dispatchEvent(new CustomEvent('setLocation', { detail: loc.id }));
                }
              }}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all ${
                state.location === loc.id
                  ? 'bg-white/90 text-slate-900'
                  : 'bg-black/30 text-white/60 hover:text-white'
              }`}
              title={loc.desc}
            >
              {loc.id === 'shore' && <MapPin size={10} />}
              {loc.id !== 'shore' && <Anchor size={10} />}
              {loc.name}
            </button>
          ))}
        </div>
      )}
    </>
  );
}