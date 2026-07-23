import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

const DEVICE_ID_KEY = 'goin-fishing-device-id';
const MAX_CHAT_MESSAGES = 60;
const PRESENCE_FLUSH_INTERVAL = 250; // ms - all pending presence changes get batched into one track() call at most this often
const PUBLIC_WORLD_ACTIVE_WINDOW_MIN = 3; // worlds not refreshed within this window drop off the public list

function randomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugifyWorld(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'world';
}

function getOrCreateDeviceId() {
  // Deliberately sessionStorage, not localStorage: this ID is used as the
  // Supabase Presence key for "who is this player". If it were shared across
  // browser tabs (as localStorage is), two tabs of the same browser testing
  // multiplayer together would both present the same key - each tab's
  // updates would look like "yourself" to the other and get filtered out of
  // the other-players list, which looks exactly like movement not
  // syncing (while chat, which isn't filtered by this ID, still works fine).
  // sessionStorage is per-tab, so each tab/window gets its own identity,
  // while still surviving a refresh of that same tab.
  try {
    let id = sessionStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = randomId();
      sessionStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch (e) {
    return randomId();
  }
}

// Multiplayer runs entirely on Supabase Realtime: player positions/nametags
// use "Presence" (ephemeral per-connection state on a channel, no database
// table needed for that part - players just disappear automatically when
// they disconnect), and chat uses "Broadcast" (fire-and-forget messages to
// everyone else on the same channel). No sign-in is required for any of
// this. A small "worlds" table (see SUPABASE_SETUP.md) is used only to let
// public worlds show up in a browsable list; private worlds never touch it.
export function useMultiplayer() {
  const [worldCode, setWorldCode] = useState(null);
  const [inWorld, setInWorld] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otherPlayers, setOtherPlayers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [viewedBank, setViewedBank] = useState(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [publicWorlds, setPublicWorlds] = useState([]);
  const [publicWorldsLoading, setPublicWorldsLoading] = useState(false);

  const channelRef = useRef(null);
  const myIdRef = useRef(getOrCreateDeviceId());
  const presenceDataRef = useRef({ player_name: '', location: 'shore', is_fishing: false, character_x: 0, character_z: 0, character_rot: 0, head_color: null, body_color: null });
  const bankDataRef = useRef({ nickname: '', fishBank: [], hasMuseum: false, museumTier: 1 });
  const isPublicRef = useRef(false);

  // Presence updates are batched: many callers (movement, is_fishing,
  // location, color changes) can all fire in the same instant, and each one
  // used to trigger its own immediate channel.track() call. That stacked up
  // fast enough to bump into Supabase's realtime rate limiting, which is
  // what was causing movement (and chat, sharing the same channel) to
  // visibly degrade over time. Now every change just merges into a pending
  // object, and a fixed-interval flush sends at most one track() call every
  // PRESENCE_FLUSH_INTERVAL ms, however many fields changed in between.
  const pendingDirtyRef = useRef(false);

  const flushPresence = useCallback(() => {
    if (!pendingDirtyRef.current || !channelRef.current) return;
    pendingDirtyRef.current = false;
    channelRef.current.track(presenceDataRef.current);
  }, []);

  const updateOwnBank = useCallback((payload) => {
    bankDataRef.current = { ...bankDataRef.current, ...payload };
  }, []);

  const syncOtherPlayers = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = channel.presenceState();
    const list = [];
    for (const key of Object.keys(state)) {
      if (key === myIdRef.current) continue;
      const entries = state[key];
      if (entries && entries[0]) list.push({ id: key, ...entries[0] });
    }
    setOtherPlayers(list);
  }, []);

  const leaveWorld = useCallback(async () => {
    const channel = channelRef.current;
    if (channel) {
      await channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    }
    isPublicRef.current = false;
    setInWorld(false);
    setWorldCode(null);
    setOtherPlayers([]);
    setChatMessages([]);
  }, []);

  const enterWorld = useCallback(async (rawCode, { isPublic = false } = {}) => {
    if (!isSupabaseConfigured) return;
    const code = slugifyWorld(rawCode || 'lobby');
    setLoading(true);
    if (channelRef.current) await leaveWorld();

    const channel = supabase.channel(`world:${code}`, {
      config: { presence: { key: myIdRef.current }, broadcast: { self: true }, private: true },
    });

    channel.on('presence', { event: 'sync' }, syncOtherPlayers);
    channel.on('presence', { event: 'join' }, syncOtherPlayers);
    channel.on('presence', { event: 'leave' }, syncOtherPlayers);
    channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
      setChatMessages(prev => (prev.some(m => m.id === payload.id) ? prev : [...prev.slice(-(MAX_CHAT_MESSAGES - 1)), payload]));
    });
    channel.on('broadcast', { event: 'requestBank' }, ({ payload }) => {
      if (payload.targetId !== myIdRef.current) return;
      channel.send({
        type: 'broadcast',
        event: 'bankData',
        payload: { requesterId: payload.requesterId, id: myIdRef.current, ...bankDataRef.current },
      });
    });
    channel.on('broadcast', { event: 'bankData' }, ({ payload }) => {
      if (payload.requesterId !== myIdRef.current) return;
      setViewedBank(payload);
      setBankLoading(false);
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track(presenceDataRef.current);
        pendingDirtyRef.current = false;
        setInWorld(true);
        setWorldCode(code);
        setLoading(false);
        isPublicRef.current = isPublic;
        if (isPublic) {
          supabase.from('worlds').upsert({
            code,
            is_public: true,
            host_name: presenceDataRef.current.player_name || 'Angler',
            updated_at: new Date().toISOString(),
          }).then(({ error }) => { if (error) console.error('Failed to list public world:', error); });
        }
      }
    });

    channelRef.current = channel;
  }, [leaveWorld, syncOtherPlayers]);

  // Merges a partial update into presence and marks it dirty for the next
  // flush - never calls track() directly (see flushPresence above).
  const updatePresence = useCallback((data) => {
    presenceDataRef.current = { ...presenceDataRef.current, ...data };
    pendingDirtyRef.current = true;
  }, []);

  const sendChatMessage = useCallback((text) => {
    const trimmed = (text || '').trim().slice(0, 200);
    if (!trimmed || !channelRef.current) return;
    const payload = { id: randomId(), senderId: myIdRef.current, name: presenceDataRef.current.player_name, text: trimmed, at: Date.now() };
    channelRef.current.send({ type: 'broadcast', event: 'chat', payload });
  }, []);

  const requestPlayerBank = useCallback((targetId) => {
    if (!channelRef.current) return;
    setBankLoading(true);
    setViewedBank(null);
    channelRef.current.send({
      type: 'broadcast',
      event: 'requestBank',
      payload: { targetId, requesterId: myIdRef.current },
    });
    // Give up after a few seconds if nobody responds (e.g. they disconnected).
    setTimeout(() => setBankLoading(loading => (loading ? false : loading)), 5000);
  }, []);

  const clearViewedBank = useCallback(() => setViewedBank(null), []);

  const listPublicWorlds = useCallback(async () => {
    if (!isSupabaseConfigured) return [];
    setPublicWorldsLoading(true);
    const cutoff = new Date(Date.now() - PUBLIC_WORLD_ACTIVE_WINDOW_MIN * 60000).toISOString();
    const { data, error } = await supabase
      .from('worlds')
      .select('code, host_name, updated_at')
      .eq('is_public', true)
      .gte('updated_at', cutoff)
      .order('updated_at', { ascending: false })
      .limit(30);
    setPublicWorldsLoading(false);
    if (error) { console.error('Failed to list public worlds:', error); return []; }
    setPublicWorlds(data || []);
    return data || [];
  }, []);

  // Flush batched presence changes on a fixed interval.
  useEffect(() => {
    if (!inWorld) return;
    const interval = setInterval(flushPresence, PRESENCE_FLUSH_INTERVAL);
    return () => clearInterval(interval);
  }, [inWorld, flushPresence]);

  // Defense-in-depth against presence desync: periodically re-track our own
  // presence (keeps it fresh server-side, and keeps a public world's listing
  // row from expiring) and force a full resync of the player list, rather
  // than relying solely on join/leave/sync events. Also force an immediate
  // resync when the tab regains visibility, since backgrounded mobile tabs
  // can throttle timers/animation frames enough that presence updates get
  // missed or feel stale until something forces a fresh look.
  useEffect(() => {
    if (!inWorld) return;
    const heartbeat = () => {
      if (!channelRef.current) return;
      channelRef.current.track(presenceDataRef.current);
      pendingDirtyRef.current = false;
      syncOtherPlayers();
      if (isPublicRef.current && worldCode) {
        supabase.from('worlds').upsert({
          code: worldCode,
          is_public: true,
          host_name: presenceDataRef.current.player_name || 'Angler',
          updated_at: new Date().toISOString(),
        }).then(() => {});
      }
    };
    const interval = setInterval(heartbeat, 8000);
    const handleVisibility = () => { if (document.visibilityState === 'visible') heartbeat(); };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [inWorld, worldCode, syncOtherPlayers]);

  // Clean up on unmount / tab close.
  useEffect(() => {
    const handleUnload = () => {
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, []);

  return {
    worldCode, inWorld, loading,
    otherPlayers, chatMessages,
    enterWorld, leaveWorld, updatePresence, sendChatMessage,
    myId: myIdRef.current,
    updateOwnBank, requestPlayerBank, viewedBank, bankLoading, clearViewedBank,
    publicWorlds, publicWorldsLoading, listPublicWorlds,
    isSupabaseConfigured,
  };
}
