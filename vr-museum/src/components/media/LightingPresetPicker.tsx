import type { LightingPresetKey } from "@/lib/artifact-categories";
import { getLightingPreset, LIGHTING_PRESETS } from "@/lib/lighting-presets";

export default function LightingPresetPicker({ value, onChange, defaultKey }: { value: LightingPresetKey; onChange: (key: LightingPresetKey) => void; defaultKey?: LightingPresetKey }) {
  return (
    <div>
      {defaultKey && value !== defaultKey && <button type="button" onClick={() => onChange(defaultKey)} className="mb-3 text-[10px] tracking-label text-stone underline underline-offset-4">Reassign to suggested lighting ({getLightingPreset(defaultKey).name})</button>}
      <div className="divide-y divide-line border-t border-b border-line">
        {LIGHTING_PRESETS.map((opt) => <button key={opt.key} type="button" onClick={() => onChange(opt.key)} className="flex w-full items-center justify-between py-3.5 text-left"><span><span className="block text-sm text-ink">{opt.name}</span><span className="block text-xs text-stone">{opt.description}</span></span><span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${value === opt.key ? "bg-ink" : "border border-line"}`} /></button>)}
      </div>
    </div>
  );
}
