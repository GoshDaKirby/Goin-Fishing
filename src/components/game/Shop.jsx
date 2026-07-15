import { useState } from 'react';
import { X, Coins, Worm, Anchor, Lock, Fish, Banknote, Building, Zap, RotateCcw, Target, Wind, Waves as WavesIcon, Bot } from 'lucide-react';
import { RODS, PERMITS, BAIT_PACK_COST, BAIT_PACK_SIZE, CAGE_TRAP_COST, CAGE_TRAP_SLOTS, BANK_UPGRADES, MUSEUM_COST, MUSEUM_UPGRADES, BOAT_UPGRADES, MINIGAME_ITEMS, AUTO_FISH_COST } from '@/game/gameConfig';

function ShopItem({ icon, title, desc, cost, owned, locked, canAfford, onBuy, actionLabel }) {
  return (
    <div className={`rounded-xl border p-3 transition-all ${owned ? 'bg-emerald-500/5 border-emerald-500/20' : locked ? 'bg-white/5 border-white/5 opacity-50' : 'bg-white/10 border-white/10'}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-cyan-400">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-white font-medium text-sm">{title}</span>
            {owned && <span className="text-[10px] text-emerald-400 font-medium">✓ Owned</span>}
          </div>
          <p className="text-white/50 text-xs mt-0.5">{desc}</p>
          {!owned && (
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1 text-amber-300">
                <Coins size={12} />
                <span className="text-xs font-semibold">{cost.toLocaleString()}</span>
              </div>
              <button
                onClick={onBuy}
                disabled={locked || !canAfford}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  locked ? 'bg-white/5 text-white/30 cursor-not-allowed' :
                  !canAfford ? 'bg-white/5 text-white/30 cursor-not-allowed' :
                  'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                {locked ? <Lock size={12} className="inline" /> : actionLabel || 'Buy'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Shop({ state, actions, onClose }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const nextBank = BANK_UPGRADES[state.bankTier];
  const nextMuseum = MUSEUM_UPGRADES[state.museumTier];
  const nextBoat = BOAT_UPGRADES[state.boatTier + 1];

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0d3d4a]/95 backdrop-blur-md border-l border-white/10 z-30 overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 bg-[#0d3d4a]/95 backdrop-blur-md px-4 py-3 border-b border-white/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Coins size={18} className="text-amber-400" />
          <h2 className="text-lg font-semibold text-white">Shop</h2>
          <span className="text-xs text-amber-300 font-semibold">{state.currency.toLocaleString()}</span>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white p-1"><X size={20} /></button>
      </div>

      <div className="p-4 space-y-4">
        {/* Bait */}
        <div>
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Bait</h3>
          <ShopItem
            icon={<Worm size={16} />}
            title={`Bait x${BAIT_PACK_SIZE}`}
            desc="Essential for fishing. Auto-consumed per catch."
            cost={BAIT_PACK_COST}
            owned={false}
            canAfford={state.currency >= BAIT_PACK_COST}
            onBuy={actions.buyBait}
            actionLabel="Buy"
          />
        </div>

        {/* Rods */}
        <div>
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Fishing Rods</h3>
          <div className="space-y-2">
            {RODS.map((rod, i) => (
              <ShopItem
                key={rod.id}
                icon={<Fish size={16} />}
                title={rod.name}
                desc={`~${(rod.biteWait / 1000).toFixed(1)}s avg. bite wait · ${rod.inventoryCap} inventory slots`}
                cost={rod.cost}
                owned={i <= state.rodTier}
                locked={i > state.rodTier + 1}
                canAfford={state.currency >= rod.cost}
                onBuy={() => actions.buyRod(i)}
                actionLabel="Upgrade"
              />
            ))}
          </div>
        </div>

        {/* Permits */}
        <div>
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Permits</h3>
          <div className="space-y-2">
            {Object.entries(PERMITS).map(([key, permit]) => (
              <ShopItem
                key={key}
                icon={<Anchor size={16} />}
                title={permit.name}
                desc={permit.desc}
                cost={permit.cost}
                owned={state.permits[key]}
                locked={permit.requires && !state.permits[permit.requires]}
                canAfford={state.currency >= permit.cost}
                onBuy={() => actions.buyPermit(key)}
              />
            ))}
          </div>
        </div>

        {/* Equipment */}
        <div>
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Equipment</h3>
          <div className="space-y-2">
            <ShopItem
              icon={<Zap size={16} />}
              title={`Cage Trap (${state.cageTraps.length}/${CAGE_TRAP_SLOTS})`}
              desc="Reusable trap at the rocks. Catches valuable fish. Click to collect."
              cost={CAGE_TRAP_COST}
              owned={false}
              locked={!state.permits.cage || state.cageTraps.length >= CAGE_TRAP_SLOTS}
              canAfford={state.currency >= CAGE_TRAP_COST}
              onBuy={actions.buyCageTrap}
              actionLabel="Buy"
            />
            {nextBoat && (
              <ShopItem
                icon={<Anchor size={16} />}
                title={nextBoat.name}
                desc={`Increases deep water capacity to ${nextBoat.cap} players.`}
                cost={nextBoat.cost}
                owned={false}
                locked={!state.permits.boat}
                canAfford={state.currency >= nextBoat.cost}
                onBuy={actions.buyBoatUpgrade}
              />
            )}
          </div>
        </div>

        {/* Bank Upgrades */}
        <div>
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Fish Bank</h3>
          <ShopItem
            icon={<Banknote size={16} />}
            title={nextBank ? `Bank Tier ${nextBank.tier}` : 'Max Bank Tier'}
            desc={nextBank ? `Increase bank capacity to ${nextBank.capacity} fish` : 'Maximum capacity reached'}
            cost={nextBank?.cost || 0}
            owned={!nextBank}
            canAfford={nextBank && state.currency >= nextBank.cost}
            onBuy={actions.buyBankUpgrade}
          />
        </div>

        {/* Museum */}
        <div>
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Museum</h3>
          {!state.hasMuseum ? (
            <ShopItem
              icon={<Building size={16} />}
              title="Fish Museum"
              desc="Display your collection. Generates passive income based on fish quality."
              cost={MUSEUM_COST}
              canAfford={state.currency >= MUSEUM_COST}
              onBuy={actions.buyMuseum}
            />
          ) : nextMuseum ? (
            <ShopItem
              icon={<Building size={16} />}
              title={nextMuseum.name}
              desc={`Increase museum income multiplier to ${nextMuseum.multiplier}x`}
              cost={nextMuseum.cost}
              canAfford={state.currency >= nextMuseum.cost}
              onBuy={actions.buyMuseumUpgrade}
            />
          ) : (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-center text-amber-400/60 text-sm">
              <Building size={20} className="mx-auto mb-1" />
              World-Class Museum — Maximum tier!
            </div>
          )}
        </div>

        {/* Fishing Minigame */}
        <div>
          <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Fishing Minigame</h3>
          <div className="space-y-2">
            <ShopItem
              icon={<Target size={16} />}
              title={MINIGAME_ITEMS.bigZone.name}
              desc={MINIGAME_ITEMS.bigZone.desc}
              cost={MINIGAME_ITEMS.bigZone.cost}
              owned={state.minigameItems.bigZone}
              canAfford={state.currency >= MINIGAME_ITEMS.bigZone.cost}
              onBuy={() => actions.buyMinigameItem('bigZone')}
            />
            <ShopItem
              icon={<WavesIcon size={16} />}
              title={MINIGAME_ITEMS.calmingBait.name}
              desc={MINIGAME_ITEMS.calmingBait.desc}
              cost={MINIGAME_ITEMS.calmingBait.cost}
              owned={state.minigameItems.calmingBait}
              canAfford={state.currency >= MINIGAME_ITEMS.calmingBait.cost}
              onBuy={() => actions.buyMinigameItem('calmingBait')}
            />
            <ShopItem
              icon={<Wind size={16} />}
              title={MINIGAME_ITEMS.tightBounds.name}
              desc={MINIGAME_ITEMS.tightBounds.desc}
              cost={MINIGAME_ITEMS.tightBounds.cost}
              owned={state.minigameItems.tightBounds}
              canAfford={state.currency >= MINIGAME_ITEMS.tightBounds.cost}
              onBuy={() => actions.buyMinigameItem('tightBounds')}
            />
            {!state.autoFishUnlocked ? (
              <ShopItem
                icon={<Bot size={16} />}
                title="Auto-Fish"
                desc="Automatically resolves every catch without playing the minigame. Requires all three upgrades above."
                cost={AUTO_FISH_COST}
                owned={false}
                locked={!Object.values(state.minigameItems).every(Boolean)}
                canAfford={state.currency >= AUTO_FISH_COST}
                onBuy={actions.buyAutoFish}
                actionLabel="Unlock"
              />
            ) : (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot size={16} className="text-emerald-400" />
                  <span className="text-white text-sm font-medium">Auto-Fish</span>
                </div>
                <button
                  onClick={actions.toggleAutoFish}
                  className={`relative w-10 h-5 rounded-full transition-colors ${state.autoFishEnabled ? 'bg-emerald-500' : 'bg-white/20'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${state.autoFishEnabled ? 'left-5' : 'left-0.5'}`} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Reset */}
        <div className="pt-4 border-t border-white/10">
          {confirmReset ? (
            <div className="flex gap-2">
              <button onClick={() => { actions.resetGame(); setConfirmReset(false); onClose(); }} className="flex-1 bg-red-600 hover:bg-red-500 text-white text-xs font-medium py-2 rounded-lg">
                Confirm Reset
              </button>
              <button onClick={() => setConfirmReset(false)} className="flex-1 bg-white/10 text-white/70 text-xs py-2 rounded-lg">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmReset(true)} className="w-full flex items-center justify-center gap-1.5 text-white/30 hover:text-red-400 text-xs py-2 transition-colors">
              <RotateCcw size={12} /> Reset Game
            </button>
          )}
        </div>
      </div>
    </div>
  );
}