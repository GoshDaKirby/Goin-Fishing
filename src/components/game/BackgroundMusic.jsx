import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import fishingTrack from '@/assets/audio/LoopedFishing.wav';

// Persistent looping background music. Browsers block audio with sound from
// autoplaying until the user has interacted with the page at least once, so
// this listens for the first click/keydown/touch anywhere on the page and
// starts playback then, rather than relying on the audio element's autoplay.
export default function BackgroundMusic({ volume = 0.4 }) {
  const audioRef = useRef(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;

    const tryPlay = () => {
      audio.play().catch(() => {
        // Still blocked (e.g. no gesture yet) - the listeners below will retry.
      });
    };

    tryPlay();

    const startOnInteraction = () => {
      tryPlay();
      window.removeEventListener('pointerdown', startOnInteraction);
      window.removeEventListener('keydown', startOnInteraction);
    };

    window.addEventListener('pointerdown', startOnInteraction);
    window.addEventListener('keydown', startOnInteraction);

    return () => {
      window.removeEventListener('pointerdown', startOnInteraction);
      window.removeEventListener('keydown', startOnInteraction);
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
