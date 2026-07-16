import { useState } from 'react';
import { X, UserCircle2, Cloud, LogOut, CloudUpload, CloudDownload } from 'lucide-react';

export default function AccountPanel({ auth, cloudSave, onClose }) {
  const { user, isLoadingAuth, isSupabaseConfigured, authMessage, signUp, signIn, signOut } = auth;
  const { cloudSave: saveRow, checking, loadCloudSave, pushSave } = cloudSave;
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [pullMessage, setPullMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    if (mode === 'signup') await signUp(email, password);
    else await signIn(email, password);
    setBusy(false);
  };

  const handlePull = async () => {
    setPullMessage(null);
    const fresh = await loadCloudSave();
    setPullMessage(fresh?.data ? 'Loaded! Your cloud save is now active on this device.' : 'No cloud save found yet - push one from a device first.');
  };

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0d3d4a]/95 backdrop-blur-md border-l border-white/10 z-30 overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 bg-[#0d3d4a]/95 backdrop-blur-md px-4 py-3 border-b border-white/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <UserCircle2 size={18} className="text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Account & Cloud Save</h2>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white p-1"><X size={20} /></button>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-white/50 text-xs leading-relaxed">
          Signing in is completely optional. Your progress already saves to this browser automatically.
          The only thing an account adds is syncing that save to the cloud so it follows you to another
          device or browser.
        </p>

        {!isSupabaseConfigured ? (
          <div className="text-center py-8 text-white/40 text-sm">
            Cloud save isn't set up yet on this deployment.
          </div>
        ) : isLoadingAuth ? (
          <div className="text-center py-8 text-white/40 text-sm">Loading...</div>
        ) : user ? (
          <div className="space-y-3">
            <div className="bg-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 text-white text-sm font-medium mb-1">
                <Cloud size={14} className="text-emerald-400" /> Signed in
              </div>
              <div className="text-white/50 text-xs">{user.email}</div>
              {saveRow?.updated_at && (
                <div className="text-white/30 text-[10px] mt-1">Last synced: {new Date(saveRow.updated_at).toLocaleString()}</div>
              )}
            </div>
            <button
              onClick={() => pushSave(JSON.parse(localStorage.getItem('lazy-fisherman-save-v2') || '{}'))}
              className="w-full flex items-center justify-center gap-1.5 bg-cyan-600/80 hover:bg-cyan-500 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              <CloudUpload size={14} /> Push this device's save to the cloud
            </button>
            <button
              onClick={handlePull}
              disabled={checking}
              className="w-full flex items-center justify-center gap-1.5 bg-amber-600/80 hover:bg-amber-500 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <CloudDownload size={14} /> {checking ? 'Checking...' : 'Pull save from cloud'}
            </button>
            {pullMessage && <div className="text-white/50 text-xs text-center">{pullMessage}</div>}
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center gap-1.5 bg-red-600/70 hover:bg-red-500 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2 text-xs font-medium">
              <button type="button" onClick={() => setMode('signin')} className={`flex-1 py-1.5 rounded-lg ${mode === 'signin' ? 'bg-cyan-600 text-white' : 'bg-white/10 text-white/50'}`}>Log In</button>
              <button type="button" onClick={() => setMode('signup')} className={`flex-1 py-1.5 rounded-lg ${mode === 'signup' ? 'bg-cyan-600 text-white' : 'bg-white/10 text-white/50'}`}>Sign Up</button>
            </div>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-black/30 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:border-cyan-400 outline-none"
            />
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Password" minLength={6}
              className="w-full bg-black/30 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:border-cyan-400 outline-none"
            />
            {authMessage && <div className="text-amber-300 text-xs">{authMessage}</div>}
            <button type="submit" disabled={busy} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium py-2 rounded-lg transition-colors">
              {busy ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Log In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
