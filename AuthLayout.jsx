import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { sfx } from '@/lib/soundEffects';

export default function ChatPanel({ multiplayer, characterName }) {
  const { inWorld, chatMessages, sendChatMessage } = multiplayer;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const listRef = useRef(null);
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    if (chatMessages.length > prevCountRef.current && !open) sfx.chat();
    prevCountRef.current = chatMessages.length;
  }, [chatMessages, open]);

  if (!inWorld) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    sendChatMessage(draft);
    setDraft('');
  };

  return (
    <div className="absolute bottom-20 left-3 z-20">
      {open ? (
        <div className="w-72 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 flex flex-col overflow-hidden" style={{ height: 260 }}>
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
            <span className="text-white text-xs font-semibold flex items-center gap-1.5"><MessageCircle size={13} /> World Chat</span>
            <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white"><X size={14} /></button>
          </div>
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
            {chatMessages.length === 0 && (
              <div className="text-white/30 text-xs text-center pt-8">No messages yet. Say hi!</div>
            )}
            {chatMessages.map(m => (
              <div key={m.id} className="text-xs">
                <span className={`font-semibold ${m.name === characterName ? 'text-cyan-300' : 'text-purple-300'}`}>{m.name}: </span>
                <span className="text-white/80 break-words">{m.text}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="flex items-center gap-1.5 p-2 border-t border-white/10">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              maxLength={200}
              placeholder="Message..."
              className="flex-1 bg-white/10 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none focus:bg-white/15 placeholder:text-white/30"
            />
            <button type="submit" className="text-cyan-300 hover:text-cyan-200 p-1.5"><Send size={14} /></button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-2 text-white/70 hover:text-white border border-white/10 transition-colors"
        >
          <MessageCircle size={14} />
          <span className="text-xs font-medium">Chat</span>
        </button>
      )}
    </div>
  );
}
