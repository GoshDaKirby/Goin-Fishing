import { useEffect, useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { MINIGAME_BASE, MINIGAME_RARITY, MINIGAME_ITEMS } from '@/game/gameConfig';
import { sfx } from '@/lib/soundEffects';

// A Stardew-Valley-style "keep the fish in the zone" minigame. The green
// catch-zone is player-controlled (mouse / arrow keys / touch-drag); the
// fish wanders on its own, calmer for common fish and increasingly erratic
// for rarer ones. Filling the meter catches the fish; letting it drain to
// zero loses it.
export default function FishingMinigame({ fish, minigameItems, onResolve, onUncast }) {
  const containerRef = useRef(null);
  const zonePosRef = useRef({ x: 0, y: 0 });
  const fishPosRef = useRef({ x: 0, y: 0 });
  const fishVelRef = useRef({ x: 0, y: 0 });
  const meterRef = useRef(50);
  const elapsedRef = useRef(0);
  const nextDirChangeRef = useRef(0);
  const resolvedRef = useRef(false);
  const keysRef = useRef({});
  const countdownClearedRef = useRef(false);

  const [meterDisplay, setMeterDisplay] = useState(50);
  const [zoneDisplay, setZoneDisplay] = useState({ x: 0, y: 0 });
  const [fishDisplay, setFishDisplay] = useState({ x: 0, y: 0 });
  const [countdownDisplay, setCountdownDisplay] = useState(Math.ceil(MINIGAME_BASE.countdown / 1000));

  const rarity = fish?.rarity || 'common';
  const rarityCfg = MINIGAME_RARITY[rarity] || MINIGAME_RARITY.common;

  const bigZoneTier = minigameItems?.bigZone || 0;
  const calmingTier = minigameItems?.calmingBait || 0;
  const boundsTier = minigameItems?.tightBounds || 0;
  const zoneBonus = bigZoneTier > 0 ? MINIGAME_ITEMS.bigZone.tiers[bigZoneTier - 1].zoneBonus : 0;
  const speedMult = calmingTier > 0 ? MINIGAME_ITEMS.calmingBait.tiers[calmingTier - 1].speedMult : 1;
  const boundsMult = boundsTier > 0 ? MINIGAME_ITEMS.tightBounds.tiers[boundsTier - 1].boundsMult : 1;

  const zoneRadius = (MINIGAME_BASE.zoneSize / 2) * (1 + zoneBonus);
  const bounds = MINIGAME_BASE.boundsSize * boundsMult;
  const half = bounds / 2;

  const resolve = useCallback((success) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    if (success) sfx.success(); else sfx.fail();
    onResolve(success);
  }, [onResolve]);

  useEffect(() => {
    sfx.bite();
    zonePosRef.current = { x: 0, y: 0 };
    fishPosRef.current = { x: (Math.random() - 0.5) * bounds * 0.6, y: (Math.random() - 0.5) * bounds * 0.6 };
    const angle0 = Math.random() * Math.PI * 2;
    fishVelRef.current = { x: Math.cos(angle0), y: Math.sin(angle0) };
    meterRef.current = 50;
    elapsedRef.current = 0;
    nextDirChangeRef.current = 0;
    resolvedRef.current = false;
    countdownClearedRef.current = false;
    setMeterDisplay(50);
    setCountdownDisplay(Math.ceil(MINIGAME_BASE.countdown / 1000));

    const handleKeyDown = (e) => { keysRef.current[e.key] = true; };
    const handleKeyUp = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const handlePointer = (clientX, clientY) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const x = Math.max(-half, Math.min(half, clientX - cx));
      const y = Math.max(-half, Math.min(half, clientY - cy));
      zonePosRef.current = { x, y };
    };
    const handleMouseMove = (e) => handlePointer(e.clientX, e.clientY);
    const handleTouchMove = (e) => {
      if (e.touches[0]) handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      e.preventDefault();
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    let animId;
    let lastT = performance.now();
    let tickAcc = 0;

    const step = (now) => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      elapsedRef.current += dt * 1000;
      tickAcc += dt;

      const gameElapsed = elapsedRef.current - MINIGAME_BASE.countdown;
      const inCountdown = gameElapsed < 0;
      if (!inCountdown && countdownClearedRef.current === false) {
        countdownClearedRef.current = true;
        setCountdownDisplay(0);
      }

      // Keyboard movement for the zone - allowed even during the countdown
      // so the player can get positioned before things start moving.
      const arrowSpeed = 220;
      let kx = 0, ky = 0;
      if (keysRef.current['ArrowLeft'] || keysRef.current['a'] || keysRef.current['A']) kx -= 1;
      if (keysRef.current['ArrowRight'] || keysRef.current['d'] || keysRef.current['D']) kx += 1;
      if (keysRef.current['ArrowUp'] || keysRef.current['w'] || keysRef.current['W']) ky -= 1;
      if (keysRef.current['ArrowDown'] || keysRef.current['s'] || keysRef.current['S']) ky += 1;
      if (kx !== 0 || ky !== 0) {
        const z = zonePosRef.current;
        zonePosRef.current = {
          x: Math.max(-half, Math.min(half, z.x + kx * arrowSpeed * dt)),
          y: Math.max(-half, Math.min(half, z.y + ky * arrowSpeed * dt)),
        };
      }

      if (inCountdown) {
        const secsLeft = Math.ceil(-gameElapsed / 1000);
        if (tickAcc >= 0.05) {
          tickAcc = 0;
          setCountdownDisplay(secsLeft);
          setZoneDisplay({ ...zonePosRef.current });
          setFishDisplay({ ...fishPosRef.current });
        }
        animId = requestAnimationFrame(step);
        return;
      }

      // Fish wandering movement
      if (gameElapsed >= nextDirChangeRef.current) {
        const angle = Math.random() * Math.PI * 2;
        const jitterMag = rarityCfg.jitter;
        fishVelRef.current = {
          x: fishVelRef.current.x * (1 - jitterMag) + Math.cos(angle) * jitterMag,
          y: fishVelRef.current.y * (1 - jitterMag) + Math.sin(angle) * jitterMag,
        };
        nextDirChangeRef.current = gameElapsed + rarityCfg.directionChangeMs * (0.6 + Math.random() * 0.8);
      }
      const speed = rarityCfg.speed * speedMult;
      const fp = fishPosRef.current;
      const fv = fishVelRef.current;
      const mag = Math.hypot(fv.x, fv.y) || 1;
      let nx = fp.x + (fv.x / mag) * speed * dt;
      let ny = fp.y + (fv.y / mag) * speed * dt;
      if (nx > half) { nx = half; fishVelRef.current = { ...fv, x: -Math.abs(fv.x) }; }
      if (nx < -half) { nx = -half; fishVelRef.current = { ...fv, x: Math.abs(fv.x) }; }
      if (ny > half) { ny = half; fishVelRef.current = { ...fv, y: -Math.abs(fv.y) }; }
      if (ny < -half) { ny = -half; fishVelRef.current = { ...fv, y: Math.abs(fv.y) }; }
      fishPosRef.current = { x: nx, y: ny };

      // Meter fill/drain - both ramp from slow to fast over the attempt's
      // duration (forgiving at first, noticeably quicker near the end).
      const dist = Math.hypot(fishPosRef.current.x - zonePosRef.current.x, fishPosRef.current.y - zonePosRef.current.y);
      const inside = dist <= zoneRadius;
      const progress = Math.min(1, gameElapsed / MINIGAME_BASE.duration);
      const currentFillRate = MINIGAME_BASE.fillRateStart + (MINIGAME_BASE.fillRateEnd - MINIGAME_BASE.fillRateStart) * progress;
      const currentDrainRate = MINIGAME_BASE.drainRateStart + (MINIGAME_BASE.drainRateEnd - MINIGAME_BASE.drainRateStart) * progress;
      meterRef.current = Math.max(0, Math.min(100, meterRef.current + (inside ? currentFillRate : -currentDrainRate) * dt * 100));

      // Throttle React state updates to ~20fps for perf
      if (tickAcc >= 0.05) {
        tickAcc = 0;
        setMeterDisplay(meterRef.current);
        setZoneDisplay({ ...zonePosRef.current });
        setFishDisplay({ ...fishPosRef.current });
      }

      if (meterRef.current >= 100) { resolve(true); return; }
      if (meterRef.current <= 0) { resolve(false); return; }
      if (gameElapsed >= MINIGAME_BASE.duration && meterRef.current < 100) {
        // Time's up - resolved by however full the meter is at that point.
        resolve(meterRef.current >= 50);
        return;
      }

      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fish?.id]);

  const meterColor = meterDisplay > 66 ? '#4ade80' : meterDisplay > 33 ? '#fbbf24' : '#f87171';

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 bg-black/50 rounded-full px-4 py-1.5 border border-white/10">
          <span className="text-white text-sm font-medium">Something's biting!</span>
          <span className="text-white/50 text-xs capitalize">({rarity})</span>
        </div>

        <div
          ref={containerRef}
          className="relative bg-cyan-950/60 border-2 border-cyan-300/30 rounded-2xl touch-none select-none"
          style={{ width: bounds, height: bounds }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {/* Fish */}
          <div
            className="absolute text-2xl transition-none"
            style={{
              left: `calc(50% + ${fishDisplay.x}px)`,
              top: `calc(50% + ${fishDisplay.y}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            🐟
          </div>

          {countdownDisplay > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl z-10">
              <span className="text-white text-4xl font-bold drop-shadow-lg animate-pulse">{countdownDisplay}</span>
            </div>
          )}

          {/* Catch zone */}
          <div
            className="absolute rounded-full border-2 border-emerald-400 bg-emerald-400/20 pointer-events-none"
            style={{
              width: zoneRadius * 2,
              height: zoneRadius * 2,
              left: `calc(50% + ${zoneDisplay.x}px)`,
              top: `calc(50% + ${zoneDisplay.y}px)`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>

        {/* Meter */}
        <div className="w-full max-w-[260px] bg-white/10 rounded-full h-3 overflow-hidden border border-white/10">
          <div className="h-full rounded-full transition-all" style={{ width: `${meterDisplay}%`, backgroundColor: meterColor }} />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-white/50 text-xs">Move the green zone over the fish to fill the meter</span>
          <button
            onClick={onUncast}
            className="flex items-center gap-1 bg-red-600/70 hover:bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
          >
            <X size={12} /> Give up
          </button>
        </div>
      </div>
    </div>
  );
}
