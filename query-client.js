import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

const AUTO_PUSH_INTERVAL = 15000;

// Cloud save is entirely optional. Signed-out players just use localStorage,
// same as before. Signed-in players get their save mirrored to a Supabase
// `saves` table (one row per user, protected by Row Level Security so only
// that user's own account can read/write it) and pulled back down on other
// devices.
export function useCloudSave(user, state, actions) {
  const [cloudSave, setCloudSave] = useState(null);
  const [checking, setChecking] = useState(false);
  const [pushStatus, setPushStatus] = useState(null); // { ok: bool, message: string, at: number }
  const stateRef = useRef(state);
  stateRef.current = state;

  const fetchCloudSave = useCallback(async () => {
    if (!isSupabaseConfigured || !user) return null;
    setChecking(true);
    const { data, error } = await supabase
      .from('saves')
      .select('data, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();
    setChecking(false);
    if (error) {
      console.error('Failed to fetch cloud save:', error);
      setPushStatus({ ok: false, message: `Couldn't check cloud save: ${error.message}`, at: Date.now() });
      return null;
    }
    setCloudSave(data || null);
    return data || null;
  }, [user]);

  useEffect(() => {
    if (user) fetchCloudSave();
    else setCloudSave(null);
  }, [user, fetchCloudSave]);

  const loadCloudSave = useCallback(async () => {
    const fresh = await fetchCloudSave();
    if (fresh?.data) actions.loadFromCloud(fresh.data);
    return fresh;
  }, [fetchCloudSave, actions]);

  // Always actually writes (no silent dedup skip) so the caller gets honest
  // feedback about whether it worked. Returns { ok, message }.
  const pushSave = useCallback(async (dataToSave, { silent } = {}) => {
    if (!isSupabaseConfigured || !user) return { ok: false, message: 'Not signed in.' };
    const { error } = await supabase
      .from('saves')
      .upsert({ user_id: user.id, data: dataToSave, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (error) {
      console.error('Failed to push cloud save:', error);
      const result = { ok: false, message: error.message || 'Push failed.' };
      if (!silent) setPushStatus({ ...result, at: Date.now() });
      return result;
    }
    const result = { ok: true, message: 'Saved to the cloud.' };
    if (!silent) setPushStatus({ ...result, at: Date.now() });
    setCloudSave({ data: dataToSave, updated_at: new Date().toISOString() });
    return result;
  }, [user]);

  // Auto-push on a fixed interval while signed in. This reads the latest
  // state via a ref rather than depending on `state` directly - the previous
  // version used a debounce keyed on the state object, which reset on every
  // change; since game state changes every second or so from timers (cage
  // traps, museum payouts, etc.), that debounce almost never actually
  // completed, so auto-save silently never ran.
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    const interval = setInterval(() => {
      pushSave(stateRef.current, { silent: true });
    }, AUTO_PUSH_INTERVAL);
    return () => clearInterval(interval);
  }, [user, pushSave]);

  const pushCurrentSave = useCallback(() => pushSave(stateRef.current), [pushSave]);

  return { cloudSave, checking, pushStatus, fetchCloudSave, loadCloudSave, pushSave, pushCurrentSave };
}
