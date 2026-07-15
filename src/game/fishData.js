export const FISH_SPECIES = {
  shore: [
    { id: 'sardine', name: 'Sardine', baseValue: 10, weight: 30, color: '#a8c5d6', size: 0.35, rarity: 'common' },
    { id: 'mackerel', name: 'Mackerel', baseValue: 18, weight: 25, color: '#5b8ca8', size: 0.42, rarity: 'common' },
    { id: 'flounder', name: 'Flounder', baseValue: 30, weight: 15, color: '#8b9e7a', size: 0.38, rarity: 'common' },
    { id: 'clownfish', name: 'Clownfish', baseValue: 45, weight: 10, color: '#e8772e', size: 0.32, rarity: 'uncommon' },
    { id: 'seabass', name: 'Sea Bass', baseValue: 70, weight: 8, color: '#6b8e9e', size: 0.5, rarity: 'uncommon' },
    { id: 'pufferfish', name: 'Pufferfish', baseValue: 90, weight: 7, color: '#d4a843', size: 0.4, rarity: 'uncommon' },
    { id: 'octopus', name: 'Octopus', baseValue: 120, weight: 5, color: '#c45a8a', size: 0.45, rarity: 'rare' },
  ],
  rocks: [
    { id: 'rockfish', name: 'Rockfish', baseValue: 55, weight: 25, color: '#b85c3a', size: 0.42, rarity: 'common' },
    { id: 'pufferfish', name: 'Pufferfish', baseValue: 80, weight: 20, color: '#d4a843', size: 0.4, rarity: 'uncommon' },
    { id: 'snapper', name: 'Snapper', baseValue: 110, weight: 15, color: '#c44545', size: 0.5, rarity: 'uncommon' },
    { id: 'grouper', name: 'Grouper', baseValue: 160, weight: 10, color: '#7a6b5d', size: 0.6, rarity: 'uncommon' },
    { id: 'morayeel', name: 'Moray Eel', baseValue: 220, weight: 7, color: '#3a5a3a', size: 0.7, rarity: 'rare' },
    { id: 'lionfish', name: 'Lionfish', baseValue: 280, weight: 5, color: '#d83a3a', size: 0.45, rarity: 'rare' },
    { id: 'octopus', name: 'Octopus', baseValue: 130, weight: 8, color: '#9a4a6a', size: 0.45, rarity: 'rare' },
    { id: 'lobster', name: 'Lobster', baseValue: 300, weight: 7, color: '#c44020', size: 0.5, rarity: 'rare' },
    { id: 'seaturtle', name: 'Sea Turtle', baseValue: 350, weight: 3, color: '#4a7a5a', size: 0.8, rarity: 'epic' },
  ],
  deep: [
    { id: 'tuna', name: 'Tuna', baseValue: 180, weight: 25, color: '#4a6b8a', size: 0.7, rarity: 'uncommon' },
    { id: 'swordfish', name: 'Swordfish', baseValue: 300, weight: 20, color: '#5a7a9a', size: 0.9, rarity: 'uncommon' },
    { id: 'marlin', name: 'Marlin', baseValue: 450, weight: 15, color: '#2a4a7a', size: 1.0, rarity: 'rare' },
    { id: 'sunfish', name: 'Sunfish', baseValue: 380, weight: 12, color: '#9a9a8a', size: 0.85, rarity: 'rare' },
    { id: 'shark', name: 'Shark', baseValue: 650, weight: 8, color: '#6a7a8a', size: 1.2, rarity: 'epic' },
    { id: 'manta', name: 'Manta Ray', baseValue: 550, weight: 7, color: '#2a2a3a', size: 1.1, rarity: 'epic' },
    { id: 'whale', name: 'Whale', baseValue: 800, weight: 5, color: '#3a4a5a', size: 1.5, rarity: 'epic' },
    { id: 'anglerfish', name: 'Anglerfish', baseValue: 1000, weight: 3, color: '#2a2a3a', size: 0.8, rarity: 'epic' },
    { id: 'giantsquid', name: 'Giant Squid', baseValue: 1200, weight: 2, color: '#8a4a6a', size: 1.3, rarity: 'legendary' },
    { id: 'coelacanth', name: 'Coelacanth', baseValue: 1500, weight: 1, color: '#3a5a7a', size: 1.0, rarity: 'legendary' },
    { id: 'megamouth', name: 'Megamouth Shark', baseValue: 1800, weight: 1, color: '#1a1a2a', size: 1.4, rarity: 'legendary' },
    { id: 'oarfish', name: 'Oarfish', baseValue: 2200, weight: 1, color: '#d8d8e8', size: 1.6, rarity: 'legendary' },
  ],
};

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

export const ALL_SPECIES = [
  ...FISH_SPECIES.shore,
  ...FISH_SPECIES.rocks,
  ...FISH_SPECIES.deep,
];

export const SPECIES_MAP = Object.fromEntries(ALL_SPECIES.map(s => [s.id, s]));

export function rollFish(location) {
  const pool = FISH_SPECIES[location] || FISH_SPECIES.shore;
  const totalWeight = pool.reduce((s, f) => s + f.weight, 0);
  let r = Math.random() * totalWeight;
  let species = pool[0];
  for (const f of pool) {
    r -= f.weight;
    if (r <= 0) { species = f; break; }
  }
  const variantEntries = Object.entries(VARIANTS);
  const totalVarWeight = variantEntries.reduce((s, [, v]) => s + v.weight, 0);
  let vr = Math.random() * totalVarWeight;
  let variant = 'normal';
  for (const [k, v] of variantEntries) {
    vr -= v.weight;
    if (vr <= 0) { variant = k; break; }
  }
  const value = Math.round(species.baseValue * VARIANTS[variant].multiplier);
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    species: species.id,
    speciesName: species.name,
    color: VARIANT_COLORS[variant] || species.color,
    size: species.size,
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

export function fishMatchesFilters(fish, filters) {
  const rarity = fish.rarity || 'common';
  if (!filters.variants[fish.variant]) return false;
  if (!filters.rarities[rarity]) return false;
  return true;
}