import { useState } from 'react';
import { X, Lock, Unlock, Coins, Banknote, Check, Package, Zap } from 'lucide-react';
import { RODS } from '@/game/gameConfig';
import { VARIANT_BADGES, RARITY_BADGES, VARIANTS, RARITIES } from '@/game/fishData';

function AutoSection({ title, settings, onToggleEnabled, onToggleFilter, color }) {
  return (
    <div className="bg-white/5 rounded-lg p-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-white/80 text-xs font-semibold flex items-center gap-1">
          <Zap size={11} className={color} /> {title}
        </span>
        <button
          onClick={onToggleEnabled}
          className={`relative w-8 h-4 rounded-full transition-colors ${settings.enabled ? 'bg-amber-500' : 'bg-white/20'}`}
        >
          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${settings.enabled ? 'left-4' : 'left-0.5'}`} />
        </button>
      </div>
      {settings.enabled && (
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {Object.entries(VARIANTS).map(([key]) => (
              <button
                key={key}
                onClick={() => onToggleFilter('variants', key)}
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium transition-colors ${
                  settings.variants[key] ? 'bg-amber-500/30 text-amber-200' : 'bg-white/5 text-white/30'
                }`}
              >
                {VARIANT_BADGES[key].label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {Object.entries(RARITIES).map(([key]) => (
              <button
                key={key}
                onClick={() => onToggleFilter('rarities', key)}
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium transition-colors`}
                style={settings.rarities[key]
                  ? { backgroundColor: RARITY_BADGES[key].color + '30', color: RARITY_BADGES[key].color }
                  : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)' }}
              >
                {RARITY_BADGES[key].label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CaughtInventory({ state, actions, onClose }) {
  const [confirmSingle, setConfirmSingle] = useState(null);
  const [confirmAll, setConfirmAll] = useState(null);
  const rod = RODS[state.rodTier];
  const full = state.caughtInventory.length >= rod.inventoryCap;
  const sellableCount = state.caughtInventory.filter(f => !f.locked).length;
  const sellableValue = state.caughtInventory.filter(f => !f.locked).reduce((s, f) => s + f.value, 0);

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0d3d4a]/95 backdrop-blur-md border-l border-white/10 z-30 overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 bg-[#0d3d4a]/95 backdrop-blur-md px-4 py-3 border-b border-white/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Package size={18} className="text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Caught Fish</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full ${full ? 'bg-red-500/80 text-white' : 'bg-white/10 text-white/70'}`}>
            {state.caughtInventory.length}/{rod.inventoryCap}
          </span>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-1"><X size={20} /></button>
      </div>

      <div className="p-4 space-y-2">
        {/* Auto settings */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <AutoSection
            title="Auto-Sell"
            settings={state.autoSettings.autoSell}
            onToggleEnabled={() => actions.toggleAutoEnabled('autoSell')}
            onToggleFilter={(ft, key) => actions.toggleAutoFilter('autoSell', ft, key)}
            color="text-amber-400"
          />
          <AutoSection
            title="Auto-Bank"
            settings={state.autoSettings.autoBank}
            onToggleEnabled={() => actions.toggleAutoEnabled('autoBank')}
            onToggleFilter={(ft, key) => actions.toggleAutoFilter('autoBank', ft, key)}
            color="text-cyan-400"
          />
        </div>

        {state.caughtInventory.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <Package size={48} className="mx-auto mb-3 opacity-30" />
            <p>Your caught inventory is empty.</p>
            <p className="text-xs mt-1">Keep fishing to fill it up!</p>
          </div>
        ) : (
          <>
            {full && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg px-3 py-2 text-red-300 text-xs mb-2">
                Inventory full! Sell or bank fish to continue catching.
              </div>
            )}
            {state.caughtInventory.map(fish => {
              const badge = VARIANT_BADGES[fish.variant];
              const rarity = RARITY_BADGES[fish.rarity] || RARITY_BADGES.common;
              const isConfirming = confirmSingle?.id === fish.id;
              return (
                <div key={fish.id} className={`rounded-xl border p-3 transition-all ${
                  fish.locked ? 'bg-white/5 border-white/5 opacity-60' : 'bg-white/10 border-white/10'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: fish.color + '40', border: `2px solid ${fish.color}` }}>
                      <span className="text-xs">🐟</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-white font-medium text-sm">{fish.speciesName}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: rarity.color + '25', color: rarity.color }}>{rarity.label}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${badge.className}`}>{badge.label}</span>
                        {fish.cageCaught && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200">Cage</span>}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Coins size={12} className="text-amber-400" />
                        <span className="text-amber-300 text-xs font-semibold">{fish.value}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => actions.toggleLock(fish.id)}
                      className={`p-2 rounded-lg transition-colors ${fish.locked ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 text-white/40 hover:text-white/70'}`}
                      title={fish.locked ? 'Unlock' : 'Lock'}
                    >
                      {fish.locked ? <Lock size={14} /> : <Unlock size={14} />}
                    </button>
                  </div>
                  {!fish.locked && (
                    <div className="flex gap-2 mt-2">
                      {isConfirming ? (
                        <div className="flex gap-1 w-full">
                          <button
                            onClick={() => { if (confirmSingle.action === 'sell') actions.sellFish(fish.id); else actions.sendToBank(fish.id); setConfirmSingle(null); }}
                            className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
                          >
                            <Check size={12} /> Confirm
                          </button>
                          <button onClick={() => setConfirmSingle(null)} className="px-3 bg-white/10 hover:bg-white/20 text-white/70 text-xs py-1.5 rounded-lg transition-colors">Cancel</button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => setConfirmSingle({ id: fish.id, action: 'sell' })} className="flex-1 flex items-center justify-center gap-1 bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-medium py-1.5 rounded-lg transition-colors">
                            <Coins size={12} /> Sell
                          </button>
                          <button onClick={() => setConfirmSingle({ id: fish.id, action: 'bank' })} className="flex-1 flex items-center justify-center gap-1 bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs font-medium py-1.5 rounded-lg transition-colors">
                            <Banknote size={12} /> Bank
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {fish.locked && <div className="text-[10px] text-amber-400/60 mt-2 text-center">Locked — sell and bank disabled</div>}
                </div>
              );
            })}

            {sellableCount > 0 && (
              <div className="pt-3 border-t border-white/10 space-y-2">
                {confirmAll ? (
                  <div className="flex gap-1">
                    <button onClick={() => { if (confirmAll === 'sell') actions.sellAllFish(); else actions.sendAllToBank(); setConfirmAll(null); }} className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2 rounded-lg">
                      <Check size={14} /> Confirm {confirmAll === 'sell' ? `Sell (${sellableValue})` : `Bank (${sellableCount})`}
                    </button>
                    <button onClick={() => setConfirmAll(null)} className="px-3 bg-white/10 text-white/70 text-sm py-2 rounded-lg">Cancel</button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmAll('sell')} className="flex-1 bg-amber-600/80 hover:bg-amber-500 text-white text-sm font-medium py-2 rounded-lg transition-colors">Sell All ({sellableValue})</button>
                    <button onClick={() => setConfirmAll('bank')} className="flex-1 bg-cyan-600/80 hover:bg-cyan-500 text-white text-sm font-medium py-2 rounded-lg transition-colors">Bank All ({sellableCount})</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}