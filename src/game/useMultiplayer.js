const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useState, useEffect, useRef, useCallback } from 'react';

const STALE_TIMEOUT = 15000;

export function useMultiplayer(user) {
  const [currentWorld, setCurrentWorld] = useState(null);
  const [otherPlayers, setOtherPlayers] = useState([]);
  const [availableWorlds, setAvailableWorlds] = useState([]);
  const [inWorld, setInWorld] = useState(false);
  const [loading, setLoading] = useState(false);

  const myPlayerIdRef = useRef(null);
  const worldIdRef = useRef(null);
  const unsubscribeRef = useRef(null);
  const pollRef = useRef(null);
  const heartbeatRef = useRef(null);

  const fetchPlayers = useCallback(async () => {
    const wid = worldIdRef.current;
    if (!wid) return;
    try {
      const players = await db.entities.WorldPlayer.filter({ world_id: wid });
      const now = Date.now();
      const active = (players || []).filter(p => {
        if (p.id === myPlayerIdRef.current) return false;
        if (!p.last_seen) return false;
        return now - new Date(p.last_seen).getTime() < STALE_TIMEOUT;
      });
      setOtherPlayers(active);
    } catch (e) { /* ignore */ }
  }, []);

  const subscribeToWorld = useCallback((wid) => {
    if (unsubscribeRef.current) unsubscribeRef.current();
    worldIdRef.current = wid;
    fetchPlayers();
    unsubscribeRef.current = db.entities.WorldPlayer.subscribe(() => fetchPlayers());
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(fetchPlayers, 5000);
  }, [fetchPlayers]);

  const refreshWorlds = useCallback(async () => {
    try {
      const [worlds, players] = await Promise.all([
        db.entities.World.filter({ status: 'active' }, '-created_date', 20),
        db.entities.WorldPlayer.filter({}, '-created_date', 100),
      ]);
      const now = Date.now();
      const counts = {};
      (players || []).forEach(p => {
        if (p.last_seen && now - new Date(p.last_seen).getTime() < STALE_TIMEOUT) {
          counts[p.world_id] = (counts[p.world_id] || 0) + 1;
        }
      });
      (worlds || []).forEach(w => {
        if (!counts[w.id]) db.entities.World.delete(w.id).catch(() => {});
      });
      setAvailableWorlds((worlds || []).filter(w => counts[w.id]).map(w => ({ ...w, player_count: counts[w.id] })));
    } catch (e) { /* ignore */ }
  }, []);

  const hostWorld = useCallback(async (name) => {
    if (!user) return;
    setLoading(true);
    try {
      const displayName = user.full_name || user.email || 'Player';
      const world = await db.entities.World.create({
        name: name || `${displayName}'s World`,
        host_name: displayName,
        status: 'active',
        max_players: 8,
      });
      const player = await db.entities.WorldPlayer.create({
        world_id: world.id,
        player_name: displayName,
        location: 'shore',
        is_fishing: false,
        character_x: 0,
        character_z: 0,
        character_rot: 0,
        last_seen: new Date().toISOString(),
      });
      myPlayerIdRef.current = player.id;
      setCurrentWorld(world);
      setInWorld(true);
      subscribeToWorld(world.id);
    } catch (e) {
      console.error('Failed to host world:', e);
    } finally {
      setLoading(false);
    }
  }, [user, subscribeToWorld]);

  const joinWorld = useCallback(async (worldId) => {
    if (!user) return;
    setLoading(true);
    try {
      const world = availableWorlds.find(w => w.id === worldId);
      if (!world) return;
      const displayName = user.full_name || user.email || 'Player';
      const player = await db.entities.WorldPlayer.create({
        world_id: worldId,
        player_name: displayName,
        location: 'shore',
        is_fishing: false,
        character_x: 0,
        character_z: 0,
        character_rot: 0,
        last_seen: new Date().toISOString(),
      });
      myPlayerIdRef.current = player.id;
      setCurrentWorld(world);
      setInWorld(true);
      subscribeToWorld(worldId);
    } catch (e) {
      console.error('Failed to join world:', e);
    } finally {
      setLoading(false);
    }
  }, [user, availableWorlds, subscribeToWorld]);

  const updatePresence = useCallback((data) => {
    if (!myPlayerIdRef.current) return;
    db.entities.WorldPlayer.update(myPlayerIdRef.current, {
      ...data,
      last_seen: new Date().toISOString(),
    }).catch(() => {});
  }, []);

  const leaveWorld = useCallback(async () => {
    if (unsubscribeRef.current) { unsubscribeRef.current(); unsubscribeRef.current = null; }
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (heartbeatRef.current) { clearInterval(heartbeatRef.current); heartbeatRef.current = null; }
    const worldId = worldIdRef.current;
    if (myPlayerIdRef.current) {
      try { await db.entities.WorldPlayer.delete(myPlayerIdRef.current); } catch (e) { /* ignore */ }
    }
    if (worldId) {
      try {
        const remaining = await db.entities.WorldPlayer.filter({ world_id: worldId });
        const now = Date.now();
        const activeCount = (remaining || []).filter(p => p.last_seen && now - new Date(p.last_seen).getTime() < STALE_TIMEOUT).length;
        if (activeCount === 0) await db.entities.World.delete(worldId);
      } catch (e) { /* ignore */ }
    }
    myPlayerIdRef.current = null;
    worldIdRef.current = null;
    setCurrentWorld(null);
    setInWorld(false);
    setOtherPlayers([]);
  }, []);

  // Heartbeat
  useEffect(() => {
    if (!inWorld) return;
    heartbeatRef.current = setInterval(() => {
      updatePresence({ last_seen: new Date().toISOString() });
    }, 5000);
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current); };
  }, [inWorld, updatePresence]);

  // Cleanup on unmount / tab close
  useEffect(() => {
    const handleUnload = () => {
      if (myPlayerIdRef.current) {
        db.entities.WorldPlayer.delete(myPlayerIdRef.current).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      if (unsubscribeRef.current) unsubscribeRef.current();
      if (pollRef.current) clearInterval(pollRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (myPlayerIdRef.current) {
        db.entities.WorldPlayer.delete(myPlayerIdRef.current).catch(() => {});
      }
    };
  }, []);

  return {
    currentWorld, otherPlayers, availableWorlds, inWorld, loading,
    refreshWorlds, hostWorld, joinWorld, leaveWorld, updatePresence,
  };
}