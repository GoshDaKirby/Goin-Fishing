import { useState } from 'react';
import { X, Globe, Users, LogOut, MapPin, Fish, Pencil, Check } from 'lucide-react';

export default function MultiplayerPanel({ multiplayer, onClose }) {
  const { nickname, setNickname, worldCode, otherPlayers, inWorld, loading, enterWorld, leaveWorld, isSupabaseConfigured } = multiplayer;
  const [codeInput, setCodeInput] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(nickname);

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
        {/* Nickname */}
        <div className="bg-white/10 rounded-xl p-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center text-purple-200 text-xs font-bold flex-shrink-0">
            {nickname[0]?.toUpperCase()}
          </div>
          {editingName ? (
            <>
              <input
                autoFocus
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                maxLength={16}
                className="flex-1 bg-black/30 text-white text-sm rounded-lg px-2 py-1 border border-white/10 outline-none focus:border-purple-400"
              />
              <button onClick={() => { setNickname(nameDraft); setEditingName(false); }} className="text-emerald-400 p-1"><Check size={16} /></button>
            </>
          ) : (
            <>
              <span className="text-white text-sm font-medium flex-1">{nickname}</span>
              <button onClick={() => { setNameDraft(nickname); setEditingName(true); }} className="text-white/40 hover:text-white p-1"><Pencil size={14} /></button>
            </>
          )}
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
                  <span className="text-white text-sm font-medium flex-1">{nickname}</span>
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
            <button
              onClick={() => enterWorld(codeInput || 'lobby')}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {loading ? 'Connecting...' : 'Enter World'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
