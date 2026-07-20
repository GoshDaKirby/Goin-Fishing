import { useState } from 'react';
import { X, Banknote, Building, Coins, TrendingUp, Fish, Lock, Unlock, Check, Users, ArrowLeft } from 'lucide-react';
import { BANK_UPGRADES, MUSEUM_UPGRADES, MUSEUM_COST, TREASURE_MUSEUM_CAP, getMuseumIncome } from '@/game/gameConfig';
import { VARIANT_BADGES, RARITY_BADGES, sizeLabel } from '@/game/fishData';

function ReadOnlyFishGrid({ fish }) {
  if (!fish || fish.length === 0) {
    return (
      <div className="text-center py-8 text-white/30 text-sm">
        <Fish size={36} className="mx-auto mb-2 opacity-30" />
        Nothing banked yet.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {fish.map(f => {
        const badge = VARIANT_BADGES[f.variant];
        const rarity = RARITY_BADGES[f.rarity] || RARITY_BADGES.common;
        const label = sizeLabel(f.sizeMultiplier);
        return (
          <div key={f.id} className="bg-white/10 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md flex-shrink-0" style={{ backgroundColor: f.color + '40', border: `2px solid ${f.color}` }} />
              <div className="min-w-0 flex-1">
                <div className="text-white text-xs font-medium truncate">{f.speciesName}</div>
                <div className="flex items-center gap-0.5 flex-wrap">
                  <span className="text-[8px] px-1 py-0.5 rounded-full font-medium" style={{ backgroundColor: rarity.color + '25', color: rarity.color }}>{rarity.label}</span>
                  <span className={`text-[8px] px-1 py-0.5 rounded-full font-medium ${badge?.className}`}>{badge?.label}</span>
                </div>
                {label && <div className="text-white/40 text-[9px] mt-0.5">{label}</div>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FishBank({ state, actions, multiplayer, onClose }) {
  const [tab, setTab] = useState('fish');
  const [confirming, setConfirming] = useState(null); // { id, action }
  const [confirmingTreasure, setConfirmingTreasure] = useState(null);
  const cap = BANK_UPGRADES[state.bankTier - 1].capacity;
  const nextBank = BANK_UPGRADES[state.bankTier];
  const nextMuseum = MUSEUM_UPGRADES[state.museumTier];
  const income = getMuseumIncome(state.fishBank, state.museumTier);
  const uniqueSpecies = new Set(state.fishBank.map(f => f.species)).size;
  const totalScore = state.fishBank.reduce((s, f) => s + (f.museumScore || 1), 0);
  const viewingOther = Boolean(multiplayer?.viewedBank || multiplayer?.bankLoading);

  if (viewingOther) {
    const viewed = multiplayer.viewedBank;
    return (
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0d3d4a]/95 backdrop-blur-md border-l border-white/10 z-30 overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 bg-[#0d3d4a]/95 backdrop-blur-md px-4 py-3 border-b border-white/10 flex items-center gap-2 z-10">
          <button onClick={multiplayer.clearViewedBank} className="text-white/50 hover:text-white p-1"><ArrowLeft size={18} /></button>
          <Banknote size={18} className="text-cyan-400" />
          <h2 className="text-lg font-semibold text-white truncate">{viewed ? `${viewed.nickname}'s Bank` : 'Loading...'}</h2>
          <button onClick={onClose} className="ml-auto text-white/50 hover:text-white p-1"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          {!viewed ? (
            <div className="text-center py-12 text-white/40 text-sm">Waiting for a response...</div>
          ) : (
            <>
              {viewed.hasMuseum && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center gap-2">
                  <Building size={16} className="text-amber-400" />
                  <span className="text-white text-sm font-medium">{MUSEUM_UPGRADES[viewed.museumTier - 1]?.name || 'Museum'}</span>
                </div>
              )}
              <ReadOnlyFishGrid fish={viewed.fishBank} />
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0d3d4a]/95 backdrop-blur-md border-l border-white/10 z-30 overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 bg-[#0d3d4a]/95 backdrop-blur-md px-4 py-3 border-b border-white/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Banknote size={18} className="text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Fish Bank</h2>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white p-1"><X size={20} /></button>
      </div>

      <div className="flex gap-2 px-4 pt-3">
        <button onClick={() => setTab('fish')} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === 'fish' ? 'bg-cyan-600 text-white' : 'bg-white/10 text-white/50'}`}>Fish Bank</button>
        <button onClick={() => setTab('treasure')} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${tab === 'treasure' ? 'bg-cyan-600 text-white' : 'bg-white/10 text-white/50'}`}>Treasure Museum</button>
      </div>

      {tab === 'fish' ? (
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
            <span>Upgrade Bank → {nextBank.capacity.toLocaleString()} slots</span>
            <span className="flex items-center gap-1"><Coins size={12} />{nextBank.cost.toLocaleString()}</span>
          </button>
        )}

        {/* Other players' banks/museums */}
        {multiplayer?.inWorld && (
          <div>
            <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5"><Users size={12} /> Visit Other Players</h3>
            {multiplayer.otherPlayers.length === 0 ? (
              <div className="text-center py-4 text-white/30 text-xs">No one else in this world right now.</div>
            ) : (
              <div className="space-y-2">
                {multiplayer.otherPlayers.map(p => (
                  <div key={p.id} className="bg-white/10 rounded-lg p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-cyan-500/30 flex items-center justify-center text-cyan-200 text-xs font-bold">
                      {(p.player_name || '?')[0]?.toUpperCase()}
                    </div>
                    <span className="text-white text-sm font-medium flex-1 truncate">{p.player_name}</span>
                    <button
                      onClick={() => multiplayer.requestPlayerBank(p.id)}
                      className="bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      View Bank
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
                const isConfirming = confirming?.id === fish.id;
                const label = sizeLabel(fish.sizeMultiplier);
                return (
                  <div key={fish.id} className={`rounded-lg p-2 ${fish.locked ? 'bg-white/5 opacity-60' : 'bg-white/10'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-md flex-shrink-0" style={{ backgroundColor: fish.color + '40', border: `2px solid ${fish.color}` }} />
                      <div className="min-w-0 flex-1">
                        <div className="text-white text-xs font-medium truncate">{fish.speciesName}</div>
                        <div className="flex items-center gap-0.5 flex-wrap">
                          <span className="text-[8px] px-1 py-0.5 rounded-full font-medium" style={{ backgroundColor: rarity.color + '25', color: rarity.color }}>{rarity.label}</span>
                          <span className={`text-[8px] px-1 py-0.5 rounded-full font-medium ${badge.className}`}>{badge.label}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          {label && <span className="text-white/40 text-[9px]">{label}</span>}
                          <span className="text-amber-300 text-[9px] font-semibold">{fish.value}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => actions.toggleBankLock(fish.id)}
                        className={`p-1 rounded transition-colors flex-shrink-0 ${fish.locked ? 'text-amber-400' : 'text-white/30 hover:text-white/60'}`}
                        title={fish.locked ? 'Unlock' : 'Lock'}
                      >
                        {fish.locked ? <Lock size={12} /> : <Unlock size={12} />}
                      </button>
                    </div>
                    {!fish.locked && (
                      isConfirming ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => { if (confirming.action === 'sell') actions.sellBankedFish(fish.id); else actions.sendBankedFishToInventory(fish.id); setConfirming(null); }}
                            className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-medium py-1 rounded transition-colors"
                          >
                            <Check size={10} /> Confirm
                          </button>
                          <button onClick={() => setConfirming(null)} className="px-2 bg-white/10 text-white/70 text-[10px] py-1 rounded">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button onClick={() => setConfirming({ id: fish.id, action: 'sell' })} className="flex-1 bg-amber-600/70 hover:bg-amber-500 text-white text-[10px] py-1 rounded transition-colors">Sell</button>
                          <button onClick={() => setConfirming({ id: fish.id, action: 'return' })} className="flex-1 bg-cyan-600/70 hover:bg-cyan-500 text-white text-[10px] py-1 rounded transition-colors">Return</button>
                        </div>
                      )
                    )}
                    {fish.locked && <div className="text-[9px] text-amber-400/60 text-center">Locked</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      ) : (
      <div className="p-4 space-y-4">
        <div className="bg-white/10 rounded-xl p-3">
          <div className="flex items-center gap-1.5 text-white/50 text-xs mb-1"><Building size={12} /> Items on Display</div>
          <div className="text-white font-semibold text-lg">{state.treasureBank.length}<span className="text-white/40 text-sm">/{TREASURE_MUSEUM_CAP}</span></div>
        </div>
        <p className="text-white/40 text-xs">Treasure and trash go on display here - separate from your fish museum. Coin cases skip this entirely and get deposited straight to your wallet when caught.</p>
        {state.treasureBank.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-sm">
            No items on display yet. Send treasure or trash here from your Loot inventory.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {state.treasureBank.map(item => {
              const isConfirming = confirmingTreasure?.id === item.id;
              return (
                <div key={item.id} className={`rounded-lg p-2 ${item.locked ? 'bg-white/5 opacity-60' : 'bg-white/10'}`}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.color + '40', border: `2px solid ${item.color}` }}>
                      <span className="text-[10px]">{item.kind === 'treasure' ? '💎' : '🗑️'}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-white text-xs font-medium truncate">{item.name}</div>
                      <span className="text-amber-300 text-[9px] font-semibold">{item.value}</span>
                    </div>
                    <button
                      onClick={() => actions.toggleTreasureBankLock(item.id)}
                      className={`p-1 rounded transition-colors flex-shrink-0 ${item.locked ? 'text-amber-400' : 'text-white/30 hover:text-white/60'}`}
                    >
                      {item.locked ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
                  </div>
                  {!item.locked && (
                    isConfirming ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => { if (confirmingTreasure.action === 'sell') actions.sellTreasureBankItem(item.id); else actions.sendTreasureBankItemToInventory(item.id); setConfirmingTreasure(null); }}
                          className="flex-1 flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-medium py-1 rounded transition-colors"
                        >
                          <Check size={10} /> Confirm
                        </button>
                        <button onClick={() => setConfirmingTreasure(null)} className="px-2 bg-white/10 text-white/70 text-[10px] py-1 rounded">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button onClick={() => setConfirmingTreasure({ id: item.id, action: 'sell' })} className="flex-1 bg-amber-600/70 hover:bg-amber-500 text-white text-[10px] py-1 rounded transition-colors">Sell</button>
                        <button onClick={() => setConfirmingTreasure({ id: item.id, action: 'return' })} className="flex-1 bg-cyan-600/70 hover:bg-cyan-500 text-white text-[10px] py-1 rounded transition-colors">Return</button>
                      </div>
                    )
                  )}
                  {item.locked && <div className="text-[9px] text-amber-400/60 text-center">Locked</div>}
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
