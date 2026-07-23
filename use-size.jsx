import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import fishingTrack from '@/assets/audio/LoopedFishing.mp3';

// Persistent looping background music. Browsers block audio with sound from
// autoplaying until the user has interacted with the page at least once, so
// this listens for the first interaction anywhere on the page and starts
// playback then, rather than relying on the audio element's autoplay.
//
// Important: listeners are only removed once playback has actually been
// confirmed started (audio.play() resolved). Some mobile browsers (notably
// several Android WebView/Chrome combinations) can reject the very first
// play() attempt even after a real user gesture - e.g. while the file is
// still buffering - and the old version removed its gesture listeners
// immediately regardless of success, so it silently gave up forever. This
// version keeps listening on every subsequent gesture until it actually
// works.
export default function BackgroundMusic({ volume = 0.4 }) {
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
    audio.muted = false;

    const tryPlay = () => {
      if (startedRef.current) return;
      const p = audio.play();
      if (p && typeof p.then === 'function') {
        p.then(() => { startedRef.current = true; }).catch(() => {
          // Still blocked - keep listening for the next gesture.
        });
      } else {
        startedRef.current = true;
      }
    };

    tryPlay();

    const events = ['pointerdown', 'touchend', 'click', 'keydown'];
    const handler = () => tryPlay();
    events.forEach(evt => window.addEventListener(evt, handler, { passive: true }));

    // Also retry once the file has actually buffered enough to play, in case
    // the gesture happened before there was any data to play yet.
    const onCanPlay = () => tryPlay();
    audio.addEventListener('canplaythrough', onCanPlay);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handler));
      audio.removeEventListener('canplaythrough', onCanPlay);
    };
  }, [volume]);

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  };

  return (
    <>
      <audio ref={audioRef} src={fishingTrack} loop preload="auto" />
      <button
        onClick={toggleMute}
        title={muted ? 'Unmute music' : 'Mute music'}
        className="fixed bottom-3 right-3 z-50 flex items-center justify-center w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white hover:bg-black/60 transition-colors"
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </>
  );
}
