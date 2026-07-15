export const RODS = [
  { id: 'basic', name: 'Basic Rod', catchInterval: 8000, inventoryCap: 20, cost: 0, desc: 'A simple stick with string. It works... mostly.' },
  { id: 'improved', name: 'Improved Rod', catchInterval: 6000, inventoryCap: 30, cost: 500, desc: 'Sturdier build, faster catches, more space.' },
  { id: 'advanced', name: 'Advanced Rod', catchInterval: 4000, inventoryCap: 40, cost: 2000, desc: 'A quality rod for serious anglers.' },
  { id: 'pro', name: 'Pro Rod', catchInterval: 2500, inventoryCap: 60, cost: 8000, desc: 'Top-tier gear. Catches fish like clockwork.' },
  { id: 'master', name: 'Master Rod', catchInterval: 1500, inventoryCap: 100, cost: 25000, desc: 'The finest rod ever crafted.' },
];

export const PERMITS = {
  rock: { name: 'Rock Fishing Permit', cost: 1000, desc: 'Unlocks the Rocks fishing area.' },
  cage: { name: 'Cage Trap Permit', cost: 1500, desc: 'Allows purchasing and using cage traps.' },
  boat: { name: 'Boat + Basic Permit', cost: 5000, desc: 'Unlocks Deep Water fishing. Includes basic boat permit.' },
  deepwater: { name: 'Deep Sea License', cost: 3000, desc: 'Increases deep water catch value by 50%.', requires: 'boat' },
};

export const CAGE_TRAP_COST = 300;
export const CAGE_TRAP_SLOTS = 4;
export const CAGE_TRAP_MIN_TIME = 30000;
export const CAGE_TRAP_MAX_TIME = 90000;
export const CAGE_VALUE_MULT = 1.5;

export const BAIT_PACK_COST = 50;
export const BAIT_PACK_SIZE = 10;

export const BANK_UPGRADES = [
  { tier: 1, capacity: 20, cost: 0 },
  { tier: 2, capacity: 50, cost: 2000 },
  { tier: 3, capacity: 100, cost: 5000 },
  { tier: 4, capacity: 200, cost: 12000 },
  { tier: 5, capacity: 500, cost: 25000 },
];

export const MUSEUM_COST = 12000;
export const MUSEUM_UPGRADES = [
  { tier: 1, multiplier: 1, cost: 0, name: 'Basic Museum' },
  { tier: 2, multiplier: 2, cost: 10000, name: 'Expanded Museum' },
  { tier: 3, multiplier: 4, cost: 25000, name: 'Premier Museum' },
  { tier: 4, multiplier: 8, cost: 60000, name: 'World-Class Museum' },
];

export const BOAT_UPGRADES = [
  { id: 'basic', name: 'Basic Boat', cap: 4, cost: 0 },
  { id: 'large', name: 'Large Boat', cap: 6, cost: 8000 },
];

export const LOCATIONS = [
  { id: 'shore', name: 'Shore', requiresPermit: null, cap: 8, desc: 'Calm coastal waters. Free for everyone.' },
  { id: 'rocks', name: 'Rocks', requiresPermit: 'rock', cap: 6, desc: 'Rocky waters with richer fish.' },
  { id: 'deep', name: 'Deep Water', requiresPermit: 'boat', cap: 4, desc: 'Open ocean. Rare and valuable fish.' },
];

export const STARTING_CURRENCY = 100;
export const STARTING_BAIT = 10;
export const MUSEUM_PAYOUT_INTERVAL = 30000;

export function getMuseumIncome(fishBank, museumTier) {
  if (!fishBank || fishBank.length === 0) return 0;
  const totalScore = fishBank.reduce((s, f) => s + (f.museumScore || 1), 0);
  const uniqueSpecies = new Set(fishBank.map(f => f.species)).size;
  const tierMult = MUSEUM_UPGRADES[museumTier - 1]?.multiplier || 1;
  return Math.round((totalScore * 2 + uniqueSpecies * 10) * tierMult * 0.1);
}