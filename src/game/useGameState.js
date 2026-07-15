import { useState, useEffect, useRef, useCallback } from 'react';
import { rollFish, fishMatchesFilters } from './fishData';
import {
  RODS, PERMITS, CAGE_TRAP_COST, CAGE_TRAP_SLOTS,
  CAGE_TRAP_MIN_TIME, CAGE_TRAP_MAX_TIME, CAGE_VALUE_MULT,
  BAIT_PACK_COST, BAIT_PACK_SIZE, BANK_UPGRADES,
  MUSEUM_COST, MUSEUM_UPGRADES, BOAT_UPGRADES,
  STARTING_CURRENCY, STARTING_BAIT, MUSEUM_PAYOUT_INTERVAL,
  getMuseumIncome,
} from './gameConfig';

const STORAGE_KEY = 'lazy-fisherman-save-v1';

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

const initialState = {
  currency: STARTING_CURRENCY,
  bait: STARTING_BAIT,
  caughtInventory: [],
  fishBank: [],
  bankTier: 1,
  hasMuseum: false,
  museumTier: 1,
  rodTier: 0,
  permits: { rock: false, cage: false, boat: false, deepwater: false },
  cageTraps: [],
  boatTier: 0,
  location: 'shore',
  encyclopedia: {},
  lastCatchTime: 0,
  lastMuseumIncome: 0,
  lastMuseumPayout: 0,
  totalEarned: 0,
  totalCaught: 0,
  autoSettings: defaultAutoSettings,
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...initialState,
        ...parsed,
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
  return {
    ...encyclopedia,
    [fish.species]: { ...entry, [fish.variant]: true, discovered: true },
  };
}

function randomTrapTime() {
  return Date.now() + CAGE_TRAP_MIN_TIME + Math.random() * (CAGE_TRAP_MAX_TIME - CAGE_TRAP_MIN_TIME);
}

export function useGameState() {
  const [state, setState] = useState(loadState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }, [state]);

  // Auto-fishing timer
  useEffect(() => {
    const rod = RODS[state.rodTier];
    const timer = setInterval(() => {
      const s = stateRef.current;
      if (s.bait <= 0) return;

      const fish = rollFish(s.location);
      if (s.permits.deepwater && s.location === 'deep') {
        fish.value = Math.round(fish.value * 1.5);
      }

      setState(prev => {
        if (prev.bait <= 0) return prev;

        const auto = prev.autoSettings;
        const bankCap = BANK_UPGRADES[prev.bankTier - 1].capacity;
        const enc = updateEncyclopedia(prev.encyclopedia, fish);

        // Auto-bank first
        if (auto.autoBank.enabled && fishMatchesFilters(fish, auto.autoBank) && prev.fishBank.length < bankCap) {
          return {
            ...prev,
            bait: prev.bait - 1,
            fishBank: [...prev.fishBank, { ...fish, locked: false }],
            encyclopedia: enc,
            lastCatchTime: Date.now(),
            totalCaught: prev.totalCaught + 1,
          };
        }

        // Auto-sell
        if (auto.autoSell.enabled && fishMatchesFilters(fish, auto.autoSell)) {
          return {
            ...prev,
            bait: prev.bait - 1,
            currency: prev.currency + fish.value,
            totalEarned: prev.totalEarned + fish.value,
            encyclopedia: enc,
            lastCatchTime: Date.now(),
            totalCaught: prev.totalCaught + 1,
          };
        }

        // Inventory
        if (prev.caughtInventory.length < rod.inventoryCap) {
          return {
            ...prev,
            bait: prev.bait - 1,
            caughtInventory: [...prev.caughtInventory, fish],
            encyclopedia: enc,
            lastCatchTime: Date.now(),
            totalCaught: prev.totalCaught + 1,
          };
        }

        return prev;
      });
    }, rod.catchInterval);
    return () => clearInterval(timer);
  }, [state.rodTier, state.location]);

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
          cageTraps: prev.cageTraps.map(t => collectIds.has(t.id) ? { ...t, status: 'waiting', catchTime: randomTrapTime(), fish: null } : t),
        };
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
        if (!fish) return prev;
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
        if (!fish) return prev;
        return {
          ...prev,
          fishBank: prev.fishBank.filter(f => f.id !== fishId),
          caughtInventory: [...prev.caughtInventory, { ...fish, locked: false }],
        };
      });
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

    resetGame: useCallback(() => {
      localStorage.removeItem(STORAGE_KEY);
      setState({ ...initialState });
    }, []),
  };

  return { state, actions };
}