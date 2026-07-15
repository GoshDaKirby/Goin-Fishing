import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// Cloud save is entirely optional. Signed-out players just use localStorage,
// same as before. Signed-in players get their save mirrored to a Supabase
// `saves` table (one row per user, protected by Row Level Security so only
// that user's own account can read/write it) and pulled back down on other
// devices.
export function useCloudSave(user, state, actions) {
  const [cloudSave, setCloudSave] = useState(null);
  const [checking, setChecking] = useState(false);
  const lastPushedRef = useRef(null);

  const fetchCloudSave = useCallback(async () => {
    if (!isSupabaseConfigured || !user) return null;
    setChecking(true);
    const { data, error } = await supabase
      .from('saves')
      .select('data, updated_at')
      .eq('user_id', user.id)
      .maybeSingle();
    setChecking(false);
    if (error) { console.error('Failed to fetch cloud save:', error); return null; }
    setCloudSave(data || null);
    return data || null;
  }, [user]);

  useEffect(() => {
    if (user) fetchCloudSave();
    else setCloudSave(null);
  }, [user, fetchCloudSave]);

  const loadCloudSave = useCallback(() => {
    if (cloudSave?.data) actions.loadFromCloud(cloudSave.data);
  }, [cloudSave, actions]);

  const pushSave = useCallback(async (dataToSave) => {
    if (!isSupabaseConfigured || !user) return;
    const json = JSON.stringify(dataToSave);
    if (json === lastPushedRef.current) return;
    lastPushedRef.current = json;
    const { error } = await supabase
      .from('saves')
      .upsert({ user_id: user.id, data: dataToSave, updated_at: new Date().toISOString() });
    if (error) console.error('Failed to push cloud save:', error);
  }, [user]);

  // Debounced auto-push while signed in.
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    const timer = setTimeout(() => pushSave(state), 4000);
    return () => clearTimeout(timer);
  }, [user, state, pushSave]);

  return { cloudSave, checking, fetchCloudSave, loadCloudSave, pushSave };
}
