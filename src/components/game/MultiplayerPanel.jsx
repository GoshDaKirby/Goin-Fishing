const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect } from 'react';
import { X, Globe, Users, LogOut, Plus, RefreshCw, Fish, MapPin } from 'lucide-react';

export default function MultiplayerPanel({ multiplayer, user, onClose }) {
  const { currentWorld, otherPlayers, availableWorlds, inWorld, loading, refreshWorlds, hostWorld, joinWorld, leaveWorld } = multiplayer;
  const [worldName, setWorldName] = useState('');
  const [showHostForm, setShowHostForm] = useState(false);

  useEffect(() => {
    if (!inWorld) refreshWorlds();
  }, [inWorld, refreshWorlds]);

  const displayName = user?.full_name || user?.email || 'Player';

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

      {!user ? (
        <div className="p-8 text-center">
          <Users size={48} className="mx-auto mb-4 text-white/20" />
          <p className="text-white/60 text-sm mb-4">Log in to host or join multiplayer worlds.</p>
          <button
            onClick={() => db.auth.redirectToLogin(window.location.href)}
            className="bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium px-6 py-2 rounded-lg transition-colors"
          >
            Log In
          </button>
        </div>
      ) : inWorld ? (
        <div className="p-4 space-y-4">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe size={16} className="text-cyan-400" />
              <span className="text-white font-semibold">{currentWorld?.name}</span>
            </div>
            <div className="text-white/40 text-xs">Hosted by {currentWorld?.host_name}</div>
            <div className="flex items-center gap-1.5 mt-2 text-emerald-300">
              <Users size={14} />
              <span className="text-sm font-semibold">{otherPlayers.length + 1}</span>
              <span className="text-white/40 text-xs">player(s) online</span>
            </div>
          </div>

          <div>
            <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Players in World</h3>
            <div className="space-y-2">
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-2.5 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-200 text-xs font-bold">You</div>
                <span className="text-white text-sm font-medium flex-1">{displayName}</span>
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
                <div className="text-center py-4 text-white/30 text-xs">No other players online. Share your world name to invite friends!</div>
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
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {showHostForm ? (
            <div className="bg-white/10 rounded-xl p-4 space-y-3">
              <h3 className="text-white font-semibold text-sm">Host a New World</h3>
              <input
                type="text"
                value={worldName}
                onChange={e => setWorldName(e.target.value)}
                placeholder={`${displayName}'s World`}
                className="w-full bg-black/30 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:border-purple-400 outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { hostWorld(worldName || `${displayName}'s World`); setWorldName(''); setShowHostForm(false); }}
                  disabled={loading}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
                <button onClick={() => setShowHostForm(false)} className="px-4 bg-white/10 text-white/70 text-sm py-2 rounded-lg">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowHostForm(true)}
              className="w-full bg-purple-600/80 hover:bg-purple-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus size={14} /> Host a World
            </button>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Open Worlds</h3>
              <button onClick={refreshWorlds} className="text-white/40 hover:text-white transition-colors">
                <RefreshCw size={12} />
              </button>
            </div>
            {availableWorlds.length === 0 ? (
              <div className="text-center py-8 text-white/30 text-sm">
                <Globe size={36} className="mx-auto mb-2 opacity-30" />
                No active worlds. Host one to get started!
              </div>
            ) : (
              <div className="space-y-2">
                {availableWorlds.map(w => (
                  <div key={w.id} className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <div className="text-white text-sm font-medium">{w.name}</div>
                      <div className="flex items-center gap-1 text-white/40 text-xs">
                        <Users size={10} /> {w.player_count || 0} player(s) · by {w.host_name}
                      </div>
                    </div>
                    <button
                      onClick={() => joinWorld(w.id)}
                      disabled={loading}
                      className="bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Join
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}