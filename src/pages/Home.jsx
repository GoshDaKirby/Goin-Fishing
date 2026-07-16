import { useState, useEffect, useCallback } from 'react';
import { Package, ShoppingBag, Banknote, BookOpen, Zap, Waves, Coins, Worm, Globe, UserCircle2, X, Fish } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useMultiplayer } from '@/game/useMultiplayer';
import { useCloudSave } from '@/game/useCloudSave';
import MultiplayerPanel from '@/components/game/MultiplayerPanel';
import ChatPanel from '@/components/game/ChatPanel';
import AccountPanel from '@/components/game/AccountPanel';
import FishingMinigame from '@/components/game/FishingMinigame';
import { useGameState } from '@/game/useGameState';
import { RODS } from '@/game/gameConfig';
import { sfx } from '@/lib/soundEffects';
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
  const auth = useAuth();
  const cloudSave = useCloudSave(auth.user, state, actions);
  const multiplayer = useMultiplayer();
  const [view, setView] = useState('fishing');
  const [activePanel, setActivePanel] = useState(null);
  const [catchFlash, setCatchFlash] = useState(null);
  const [incomeFlash, setIncomeFlash] = useState(null);
  const [chatBubbles, setChatBubbles] = useState({});

  // Location change listener
  useEffect(() => {
    const handler = (e) => actions.setLocation(e.detail);
    document.addEventListener('setLocation', handler);
    return () => document.removeEventListener('setLocation', handler);
  }, [actions]);

  // Catch flash notification - driven directly off the fish that was just
  // caught (or null on a failed catch), never inferred from array contents.
  useEffect(() => {
    if (state.lastCatchTime && state.lastCatchTime > 0) {
      if (state.lastCaughtFish) {
        setCatchFlash({ fish: state.lastCaughtFish, failed: false });
        sfx.tick();
      } else {
        setCatchFlash({ fish: null, failed: true });
      }
      const timer = setTimeout(() => setCatchFlash(null), 3000);
      return () => clearTimeout(timer);
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

  // Play a bite sound the instant a cast turns into a bite.
  useEffect(() => {
    if (state.castPhase === 'biting') sfx.bite();
  }, [state.castPhase]);

  const rod = RODS[state.rodTier];
  const inventoryFull = state.caughtInventory.length >= rod.inventoryCap;
  const canCast = state.bait > 0 && !inventoryFull && state.castPhase === 'idle' && !(state.autoFishUnlocked && state.autoFishEnabled);
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
    updatePresence({ is_fishing: state.castPhase !== 'idle' });
  }, [state.castPhase, updatePresence]);

  useEffect(() => {
    updatePresence({ location: state.location });
  }, [state.location, updatePresence]);

  // Show a brief speech-bubble above whoever just spoke (replaced instantly
  // if they send another message before the previous one expires).
  useEffect(() => {
    if (multiplayer.chatMessages.length === 0) return;
    const last = multiplayer.chatMessages[multiplayer.chatMessages.length - 1];
    if (!last.senderId) return;
    setChatBubbles(prev => ({ ...prev, [last.senderId]: { text: last.text, expiresAt: Date.now() + 4500 } }));
  }, [multiplayer.chatMessages]);

  // Keep our own fish bank/museum info available for other players who want
  // to browse it (read-only - inventory is never shared).
  const { updateOwnBank } = multiplayer;
  useEffect(() => {
    updateOwnBank({ nickname: multiplayer.nickname, fishBank: state.fishBank, hasMuseum: state.hasMuseum, museumTier: state.museumTier });
  }, [state.fishBank, state.hasMuseum, state.museumTier, multiplayer.nickname, updateOwnBank]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-900 select-none">
      {/* 3D Scene */}
      {view === 'fishing' ? (
        <OceanScene location={state.location} castPhase={state.castPhase} otherPlayers={playersInView} onCharacterPlaced={handleCharacterPlaced} nickname={multiplayer.nickname} myId={multiplayer.myId} chatBubbles={chatBubbles} />
      ) : (
        <AquariumScene fish={state.fishBank} hasMuseum={state.hasMuseum} museumTier={state.museumTier} />
      )}

      {/* Top Bar */}
      <TopBar state={state} view={view} setView={setView} setActivePanel={setActivePanel} />

      {view === 'fishing' && (
        <div className="absolute top-3 right-3 z-10 flex gap-1.5">
          <button
            onClick={() => setActivePanel(activePanel === 'account' ? null : 'account')}
            className={`rounded-full p-1.5 border backdrop-blur-md transition-all ${
              activePanel === 'account' ? 'bg-cyan-500/80 text-white border-white/20' : 'bg-black/40 text-white/60 border-white/10 hover:text-white'
            }`}
            title="Account & Cloud Save"
          >
            <UserCircle2 size={14} />
          </button>
          <button
            onClick={() => setActivePanel(activePanel === 'multiplayer' ? null : 'multiplayer')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border backdrop-blur-md transition-all flex items-center gap-1.5 ${
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
        </div>
      )}

      {/* Fishing minigame overlay */}
      {view === 'fishing' && state.castPhase === 'biting' && state.currentCatchFish && (
        <FishingMinigame
          fish={state.currentCatchFish}
          minigameItems={state.minigameItems}
          onResolve={actions.resolveCatch}
          onUncast={actions.uncast}
        />
      )}

      {/* Catch Flash */}
      {catchFlash && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-md rounded-full px-4 py-2 border border-white/10 animate-in fade-in slide-in-from-top duration-300">
          {catchFlash.failed ? (
            <span className="text-white/70 text-sm font-medium">The fish got away...</span>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: catchFlash.fish.color, border: `1px solid ${catchFlash.fish.color}` }} />
              <span className="text-white text-sm font-medium">Caught a {catchFlash.fish.variantName} {catchFlash.fish.speciesName}!</span>
              <span className="text-amber-300 text-xs">+{catchFlash.fish.value}</span>
            </div>
          )}
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

      {/* Fishing Status / Cast controls */}
      {view === 'fishing' && !(state.autoFishUnlocked && state.autoFishEnabled) && (
        <div className="absolute bottom-28 sm:bottom-20 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
          {state.castPhase === 'idle' && (
            <>
              {!canCast && (
                <div className="bg-red-500/80 backdrop-blur-md rounded-full px-4 py-1.5 text-white text-xs font-medium flex items-center gap-1.5">
                  {state.bait === 0 ? <><Worm size={12} /> Out of bait!</> : <><Package size={12} /> Inventory full!</>}
                </div>
              )}
              <button
                onClick={() => { actions.cast(); sfx.cast(); }}
                disabled={!canCast}
                className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${
                  canCast ? 'bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg' : 'bg-white/10 text-white/30'
                }`}
              >
                <Fish size={16} /> Cast Line
              </button>
            </>
          )}
          {state.castPhase === 'waiting' && (
            <div className="flex flex-col items-center gap-2">
              <div className="bg-black/40 backdrop-blur-md rounded-full px-4 py-1.5 text-white/80 text-xs font-medium flex items-center gap-1.5">
                <Waves size={12} className="animate-pulse" /> Waiting for a bite...
              </div>
              <button
                onClick={actions.uncast}
                className="flex items-center gap-1.5 bg-red-600/70 hover:bg-red-500 text-white text-xs font-medium px-4 py-1.5 rounded-full transition-colors"
              >
                <X size={12} /> Uncast
              </button>
            </div>
          )}
        </div>
      )}
      {view === 'fishing' && state.autoFishUnlocked && state.autoFishEnabled && (
        <div className="absolute bottom-28 sm:bottom-20 left-1/2 -translate-x-1/2 z-10">
          <div className="bg-emerald-600/70 backdrop-blur-md rounded-full px-4 py-1.5 text-white text-xs font-medium flex items-center gap-1.5">
            <Waves size={12} className="animate-pulse" /> Auto-fishing...
          </div>
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
      {activePanel === 'bank' && <FishBank state={state} actions={actions} multiplayer={multiplayer} onClose={() => setActivePanel(null)} />}
      {activePanel === 'encyclopedia' && <Encyclopedia state={state} onClose={() => setActivePanel(null)} />}
      {activePanel === 'traps' && <CageTraps state={state} actions={actions} onClose={() => setActivePanel(null)} />}
      {activePanel === 'multiplayer' && <MultiplayerPanel multiplayer={multiplayer} onClose={() => setActivePanel(null)} />}
      {activePanel === 'account' && <AccountPanel auth={auth} cloudSave={cloudSave} onClose={() => setActivePanel(null)} />}

      {/* Chat */}
      {view === 'fishing' && <ChatPanel multiplayer={multiplayer} />}

      {/* Bottom Nav (left side on mobile so it's reachable and not covered by browser chrome; bottom bar on larger screens) */}
      <div className="fixed left-2 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 sm:absolute sm:left-0 sm:right-0 sm:bottom-0 sm:top-auto sm:translate-y-0 sm:flex-row sm:items-center sm:justify-center sm:gap-2 sm:px-3 sm:pb-3 sm:pt-2 sm:bg-gradient-to-t sm:from-black/60 sm:to-transparent">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-2 sm:max-w-lg sm:mx-auto">
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
