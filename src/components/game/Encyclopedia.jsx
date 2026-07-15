import { X, BookOpen, Fish } from 'lucide-react';
import { ALL_SPECIES, VARIANTS, RARITY_BADGES } from '@/game/fishData';

export default function Encyclopedia({ state, onClose }) {
  const discovered = ALL_SPECIES.filter(s => state.encyclopedia[s.id]?.discovered);
  const undiscovered = ALL_SPECIES.filter(s => !state.encyclopedia[s.id]?.discovered);
  const totalVariants = discovered.reduce((sum, s) => {
    return sum + Object.keys(VARIANTS).filter(v => state.encyclopedia[s.id]?.[v]).length;
  }, 0);

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0d3d4a]/95 backdrop-blur-md border-l border-white/10 z-30 overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 bg-[#0d3d4a]/95 backdrop-blur-md px-4 py-3 border-b border-white/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Encyclopedia</h2>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white p-1"><X size={20} /></button>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>{discovered.length}/{ALL_SPECIES.length} species discovered</span>
          <span>{totalVariants} variant catches</span>
        </div>

        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div className="bg-cyan-400 h-full rounded-full transition-all" style={{ width: `${(discovered.length / ALL_SPECIES.length) * 100}%` }} />
        </div>

        {discovered.length > 0 && (
          <div className="space-y-2 pt-2">
            {discovered.map(species => (
              <div key={species.id} className="bg-white/10 rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: species.color + '30', border: `2px solid ${species.color}` }}>
                    <Fish size={18} style={{ color: species.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">{species.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: (RARITY_BADGES[species.rarity]?.color || '#9ca3af') + '25', color: RARITY_BADGES[species.rarity]?.color || '#9ca3af' }}>
                        {RARITY_BADGES[species.rarity]?.label || 'Common'}
                      </span>
                    </div>
                    <div className="text-white/40 text-xs">Base value: {species.baseValue}</div>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-2">
                  {Object.entries(VARIANTS).map(([key, variant]) => {
                    const found = state.encyclopedia[species.id]?.[key];
                    return (
                      <div key={key} className={`flex-1 text-center text-[10px] py-1 rounded-md font-medium ${
                        found ? 'bg-cyan-500/30 text-cyan-200' : 'bg-white/5 text-white/20'
                      }`}>
                        {variant.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {undiscovered.length > 0 && (
          <div className="pt-2">
            <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">Undiscovered ({undiscovered.length})</h3>
            <div className="grid grid-cols-2 gap-2">
              {undiscovered.map(species => (
                <div key={species.id} className="bg-white/5 rounded-lg p-2 flex items-center gap-2 opacity-40">
                  <div className="w-8 h-8 rounded-md bg-white/5 border border-white/5 flex items-center justify-center">
                    <span className="text-white/20 text-xs">?</span>
                  </div>
                  <span className="text-white/30 text-xs">??? ???</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-white/10 text-center text-white/40 text-xs">
          <p>Total caught: {state.totalCaught.toLocaleString()}</p>
          <p>Total earned: {state.totalEarned.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}