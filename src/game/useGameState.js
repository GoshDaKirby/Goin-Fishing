import { useState, useEffect, useRef, useCallback } from 'react';
import { rollFish, fishMatchesFilters } from './fishData';
import { rollTrash, rollTreasure, rollTackleCatch, rollEmptyHanded } from './lootData';
import {
  RODS, PERMITS, CAGE_TRAP_COST, CAGE_TRAP_SLOTS,
  CAGE_TRAP_MIN_TIME, CAGE_TRAP_MAX_TIME, CAGE_VALUE_MULT,
  BAIT_PACK_COST, BAIT_PACK_SIZE, TACKLE_PACK_COST, TACKLE_PACK_SIZE,
  BANK_UPGRADES, MUSEUM_COST, MUSEUM_UPGRADES, BOAT_UPGRADES,
  STARTING_CURRENCY, STARTING_BAIT, MUSEUM_PAYOUT_INTERVAL,
  MINIGAME_ITEMS, LOOT_INVENTORY_CAP, TREASURE_MUSEUM_CAP,
  HEAD_COLOR_PRESETS, BODY_COLOR_PRESETS,
  getMuseumIncome,
} from './gameConfig';

const STORAGE_KEY = 'lazy-fisherman-save-v2';

const defaultAutoSettings = {
  autoSell: {
    enabled: false,
    variants: { normal: true, albino: false, melanistic: false, gold: false },
    rarities: { common: true, uncommon: true, rare: false, epic: false, legendary: false },
  },
  autoBank: {
    enabled: false,
    variants: { normal: false, albino: true, melanistic: true, gold: true },
    rarities: { common: false, uncommon: false, rare: true, epic: true, legendary: true },
  },
};

const defaultMinigameItems = { bigZone: 0, calmingBait: 0, tightBounds: 0 };

function randomDefaultName() {
  return `Angler${Math.floor(Math.random() * 9000 + 1000)}`;
}

const initialState = {
  currency: STARTING_CURRENCY,
  bait: STARTING_BAIT,
  tackle: 0,
  equipped: 'bait', // 'bait' | 'tackle' | 'none'
  caughtInventory: [],
  lootInventory: [],
  fishBank: [],
  treasureBank: [],
  bankTier: 1,
  hasMuseum: false,
  museumTier: 1,
  rodTier: 0,
  permits: { rock: false, cage: false, boat: false, deepwater: false },
  cageTraps: [],
  boatTier: 0,
  location: 'shore',
  encyclopedia: {},
  trashDex: {},
  treasureDex: {},
  lastCatchTime: 0,
  lastCaughtFish: null,
  lastLoot: null,
  lastMuseumIncome: 0,
  lastMuseumPayout: 0,
  totalEarned: 0,
  totalCaught: 0,
  autoSettings: defaultAutoSettings,
  characterName: randomDefaultName(),
  characterColors: { head: HEAD_COLOR_PRESETS[1], body: BODY_COLOR_PRESETS[0] },

  // Active fishing minigame state
  castPhase: 'idle', // 'idle' | 'waiting' | 'biting'
  castStartedAt: 0,
  biteDeadline: 0,
  castEquipped: 'bait',
  currentCatchFish: null,
  minigameItems: defaultMinigameItems,
  autoFishEnabled: false,
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const migratedMinigameItems = {};
      for (const k of Object.keys(defaultMinigameItems)) {
        const v = parsed.minigameItems?.[k];
        migratedMinigameItems[k] = typeof v === 'boolean' ? (v ? 1 : 0) : (typeof v === 'number' ? v : 0);
      }
      return {
        ...initialState,
        ...parsed,
        // Never resume mid-cast from a stale save; always come back to idle.
        castPhase: 'idle',
        castStartedAt: 0,
        biteDeadline: 0,
        currentCatchFish: null,
        minigameItems: migratedMinigameItems,
        characterColors: { ...initialState.characterColors, ...(parsed.characterColors || {}) },
        equipped: parsed.equipped || 'bait',
        autoSettings: {
          autoSell: { ...defaultAutoSettings.autoSell, ...(parsed.autoSettings?.autoSell || {}), variants: { ...defaultAutoSettings.autoSell.variants, ...(parsed.autoSettings?.autoSell?.variants || {}) }, rarities: { ...defaultAutoSettings.autoSell.rarities, ...(parsed.autoSettings?.autoSell?.rarities || {}) } },
          autoBank: { ...defaultAutoSettings.autoBank, ...(parsed.autoSettings?.autoBank || {}), variants: { ...defaultAutoSettings.autoBank.variants, ...(parsed.autoSettings?.autoBank?.variants || {}) }, rarities: { ...defaultAutoSettings.autoBank.rarities, ...(parsed.autoSettings?.autoBank?.rarities || {}) } },
        },
      };
    }
  } catch (e) { /* ignore */ }
  return { ...initialState };
}

function updateEncyclopedia(encyclopedia, fish) {
  const entry = encyclopedia[fish.species] || {};
  const prevMin = entry.minSize;
  const prevMax = entry.maxSize;
  return {
    ...encyclopedia,
    [fish.species]: {
      ...entry,
      [fish.variant]: true,
      discovered: true,
      minSize: prevMin == null ? fish.sizeMultiplier : Math.min(prevMin, fish.sizeMultiplier),
      maxSize: prevMax == null ? fish.sizeMultiplier : Math.max(prevMax, fish.sizeMultiplier),
      biggestValue: Math.max(entry.biggestValue || 0, fish.value),
    },
  };
}

function randomTrapTime() {
  return Date.now() + CAGE_TRAP_MIN_TIME + Math.random() * (CAGE_TRAP_MAX_TIME - CAGE_TRAP_MIN_TIME);
}

function updateLootDex(dex, item) {
  const entry = dex[item.itemId] || {};
  return {
    ...dex,
    [item.itemId]: {
      ...entry,
      discovered: true,
      timesFound: (entry.timesFound || 0) + 1,
      biggestValue: Math.max(entry.biggestValue || 0, item.value),
    },
  };
}

// Deposits a rolled trash/treasure item. Coin cases skip inventory entirely
// and just add their value straight to the wallet. Everything else goes into
// lootInventory (separate from the fish inventory - trash/treasure never mix
// with fish, per how the fish bank and treasure museum are kept separate).
function depositLoot(prev, item) {
  const dexKey = item.kind === 'trash' ? 'trashDex' : 'treasureDex';
  const dex = updateLootDex(prev[dexKey], item);
  const base = {
    [dexKey]: dex,
    lastCatchTime: Date.now(),
    lastLoot: item,
    lastCaughtFish: null,
  };

  if (item.isCoinCase) {
    return { ...prev, ...base, currency: prev.currency + item.value, totalEarned: prev.totalEarned + item.value };
  }

  if (prev.lootInventory.length < LOOT_INVENTORY_CAP) {
    return { ...prev, ...base, lootInventory: [...prev.lootInventory, item] };
  }

  // No room - item is lost, but we still show what it was.
  return { ...prev, lastCatchTime: Date.now(), lastLoot: item, lastCaughtFish: null };
}

// Places a rolled fish into auto-sell/auto-bank/inventory (in that priority
// order), matching the old passive-fishing behavior. Always records
// lastCaughtFish/lastCatchTime directly off the fish that was actually
// caught, rather than inferring it from whatever happens to be at the end of
// an array (that inference was the source of the old mislabeled catch popup).
function depositCaughtFish(prev, fish, rod) {
  const auto = prev.autoSettings;
  const bankCap = BANK_UPGRADES[prev.bankTier - 1].capacity;
  const enc = updateEncyclopedia(prev.encyclopedia, fish);
  const base = {
    encyclopedia: enc,
    lastCatchTime: Date.now(),
    lastCaughtFish: fish,
    lastLoot: null,
    totalCaught: prev.totalCaught + 1,
  };

  if (auto.autoBank.enabled && fishMatchesFilters(fish, auto.autoBank) && prev.fishBank.length < bankCap) {
    return { ...prev, ...base, fishBank: [...prev.fishBank, { ...fish, locked: false }] };
  }

  if (auto.autoSell.enabled && fishMatchesFilters(fish, auto.autoSell)) {
    return { ...prev, ...base, currency: prev.currency + fish.value, totalEarned: prev.totalEarned + fish.value };
  }

  if (prev.caughtInventory.length < rod.inventoryCap) {
    return { ...prev, ...base, caughtInventory: [...prev.caughtInventory, fish] };
  }

  // No room anywhere - the fish is lost, but we still show what it was.
  return { ...prev, lastCatchTime: Date.now(), lastCaughtFish: fish };
}

function randomBiteWait(rod) {
  // +/- 30% jitter around the rod's base bite-wait time so it doesn't feel
  // like a metronome.
  return rod.biteWait * (0.7 + Math.random() * 0.6);
}

export function useGameState() {
  const [state, setState] = useState(loadState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }, [state]);

  // Bite timer - watches for the moment a "waiting" cast should turn into a bite.
  useEffect(() => {
    if (state.castPhase !== 'waiting') return;
    const delay = Math.max(0, state.biteDeadline - Date.now());
    const timer = setTimeout(() => {
      setState(prev => {
        if (prev.castPhase !== 'waiting') return prev;
        const rod = RODS[prev.rodTier];

        if (prev.castEquipped === 'tackle') {
          const item = rollTackleCatch();
          return depositLoot({ ...prev, castPhase: 'idle', castStartedAt: 0, biteDeadline: 0 }, item);
        }

        if (prev.castEquipped === 'none') {
          const { result, type } = rollEmptyHanded(rollFish, prev.location);
          const cleared = { ...prev, castPhase: 'idle', castStartedAt: 0, biteDeadline: 0 };
          if (type === 'fish') return depositCaughtFish(cleared, result, rod);
          return depositLoot(cleared, result);
        }

        // Normal bait fishing - goes into the manual minigame as before.
        const fish = rollFish(prev.location);
        if (prev.permits.deepwater && prev.location === 'deep') {
          fish.value = Math.round(fish.value * 1.5);
        }
        return { ...prev, castPhase: 'biting', currentCatchFish: fish };
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [state.castPhase, state.biteDeadline]);

  // Auto-fish: availability is tied to the current rod tier (RODS[tier].autoRarities),
  // not a separate purchase. It still rolls a bite each cycle, but only fish
  // within the rod's supported rarities actually get caught - anything rarer
  // still requires playing the manual minigame.
  useEffect(() => {
    const rod = RODS[state.rodTier];
    if (!state.autoFishEnabled || rod.autoRarities.length === 0) return;
    const timer = setInterval(() => {
      setState(prev => {
        const currentRod = RODS[prev.rodTier];
        if (!prev.autoFishEnabled || currentRod.autoRarities.length === 0) return prev;
        if (prev.bait <= 0) return prev;
        if (prev.castPhase !== 'idle') return prev;
        const fish = rollFish(prev.location);
        if (prev.permits.deepwater && prev.location === 'deep') {
          fish.value = Math.round(fish.value * 1.5);
        }
        const afterBait = { ...prev, bait: prev.bait - 1 };
        if (!currentRod.autoRarities.includes(fish.rarity)) {
          // Too good for auto-catch - it gets away.
          return { ...afterBait, lastCatchTime: Date.now(), lastCaughtFish: null };
        }
        return depositCaughtFish(afterBait, fish, currentRod);
      });
    }, rod.biteWait);
    return () => clearInterval(timer);
  }, [state.autoFishEnabled, state.rodTier, state.location]);

  // Cage trap timer
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => {
        let changed = false;
        const updated = prev.cageTraps.map(trap => {
          if (trap.status === 'waiting' && Date.now() >= trap.catchTime) {
            const fish = rollFish('rocks');
            fish.value = Math.round(fish.value * CAGE_VALUE_MULT);
            fish.cageCaught = true;
            changed = true;
            return { ...trap, status: 'caught', fish };
          }
          return trap;
        });
        return changed ? { ...prev, cageTraps: updated } : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Museum payout timer
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => {
        if (!prev.hasMuseum) return prev;
        const income = getMuseumIncome(prev.fishBank, prev.museumTier);
        if (income <= 0) return prev;
        return {
          ...prev,
          currency: prev.currency + income,
          totalEarned: prev.totalEarned + income,
          lastMuseumIncome: income,
          lastMuseumPayout: Date.now(),
        };
      });
    }, MUSEUM_PAYOUT_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  const actions = {
    setLocation: useCallback((loc) => {
      setState(prev => ({ ...prev, location: loc }));
    }, []),

    buyBait: useCallback(() => {
      setState(prev => {
        if (prev.currency < BAIT_PACK_COST) return prev;
        return { ...prev, currency: prev.currency - BAIT_PACK_COST, bait: prev.bait + BAIT_PACK_SIZE };
      });
    }, []),

    buyRod: useCallback((tier) => {
      setState(prev => {
        const rod = RODS[tier];
        if (!rod || prev.currency < rod.cost || tier <= prev.rodTier) return prev;
        return { ...prev, currency: prev.currency - rod.cost, rodTier: tier };
      });
    }, []),

    buyPermit: useCallback((key) => {
      setState(prev => {
        const permit = PERMITS[key];
        if (!permit || prev.permits[key]) return prev;
        if (permit.requires && !prev.permits[permit.requires]) return prev;
        if (prev.currency < permit.cost) return prev;
        return { ...prev, currency: prev.currency - permit.cost, permits: { ...prev.permits, [key]: true } };
      });
    }, []),

    buyCageTrap: useCallback(() => {
      setState(prev => {
        if (!prev.permits.cage) return prev;
        if (prev.cageTraps.length >= CAGE_TRAP_SLOTS) return prev;
        if (prev.currency < CAGE_TRAP_COST) return prev;
        return {
          ...prev,
          currency: prev.currency - CAGE_TRAP_COST,
          cageTraps: [...prev.cageTraps, { id: `trap-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, status: 'waiting', catchTime: randomTrapTime(), fish: null }],
        };
      });
    }, []),

    collectCageTrap: useCallback((trapId) => {
      setState(prev => {
        const rod = RODS[prev.rodTier];
        if (prev.caughtInventory.length >= rod.inventoryCap) return prev;
        const trap = prev.cageTraps.find(t => t.id === trapId);
        if (!trap || trap.status !== 'caught' || !trap.fish) return prev;
        const fish = trap.fish;
        return {
          ...prev,
          caughtInventory: [...prev.caughtInventory, fish],
          encyclopedia: updateEncyclopedia(prev.encyclopedia, fish),
          totalCaught: prev.totalCaught + 1,
          lastCatchTime: Date.now(),
          lastCaughtFish: fish,
          cageTraps: prev.cageTraps.map(t => t.id === trapId ? { ...t, status: 'waiting', catchTime: randomTrapTime(), fish: null } : t),
        };
      });
    }, []),

    collectAllCageTraps: useCallback(() => {
      setState(prev => {
        const rod = RODS[prev.rodTier];
        const space = rod.inventoryCap - prev.caughtInventory.length;
        if (space <= 0) return prev;
        const caughtTraps = prev.cageTraps.filter(t => t.status === 'caught' && t.fish);
        const toCollect = caughtTraps.slice(0, space);
        if (toCollect.length === 0) return prev;
        const newFish = toCollect.map(t => t.fish);
        const collectIds = new Set(toCollect.map(t => t.id));
        return {
          ...prev,
          caughtInventory: [...prev.caughtInventory, ...newFish],
          encyclopedia: newFish.reduce((enc, f) => updateEncyclopedia(enc, f), prev.encyclopedia),
          totalCaught: prev.totalCaught + toCollect.length,
          lastCatchTime: Date.now(),
          lastCaughtFish: newFish[newFish.length - 1],
          cageTraps: prev.cageTraps.map(t => collectIds.has(t.id) ? { ...t, status: 'waiting', catchTime: randomTrapTime(), fish: null } : t),
        };
      });
    }, []),

    // --- Active fishing minigame ---
    cast: useCallback(() => {
      setState(prev => {
        if (prev.castPhase !== 'idle') return prev;
        const rod = RODS[prev.rodTier];
        const now = Date.now();

        if (prev.equipped === 'tackle') {
          if (prev.tackle <= 0) return prev;
          if (prev.lootInventory.length >= LOOT_INVENTORY_CAP) return prev;
          return {
            ...prev,
            tackle: prev.tackle - 1,
            castPhase: 'waiting',
            castStartedAt: now,
            castEquipped: 'tackle',
            biteDeadline: now + randomBiteWait(rod),
            currentCatchFish: null,
          };
        }

        if (prev.equipped === 'none') {
          return {
            ...prev,
            castPhase: 'waiting',
            castStartedAt: now,
            castEquipped: 'none',
            biteDeadline: now + randomBiteWait(rod),
            currentCatchFish: null,
          };
        }

        // Default: bait
        if (prev.bait <= 0) return prev;
        if (prev.caughtInventory.length >= rod.inventoryCap) return prev;
        return {
          ...prev,
          bait: prev.bait - 1,
          castPhase: 'waiting',
          castStartedAt: now,
          castEquipped: 'bait',
          biteDeadline: now + randomBiteWait(rod),
          currentCatchFish: null,
        };
      });
    }, []),

    uncast: useCallback(() => {
      setState(prev => {
        if (prev.castPhase === 'idle') return prev;
        // Refund the consumed resource only if the fish never actually bit yet.
        const shouldRefund = prev.castPhase === 'waiting';
        const refundBait = shouldRefund && prev.castEquipped === 'bait' ? 1 : 0;
        const refundTackle = shouldRefund && prev.castEquipped === 'tackle' ? 1 : 0;
        return {
          ...prev,
          bait: prev.bait + refundBait,
          tackle: prev.tackle + refundTackle,
          castPhase: 'idle',
          castStartedAt: 0,
          biteDeadline: 0,
          currentCatchFish: null,
        };
      });
    }, []),

    resolveCatch: useCallback((success) => {
      setState(prev => {
        if (prev.castPhase !== 'biting' || !prev.currentCatchFish) return prev;
        const rod = RODS[prev.rodTier];
        const fish = prev.currentCatchFish;
        const cleared = { ...prev, castPhase: 'idle', castStartedAt: 0, biteDeadline: 0, currentCatchFish: null };
        if (!success) {
          return { ...cleared, lastCatchTime: Date.now(), lastCaughtFish: null };
        }
        return depositCaughtFish(cleared, fish, rod);
      });
    }, []),

    buyMinigameItem: useCallback((key) => {
      setState(prev => {
        const item = MINIGAME_ITEMS[key];
        const currentTier = prev.minigameItems[key] || 0;
        const nextTier = item?.tiers?.[currentTier];
        if (!item || !nextTier || prev.currency < nextTier.cost) return prev;
        return { ...prev, currency: prev.currency - nextTier.cost, minigameItems: { ...prev.minigameItems, [key]: currentTier + 1 } };
      });
    }, []),

    toggleAutoFish: useCallback(() => {
      setState(prev => {
        if (RODS[prev.rodTier].autoRarities.length === 0) return prev;
        return { ...prev, autoFishEnabled: !prev.autoFishEnabled };
      });
    }, []),

    sellFish: useCallback((fishId) => {
      setState(prev => {
        const fish = prev.caughtInventory.find(f => f.id === fishId);
        if (!fish || fish.locked) return prev;
        return {
          ...prev,
          currency: prev.currency + fish.value,
          totalEarned: prev.totalEarned + fish.value,
          caughtInventory: prev.caughtInventory.filter(f => f.id !== fishId),
        };
      });
    }, []),

    sellAllFish: useCallback(() => {
      setState(prev => {
        const sellable = prev.caughtInventory.filter(f => !f.locked);
        const earnings = sellable.reduce((s, f) => s + f.value, 0);
        if (earnings === 0) return prev;
        return {
          ...prev,
          currency: prev.currency + earnings,
          totalEarned: prev.totalEarned + earnings,
          caughtInventory: prev.caughtInventory.filter(f => f.locked),
        };
      });
    }, []),

    sendToBank: useCallback((fishId) => {
      setState(prev => {
        const cap = BANK_UPGRADES[prev.bankTier - 1].capacity;
        if (prev.fishBank.length >= cap) return prev;
        const fish = prev.caughtInventory.find(f => f.id === fishId);
        if (!fish || fish.locked) return prev;
        return {
          ...prev,
          caughtInventory: prev.caughtInventory.filter(f => f.id !== fishId),
          fishBank: [...prev.fishBank, { ...fish, locked: false }],
        };
      });
    }, []),

    sendAllToBank: useCallback(() => {
      setState(prev => {
        const cap = BANK_UPGRADES[prev.bankTier - 1].capacity;
        const space = cap - prev.fishBank.length;
        if (space <= 0) return prev;
        const sendable = prev.caughtInventory.filter(f => !f.locked).slice(0, space);
        if (sendable.length === 0) return prev;
        const sendIds = new Set(sendable.map(f => f.id));
        return {
          ...prev,
          caughtInventory: prev.caughtInventory.filter(f => !sendIds.has(f.id)),
          fishBank: [...prev.fishBank, ...sendable.map(f => ({ ...f, locked: false }))],
        };
      });
    }, []),

    toggleLock: useCallback((fishId) => {
      setState(prev => ({
        ...prev,
        caughtInventory: prev.caughtInventory.map(f => f.id === fishId ? { ...f, locked: !f.locked } : f),
      }));
    }, []),

    sellBankedFish: useCallback((fishId) => {
      setState(prev => {
        const fish = prev.fishBank.find(f => f.id === fishId);
        if (!fish || fish.locked) return prev;
        return {
          ...prev,
          currency: prev.currency + fish.value,
          totalEarned: prev.totalEarned + fish.value,
          fishBank: prev.fishBank.filter(f => f.id !== fishId),
        };
      });
    }, []),

    sendBankedFishToInventory: useCallback((fishId) => {
      setState(prev => {
        const rod = RODS[prev.rodTier];
        if (prev.caughtInventory.length >= rod.inventoryCap) return prev;
        const fish = prev.fishBank.find(f => f.id === fishId);
        if (!fish || fish.locked) return prev;
        return {
          ...prev,
          fishBank: prev.fishBank.filter(f => f.id !== fishId),
          caughtInventory: [...prev.caughtInventory, { ...fish, locked: false }],
        };
      });
    }, []),

    toggleBankLock: useCallback((fishId) => {
      setState(prev => ({
        ...prev,
        fishBank: prev.fishBank.map(f => f.id === fishId ? { ...f, locked: !f.locked } : f),
      }));
    }, []),

    toggleAutoEnabled: useCallback((category) => {
      setState(prev => ({
        ...prev,
        autoSettings: {
          ...prev.autoSettings,
          [category]: {
            ...prev.autoSettings[category],
            enabled: !prev.autoSettings[category].enabled,
          },
        },
      }));
    }, []),

    toggleAutoFilter: useCallback((category, filterType, key) => {
      setState(prev => ({
        ...prev,
        autoSettings: {
          ...prev.autoSettings,
          [category]: {
            ...prev.autoSettings[category],
            [filterType]: {
              ...prev.autoSettings[category][filterType],
              [key]: !prev.autoSettings[category][filterType][key],
            },
          },
        },
      }));
    }, []),

    buyBankUpgrade: useCallback(() => {
      setState(prev => {
        const next = BANK_UPGRADES[prev.bankTier];
        if (!next || prev.currency < next.cost) return prev;
        return { ...prev, currency: prev.currency - next.cost, bankTier: prev.bankTier + 1 };
      });
    }, []),

    buyMuseum: useCallback(() => {
      setState(prev => {
        if (prev.hasMuseum || prev.currency < MUSEUM_COST) return prev;
        return { ...prev, currency: prev.currency - MUSEUM_COST, hasMuseum: true };
      });
    }, []),

    buyMuseumUpgrade: useCallback(() => {
      setState(prev => {
        const next = MUSEUM_UPGRADES[prev.museumTier];
        if (!next || prev.currency < next.cost) return prev;
        return { ...prev, currency: prev.currency - next.cost, museumTier: prev.museumTier + 1 };
      });
    }, []),

    buyBoatUpgrade: useCallback(() => {
      setState(prev => {
        const next = BOAT_UPGRADES[prev.boatTier + 1];
        if (!next || !prev.permits.boat || prev.currency < next.cost) return prev;
        return { ...prev, currency: prev.currency - next.cost, boatTier: prev.boatTier + 1 };
      });
    }, []),

    buyTacklePack: useCallback(() => {
      setState(prev => {
        if (prev.currency < TACKLE_PACK_COST) return prev;
        return { ...prev, currency: prev.currency - TACKLE_PACK_COST, tackle: prev.tackle + TACKLE_PACK_SIZE };
      });
    }, []),

    setEquipped: useCallback((type) => {
      setState(prev => {
        if (!['bait', 'tackle', 'none'].includes(type)) return prev;
        if (prev.castPhase !== 'idle') return prev; // don't swap gear mid-cast
        return { ...prev, equipped: type };
      });
    }, []),

    sellLootItem: useCallback((itemId) => {
      setState(prev => {
        const item = prev.lootInventory.find(i => i.id === itemId);
        if (!item || item.locked) return prev;
        return {
          ...prev,
          currency: prev.currency + item.value,
          totalEarned: prev.totalEarned + item.value,
          lootInventory: prev.lootInventory.filter(i => i.id !== itemId),
        };
      });
    }, []),

    sellAllLoot: useCallback(() => {
      setState(prev => {
        const sellable = prev.lootInventory.filter(i => !i.locked);
        const earnings = sellable.reduce((s, i) => s + i.value, 0);
        if (earnings === 0) return prev;
        return {
          ...prev,
          currency: prev.currency + earnings,
          totalEarned: prev.totalEarned + earnings,
          lootInventory: prev.lootInventory.filter(i => i.locked),
        };
      });
    }, []),

    toggleLootLock: useCallback((itemId) => {
      setState(prev => ({
        ...prev,
        lootInventory: prev.lootInventory.map(i => i.id === itemId ? { ...i, locked: !i.locked } : i),
      }));
    }, []),

    sendLootToMuseum: useCallback((itemId) => {
      setState(prev => {
        if (prev.treasureBank.length >= TREASURE_MUSEUM_CAP) return prev;
        const item = prev.lootInventory.find(i => i.id === itemId);
        if (!item || item.locked) return prev;
        return {
          ...prev,
          lootInventory: prev.lootInventory.filter(i => i.id !== itemId),
          treasureBank: [...prev.treasureBank, { ...item, locked: false }],
        };
      });
    }, []),

    sellTreasureBankItem: useCallback((itemId) => {
      setState(prev => {
        const item = prev.treasureBank.find(i => i.id === itemId);
        if (!item || item.locked) return prev;
        return {
          ...prev,
          currency: prev.currency + item.value,
          totalEarned: prev.totalEarned + item.value,
          treasureBank: prev.treasureBank.filter(i => i.id !== itemId),
        };
      });
    }, []),

    sendTreasureBankItemToInventory: useCallback((itemId) => {
      setState(prev => {
        if (prev.lootInventory.length >= LOOT_INVENTORY_CAP) return prev;
        const item = prev.treasureBank.find(i => i.id === itemId);
        if (!item || item.locked) return prev;
        return {
          ...prev,
          treasureBank: prev.treasureBank.filter(i => i.id !== itemId),
          lootInventory: [...prev.lootInventory, { ...item, locked: false }],
        };
      });
    }, []),

    toggleTreasureBankLock: useCallback((itemId) => {
      setState(prev => ({
        ...prev,
        treasureBank: prev.treasureBank.map(i => i.id === itemId ? { ...i, locked: !i.locked } : i),
      }));
    }, []),

    setCharacterName: useCallback((name) => {
      setState(prev => ({ ...prev, characterName: (name || '').trim().slice(0, 16) || prev.characterName }));
    }, []),

    setCharacterColor: useCallback((part, hex) => {
      setState(prev => {
        if (part !== 'head' && part !== 'body') return prev;
        return { ...prev, characterColors: { ...prev.characterColors, [part]: hex } };
      });
    }, []),

    resetGame: useCallback(() => {
      localStorage.removeItem(STORAGE_KEY);
      setState({ ...initialState });
    }, []),

    // Used by cloud-save sync to overwrite local state wholesale.
    loadFromCloud: useCallback((cloudState) => {
      if (!cloudState || typeof cloudState !== 'object') return;
      setState(prev => ({
        ...initialState,
        ...cloudState,
        castPhase: 'idle',
        castStartedAt: 0,
        biteDeadline: 0,
        currentCatchFish: null,
      }));
    }, []),
  };

  return { state, actions };
}
