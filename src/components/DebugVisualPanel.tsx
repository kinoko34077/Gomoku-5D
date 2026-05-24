import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { defaultVisualTuning, type VisualTuning } from '../visualTuning';

interface DebugPanelPosition {
  x: number;
  y: number;
}

interface DebugVisualPanelProps {
  visualTuning: VisualTuning;
  onChange: (next: VisualTuning) => void;
}

const TUNING_SLIDERS: Array<[keyof VisualTuning, string, number, number, number]> = [
  ['backgroundGray', '背景', -64, 255, 1],
  ['outerGridOpacity', '外側グリッド透明度', -1, 1, 0.01],
  ['sliceGridOpacity', '断面線透明度', -1, 1.5, 0.01],
  ['slicePlaneOpacity', '断面面透明度', -1, 1.5, 0.01],
  ['offSliceStoneOpacity', '断面外の石透明度', -1, 1.5, 0.01],
  ['offSliceEmptyOpacity', '断面外の空点透明度', -1, 1.5, 0.01],
  ['outerDashSize', '破線長さ', -0.5, 0.8, 0.01],
  ['outerGapSize', '破線間隔', -0.5, 0.8, 0.01],
  ['phaseSaturationBoost', '位相彩度補正', -1, 1, 0.01],
  ['whitePhaseLightness', '白石明度', -0.5, 1, 0.01],
  ['blackPhaseLightness', '黒石明度', -0.5, 1, 0.01],
  ['phaseGlow', '位相発光', -0.5, 1, 0.01],
  ['stoneScale', '石サイズ', -3, 3, 0.01],
  ['countMarkerScale', '数字サイズ', -2, 2, 0.01],
  ['countMarkerOffset', '数字浮遊距離', -2, 2, 0.01],
  ['focusFadeStrength', '焦点フェード', -1, 2, 0.01],
  ['frontDepthFadeStrength', '手前フェード', -1, 2, 0.01],
];

export function DebugVisualPanel({ visualTuning, onChange }: DebugVisualPanelProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [position, setPosition] = useState<DebugPanelPosition>(() => ({
    x: typeof window === 'undefined' ? 24 : Math.max(24, window.innerWidth - 320),
    y: typeof window === 'undefined' ? 96 : Math.max(96, window.innerHeight - 620),
  }));
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (event: MouseEvent) => {
      setPosition({
        x: Math.max(12, event.clientX - dragOffsetRef.current.x),
        y: Math.max(12, event.clientY - dragOffsetRef.current.y),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    const panelRect = event.currentTarget.parentElement?.getBoundingClientRect();
    if (!panelRect) return;

    dragOffsetRef.current = {
      x: event.clientX - panelRect.left,
      y: event.clientY - panelRect.top,
    };
    setIsDragging(true);
  }, []);

  return (
    <div
      className="absolute z-40 w-72 pointer-events-auto"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/88 text-xs text-slate-100 shadow-2xl backdrop-blur-md">
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
        >
          <div>
            <div className="font-semibold">デバッグ表示調整</div>
            <div className="text-[10px] text-slate-500">この見出しをドラッグして移動</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-800"
              onClick={() => onChange(defaultVisualTuning)}
            >
              初期値
            </button>
            <button
              className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:bg-slate-800"
              onClick={() => setCollapsed(prev => !prev)}
            >
              {collapsed ? '開く' : '畳む'}
            </button>
          </div>
        </div>

        {!collapsed ? (
          <div className="max-h-[70vh] overflow-y-auto border-t border-slate-800 px-4 py-4">
            {TUNING_SLIDERS.map(([key, label, min, max, step]) => (
              <label key={key} className="mb-2 block">
                <div className="mb-1 flex justify-between">
                  <span>{label}</span>
                  <span className="font-mono text-slate-400">{String(visualTuning[key])}</span>
                </div>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={Number(visualTuning[key])}
                  onChange={(event) =>
                    onChange({
                      ...visualTuning,
                      [key]: Number(event.target.value),
                    })
                  }
                  className="w-full"
                />
              </label>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
