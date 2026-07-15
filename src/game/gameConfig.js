export const RODS = [
  { id: 'basic', name: 'Basic Rod', biteWait: 4000, inventoryCap: 20, cost: 0, desc: 'A simple stick with string. Bites come quick, but it holds less.' },
  { id: 'improved', name: 'Improved Rod', biteWait: 5500, inventoryCap: 30, cost: 500, desc: 'Sturdier build with more room to carry fish. Bites take a bit longer to find.' },
  { id: 'advanced', name: 'Advanced Rod', biteWait: 7500, inventoryCap: 40, cost: 2000, desc: 'Built for serious anglers going after serious fish. Slower bites, bigger haul.' },
  { id: 'pro', name: 'Pro Rod', biteWait: 10000, inventoryCap: 60, cost: 8000, desc: 'Top-tier gear for the patient angler. Long waits, large capacity.' },
  { id: 'master', name: 'Master Rod', biteWait: 13000, inventoryCap: 100, cost: 25000, desc: 'The finest rod ever crafted. Every bite is a wait worth having.' },
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
  { tier: 2, capacity: 75, cost: 3000 },
  { tier: 3, capacity: 200, cost: 9000 },
  { tier: 4, capacity: 500, cost: 20000 },
  { tier: 5, capacity: 1200, cost: 45000 },
  { tier: 6, capacity: 3000, cost: 100000 },
  { tier: 7, capacity: 7500, cost: 250000 },
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

// --- Fishing minigame ---
// Base parameters for the "keep the fish in the zone" minigame. Difficulty
// (fish speed/erraticness) scales up by rarity on top of these base values.
export const MINIGAME_BASE = {
  boundsSize: 260,      // px, the outer square the fish is constrained to
  zoneSize: 70,         // px, the green catch-zone diameter
  duration: 9000,        // ms, how long the player has to fill the catch meter
  fillRate: 1,           // meter fill per second while fish is inside the zone
  drainRate: 0.6,        // meter drain per second while fish is outside the zone
};

// Per-rarity fish movement behavior in the minigame: calmer for common fish,
// increasingly erratic and fast for rarer fish.
export const MINIGAME_RARITY = {
  common: { speed: 60, jitter: 0.15, directionChangeMs: 900 },
  uncommon: { speed: 85, jitter: 0.25, directionChangeMs: 700 },
  rare: { speed: 110, jitter: 0.35, directionChangeMs: 550 },
  epic: { speed: 140, jitter: 0.5, directionChangeMs: 400 },
  legendary: { speed: 175, jitter: 0.65, directionChangeMs: 300 },
};

// Assist upgrades that make the minigame easier. All three must be owned
// before the Auto-Fish upgrade becomes purchasable.
export const MINIGAME_ITEMS = {
  bigZone: { name: 'Wide Net', desc: 'Increases the green catch-zone size by 40%.', cost: 4000, zoneBonus: 0.4 },
  calmingBait: { name: 'Calming Bait', desc: 'Slows fish movement in the minigame by 35%.', cost: 6000, speedMult: 0.65 },
  tightBounds: { name: 'Focus Lure', desc: 'Shrinks the outer play area by 30%, giving the fish less room to run.', cost: 8000, boundsMult: 0.7 },
};

export const AUTO_FISH_COST = 20000;

export function getMuseumIncome(fishBank, museumTier) {
  if (!fishBank || fishBank.length === 0) return 0;
  const totalScore = fishBank.reduce((s, f) => s + (f.museumScore || 1), 0);
  const uniqueSpecies = new Set(fishBank.map(f => f.species)).size;
  const tierMult = MUSEUM_UPGRADES[museumTier - 1]?.multiplier || 1;
  return Math.round((totalScore * 2 + uniqueSpecies * 10) * tierMult * 0.1);
}