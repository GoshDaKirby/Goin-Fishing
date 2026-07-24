import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

const DEVICE_ID_KEY = 'goin-fishing-device-id';
const MAX_CHAT_MESSAGES = 60;
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

// Multiplayer runs on Supabase Realtime, but track() (Presence) is now only
// ever called ONCE per connection - at the moment of joining, purely so
// Presence can tell everyone who's in the room (join/leave/sync). Every
// later change - movement, name/color edits, location changes, whether
// you're fishing - goes through Broadcast instead, the same mechanism as
// chat. This was tightened up in stages (movement first, now everything
// else) after repeated track() calls turned out to be the actual cause of a
// recurring bug: calling track() again at the wrong moment could make the
// *sender's own* inbound message handling seize up, while their outbound
// sends (like chat) kept working - which matched a report where catching a
// fish (which used to send a fresh track() for the is_fishing flag) broke
// the catching player's own view of everyone else, but not vice versa.
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
  const [connectionIssue, setConnectionIssue] = useState(false);

  const channelRef = useRef(null);
  const myIdRef = useRef(getOrCreateDeviceId());
  // Our own current metadata - sent once via track() at join, and via
  // 'meta' broadcasts after that for any later change.
  const presenceDataRef = useRef({ player_name: '', location: 'shore', is_fishing: false, head_color: null, body_color: null, hat_color: null });
  // Fast-changing position data, keyed by player id, updated via Broadcast.
  const positionsRef = useRef({}); // { [id]: { x, z, rot } }
  // Metadata updates received after someone's initial join, keyed by id.
  const metaOverridesRef = useRef({}); // { [id]: { player_name, location, is_fishing, head_color, body_color, hat_color } }
  const bankDataRef = useRef({ nickname: '', fishBank: [], hasMuseum: false, museumTier: 1 });
  const isPublicRef = useRef(false);
  const lastSentPositionRef = useRef({ x: null, z: null, rot: null });

  const updateOwnBank = useCallback((payload) => {
    bankDataRef.current = { ...bankDataRef.current, ...payload };
  }, []);

  // Rebuilds the other-players list from presence (join/leave membership)
  // merged with the latest known broadcast metadata and position for each id.
  const rebuildOtherPlayers = useCallback(() => {
    const channel = channelRef.current;
    if (!channel) return;
    const state = channel.presenceState();
    const list = [];
    for (const key of Object.keys(state)) {
      if (key === myIdRef.current) continue;
      const entries = state[key];
      if (!entries || !entries[0]) continue;
      const pos = positionsRef.current[key];
      const meta = metaOverridesRef.current[key];
      list.push({
        id: key,
        ...entries[0],
        ...meta,
        character_x: pos ? pos.x : 0,
        character_z: pos ? pos.z : 0,
        character_rot: pos ? pos.rot : 0,
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
    metaOverridesRef.current = {};
    setInWorld(false);
    setWorldCode(null);
    setOtherPlayers([]);
    setChatMessages([]);
    setConnectionIssue(false);
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
      // Clean up stored position/metadata for anyone who actually left, so
      // a later rejoin under the same id doesn't briefly show stale info.
      (payload?.leftPresences || []).forEach(p => {
        delete positionsRef.current[p?.key];
        delete metaOverridesRef.current[p?.key];
      });
      rebuildOtherPlayers();
    });
    channel.on('broadcast', { event: 'move' }, ({ payload }) => {
      if (!payload?.id || payload.id === myIdRef.current) return;
      positionsRef.current[payload.id] = { x: payload.x, z: payload.z, rot: payload.rot };
      setOtherPlayers(prev => prev.map(p => (p.id === payload.id ? { ...p, character_x: payload.x, character_z: payload.z, character_rot: payload.rot } : p)));
    });
    channel.on('broadcast', { event: 'meta' }, ({ payload }) => {
      if (!payload?.id || payload.id === myIdRef.current) return;
      const { id, ...fields } = payload;
      metaOverridesRef.current[id] = { ...metaOverridesRef.current[id], ...fields };
      setOtherPlayers(prev => prev.map(p => (p.id === id ? { ...p, ...fields } : p)));
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

    const handleStatus = async (status, err) => {
      // Log every transition so the real reason is visible in devtools
      // instead of the connection just silently degrading.
      console.log(`[multiplayer] channel status: ${status}`, err || '');

      if (status === 'SUBSCRIBED') {
        // The ONE and only track() call for this connection.
        await channel.track(presenceDataRef.current);
        setInWorld(true);
        setWorldCode(code);
        setLoading(false);
        setConnectionIssue(false);
        isPublicRef.current = isPublic;
        if (isPublic) {
          supabase.from('worlds').upsert({
            code,
            is_public: true,
            host_name: presenceDataRef.current.player_name || 'Angler',
            updated_at: new Date().toISOString(),
          }).then(({ error }) => { if (error) console.error('Failed to list public world:', error); });
        }
        return;
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setConnectionIssue(true);
        if (channelRef.current === channel) {
          setTimeout(() => {
            if (channelRef.current === channel) channel.subscribe(handleStatus);
          }, 1500);
        }
      }
    };
    channel.subscribe(handleStatus);

    channelRef.current = channel;
  }, [leaveWorld, rebuildOtherPlayers]);

  // Slow-changing metadata (name, colors, location, is_fishing). Broadcasts
  // a 'meta' event with whatever changed - never calls track() again after
  // the initial join (see the note at the top of this file for why).
  const updatePresence = useCallback((data) => {
    presenceDataRef.current = { ...presenceDataRef.current, ...data };
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'meta', payload: { id: myIdRef.current, ...data } });
    }
  }, []);

  // Fast-changing position - Broadcast. Skips sending if the
  // position/rotation hasn't actually changed since the last send.
  const updatePosition = useCallback((x, z, rot) => {
    const last = lastSentPositionRef.current;
    if (last.x === x && last.z === z && last.rot === rot) return;
    lastSentPositionRef.current = { x, z, rot };
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event: 'move', payload: { id: myIdRef.current, x, z, rot } })
        .then(result => { if (result !== 'ok') console.warn('[multiplayer] move send result:', result); });
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

  // Defense-in-depth against desync: periodically force a full resync of the
  // player list from presence state (cheap, no track() involved), refresh a
  // public world's listing row if applicable, and check the tab's visibility
  // to recover from a phone going to sleep.
  useEffect(() => {
    if (!inWorld) return;
    const refresh = () => {
      if (!channelRef.current) return;
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
    const interval = setInterval(refresh, 8000);
    // Phones fully suspend JS (and usually the underlying WebSocket) while
    // the screen is off/backgrounded. When the tab wakes back up, this
    // checks whether the channel is really still joined, and if not, does a
    // full clean rejoin (same as pressing "Enter World" again) rather than
    // quietly staying disconnected.
    const handleWake = () => {
      if (document.visibilityState !== 'visible') return;
      const channel = channelRef.current;
      if (!channel || channel.state !== 'joined') {
        console.log('[multiplayer] reconnecting after wake, channel state was:', channel?.state);
        if (worldCode) enterWorld(worldCode, { isPublic: isPublicRef.current });
      } else {
        refresh();
      }
    };
    document.addEventListener('visibilitychange', handleWake);
    window.addEventListener('focus', handleWake);
    window.addEventListener('online', handleWake);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleWake);
      window.removeEventListener('focus', handleWake);
      window.removeEventListener('online', handleWake);
    };
  }, [inWorld, worldCode, rebuildOtherPlayers, enterWorld]);

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
    worldCode, inWorld, loading, connectionIssue,
    otherPlayers, chatMessages,
    enterWorld, leaveWorld, updatePresence, updatePosition, sendChatMessage,
    myId: myIdRef.current,
    updateOwnBank, requestPlayerBank, viewedBank, bankLoading, clearViewedBank,
    publicWorlds, publicWorldsLoading, listPublicWorlds,
    isSupabaseConfigured,
  };
}
