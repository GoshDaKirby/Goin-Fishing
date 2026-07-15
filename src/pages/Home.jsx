import { useState, useEffect, useCallback } from 'react';
import { Package, ShoppingBag, Banknote, BookOpen, Zap, Waves, Coins, Worm, Globe } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useMultiplayer } from '@/game/useMultiplayer';
import MultiplayerPanel from '@/components/game/MultiplayerPanel';
import { useGameState } from '@/game/useGameState';
import { RODS, getMuseumIncome } from '@/game/gameConfig';
import OceanScene from '@/components/game/OceanScene';
import AquariumScene from '@/components/game/AquariumScene';
import TopBar from '@/components/game/TopBar';
import CaughtInventory from '@/components/game/CaughtInventory';
import Shop from '@/components/game/Shop';
import FishBank from '@/components/game/FishBank';
import Encyclopedia from '@/components/game/Encyclopedia';
import CageTraps from '@/components/game/CageTraps';

export default function Home() {
  const { state, actions } = useGameState();
  const { user } = useAuth();
  const multiplayer = useMultiplayer(user);
  const [view, setView] = useState('fishing');
  const [activePanel, setActivePanel] = useState(null);
  const [catchFlash, setCatchFlash] = useState(null);
  const [incomeFlash, setIncomeFlash] = useState(null);

  // Location change listener
  useEffect(() => {
    const handler = (e) => actions.setLocation(e.detail);
    document.addEventListener('setLocation', handler);
    return () => document.removeEventListener('setLocation', handler);
  }, [actions]);

  // Catch flash notification
  useEffect(() => {
    if (state.lastCatchTime && state.lastCatchTime > 0) {
      const fish = state.caughtInventory[state.caughtInventory.length - 1];
      if (fish) {
        setCatchFlash(fish);
        const timer = setTimeout(() => setCatchFlash(null), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [state.lastCatchTime]);

  // Museum income flash
  useEffect(() => {
    if (state.lastMuseumPayout && state.lastMuseumPayout > 0 && state.lastMuseumIncome > 0) {
      setIncomeFlash(state.lastMuseumIncome);
      const timer = setTimeout(() => setIncomeFlash(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.lastMuseumPayout]);

  const rod = RODS[state.rodTier];
  const fishingActive = state.bait > 0 && state.caughtInventory.length < rod.inventoryCap;
  const navItems = [
    { id: 'inventory', icon: Package, label: 'Catch', badge: state.caughtInventory.length },
    { id: 'shop', icon: ShoppingBag, label: 'Shop' },
    { id: 'traps', icon: Zap, label: 'Traps', badge: state.cageTraps.filter(t => t.status === 'caught').length },
    { id: 'encyclopedia', icon: BookOpen, label: 'Dex' },
  ];

  // Multiplayer presence
  const playersInView = multiplayer.otherPlayers.filter(p => p.location === state.location);
  const { updatePresence } = multiplayer;

  const handleCharacterPlaced = useCallback((x, z, rot) => {
    updatePresence({ character_x: x, character_z: z, character_rot: rot });
  }, [updatePresence]);

  useEffect(() => {
    updatePresence({ is_fishing: fishingActive });
  }, [fishingActive, updatePresence]);

  useEffect(() => {
    updatePresence({ location: state.location });
  }, [state.location, updatePresence]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900 select-none">
      {/* 3D Scene */}
      {view === 'fishing' ? (
        <OceanScene location={state.location} fishingActive={fishingActive} otherPlayers={playersInView} onCharacterPlaced={handleCharacterPlaced} />
      ) : (
        <AquariumScene fish={state.fishBank} hasMuseum={state.hasMuseum} museumTier={state.museumTier} />
      )}

      {/* Top Bar */}
      <TopBar state={state} view={view} setView={setView} setActivePanel={setActivePanel} />

      {view === 'fishing' && (
        <button
          onClick={() => setActivePanel(activePanel === 'multiplayer' ? null : 'multiplayer')}
          className={`absolute top-3 right-3 z-10 rounded-full px-3 py-1.5 text-xs font-medium border backdrop-blur-md transition-all flex items-center gap-1.5 ${
            activePanel === 'multiplayer'
              ? 'bg-purple-500/80 text-white border-white/20'
              : multiplayer.inWorld
                ? 'bg-emerald-500/30 text-emerald-200 border-emerald-500/30'
                : 'bg-black/40 text-white/60 border-white/10 hover:text-white'
          }`}
        >
          <Globe size={12} />
          {multiplayer.inWorld ? `${multiplayer.otherPlayers.length + 1} online` : 'World'}
        </button>
      )}

      {/* Catch Flash */}
      {catchFlash && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full" style={{ backgroundColor: catchFlash.color, border: `1px solid ${catchFlash.color}` }} />
            <span className="text-white text-sm font-medium">Caught a {catchFlash.variantName} {catchFlash.speciesName}!</span>
            <span className="text-amber-300 text-xs">+{catchFlash.value}</span>
          </div>
        </div>
      )}

      {/* Income Flash */}
      {incomeFlash && (
        <div className="absolute top-20 right-4 z-20 bg-amber-500/80 backdrop-blur-md rounded-full px-4 py-2 animate-in fade-in slide-in-from-right duration-300">
          <div className="flex items-center gap-1.5">
            <Coins size={14} className="text-white" />
            <span className="text-white text-sm font-semibold">+{incomeFlash}</span>
            <span className="text-white/70 text-xs">museum income</span>
          </div>
        </div>
      )}

      {/* Fishing Status */}
      {view === 'fishing' && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
          {!fishingActive && (
            <div className="bg-red-500/80 backdrop-blur-md rounded-full px-4 py-1.5 text-white text-xs font-medium flex items-center gap-1.5">
              {state.bait === 0 ? <><Worm size={12} /> Out of bait!</> : <><Package size={12} /> Inventory full!</>}
            </div>
          )}
          {fishingActive && (
            <div className="bg-black/30 backdrop-blur-md rounded-full px-4 py-1.5 text-white/70 text-xs font-medium flex items-center gap-1.5">
              <Waves size={12} className="animate-pulse" /> Fishing...
            </div>
          )}
        </div>
      )}

      {/* Bank view label */}
      {view === 'bank' && (
        <>
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-black/30 backdrop-blur-md rounded-full px-4 py-1.5 text-white/70 text-xs font-medium">
              {state.hasMuseum ? '🐟 Fish Museum' : '🐠 Fish Bank'}
            </div>
          </div>
          {!activePanel && (
            <button
              onClick={() => setActivePanel('bank')}
              className="absolute top-14 right-4 z-10 bg-black/40 backdrop-blur-md rounded-full px-4 py-2 text-white text-sm font-medium border border-white/10 hover:bg-black/60 transition-colors flex items-center gap-1.5"
            >
              <Banknote size={14} /> Manage
            </button>
          )}
        </>
      )}

      {/* Active Panel */}
      {activePanel === 'inventory' && <CaughtInventory state={state} actions={actions} onClose={() => setActivePanel(null)} />}
      {activePanel === 'shop' && <Shop state={state} actions={actions} onClose={() => setActivePanel(null)} />}
      {activePanel === 'bank' && <FishBank state={state} actions={actions} onClose={() => setActivePanel(null)} />}
      {activePanel === 'encyclopedia' && <Encyclopedia state={state} onClose={() => setActivePanel(null)} />}
      {activePanel === 'traps' && <CageTraps state={state} actions={actions} onClose={() => setActivePanel(null)} />}
      {activePanel === 'multiplayer' && <MultiplayerPanel multiplayer={multiplayer} user={user} onClose={() => setActivePanel(null)} />}

      {/* Bottom Nav */}
      <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-3 pt-2 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-center gap-2 max-w-lg mx-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActivePanel(activePanel === item.id ? null : item.id)}
                className={`relative flex flex-col items-center gap-0.5 px-3 sm:px-4 py-2 rounded-xl transition-all ${
                  activePanel === item.id
                    ? 'bg-cyan-500/80 text-white'
                    : 'bg-black/40 backdrop-blur-md text-white/60 hover:text-white border border-white/5'
                }`}
              >
                <Icon size={18} />
                <span className="text-[10px] font-medium">{item.label}</span>
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-400 text-amber-900 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <button
            onClick={() => setView(view === 'fishing' ? 'bank' : 'fishing')}
            className={`flex flex-col items-center gap-0.5 px-3 sm:px-4 py-2 rounded-xl transition-all ${
              view === 'bank'
                ? 'bg-cyan-500/80 text-white'
                : 'bg-black/40 backdrop-blur-md text-white/60 hover:text-white border border-white/5'
            }`}
          >
            {view === 'fishing' ? <Banknote size={18} /> : <Waves size={18} />}
            <span className="text-[10px] font-medium">{view === 'fishing' ? 'Bank' : 'Fish'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}