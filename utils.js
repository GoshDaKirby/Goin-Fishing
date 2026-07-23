export const TRASH_ITEMS = [
  { id: 'old_boot', name: 'Old Boot', color: '#6b4a2a', minValue: 1, maxValue: 2 },
  { id: 'tin_can', name: 'Rusty Tin Can', color: '#8a8a8a', minValue: 1, maxValue: 2 },
  { id: 'seaweed_clump', name: 'Seaweed Clump', color: '#3a6b3a', minValue: 1, maxValue: 3 },
  { id: 'broken_bottle', name: 'Broken Bottle', color: '#4a8a6a', minValue: 2, maxValue: 4 },
  { id: 'waterlogged_phone', name: 'Waterlogged Phone', color: '#2a2a2a', minValue: 3, maxValue: 5 },
  { id: 'tangled_net', name: 'Tangled Fishing Net', color: '#9a9a7a', minValue: 2, maxValue: 3 },
];

export const TREASURE_ITEMS = [
  { id: 'copper_ring', name: 'Copper Ring', color: '#b87333', rarity: 'common', minValue: 15, maxValue: 35 },
  { id: 'sea_glass', name: 'Polished Sea Glass', color: '#7ac9c9', rarity: 'common', minValue: 10, maxValue: 25 },
  { id: 'silver_locket', name: 'Silver Locket', color: '#c0c0c0', rarity: 'uncommon', minValue: 50, maxValue: 90 },
  { id: 'ancient_coin', name: 'Ancient Coin', color: '#d4af37', rarity: 'uncommon', minValue: 60, maxValue: 100 },
  { id: 'pearl_strand', name: 'Pearl Strand', color: '#f0e6d2', rarity: 'rare', minValue: 150, maxValue: 250 },
  { id: 'jeweled_dagger', name: 'Jeweled Dagger Hilt', color: '#8a2a2a', rarity: 'rare', minValue: 200, maxValue: 300 },
  { id: 'golden_idol', name: 'Golden Idol', color: '#ffd700', rarity: 'epic', minValue: 500, maxValue: 800 },
  { id: 'coin_case', name: 'Coin Case', color: '#f5c518', rarity: 'uncommon', isCoinCase: true, minValue: 40, maxValue: 120 },
];

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

// Magnetic tackle: roughly a 50/50 split between trash and treasure.
export function rollTackleCatch() {
  return Math.random() < 0.5 ? rollTrash() : rollTreasure();
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
