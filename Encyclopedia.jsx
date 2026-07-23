import { useState, useEffect } from 'react';
import { X, Globe, Users, LogOut, MapPin, Fish, RefreshCw } from 'lucide-react';

export default function MultiplayerPanel({ multiplayer, characterName, onClose }) {
  const {
    worldCode, otherPlayers, inWorld, loading, enterWorld, leaveWorld,
    publicWorlds, publicWorldsLoading, listPublicWorlds, isSupabaseConfigured,
  } = multiplayer;
  const [codeInput, setCodeInput] = useState('');
  const [makePublic, setMakePublic] = useState(false);

  useEffect(() => {
    if (!inWorld && isSupabaseConfigured) listPublicWorlds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inWorld]);

  if (!isSupabaseConfigured) {
    return (
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0d3d4a]/95 backdrop-blur-md border-l border-white/10 z-30 overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="sticky top-0 bg-[#0d3d4a]/95 backdrop-blur-md px-4 py-3 border-b border-white/10 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-purple-400" />
            <h2 className="text-lg font-semibold text-white">Multiplayer</h2>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1"><X size={20} /></button>
        </div>
        <div className="p-8 text-center text-white/50 text-sm">
          Multiplayer isn't set up yet on this deployment. It needs a Supabase project connected (see the setup notes).
        </div>
      </div>
    );
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0d3d4a]/95 backdrop-blur-md border-l border-white/10 z-30 overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 bg-[#0d3d4a]/95 backdrop-blur-md px-4 py-3 border-b border-white/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-purple-400" />
          <h2 className="text-lg font-semibold text-white">Multiplayer</h2>
          {inWorld && <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-medium">Live</span>}
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white p-1"><X size={20} /></button>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white/10 rounded-xl p-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-200 text-xs font-bold flex-shrink-0">
            {characterName[0]?.toUpperCase()}
          </div>
          <span className="text-white text-sm font-medium flex-1">{characterName}</span>
          <span className="text-white/30 text-[10px]">Edit in Character</span>
        </div>

        {inWorld ? (
          <>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Globe size={16} className="text-cyan-400" />
                <span className="text-white font-semibold">World: {worldCode}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-emerald-300">
                <Users size={14} />
                <span className="text-sm font-semibold">{otherPlayers.length + 1}</span>
                <span className="text-white/40 text-xs">player(s) online</span>
              </div>
              <p className="text-white/40 text-xs mt-1">Share this world code with friends so they can join you.</p>
            </div>

            <div>
              <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Players in World</h3>
              <div className="space-y-2">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2.5 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-200 text-xs font-bold">You</div>
                  <span className="text-white text-sm font-medium flex-1">{characterName}</span>
                </div>
                {otherPlayers.map(p => (
                  <div key={p.id} className="bg-white/10 rounded-lg p-2.5 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-cyan-500/30 flex items-center justify-center text-cyan-200 text-xs font-bold">
                      {(p.player_name || '?')[0]?.toUpperCase()}
                    </div>
                    <span className="text-white text-sm font-medium flex-1">{p.player_name}</span>
                    <div className="flex items-center gap-1">
                      <MapPin size={10} className="text-white/30" />
                      <span className="text-white/40 text-xs capitalize">{p.location}</span>
                      {p.is_fishing && <Fish size={10} className="text-cyan-400" />}
                    </div>
                  </div>
                ))}
                {otherPlayers.length === 0 && (
                  <div className="text-center py-4 text-white/30 text-xs">No other players online. Share your world code to invite friends!</div>
                )}
              </div>
            </div>

            <button
              onClick={leaveWorld}
              disabled={loading}
              className="w-full bg-red-600/80 hover:bg-red-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut size={14} /> Leave World
            </button>
          </>
        ) : (
          <>
            <div className="bg-white/10 rounded-xl p-4 space-y-3">
              <h3 className="text-white font-semibold text-sm">Join or Host a World</h3>
              <p className="text-white/50 text-xs">Type any world code. If nobody's using it yet, you're the host - if a friend already made it, you'll join them.</p>
              <input
                type="text"
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
                placeholder="e.g. sunset-cove"
                className="w-full bg-black/30 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:border-purple-400 outline-none"
              />
              <label className="flex items-center gap-2 text-xs text-white/60">
                <input type="checkbox" checked={makePublic} onChange={e => setMakePublic(e.target.checked)} className="accent-purple-500" />
                Make this world public (shows up in the list below for anyone to join)
              </label>
              <button
                onClick={() => enterWorld(codeInput || 'lobby', { isPublic: makePublic })}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                {loading ? 'Connecting...' : 'Enter World'}
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Public Worlds</h3>
                <button onClick={listPublicWorlds} className="text-white/40 hover:text-white p-1"><RefreshCw size={12} className={publicWorldsLoading ? 'animate-spin' : ''} /></button>
              </div>
              {publicWorlds.length === 0 ? (
                <div className="text-center py-4 text-white/30 text-xs">No public worlds active right now. Be the first to host one!</div>
              ) : (
                <div className="space-y-2">
                  {publicWorlds.map(w => (
                    <div key={w.code} className="bg-white/10 rounded-lg p-2.5 flex items-center gap-2">
                      <Globe size={14} className="text-cyan-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-white text-sm font-medium truncate">{w.code}</div>
                        <div className="text-white/40 text-[10px]">Hosted by {w.host_name || 'Angler'}</div>
                      </div>
                      <button
                        onClick={() => enterWorld(w.code, { isPublic: true })}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
