import type { ReactNode } from 'react';
import type { GameMode, GameSettings } from '../types';

interface SessionSettingsFormProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  gameMode: GameMode;
  onGameModeChange: (mode: GameMode) => void;
  compact?: boolean;
  showMode?: boolean;
  variant?: 'default' | 'hero';
}

function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block rounded-2xl border border-slate-800 bg-slate-950/48 px-3 py-3 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-slate-200">{label}</span>
        {hint ? <span className="text-[10px] text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

export function SessionSettingsForm({
  settings,
  onSettingsChange,
  gameMode,
  onGameModeChange,
  compact = false,
  showMode = true,
  variant = 'default',
}: SessionSettingsFormProps) {
  const controlClassName = compact
    ? 'w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500'
    : 'w-full rounded-2xl border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 outline-none transition-colors focus:border-emerald-500';
  const isHero = variant === 'hero';

  const updateNumber = (key: keyof GameSettings, value: number) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const groupsClassName = isHero
    ? 'grid gap-3 md:grid-cols-2 xl:grid-cols-4'
    : compact
      ? 'space-y-3'
      : 'space-y-4';

  return (
    <div className={groupsClassName}>
      {showMode ? (
        <Field label="対局モード" className={isHero ? 'md:col-span-2 xl:col-span-1' : ''}>
          <select
            value={gameMode}
            onChange={event => onGameModeChange(event.target.value as GameMode)}
            className={controlClassName}
          >
            <option value="local">ローカル2P</option>
            <option value="ai_black">対AI: あなたは白</option>
            <option value="ai_white">対AI: あなたは黒</option>
          </select>
        </Field>
      ) : null}

      <Field
        label="盤面サイズ"
        hint={`${settings.boardSize} x ${settings.boardSize} x ${settings.boardSize}`}
      >
        <input
          type="range"
          min="5"
          max="8"
          value={settings.boardSize}
          onChange={event => updateNumber('boardSize', Number(event.target.value))}
          className="w-full accent-emerald-500"
        />
      </Field>

      <Field label="位相数" hint={`${settings.maxPhases}`}>
        <input
          type="range"
          min="2"
          max="10"
          value={settings.maxPhases}
          onChange={event => updateNumber('maxPhases', Number(event.target.value))}
          className="w-full accent-sky-500"
        />
      </Field>

      <Field label="XYZ 勝利長" hint={`${settings.winLength} 連`}>
        <input
          type="number"
          min="3"
          max={Math.min(5, settings.boardSize)}
          value={settings.winLength}
          onChange={event => updateNumber('winLength', Number(event.target.value))}
          className={controlClassName}
        />
      </Field>

      <Field label="同位置コンボ" hint={`${settings.streakWinLength} 連`}>
        <input
          type="number"
          min="3"
          max="9"
          value={settings.streakWinLength}
          onChange={event => updateNumber('streakWinLength', Number(event.target.value))}
          className={controlClassName}
        />
      </Field>

      <Field label="持ち時間" hint="0 で無制限">
        <input
          type="number"
          min="0"
          step="30"
          value={settings.timeLimitSeconds}
          onChange={event => updateNumber('timeLimitSeconds', Number(event.target.value))}
          className={controlClassName}
        />
      </Field>

      <Field label="引き分け手数" hint="0 で無効">
        <input
          type="number"
          min="0"
          step="10"
          value={settings.drawMoveLimit}
          onChange={event => updateNumber('drawMoveLimit', Number(event.target.value))}
          className={controlClassName}
        />
      </Field>

      <Field label="Undo / Redo" hint={settings.undoRedoEnabled ? '有効' : '無効'} className={isHero ? 'md:col-span-2 xl:col-span-1' : ''}>
        <label className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/55 px-3 py-2">
          <span className="text-sm text-slate-200">巻き戻しを許可</span>
          <input
            type="checkbox"
            checked={settings.undoRedoEnabled}
            onChange={event => onSettingsChange({ ...settings, undoRedoEnabled: event.target.checked })}
          />
        </label>
      </Field>
    </div>
  );
}
