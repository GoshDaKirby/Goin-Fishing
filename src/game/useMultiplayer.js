import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

const NICKNAME_KEY = 'goin-fishing-nickname';
const DEVICE_ID_KEY = 'goin-fishing-device-id';
const MAX_CHAT_MESSAGES = 60;

function randomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function slugifyWorld(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'world';
}

function getOrCreateDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch (e) {
    return randomId();
  }
}

// Multiplayer runs entirely on Supabase Realtime: player positions/nametags
// use "Presence" (ephemeral per-connection state on a channel, no database
// table needed - players just disappear automatically when they disconnect),
// and chat uses "Broadcast" (fire-and-forget messages to everyone else on
// the same channel, also not persisted anywhere). No sign-in is required for
// any of this; each device just gets a stable local ID + an editable
// nickname stored in localStorage.
export function useMultiplayer(user) {
  const [nickname, setNicknameState] = useState(() => {
    try {
      return localStorage.getItem(NICKNAME_KEY) || `Angler${Math.floor(Math.random() * 9000 + 1000)}`;
    } catch (e) { return 'Angler'; }
  });
  const [worldCode, setWorldCode] = useState(null);
  const [inWorld, setInWorld] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otherPlayers, setOtherPlayers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [viewedBank, setViewedBank] = useState(null);
  const [bankLoading, setBankLoading] = useState(false);

  const channelRef = useRef(null);
  const myIdRef = useRef(getOrCreateDeviceId());
  const presenceDataRef = useRef({ player_name: nickname, location: 'shore', is_fishing: false, character_x: 0, character_z: 0, character_rot: 0 });
  const bankDataRef = useRef({ nickname, fishBank: [], hasMuseum: false, museumTier: 1 });

  const setNickname = useCallback((name) => {
    const trimmed = (name || '').trim().slice(0, 16) || 'Angler';
    setNicknameState(trimmed);
    try { localStorage.setItem(NICKNAME_KEY, trimmed); } catch (e) { /* ignore */ }
    presenceDataRef.current = { ...presenceDataRef.current, player_name: trimmed };
    bankDataRef.current = { ...bankDataRef.current, nickname: trimmed };
    if (channelRef.current) channelRef.current.track(presenceDataRef.current);
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
    setInWorld(false);
    setWorldCode(null);
    setOtherPlayers([]);
    setChatMessages([]);
  }, []);

  const enterWorld = useCallback(async (rawCode) => {
    if (!isSupabaseConfigured) return;
    const code = slugifyWorld(rawCode || 'lobby');
    setLoading(true);
    if (channelRef.current) await leaveWorld();

    const channel = supabase.channel(`world:${code}`, {
      config: { presence: { key: myIdRef.current }, broadcast: { self: true } },
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
        setInWorld(true);
        setWorldCode(code);
        setLoading(false);
      }
    });

    channelRef.current = channel;
  }, [leaveWorld, syncOtherPlayers]);

  const updatePresence = useCallback((data) => {
    presenceDataRef.current = { ...presenceDataRef.current, ...data };
    if (channelRef.current && inWorld) {
      channelRef.current.track(presenceDataRef.current);
    }
  }, [inWorld]);

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
    nickname, setNickname,
    worldCode, inWorld, loading,
    otherPlayers, chatMessages,
    enterWorld, leaveWorld, updatePresence, sendChatMessage,
    myId: myIdRef.current,
    updateOwnBank, requestPlayerBank, viewedBank, bankLoading, clearViewedBank,
    isSupabaseConfigured,
  };
}
