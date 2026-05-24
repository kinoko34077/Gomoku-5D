import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Cpu,
  HelpCircle,
  Redo2,
  RotateCcw,
  Settings2,
  Undo2,
  User,
  X,
} from 'lucide-react';
import type { Threat } from '../gameLogic';
import { getPhaseLegendStyle } from '../phasePalette';
import type { Board, Coordinate, GameMode, GameSettings, Player, WinInfo } from '../types';
import type { VisualTuning } from '../visualTuning';
import { PanelCard } from './PanelCard';

interface UIOverlayProps {
  board: Board;
  settings: GameSettings;
  setSettings: (s: GameSettings) => void;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  activePlayer: Player;
  cursor: Coordinate;
  onCursorChange: (cursor: Coordinate) => void;
  sliceAxis: 'X' | 'Y' | 'Z' | 'none';
  setSliceAxis: (axis: 'X' | 'Y' | 'Z' | 'none') => void;
  sliceIndex: number;
  setSliceIndex: (index: number) => void;
  winInfo: WinInfo | null;
  threats: Threat[];
  visualTuning: VisualTuning;
  showGridAssist: boolean;
  setShowGridAssist: (value: boolean | ((prev: boolean) => boolean)) => void;
  threatDetectionEnabled: boolean;
  setThreatDetectionEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  threatDisplayEnabled: boolean;
  setThreatDisplayEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  debugMode: boolean;
  setDebugMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onGuideOpen: () => void;
  onCellClick: (x: number, y: number, z: number) => void;
}

const controlRows = [
  ['通常ドラッグ', '回転'],
  ['Shift + ホバー / クリック', 'X 軸固定'],
  ['Ctrl + ホバー / クリック', 'Z 軸固定'],
  ['Shift + Ctrl', 'XZ 軸固定'],
  ['Alt + ドラッグ', '上下で Y、左右で Z 断面変更'],
  ['ホイール', 'ズーム'],
  ['Shift / Alt / Ctrl + ホイール', 'X / Y / Z の指定位置変更'],
  ['G', 'グリッド補助切替'],
] as const;

const settingToggles = [
  { key: 'grid', label: 'グリッド補助を表示' },
  { key: 'threatDetect', label: '警戒判定を行う' },
  { key: 'threatDisplay', label: '警戒表示を見せる' },
  { key: 'debug', label: 'デバッグモード' },
] as const;

function PhaseGuide({
  visualTuning,
}: {
  visualTuning: VisualTuning;
}) {
  return (
    <div className="space-y-1.5 font-mono text-[10px]">
      {Array.from({ length: 10 }).map((_, phase) => (
        <div key={phase} className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/70 px-2.5 py-2">
          <div className="w-6 text-slate-400">{phase}</div>
          <div className="flex flex-1 items-center gap-2">
            <div
              className="h-4 flex-1 rounded"
              style={{
                backgroundColor: getPhaseLegendStyle(phase, 'white', visualTuning).swatch,
                border: `1px solid ${getPhaseLegendStyle(phase, 'white', visualTuning).border}`,
              }}
            />
            <span className="w-3 text-slate-500">白</span>
            <div
              className="h-4 flex-1 rounded"
              style={{
                backgroundColor: getPhaseLegendStyle(phase, 'black', visualTuning).swatch,
                border: `1px solid ${getPhaseLegendStyle(phase, 'black', visualTuning).border}`,
              }}
            />
            <span className="w-3 text-slate-500">黒</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function WinOverlay({
  winInfo,
  visible,
  onClose,
  onReset,
}: {
  winInfo: WinInfo;
  visible: boolean;
  onClose: () => void;
  onReset: () => void;
}) {
  if (!visible) return null;

  return (
    <div className="pointer-events-auto fixed inset-0 z-[90] flex items-center justify-center bg-black/55 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-5 rounded-3xl border border-slate-700 bg-slate-950/92 p-8 text-center shadow-2xl">
        <div className="flex items-start justify-between">
          <div />
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            title="閉じる"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 text-3xl font-bold text-slate-950">
          勝
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-wide text-yellow-300">
            {winInfo.winner === 'white' ? '白の勝ち' : '黒の勝ち'}
          </h2>
          <div className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">
            {winInfo.type === 'streak' ? '同位置5コンボ' : 'XYZ5連 + 位相条件'}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm leading-relaxed text-slate-200">
          {winInfo.description}
        </div>
        <div className="text-[11px] text-slate-500">数秒後に自動で閉じます。閉じても勝敗は維持され、追加の着手はできません。</div>
        <button
          onClick={onReset}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-3 font-extrabold text-slate-950 transition-transform active:scale-[0.98]"
        >
          もう一度遊ぶ
        </button>
      </div>
    </div>
  );
}

export const UIOverlay: React.FC<UIOverlayProps> = ({
  board,
  settings,
  setSettings,
  gameMode,
  setGameMode,
  activePlayer,
  cursor,
  onCursorChange,
  sliceAxis,
  setSliceAxis,
  sliceIndex,
  setSliceIndex,
  winInfo,
  threats,
  visualTuning,
  showGridAssist,
  setShowGridAssist,
  threatDetectionEnabled,
  setThreatDetectionEnabled,
  threatDisplayEnabled,
  setThreatDisplayEnabled,
  debugMode,
  setDebugMode,
  onUndo,
  onRedo,
  onReset,
  canUndo,
  canRedo,
  onGuideOpen,
  onCellClick,
}) => {
  const [cx, cy, cz] = cursor;
  const size = settings.boardSize;
  const currentCell = board[cx]?.[cy]?.[cz];
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWinOverlayVisible, setIsWinOverlayVisible] = useState(false);

  useEffect(() => {
    if (!winInfo) {
      setIsWinOverlayVisible(false);
      return;
    }

    setIsWinOverlayVisible(true);
    const timer = window.setTimeout(() => setIsWinOverlayVisible(false), 4500);
    return () => window.clearTimeout(timer);
  }, [winInfo]);

  const currentPhaseStyle = useMemo(
    () => getPhaseLegendStyle(currentCell?.phase ?? 0, currentCell?.lastPlayer ?? 'white', visualTuning),
    [currentCell?.lastPlayer, currentCell?.phase, visualTuning],
  );

  const focusOnCell = (coord: Coordinate, axis: 'X' | 'Y' | 'Z') => {
    setSliceAxis(axis);
    if (axis === 'X') setSliceIndex(coord[0]);
    if (axis === 'Y') setSliceIndex(coord[1]);
    if (axis === 'Z') setSliceIndex(coord[2]);
    onCursorChange(coord);
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 text-white select-none md:p-5">
      <div className="z-40 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="pointer-events-auto max-w-md rounded-2xl border border-slate-700/85 bg-slate-950/78 px-4 py-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-emerald-400">
            <span>五次元五目並べ</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-500">位相五目</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2">
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full ${
                  activePlayer === 'white'
                    ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                    : 'bg-black ring-1 ring-slate-500 shadow-[0_0_10px_rgba(0,0,0,0.7)]'
                }`}
              />
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">手番</div>
                <div className="text-sm font-semibold text-slate-100">{activePlayer === 'white' ? '白' : '黒'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/75 px-3 py-2 text-xs text-slate-200">
              {gameMode === 'local' ? (
                <>
                  <User size={13} className="text-sky-400" />
                  <span>ローカル2P</span>
                </>
              ) : (
                <>
                  <Cpu size={13} className="text-violet-400" />
                  <span>{gameMode === 'ai_white' ? '対AI: あなたは黒' : '対AI: あなたは白'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="pointer-events-auto relative z-[70] flex items-center gap-2 rounded-2xl border border-slate-700/85 bg-slate-950/92 p-2 shadow-2xl backdrop-blur-md">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`rounded-xl p-2.5 transition-all ${
              canUndo ? 'text-slate-200 hover:bg-slate-800 active:scale-95' : 'cursor-not-allowed text-slate-600'
            }`}
            title="元に戻す"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`rounded-xl p-2.5 transition-all ${
              canRedo ? 'text-slate-200 hover:bg-slate-800 active:scale-95' : 'cursor-not-allowed text-slate-600'
            }`}
            title="やり直す"
          >
            <Redo2 size={18} />
          </button>
          <span className="h-6 w-px bg-slate-800" />
          <button
            onClick={onReset}
            className="rounded-xl p-2.5 text-slate-200 transition-all hover:bg-red-950/35 hover:text-red-300 active:scale-95"
            title="対局をリセット"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={() => setIsSettingsOpen(prev => !prev)}
            className="rounded-xl p-2.5 text-slate-200 transition-all hover:bg-slate-800 active:scale-95"
            title="設定"
          >
            <Settings2 size={18} />
          </button>
          <button
            onClick={onGuideOpen}
            className="rounded-xl p-2.5 text-slate-200 transition-all hover:bg-slate-800 active:scale-95"
            title="ヘルプ"
          >
            <HelpCircle size={18} />
          </button>

          {isSettingsOpen ? (
            <div className="absolute right-0 top-[calc(100%+0.75rem)] z-[80] w-80 rounded-2xl border border-slate-700/90 bg-slate-950/98 p-4 text-xs text-slate-100 shadow-2xl backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-300">設定</div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                  title="閉じる"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-3">
                {settingToggles.map(item => {
                  const checked =
                    item.key === 'grid' ? showGridAssist
                    : item.key === 'threatDetect' ? threatDetectionEnabled
                    : item.key === 'threatDisplay' ? threatDisplayEnabled
                    : debugMode;
                  const toggle =
                    item.key === 'grid' ? () => setShowGridAssist(prev => !prev)
                    : item.key === 'threatDetect' ? () => setThreatDetectionEnabled(prev => !prev)
                    : item.key === 'threatDisplay' ? () => setThreatDisplayEnabled(prev => !prev)
                    : () => setDebugMode(prev => !prev);

                  return (
                    <label key={item.key} className="flex items-center justify-between gap-3">
                      <span>{item.label}</span>
                      <input type="checkbox" checked={checked} onChange={toggle} />
                    </label>
                  );
                })}
              </div>
              <div className="mt-3 text-[10px] text-slate-500">P を押しながら DEBUG と入力しても切り替えできます。</div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="my-3 grid min-h-0 flex-1 grid-cols-[minmax(15rem,18rem)_1fr_minmax(16rem,19rem)] gap-3">
        <div className="z-20 flex min-h-0 flex-col gap-3">
          <PanelCard title="対局設定" subtitle="モードと盤面サイズ">
            <div className="space-y-4 text-xs">
              <label className="block">
                <div className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">モード</div>
                <select
                  value={gameMode}
                  onChange={(event) => setGameMode(event.target.value as GameMode)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition-colors focus:border-emerald-500"
                >
                  <option value="local">ローカル2P</option>
                  <option value="ai_black">対AI: あなたは白</option>
                  <option value="ai_white">対AI: あなたは黒</option>
                </select>
              </label>

              <label className="block">
                <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  <span>盤面サイズ</span>
                  <span className="font-mono text-slate-300">{size} x {size} x {size}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="8"
                  value={size}
                  onChange={(event) => setSettings({ ...settings, boardSize: Number(event.target.value) })}
                  className="w-full accent-emerald-500"
                />
                <div className="mt-1 text-[10px] text-slate-500">サイズ変更時は現在の対局をリセットします。</div>
              </label>
            </div>
          </PanelCard>

          <PanelCard title="インスペクタ" subtitle="選択中マスの状態">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 font-mono">
                <span className="text-slate-500">カーソル</span>
                <span className="text-emerald-400">({cx}, {cy}, {cz})</span>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">最後の手</span>
                  {currentCell?.lastPlayer ? (
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          currentCell.lastPlayer === 'white' ? 'bg-white ring-1 ring-slate-400' : 'bg-black ring-1 ring-slate-500'
                        }`}
                      />
                      <span>{currentCell.lastPlayer === 'white' ? '白' : '黒'}</span>
                    </span>
                  ) : (
                    <span className="text-slate-500">空</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">位相</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3.5 w-3.5 rounded"
                      style={{
                        backgroundColor: currentPhaseStyle.swatch,
                        border: `1px solid ${currentPhaseStyle.border}`,
                      }}
                    />
                    <span className="font-mono text-slate-100">{currentCell?.phase ?? 0}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-2 py-2 text-center">
                    <div className="text-[10px] text-slate-500">白コンボ</div>
                    <div className="text-sm font-semibold text-white">{currentCell?.streak.white ?? 0}</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-2 py-2 text-center">
                    <div className="text-[10px] text-slate-500">黒コンボ</div>
                    <div className="text-sm font-semibold text-slate-300">{currentCell?.streak.black ?? 0}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onCellClick(cx, cy, cz)}
                className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
              >
                ここに置く
              </button>
            </div>
          </PanelCard>
        </div>

        <div />

        <div className="z-20 flex min-h-0 flex-col gap-3">
          <PanelCard title="断面表示" subtitle="表示する切り出し面">
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-1">
                {(['Z', 'Y', 'X', 'none'] as const).map(axis => (
                  <button
                    key={axis}
                    onClick={() => setSliceAxis(axis)}
                    className={`rounded-lg px-2 py-1.5 font-semibold transition-colors ${
                      sliceAxis === axis ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {axis === 'none' ? '全層' : axis}
                  </button>
                ))}
              </div>

              {sliceAxis !== 'none' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>{sliceAxis} 位置</span>
                    <span className="font-mono">
                      {sliceIndex} / {size - 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSliceIndex(Math.max(0, sliceIndex - 1))}
                      className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="0"
                      max={size - 1}
                      value={sliceIndex}
                      onChange={(event) => setSliceIndex(Number(event.target.value))}
                      className="w-full accent-sky-500"
                    />
                    <button
                      onClick={() => setSliceIndex(Math.min(size - 1, sliceIndex + 1))}
                      className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800"
                    >
                      +
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-slate-500">全断面を表示中</div>
              )}
            </div>
          </PanelCard>

          <PanelCard title="警戒" subtitle="危険な筋を確認" defaultCollapsed={threats.length === 0}>
            <div className="max-h-[18rem] space-y-2 overflow-y-auto pr-1 text-xs">
              {threats.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-4 text-center text-slate-500">
                  現在は警戒がありません
                </div>
              ) : (
                threats.map((threat, index) => {
                  const targetCell = threat.cells[0];
                  const axis = sliceAxis === 'none' ? 'Z' : sliceAxis;
                  const isStreak = threat.type === 'streak_pressure';

                  return (
                    <button
                      key={`${threat.type}-${index}`}
                      onClick={() => focusOnCell(targetCell, axis)}
                      className={`w-full rounded-xl border p-2.5 text-left transition-colors ${
                        isStreak
                          ? 'border-red-900/60 bg-red-950/20 text-red-200 hover:bg-red-950/35'
                          : 'border-amber-900/60 bg-amber-950/20 text-amber-200 hover:bg-amber-950/35'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 font-semibold">
                          <AlertTriangle size={12} />
                          <span>{isStreak ? '同位置コンボ警戒' : '5連警戒'}</span>
                        </span>
                        <span className="font-mono text-[10px] opacity-80">{targetCell.join(',')}</span>
                      </div>
                      <div className="mt-1.5 text-[11px] leading-relaxed opacity-90">{threat.description}</div>
                    </button>
                  );
                })
              )}
            </div>
          </PanelCard>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(15rem,18rem)_1fr_minmax(16rem,19rem)] items-end gap-3">
        <div />

        <div className="w-full max-w-sm justify-self-center">
          <PanelCard title="位相ガイド" subtitle="白石と黒石の見え方" defaultCollapsed>
            <PhaseGuide visualTuning={visualTuning} />
          </PanelCard>
        </div>

        <div className="w-full max-w-[19rem] justify-self-end">
          <PanelCard title="操作" subtitle="ドラッグ・ホイール・切替" defaultCollapsed>
            <div className="space-y-2 text-[11px] text-slate-300">
              {controlRows.map(([label, detail]) => (
                <div key={label} className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                  <span className="font-semibold text-slate-100">{label}</span>
                  <span className="ml-2 text-slate-400">{detail}</span>
                </div>
              ))}
            </div>
          </PanelCard>
        </div>
      </div>

      {winInfo ? (
        <WinOverlay
          winInfo={winInfo}
          visible={isWinOverlayVisible}
          onClose={() => setIsWinOverlayVisible(false)}
          onReset={onReset}
        />
      ) : null}
    </div>
  );
};
