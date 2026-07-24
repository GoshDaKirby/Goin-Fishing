import { rollSpecificFish } from './fishData';

export const TRASH_ITEMS = [
  { id: 'old_boot', name: 'Old Boot', color: '#6b4a2a', emoji: '👢', minValue: 1, maxValue: 2 },
  { id: 'tin_can', name: 'Rusty Tin Can', color: '#8a8a8a', emoji: '🥫', minValue: 1, maxValue: 2 },
  { id: 'seaweed_clump', name: 'Seaweed Clump', color: '#3a6b3a', emoji: '🪸', minValue: 1, maxValue: 3 },
  { id: 'broken_bottle', name: 'Broken Bottle', color: '#4a8a6a', emoji: '🍾', minValue: 2, maxValue: 4 },
  { id: 'waterlogged_phone', name: 'Waterlogged Phone', color: '#2a2a2a', emoji: '📱', minValue: 3, maxValue: 5 },
  { id: 'tangled_net', name: 'Tangled Fishing Net', color: '#9a9a7a', emoji: '🕸️', minValue: 2, maxValue: 3 },
];

export const TREASURE_ITEMS = [
  { id: 'copper_ring', name: 'Copper Ring', color: '#b87333', emoji: '💍', rarity: 'common', minValue: 15, maxValue: 35 },
  { id: 'sea_glass', name: 'Polished Sea Glass', color: '#7ac9c9', emoji: '🔷', rarity: 'common', minValue: 10, maxValue: 25 },
  { id: 'silver_locket', name: 'Silver Locket', color: '#c0c0c0', emoji: '📿', rarity: 'uncommon', minValue: 50, maxValue: 90 },
  { id: 'ancient_coin', name: 'Ancient Coin', color: '#d4af37', emoji: '🪙', rarity: 'uncommon', minValue: 60, maxValue: 100 },
  { id: 'pearl_strand', name: 'Pearl Strand', color: '#f0e6d2', emoji: '🦪', rarity: 'rare', minValue: 150, maxValue: 250 },
  { id: 'jeweled_dagger', name: 'Jeweled Dagger Hilt', color: '#8a2a2a', emoji: '🗡️', rarity: 'rare', minValue: 200, maxValue: 300 },
  { id: 'golden_idol', name: 'Golden Idol', color: '#ffd700', emoji: '🏺', rarity: 'epic', minValue: 500, maxValue: 800 },
  { id: 'coin_case', name: 'Coin Case', color: '#f5c518', emoji: '🪙', rarity: 'uncommon', isCoinCase: true, minValue: 40, maxValue: 120 },
];

// Ultra-rare fish exclusively reachable through magnetic tackle. Location
// determines which one you can even roll for; the whale additionally needs
// the deep-sea permit on top of the boat permit that gets you into 'deep' at
// all - "the depths" being a step beyond just "the boat".
const ROBO_CHANCE = 0.006; // ~0.6% per tackle catch - "nearly impossible", not "impossible"

function rollRoboFish(location, permits) {
  if (location === 'rocks') return rollSpecificFish('robo_fish', location);
  if (location === 'deep') {
    if (permits?.deepwater && Math.random() < 0.35) return rollSpecificFish('robo_whale', location);
    return rollSpecificFish('robo_shark', location);
  }
  return null;
}

const TRASH_WEIGHT = 1;
const TREASURE_WEIGHTS = { common: 40, uncommon: 25, rare: 10, epic: 3 };

function rollFromList(list, weightFn) {
  const total = list.reduce((s, i) => s + weightFn(i), 0);
  let r = Math.random() * total;
  for (const item of list) {
    r -= weightFn(item);
    if (r <= 0) return item;
  }
  return list[list.length - 1];
}

function rollValue(item) {
  return Math.round(item.minValue + Math.random() * (item.maxValue - item.minValue));
}

function makeCaught(item, kind) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    kind, // 'trash' | 'treasure'
    itemId: item.id,
    name: item.name,
    emoji: item.emoji || (kind === 'treasure' ? '💎' : '🗑️'),
    color: item.color,
    rarity: item.rarity || null,
    isCoinCase: Boolean(item.isCoinCase),
    value: rollValue(item),
    locked: false,
    caughtAt: Date.now(),
  };
}

export function rollTrash() {
  const item = rollFromList(TRASH_ITEMS, () => TRASH_WEIGHT);
  return makeCaught(item, 'trash');
}

export function rollTreasure() {
  const item = rollFromList(TREASURE_ITEMS, (i) => TREASURE_WEIGHTS[i.rarity] || 10);
  return makeCaught(item, 'treasure');
}

// Magnetic tackle: overwhelmingly trash/treasure (roughly 50/50), but with a
// tiny chance at the location-appropriate robo-fish instead. Returns
// { type: 'fish' | 'loot', item } so the caller can deposit it the right way
// - robo-fish are genuine fish (they go in the fish inventory/bank/dex, not
// the loot/treasure ones).
export function rollTackleCatch(location, permits) {
  if (Math.random() < ROBO_CHANCE) {
    const fish = rollRoboFish(location, permits);
    if (fish) return { type: 'fish', item: fish };
  }
  const item = Math.random() < 0.5 ? rollTrash() : rollTreasure();
  return { type: 'loot', item };
}

// Fishing completely empty-handed (no bait, no tackle): mostly junk, with a
// small chance at either a real fish or actual treasure. This exists purely
// as a way to claw back a little money if you're stuck with zero bait and
// zero currency - not a viable primary strategy.
export function rollEmptyHanded(rollFishFn, location) {
  const r = Math.random();
  if (r < 0.90) return { result: rollTrash(), type: 'trash' };
  if (r < 0.95) return { result: rollFishFn(location), type: 'fish' };
  return { result: rollTreasure(), type: 'treasure' };
}
