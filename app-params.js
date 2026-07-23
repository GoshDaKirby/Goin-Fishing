import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

const DEVICE_ID_KEY = 'goin-fishing-device-id';
const MAX_CHAT_MESSAGES = 60;
const PUBLIC_WORLD_ACTIVE_WINDOW_MIN = 3; // worlds not refreshed within this window drop off the public list
const STALE_POSITION_MS = 15000; // if we haven't heard a 'move' broadcast from someone in this long, stop trusting their last known position

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
  // multiplayer together would both present the same key.
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

// Multiplayer runs on two different Supabase Realtime mechanisms, used for
// what they're each actually meant for:
//
// - Presence: WHO is in the world and their slow-changing info (name,
//   colors, current location, whether they're fishing). This only calls
//   track() when one of those things actually changes - a few times a
//   minute at most.
// - Broadcast: WHERE they are. Position updates happen many times a second
//   while walking, and Supabase's own docs are explicit that Presence
//   (track()) is the wrong tool for that ("will flood the channel and cause
//   performance problems... for high-frequency updates, use Broadcast
//   instead"). Broadcasting movement fixes exactly the symptoms that come
//   from misusing Presence for it: chat degrading and players seeming to
//   drop off the list once someone starts moving.
//
// Chat also uses Broadcast, on the same channel, and no longer competes with
// a flood of position-driven track() calls.
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
  // Slow-changing presence metadata only - no position data in here.
  const presenceDataRef = useRef({ player_name: '', location: 'shore', is_fishing: false, head_color: null, body_color: null, hat_color: null });
  // Fast-changing position data, keyed by player id, updated via Broadcast.
  const positionsRef = useRef({}); // { [id]: { x, z, rot, at } }
  const bankDataRef = useRef({ nickname: '', fishBank: [], hasMuseum: false, museumTier: 1 });
  const isPublicRef = useRef(false);
  const lastSentPositionRef = useRef({ x: null, z: null, rot: null });

  const updateOwnBank = useCallback((payload) => {
    bankDataRef.current = { ...bankDataRef.current, ...payload };
  }, []);

  // Rebuilds the other-players list from presence (identity/metadata) merged
  // with the latest known broadcast position for each id.
  const rebuildOtherPlayers = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = channel.presenceState();
    const now = Date.now();
    const list = [];
    for (const key of Object.keys(state)) {
      if (key === myIdRef.current) continue;
      const entries = state[key];
      if (!entries || !entries[0]) continue;
      const pos = positionsRef.current[key];
      const fresh = pos && (now - pos.at) < STALE_POSITION_MS;
      list.push({
        id: key,
        ...entries[0],
        character_x: fresh ? pos.x : 0,
        character_z: fresh ? pos.z : 0,
        character_rot: fresh ? pos.rot : 0,
      });
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
    positionsRef.current = {};
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
      config: { presence: { key: myIdRef.current }, broadcast: { self: true } },
    });

    channel.on('presence', { event: 'sync' }, rebuildOtherPlayers);
    channel.on('presence', { event: 'join' }, rebuildOtherPlayers);
    channel.on('presence', { event: 'leave' }, (payload) => {
      // Clean up stored position data for anyone who actually left, so a
      // later rejoin under the same id doesn't briefly show a stale spot.
      (payload?.leftPresences || []).forEach(p => { delete positionsRef.current[p?.key]; });
      rebuildOtherPlayers();
    });
    channel.on('broadcast', { event: 'move' }, ({ payload }) => {
      if (!payload?.id || payload.id === myIdRef.current) return;
      positionsRef.current[payload.id] = { x: payload.x, z: payload.z, rot: payload.rot, at: Date.now() };
      setOtherPlayers(prev => prev.map(p => (p.id === payload.id ? { ...p, character_x: payload.x, character_z: payload.z, character_rot: payload.rot } : p)));
    });
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
  }, [leaveWorld, rebuildOtherPlayers]);

  // Slow-changing metadata (name, colors, location, is_fishing) - uses
  // Presence/track() directly, since this changes rarely and is exactly
  // what Presence is meant for.
  const updatePresence = useCallback((data) => {
    presenceDataRef.current = { ...presenceDataRef.current, ...data };
    if (channelRef.current) channelRef.current.track(presenceDataRef.current);
  }, []);

  // Fast-changing position - Broadcast, not Presence. Skips sending if the
  // position/rotation hasn't actually changed since the last send.
  const updatePosition = useCallback((x, z, rot) => {
    const last = lastSentPositionRef.current;
    if (last.x === x && last.z === z && last.rot === rot) return;
    lastSentPositionRef.current = { x, z, rot };
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'move', payload: { id: myIdRef.current, x, z, rot } });
    }
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

  // Defense-in-depth against presence desync: periodically re-track our own
  // presence (keeps it fresh server-side, and keeps a public world's listing
  // row from expiring) and force a full resync of the player list, rather
  // than relying solely on join/leave/sync events. Also force an immediate
  // resync when the tab regains visibility, since backgrounded mobile tabs
  // can throttle timers/animation frames enough that events get missed or
  // feel stale until something forces a fresh look. This is cheap now that
  // presence data is small and rarely-changing.
  useEffect(() => {
    if (!inWorld) return;
    const heartbeat = () => {
      if (!channelRef.current) return;
      channelRef.current.track(presenceDataRef.current);
      rebuildOtherPlayers();
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
  }, [inWorld, worldCode, rebuildOtherPlayers]);

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
    enterWorld, leaveWorld, updatePresence, updatePosition, sendChatMessage,
    myId: myIdRef.current,
    updateOwnBank, requestPlayerBank, viewedBank, bankLoading, clearViewedBank,
    publicWorlds, publicWorldsLoading, listPublicWorlds,
    isSupabaseConfigured,
  };
}
