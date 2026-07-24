export const FISH_SPECIES = {
  shore: [
    { id: 'sardine', name: 'Sardine', baseValue: 10, weight: 30, color: '#a8c5d6', size: 0.35, rarity: 'common', emoji: '🐟' },
    { id: 'mackerel', name: 'Mackerel', baseValue: 18, weight: 25, color: '#5b8ca8', size: 0.42, rarity: 'common', emoji: '🐟' },
    { id: 'flounder', name: 'Flounder', baseValue: 30, weight: 20, color: '#8b9e7a', size: 0.38, rarity: 'common', emoji: '🐟' },
    { id: 'shore_shrimp', name: 'Shore Shrimp', baseValue: 22, weight: 22, color: '#e8a87c', size: 0.15, rarity: 'common', emoji: '🦐' },
    { id: 'beach_crab', name: 'Beach Crab', baseValue: 35, weight: 20, color: '#d8603a', size: 0.2, rarity: 'common', emoji: '🦀' },
    { id: 'clownfish', name: 'Clownfish', baseValue: 45, weight: 12, color: '#e8772e', size: 0.32, rarity: 'uncommon', emoji: '🐠' },
    { id: 'seabass', name: 'Sea Bass', baseValue: 70, weight: 10, color: '#6b8e9e', size: 0.5, rarity: 'uncommon', emoji: '🐟' },
    { id: 'pufferfish', name: 'Pufferfish', baseValue: 90, weight: 9, color: '#d4a843', size: 0.4, rarity: 'uncommon', emoji: '🐡' },
    { id: 'moon_jelly', name: 'Moon Jelly', baseValue: 75, weight: 10, color: '#d8e8f0', size: 0.3, rarity: 'uncommon', emoji: '🪼' },
    { id: 'oyster', name: 'Oyster', baseValue: 60, weight: 12, color: '#c8beac', size: 0.2, rarity: 'uncommon', emoji: '🦪' },
    { id: 'octopus', name: 'Octopus', baseValue: 120, weight: 6, color: '#c45a8a', size: 0.45, rarity: 'rare', emoji: '🐙' },
    { id: 'sea_turtle', name: 'Sea Turtle', baseValue: 340, weight: 3, color: '#4a7a5a', size: 0.8, rarity: 'rare', emoji: '🐢' },
    { id: 'marsh_frog', name: 'Marsh Frog', baseValue: 200, weight: 4, color: '#5a8a4a', size: 0.25, rarity: 'rare', emoji: '🐸' },
  ],
  rocks: [
    { id: 'rockfish', name: 'Rockfish', baseValue: 55, weight: 24, color: '#b85c3a', size: 0.42, rarity: 'common', emoji: '🐟' },
    { id: 'tide_crab', name: 'Tide Crab', baseValue: 65, weight: 20, color: '#a8402a', size: 0.22, rarity: 'common', emoji: '🦀' },
    { id: 'rock_oyster', name: 'Rock Oyster', baseValue: 70, weight: 16, color: '#9a9080', size: 0.2, rarity: 'common', emoji: '🦪' },
    { id: 'rock_pufferfish', name: 'Spiny Pufferfish', baseValue: 80, weight: 16, color: '#d4a843', size: 0.4, rarity: 'uncommon', emoji: '🐡' },
    { id: 'snapper', name: 'Snapper', baseValue: 110, weight: 14, color: '#c44545', size: 0.5, rarity: 'uncommon', emoji: '🐟' },
    { id: 'grouper', name: 'Grouper', baseValue: 160, weight: 10, color: '#7a6b5d', size: 0.6, rarity: 'uncommon', emoji: '🐟' },
    { id: 'sea_snake', name: 'Sea Snake', baseValue: 140, weight: 10, color: '#3a6b4a', size: 0.55, rarity: 'uncommon', emoji: '🐍' },
    { id: 'marine_iguana', name: 'Marine Iguana', baseValue: 175, weight: 8, color: '#4a5a3a', size: 0.4, rarity: 'uncommon', emoji: '🦎' },
    { id: 'morayeel', name: 'Moray Eel', baseValue: 220, weight: 7, color: '#3a5a3a', size: 0.7, rarity: 'rare', emoji: '🐍' },
    { id: 'lionfish', name: 'Lionfish', baseValue: 280, weight: 6, color: '#d83a3a', size: 0.45, rarity: 'rare', emoji: '🐠' },
    { id: 'rock_octopus', name: 'Reef Octopus', baseValue: 130, weight: 7, color: '#9a4a6a', size: 0.45, rarity: 'rare', emoji: '🐙' },
    { id: 'lobster', name: 'Lobster', baseValue: 300, weight: 6, color: '#c44020', size: 0.5, rarity: 'rare', emoji: '🦞' },
    { id: 'giant_clam', name: 'Giant Clam', baseValue: 400, weight: 3, color: '#d8c8b8', size: 0.5, rarity: 'epic', emoji: '🐚' },
    { id: 'small_croc', name: 'Estuary Crocodile', baseValue: 480, weight: 2, color: '#3a4a2a', size: 0.9, rarity: 'epic', emoji: '🐊' },
    { id: 'robo_fish', name: 'Robo-Fish', baseValue: 3000, weight: 0, color: '#8a9aa8', size: 0.5, rarity: 'legendary', emoji: '🐟🤖', tackleOnly: true },
  ],
  deep: [
    { id: 'tuna', name: 'Tuna', baseValue: 180, weight: 22, color: '#4a6b8a', size: 0.7, rarity: 'uncommon', emoji: '🐟' },
    { id: 'swordfish', name: 'Swordfish', baseValue: 300, weight: 16, color: '#5a7a9a', size: 0.9, rarity: 'uncommon', emoji: '🐟' },
    { id: 'dolphin', name: 'Dolphin', baseValue: 260, weight: 14, color: '#7a95a5', size: 0.85, rarity: 'uncommon', emoji: '🐬' },
    { id: 'harbor_seal', name: 'Harbor Seal', baseValue: 240, weight: 13, color: '#8a8578', size: 0.75, rarity: 'uncommon', emoji: '🦭' },
    { id: 'marlin', name: 'Marlin', baseValue: 450, weight: 11, color: '#2a4a7a', size: 1.0, rarity: 'rare', emoji: '🐟' },
    { id: 'sunfish', name: 'Sunfish', baseValue: 380, weight: 9, color: '#9a9a8a', size: 0.85, rarity: 'rare', emoji: '🐠' },
    { id: 'reef_squid', name: 'Reef Squid', baseValue: 340, weight: 9, color: '#8a6a9a', size: 0.6, rarity: 'rare', emoji: '🦑' },
    { id: 'shark', name: 'Shark', baseValue: 650, weight: 6, color: '#6a7a8a', size: 1.2, rarity: 'epic', emoji: '🦈' },
    { id: 'hammerhead', name: 'Hammerhead Shark', baseValue: 720, weight: 5, color: '#5a6a78', size: 1.15, rarity: 'epic', emoji: '🦈' },
    { id: 'manta', name: 'Manta Ray', baseValue: 550, weight: 6, color: '#2a2a3a', size: 1.1, rarity: 'epic', emoji: '🐠' },
    { id: 'whale', name: 'Whale', baseValue: 800, weight: 4, color: '#3a4a5a', size: 1.5, rarity: 'epic', emoji: '🐋' },
    { id: 'anglerfish', name: 'Anglerfish', baseValue: 1000, weight: 3, color: '#2a2a3a', size: 0.8, rarity: 'epic', emoji: '🐡' },
    { id: 'giantsquid', name: 'Giant Squid', baseValue: 1200, weight: 2, color: '#8a4a6a', size: 1.3, rarity: 'legendary', emoji: '🦑' },
    { id: 'coelacanth', name: 'Coelacanth', baseValue: 1500, weight: 1, color: '#3a5a7a', size: 1.0, rarity: 'legendary', emoji: '🐟' },
    { id: 'megamouth', name: 'Megamouth Shark', baseValue: 1800, weight: 1, color: '#1a1a2a', size: 1.4, rarity: 'legendary', emoji: '🦈' },
    { id: 'oarfish', name: 'Oarfish', baseValue: 2200, weight: 1, color: '#d8d8e8', size: 1.6, rarity: 'legendary', emoji: '🐍' },
    { id: 'sea_dragon', name: 'Leafy Sea Dragon', baseValue: 2600, weight: 0.8, color: '#5a8a4a', size: 0.6, rarity: 'legendary', emoji: '🐉' },
    { id: 'frilled_shark', name: 'Frilled Shark', baseValue: 2400, weight: 0.8, color: '#4a4a4a', size: 1.2, rarity: 'legendary', emoji: '🦖' },
    { id: 'robo_shark', name: 'Robo-Shark', baseValue: 7000, weight: 0, color: '#7a8a9a', size: 1.2, rarity: 'legendary', emoji: '🦈🤖', tackleOnly: true },
    { id: 'robo_whale', name: 'Robo-Whale', baseValue: 16000, weight: 0, color: '#4a5a6a', size: 1.6, rarity: 'legendary', emoji: '🐋🤖', tackleOnly: true },
  ],
};

// Robo-fish/shark/whale have weight: 0 in the pools above (so a normal bait
// cast can never randomly roll them via the weighted pool) - they're only
// reachable through the dedicated tackle-catch roll in lootData.js, which
// checks location (and, for the whale, the deep-sea permit) directly.

export const VARIANTS = {
  normal: { name: 'Normal', multiplier: 1, museumScore: 1, weight: 95 },
  albino: { name: 'Albino', multiplier: 1.5, museumScore: 2, weight: 3 },
  melanistic: { name: 'Melanistic', multiplier: 2, museumScore: 3, weight: 1.5 },
  gold: { name: 'Gold', multiplier: 5, museumScore: 5, weight: 0.5 },
};

export const VARIANT_COLORS = {
  normal: null,
  albino: '#f0e8d8',
  melanistic: '#1a1a1a',
  gold: '#f5a623',
};

export const VARIANT_BADGES = {
  normal: { label: 'Normal', className: 'bg-slate-500 text-white' },
  albino: { label: 'Albino', className: 'bg-amber-50 text-amber-900 border border-amber-300' },
  melanistic: { label: 'Melanistic', className: 'bg-gray-900 text-gray-100' },
  gold: { label: 'Gold', className: 'bg-amber-400 text-amber-900' },
};

export const RARITIES = {
  common: { name: 'Common', color: '#9ca3af' },
  uncommon: { name: 'Uncommon', color: '#4ade80' },
  rare: { name: 'Rare', color: '#60a5fa' },
  epic: { name: 'Epic', color: '#c084fc' },
  legendary: { name: 'Legendary', color: '#fbbf24' },
};

export const RARITY_BADGES = {
  common: { label: 'Common', color: '#9ca3af' },
  uncommon: { label: 'Uncommon', color: '#4ade80' },
  rare: { label: 'Rare', color: '#60a5fa' },
  epic: { label: 'Epic', color: '#c084fc' },
  legendary: { label: 'Legendary', color: '#fbbf24' },
};

// How far an individual catch's size can drift from the species' average
// size (as a fraction, e.g. 0.35 = anywhere from 65% to 135% of average).
export const SIZE_SPREAD = {
  common: 0.30,
  uncommon: 0.35,
  rare: 0.40,
  epic: 0.45,
  legendary: 0.55,
};

export const ALL_SPECIES = [
  ...FISH_SPECIES.shore,
  ...FISH_SPECIES.rocks,
  ...FISH_SPECIES.deep,
];

export const SPECIES_MAP = Object.fromEntries(ALL_SPECIES.map(s => [s.id, s]));

function finalizeFish(species, location) {
  const variantEntries = Object.entries(VARIANTS);
  const totalVarWeight = variantEntries.reduce((s, [, v]) => s + v.weight, 0);
  let vr = Math.random() * totalVarWeight;
  let variant = 'normal';
  for (const [k, v] of variantEntries) {
    vr -= v.weight;
    if (vr <= 0) { variant = k; break; }
  }

  // Size variance: each individual catch rolls a size multiplier on a bell-ish
  // curve (average of two rolls pulls results toward the middle, with rare
  // extremes at both ends). Rarer fish have a slightly wider spread, since
  // the trophy-sized outliers matter more for rarer species.
  const spread = SIZE_SPREAD[species.rarity || 'common'] ?? SIZE_SPREAD.common;
  const roll = (Math.random() + Math.random()) / 2; // 0..1, centered on 0.5
  const sizeMultiplier = +(1 - spread + roll * spread * 2).toFixed(3);
  const actualSize = +(species.size * sizeMultiplier).toFixed(3);

  // Bigger fish sell for more, smaller fish sell for less. A fish at the
  // average size multiplier (1.0) sells at the normal base/variant value;
  // it scales roughly linearly off of that from there.
  const sizeValueMultiplier = 0.4 + sizeMultiplier * 0.6;
  const value = Math.round(species.baseValue * VARIANTS[variant].multiplier * sizeValueMultiplier);

  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    species: species.id,
    speciesName: species.name,
    emoji: species.emoji || '🐟',
    color: VARIANT_COLORS[variant] || species.color,
    size: actualSize,
    sizeMultiplier,
    rarity: species.rarity || 'common',
    variant,
    variantName: VARIANTS[variant].name,
    value,
    museumScore: VARIANTS[variant].museumScore,
    locked: false,
    location,
    caughtAt: Date.now(),
  };
}

export function rollFish(location) {
  const pool = FISH_SPECIES[location] || FISH_SPECIES.shore;
  const totalWeight = pool.reduce((s, f) => s + f.weight, 0);
  let r = Math.random() * totalWeight;
  let species = pool[0];
  for (const f of pool) {
    r -= f.weight;
    if (r <= 0) { species = f; break; }
  }
  return finalizeFish(species, location);
}

// Catches one specific named species regardless of its normal pool weight -
// used for the magnetic-tackle-only robo-fish/shark/whale, which have a
// weight of 0 in their pool (so a normal cast can never roll them) and are
// only reachable through this direct roll.
export function rollSpecificFish(speciesId, location) {
  const species = SPECIES_MAP[speciesId];
  if (!species) return null;
  return finalizeFish(species, location);
}

export function sizeLabel(sizeMultiplier) {
  if (sizeMultiplier == null) return null;
  if (sizeMultiplier >= 1.35) return 'Massive';
  if (sizeMultiplier >= 1.15) return 'Large';
  if (sizeMultiplier >= 0.85) return 'Average';
  if (sizeMultiplier >= 0.65) return 'Small';
  return 'Tiny';
}

export function fishMatchesFilters(fish, filters) {
  const rarity = fish.rarity || 'common';
  if (!filters.variants[fish.variant]) return false;
  if (!filters.rarities[rarity]) return false;
  return true;
}