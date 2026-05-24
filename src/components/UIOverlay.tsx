import React from 'react';
import {
  AlertTriangle,
  Cpu,
  HelpCircle,
  Redo2,
  RotateCcw,
  Undo2,
  User,
} from 'lucide-react';
import type { Board, Coordinate, GameMode, GameSettings, Player, WinInfo } from '../types';
import type { Threat } from '../gameLogic';
import type { VisualTuning } from '../visualTuning';
import { getPhaseLegendStyle } from '../phasePalette';
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
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onGuideOpen: () => void;
  onCellClick: (x: number, y: number, z: number) => void;
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

  const focusOnCell = (coord: Coordinate, axis: 'X' | 'Y' | 'Z') => {
    setSliceAxis(axis);
    if (axis === 'X') setSliceIndex(coord[0]);
    if (axis === 'Y') setSliceIndex(coord[1]);
    if (axis === 'Z') setSliceIndex(coord[2]);
    onCursorChange(coord);
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 text-white select-none md:p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
        <div className="pointer-events-auto max-w-md rounded-2xl border border-slate-700/85 bg-slate-950/78 px-4 py-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-emerald-400">
            <span>Gomoku 5D</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-500">Phase Gomoku</span>
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
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Turn</div>
                <div className="text-sm font-semibold text-slate-100">
                  {activePlayer === 'white' ? 'White' : 'Black'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/75 px-3 py-2 text-xs text-slate-200">
              {gameMode === 'local' ? (
                <>
                  <User size={13} className="text-sky-400" />
                  <span>Local 2P</span>
                </>
              ) : (
                <>
                  <Cpu size={13} className="text-violet-400" />
                  <span>{gameMode === 'ai_white' ? 'AI plays White' : 'AI plays Black'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-slate-700/85 bg-slate-950/78 p-2 shadow-2xl backdrop-blur-md">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`rounded-xl p-2.5 transition-all ${
              canUndo ? 'text-slate-200 hover:bg-slate-800 active:scale-95' : 'cursor-not-allowed text-slate-600'
            }`}
            title="Undo"
          >
            <Undo2 size={18} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`rounded-xl p-2.5 transition-all ${
              canRedo ? 'text-slate-200 hover:bg-slate-800 active:scale-95' : 'cursor-not-allowed text-slate-600'
            }`}
            title="Redo"
          >
            <Redo2 size={18} />
          </button>
          <span className="h-6 w-px bg-slate-800" />
          <button
            onClick={onReset}
            className="rounded-xl p-2.5 text-slate-200 transition-all hover:bg-red-950/35 hover:text-red-300 active:scale-95"
            title="Reset"
          >
            <RotateCcw size={18} />
          </button>
          <button
            onClick={onGuideOpen}
            className="rounded-xl p-2.5 text-slate-200 transition-all hover:bg-slate-800 active:scale-95"
            title="Guide"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>

      <div className="my-3 grid min-h-0 flex-1 grid-cols-[minmax(15rem,18rem)_1fr_minmax(16rem,19rem)] gap-3">
        <div className="flex min-h-0 flex-col gap-3">
          <PanelCard title="Settings" subtitle="mode and board size">
            <div className="space-y-4 text-xs">
              <label className="block">
                <div className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-500">Mode</div>
                <select
                  value={gameMode}
                  onChange={(e) => setGameMode(e.target.value as GameMode)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none transition-colors focus:border-emerald-500"
                >
                  <option value="local">Local 2P</option>
                  <option value="ai_black">VS AI (you: White)</option>
                  <option value="ai_white">VS AI (you: Black)</option>
                </select>
              </label>

              <label className="block">
                <div className="mb-1.5 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  <span>Board Size</span>
                  <span className="font-mono text-slate-300">{size} x {size} x {size}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="8"
                  value={size}
                  onChange={(e) => setSettings({ ...settings, boardSize: Number(e.target.value) })}
                  className="w-full accent-emerald-500"
                />
                <div className="mt-1 text-[10px] text-slate-500">size changes reset the current game</div>
              </label>
            </div>
          </PanelCard>

          <PanelCard title="Inspector" subtitle="selected cell state">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 font-mono">
                <span className="text-slate-500">cursor</span>
                <span className="text-emerald-400">({cx}, {cy}, {cz})</span>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">owner</span>
                  {currentCell?.lastPlayer ? (
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          currentCell.lastPlayer === 'white' ? 'bg-white ring-1 ring-slate-400' : 'bg-black ring-1 ring-slate-500'
                        }`}
                      />
                      <span>{currentCell.lastPlayer}</span>
                    </span>
                  ) : (
                    <span className="text-slate-500">empty</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">phase</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3.5 w-3.5 rounded"
                      style={{
                        backgroundColor: getPhaseLegendStyle(currentCell?.phase ?? 0, currentCell?.lastPlayer ?? 'white', visualTuning).swatch,
                        border: `1px solid ${getPhaseLegendStyle(currentCell?.phase ?? 0, currentCell?.lastPlayer ?? 'white', visualTuning).border}`,
                      }}
                    />
                    <span className="font-mono text-slate-100">{currentCell?.phase ?? 0}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-2 py-2 text-center">
                    <div className="text-[10px] text-slate-500">white combo</div>
                    <div className="text-sm font-semibold text-white">{currentCell?.streak.white ?? 0}</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-2 py-2 text-center">
                    <div className="text-[10px] text-slate-500">black combo</div>
                    <div className="text-sm font-semibold text-slate-300">{currentCell?.streak.black ?? 0}</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onCellClick(cx, cy, cz)}
                className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
              >
                place stone here
              </button>
            </div>
          </PanelCard>
        </div>

        <div />

        <div className="flex min-h-0 flex-col gap-3">
          <PanelCard title="Slice" subtitle="cross section view">
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-1">
                {(['Z', 'Y', 'X', 'none'] as const).map((axis) => (
                  <button
                    key={axis}
                    onClick={() => setSliceAxis(axis)}
                    className={`rounded-lg px-2 py-1.5 font-semibold transition-colors ${
                      sliceAxis === axis ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {axis === 'none' ? 'all' : axis}
                  </button>
                ))}
              </div>

              {sliceAxis !== 'none' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>{sliceAxis} index</span>
                    <span className="font-mono">{sliceIndex} / {size - 1}</span>
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
                      onChange={(e) => setSliceIndex(Number(e.target.value))}
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
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-slate-500">
                  all slices visible
                </div>
              )}
            </div>
          </PanelCard>

          <PanelCard title="Threats" subtitle="focus dangerous lines" defaultCollapsed={threats.length === 0}>
            <div className="max-h-[18rem] space-y-2 overflow-y-auto pr-1 text-xs">
              {threats.length === 0 ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-4 text-center text-slate-500">
                  no immediate threats
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
                          <span>{isStreak ? 'combo pressure' : 'line threat'}</span>
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

        <div className="justify-self-center w-full max-w-sm">
          <PanelCard title="Phase Guide" subtitle="white and black actual stone colors" defaultCollapsed>
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
                    <span className="w-3 text-slate-500">W</span>
                    <div
                      className="h-4 flex-1 rounded"
                      style={{
                        backgroundColor: getPhaseLegendStyle(phase, 'black', visualTuning).swatch,
                        border: `1px solid ${getPhaseLegendStyle(phase, 'black', visualTuning).border}`,
                      }}
                    />
                    <span className="w-3 text-slate-500">B</span>
                  </div>
                </div>
              ))}
            </div>
          </PanelCard>
        </div>

        <div className="justify-self-end w-full max-w-[19rem]">
          <PanelCard title="Controls" subtitle="drag, wheel, and grid toggle" defaultCollapsed>
            <div className="space-y-2 text-[11px] text-slate-300">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                <span className="font-semibold text-slate-100">通常ドラッグ</span>
                <span className="ml-2 text-slate-400">回転</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                <span className="font-semibold text-slate-100">Shift+ドラッグ</span>
                <span className="ml-2 text-slate-400">X 切出し</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                <span className="font-semibold text-slate-100">Alt+ドラッグ</span>
                <span className="ml-2 text-slate-400">上下で Y / 左右で Z 切出し</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                <span className="font-semibold text-slate-100">ホイール</span>
                <span className="ml-2 text-slate-400">ズーム</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                <span className="font-semibold text-slate-100">Shift / Alt / Ctrl + ホイール</span>
                <span className="ml-2 text-slate-400">X / Y / Z 指定位置変更</span>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
                <span className="font-semibold text-slate-100">G</span>
                <span className="ml-2 text-slate-400">グリッド表示切替</span>
              </div>
            </div>
          </PanelCard>
        </div>
      </div>

      {winInfo ? (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-slate-700 bg-slate-950/92 p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 text-3xl font-bold text-slate-950">
              W
            </div>
            <div>
              <h2 className="text-2xl font-extrabold uppercase tracking-wide text-yellow-300">
                {winInfo.winner === 'white' ? 'White wins' : 'Black wins'}
              </h2>
              <div className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">
                {winInfo.type === 'streak' ? 'same cell combo' : 'xyz plus phase'}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm leading-relaxed text-slate-200">
              {winInfo.description}
            </div>
            <button
              onClick={onReset}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 py-3 font-extrabold text-slate-950 transition-transform active:scale-[0.98]"
            >
              play again
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
