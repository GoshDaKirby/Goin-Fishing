export const RODS = [
  { id: 'basic', name: 'Basic Rod', biteWait: 13000, inventoryCap: 20, cost: 0, autoRarities: [], desc: 'A simple stick with string. Long waits between bites. No auto-catch.' },
  { id: 'improved', name: 'Improved Rod', biteWait: 10000, inventoryCap: 30, cost: 800, autoRarities: ['common'], desc: 'Faster bites. Auto-fishes common and below.' },
  { id: 'advanced', name: 'Advanced Rod', biteWait: 7500, inventoryCap: 40, cost: 4000, autoRarities: ['common', 'uncommon'], desc: 'Even faster bites. Auto-fishes uncommon and below.' },
  { id: 'pro', name: 'Pro Rod', biteWait: 5500, inventoryCap: 60, cost: 16000, autoRarities: ['common', 'uncommon', 'rare'], desc: 'Quick bites for the serious angler. Auto-fishes rare and below.' },
  { id: 'master', name: 'Master Rod', biteWait: 4000, inventoryCap: 100, cost: 50000, autoRarities: ['common', 'uncommon', 'rare', 'epic'], desc: 'The finest rod ever crafted. Auto-fishes epic and below.' },
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

// Magnetic tackle: pricier than bait, used for treasure/trash fishing instead of regular fish.
export const TACKLE_PACK_COST = 250;
export const TACKLE_PACK_SIZE = 5;

// Character customization presets. Skin tones for the head, muted clothing
// colors for the body (kept in the same understated palette as the existing
// multiplayer shirt colors - no neon/overly bright options).
export const HEAD_COLOR_PRESETS = [
  '#f2d3b3', '#e8b890', '#d19a6a', '#a9744a', '#7a4f2f', '#4a2f1a',
];
export const BODY_COLOR_PRESETS = [
  '#3a7a9a', '#9a3a7a', '#3a9a6a', '#7a5a9a', '#9a6a3a', '#5a6a7a',
];
export const HAT_COLOR_PRESETS = [
  '#8b6b3a', '#4a4a4a', '#6b3a3a', '#3a5a6b', '#5a6b3a', '#3a3a3a',
];

export const LOOT_INVENTORY_CAP = 30;
export const TREASURE_MUSEUM_CAP = 60;
// Small chance a bait cast pulls up trash/treasure instead of a fish.
export const BAIT_LOOT_CHANCE = 0.05;

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
  duration: 9000,        // ms, how long the player has to fill the catch meter (after the countdown)
  countdown: 1500,       // ms, "get ready" pause before the fish/meter start moving at all (still counts 3-2-1, just faster)
  // Both fill and drain ramp from slow to fast over the duration of a single
  // catch attempt - everything feels sluggish and forgiving at first (time
  // to get positioned), then speeds up as the clock runs down.
  fillRateStart: 0.35,   // meter fill/sec at the start of the attempt
  fillRateEnd: 1.4,      // meter fill/sec by the end of the attempt
  drainRateStart: 0.2,   // meter drain/sec at the start of the attempt
  drainRateEnd: 0.8,     // meter drain/sec by the end of the attempt
};

// Per-rarity fish movement behavior in the minigame: calmer for common fish,
// increasingly erratic and fast for rarer fish. RARITY_ORDER is also used to
// shift effective difficulty down by rod tier (see FishingMinigame.jsx).
export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export const MINIGAME_RARITY = {
  common: { speed: 120, jitter: 0.15, directionChangeMs: 900 },
  uncommon: { speed: 170, jitter: 0.25, directionChangeMs: 700 },
  rare: { speed: 220, jitter: 0.35, directionChangeMs: 550 },
  epic: { speed: 280, jitter: 0.5, directionChangeMs: 400 },
  legendary: { speed: 350, jitter: 0.65, directionChangeMs: 300 },
};

// Assist upgrades that make the minigame a bit easier, each with a couple of
// modest tiers (kept deliberately weak so they help without trivializing the
// minigame). These are independent of auto-catch, which is now tied to rod
// tier instead.
export const MINIGAME_ITEMS = {
  bigZone: {
    name: 'Wide Net',
    tiers: [
      { zoneBonus: 0.15, cost: 1500 },
      { zoneBonus: 0.30, cost: 4500 },
    ],
  },
  calmingBait: {
    name: 'Calming Bait',
    tiers: [
      { speedMult: 0.85, cost: 1500 },
      { speedMult: 0.70, cost: 4500 },
    ],
  },
  tightBounds: {
    name: 'Focus Lure',
    tiers: [
      { boundsMult: 0.85, cost: 1500 },
      { boundsMult: 0.70, cost: 4500 },
    ],
  },
};

export function getMuseumIncome(fishBank, museumTier) {
  if (!fishBank || fishBank.length === 0) return 0;
  const totalScore = fishBank.reduce((s, f) => s + (f.museumScore || 1), 0);
  const uniqueSpecies = new Set(fishBank.map(f => f.species)).size;
  const tierMult = MUSEUM_UPGRADES[museumTier - 1]?.multiplier || 1;
  return Math.round((totalScore * 2 + uniqueSpecies * 10) * tierMult * 0.1);
}