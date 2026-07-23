import { useState } from 'react';
import { X, UserCircle2, Check } from 'lucide-react';
import { HEAD_COLOR_PRESETS, BODY_COLOR_PRESETS, HAT_COLOR_PRESETS } from '@/game/gameConfig';

function ColorRow({ label, presets, value, onChange }) {
  return (
    <div>
      <div className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">{label}</div>
      <div className="flex flex-wrap gap-2 mb-2">
        {presets.map(hex => (
          <button
            key={hex}
            onClick={() => onChange(hex)}
            className={`w-9 h-9 rounded-full border-2 transition-all ${value.toLowerCase() === hex.toLowerCase() ? 'border-white scale-110' : 'border-white/20'}`}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg border border-white/20 bg-transparent cursor-pointer"
        />
        <span className="text-white/40 text-xs">Custom color (advanced)</span>
      </div>
    </div>
  );
}

export default function CharacterPanel({ state, actions, onClose }) {
  const [nameDraft, setNameDraft] = useState(state.characterName);

  return (
    <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0d3d4a]/95 backdrop-blur-md border-l border-white/10 z-30 overflow-y-auto animate-in slide-in-from-right duration-300">
      <div className="sticky top-0 bg-[#0d3d4a]/95 backdrop-blur-md px-4 py-3 border-b border-white/10 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <UserCircle2 size={18} className="text-cyan-400" />
          <h2 className="text-lg font-semibold text-white">Character</h2>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white p-1"><X size={20} /></button>
      </div>

      <div className="p-4 space-y-5">
        <div>
          <div className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-2">Name</div>
          <div className="flex items-center gap-2">
            <input
              value={nameDraft}
              onChange={e => setNameDraft(e.target.value)}
              maxLength={16}
              className="flex-1 bg-black/30 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:border-cyan-400 outline-none"
            />
            <button
              onClick={() => actions.setCharacterName(nameDraft)}
              className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
            >
              <Check size={14} /> Save
            </button>
          </div>
          <p className="text-white/40 text-[10px] mt-1">This is the name other players see above your character and in chat.</p>
        </div>

        <ColorRow
          label="Skin Color"
          presets={HEAD_COLOR_PRESETS}
          value={state.characterColors.head}
          onChange={hex => actions.setCharacterColor('head', hex)}
        />
        <ColorRow
          label="Clothing Color"
          presets={BODY_COLOR_PRESETS}
          value={state.characterColors.body}
          onChange={hex => actions.setCharacterColor('body', hex)}
        />
        <ColorRow
          label="Hat Color"
          presets={HAT_COLOR_PRESETS}
          value={state.characterColors.hat}
          onChange={hex => actions.setCharacterColor('hat', hex)}
        />

        <p className="text-white/30 text-[10px] pt-2 border-t border-white/10">
          Your name and colors save with your progress, and other players in your world see them live.
        </p>
      </div>
    </div>
  );
}
