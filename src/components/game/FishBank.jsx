import { X, Banknote, Building, Coins, TrendingUp, Fish } from 'lucide-react';
import { BANK_UPGRADES, MUSEUM_UPGRADES, MUSEUM_COST, getMuseumIncome } from '@/game/gameConfig';
import { VARIANT_BADGES, RARITY_BADGES } from '@/game/fishData';

export default function FishBank({ state, actions, onClose }) {
  const cap = BANK_UPGRADES[state.bankTier - 1].capacity;
  const nextBank = BANK_UPGRADES[state.bankTier];
  const nextMuseum = MUSEUM_UPGRADES[state.museumTier];
  const income = getMuseumIncome(state.fishBank, state.museumTier);
  const uniqueSpecies = new Set(state.fishBank.map(f => f.species)).size;
  const totalScore = state.fishBank.reduce((s, f) => s + (f.museumScore || 1), 0);

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0d3d4a]/95 backdrop-blur-md border-l border-white/10 z-30 overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 bg-[#0d3d4a]/95 backdrop-blur-md px-4 py-3 border-b border-white/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Banknote size={18} className="text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Fish Bank</h2>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white p-1"><X size={20} /></button>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1"><Fish size={12} /> Fish</div>
            <div className="text-white font-semibold text-lg">{state.fishBank.length}<span className="text-white/40 text-sm">/{cap}</span></div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1"><TrendingUp size={12} /> Species</div>
            <div className="text-white font-semibold text-lg">{uniqueSpecies}</div>
          </div>
        </div>

        {/* Museum Status */}
        {state.hasMuseum ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Building size={18} className="text-amber-400" />
              <span className="text-white font-semibold">{MUSEUM_UPGRADES[state.museumTier - 1].name}</span>
              <span className="text-amber-400 text-xs font-medium">Tier {state.museumTier}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-300">
              <Coins size={14} />
              <span className="text-sm font-semibold">+{income}</span>
              <span className="text-white/40 text-xs">per 30s</span>
            </div>
            <div className="text-white/40 text-xs">Museum Quality: {totalScore} pts</div>
            {nextMuseum && (
              <button
                onClick={actions.buyMuseumUpgrade}
                disabled={state.currency < nextMuseum.cost}
                className={`w-full mt-2 flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  state.currency >= nextMuseum.cost ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-white/5 text-white/30'
                }`}
              >
                <span>Upgrade to {nextMuseum.name}</span>
                <span className="flex items-center gap-1"><Coins size={12} />{nextMuseum.cost.toLocaleString()}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <Building size={28} className="mx-auto mb-2 text-white/30" />
            <p className="text-white/50 text-sm mb-3">Build a museum to earn passive income from your collection.</p>
            <button
              onClick={actions.buyMuseum}
              disabled={state.currency < MUSEUM_COST}
              className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                state.currency >= MUSEUM_COST ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-white/5 text-white/30'
              }`}
            >
              <Building size={14} /> Build Museum <Coins size={12} /> {MUSEUM_COST.toLocaleString()}
            </button>
          </div>
        )}

        {/* Bank Upgrade */}
        {nextBank && (
          <button
            onClick={actions.buyBankUpgrade}
            disabled={state.currency < nextBank.cost}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              state.currency >= nextBank.cost ? 'bg-cyan-600/80 hover:bg-cyan-500 text-white' : 'bg-white/5 text-white/30'
            }`}
          >
            <span>Upgrade Bank → {nextBank.capacity} slots</span>
            <span className="flex items-center gap-1"><Coins size={12} />{nextBank.cost.toLocaleString()}</span>
          </button>
        )}

        {/* Fish List */}
        <div>
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Banked Fish</h3>
          {state.fishBank.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">
              <Fish size={36} className="mx-auto mb-2 opacity-30" />
              No fish in your bank yet. Send prized catches here from the caught inventory.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {state.fishBank.map(fish => {
                const badge = VARIANT_BADGES[fish.variant];
                const rarity = RARITY_BADGES[fish.rarity] || RARITY_BADGES.common;
                return (
                  <div key={fish.id} className="bg-white/10 rounded-lg p-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-md flex-shrink-0" style={{ backgroundColor: fish.color + '40', border: `2px solid ${fish.color}` }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-white text-xs font-medium truncate">{fish.speciesName}</div>
                        <div className="flex items-center gap-0.5 flex-wrap">
                          <span className="text-[8px] px-1 py-0.5 rounded-full font-medium" style={{ backgroundColor: rarity.color + '25', color: rarity.color }}>{rarity.label}</span>
                          <span className={`text-[8px] px-1 py-0.5 rounded-full font-medium ${badge.className}`}>{badge.label}</span>
                          <span className="text-amber-300 text-[9px] font-semibold ml-0.5">{fish.value}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => actions.sellBankedFish(fish.id)} className="flex-1 bg-amber-600/70 hover:bg-amber-500 text-white text-[10px] py-1 rounded transition-colors">Sell</button>
                      <button onClick={() => actions.sendBankedFishToInventory(fish.id)} className="flex-1 bg-cyan-600/70 hover:bg-cyan-500 text-white text-[10px] py-1 rounded transition-colors">Return</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}