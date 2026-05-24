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
  showHistoryControls: boolean;
  setShowHistoryControls: (value: boolean | ((prev: boolean) => boolean)) => void;
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

function compactThreatText(description: string) {
  return description
    .replace(/白が1手で/g, '白1手')
    .replace(/黒が1手で/g, '黒1手')
    .replace(/同位置コンボ警戒/g, '同位置警戒')
    .replace(/XYZ \+ /g, '')
    .replace(/階段位相5連/g, '階段5連')
    .replace(/同位相5連/g, '同位相5連');
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
      <div className="w-full max-w-md space-y-4 rounded-3xl border border-slate-700 bg-slate-950/94 p-6 text-center shadow-2xl">
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
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 text-2xl font-bold text-slate-950">
          勝
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-wide text-yellow-300">
            {winInfo.winner === 'white' ? '白の勝ち' : '黒の勝ち'}
          </h2>
          <div className="mt-1 text-[11px] tracking-[0.18em] text-slate-500">
            {winInfo.type === 'streak' ? '同位置5コンボ' : 'XYZ5連 + 位相条件'}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/72 p-3 text-sm leading-relaxed text-slate-200">
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
  showHistoryControls,
  setShowHistoryControls,
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
  const isBrightBackdrop = visualTuning.backgroundGray >= 92;

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
    [currentCell?.phase, currentCell?.lastPlayer, visualTuning],
  );

  const theme = isBrightBackdrop
    ? {
        panel: 'bg-slate-950/92 border-slate-700/90 text-slate-100',
        title: 'text-slate-200',
        subtitle: 'text-slate-400',
        subtle: 'text-slate-400',
        card: 'bg-slate-900/76 border-slate-800',
        popup: 'bg-slate-950/98 border-slate-700/95 backdrop-blur-xl shadow-2xl',
      }
    : {
        panel: 'bg-slate-900/82 border-slate-600/80 text-slate-50',
        title: 'text-slate-100',
        subtitle: 'text-slate-300',
        subtle: 'text-slate-300',
        card: 'bg-slate-950/60 border-slate-700',
        popup: 'bg-slate-900/96 border-slate-600/90 backdrop-blur-xl shadow-2xl',
      };

  const focusOnCell = (coord: Coordinate, axis: 'X' | 'Y' | 'Z') => {
    setSliceAxis(axis);
    if (axis === 'X') setSliceIndex(coord[0]);
    if (axis === 'Y') setSliceIndex(coord[1]);
    if (axis === 'Z') setSliceIndex(coord[2]);
    onCursorChange(coord);
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 text-white select-none md:p-4">
      <div className="z-40 grid grid-cols-[minmax(0,18rem)_auto] items-start gap-2">
        <div className={`pointer-events-auto rounded-2xl border px-3 py-2.5 shadow-2xl backdrop-blur-md ${theme.panel}`}>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-emerald-400">
            <span>五次元五目並べ</span>
            <span className="text-slate-600">/</span>
            <span className={theme.subtitle}>位相五目</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <div className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${theme.card}`}>
              <span
                className={`inline-block h-3 w-3 rounded-full ${
                  activePlayer === 'white'
                    ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]'
                    : 'bg-black ring-1 ring-slate-500 shadow-[0_0_10px_rgba(0,0,0,0.7)]'
                }`}
              />
              <div>
                <div className={`text-[9px] uppercase tracking-[0.16em] ${theme.subtitle}`}>手番</div>
                <div className={`text-sm font-semibold ${theme.title}`}>{activePlayer === 'white' ? '白' : '黒'}</div>
              </div>
            </div>

            <div className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-[11px] ${theme.card}`}>
              {gameMode === 'local' ? (
                <>
                  <User size={12} className="text-sky-400" />
                  <span>ローカル2P</span>
                </>
              ) : (
                <>
                  <Cpu size={12} className="text-violet-400" />
                  <span>{gameMode === 'ai_white' ? '対AI: あなたは黒' : '対AI: あなたは白'}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className={`pointer-events-auto relative z-[70] flex items-center gap-1.5 rounded-2xl border p-1.5 shadow-2xl backdrop-blur-md ${theme.panel}`}>
          {showHistoryControls ? (
            <>
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`rounded-xl p-2 transition-all ${
                  canUndo ? `${theme.title} hover:bg-slate-800 active:scale-95` : 'cursor-not-allowed text-slate-600'
                }`}
                title="元に戻す"
              >
                <Undo2 size={17} />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className={`rounded-xl p-2 transition-all ${
                  canRedo ? `${theme.title} hover:bg-slate-800 active:scale-95` : 'cursor-not-allowed text-slate-600'
                }`}
                title="やり直す"
              >
                <Redo2 size={17} />
              </button>
              <span className="h-5 w-px bg-slate-800" />
            </>
          ) : null}
          <button
            onClick={onReset}
            className={`rounded-xl p-2 transition-all hover:bg-red-950/35 hover:text-red-300 active:scale-95 ${theme.title}`}
            title="対局をリセット"
          >
            <RotateCcw size={17} />
          </button>
          <button
            onClick={() => setIsSettingsOpen(prev => !prev)}
            className={`rounded-xl p-2 transition-all hover:bg-slate-800 active:scale-95 ${theme.title}`}
            title="設定"
          >
            <Settings2 size={17} />
          </button>
          <button
            onClick={onGuideOpen}
            className={`rounded-xl p-2 transition-all hover:bg-slate-800 active:scale-95 ${theme.title}`}
            title="ヘルプ"
          >
            <HelpCircle size={17} />
          </button>

          {isSettingsOpen ? (
            <div className={`absolute right-0 top-[calc(100%+0.55rem)] z-[80] w-72 rounded-2xl border p-4 text-xs text-slate-100 ${theme.popup}`}>
              <div className="mb-3 flex items-center justify-between">
                <div className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${theme.title}`}>設定</div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                  title="閉じる"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="space-y-3">
                <label className="flex items-center justify-between gap-3">
                  <span>グリッド補助を表示</span>
                  <input type="checkbox" checked={showGridAssist} onChange={() => setShowGridAssist(prev => !prev)} />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>警戒判定を行う</span>
                  <input type="checkbox" checked={threatDetectionEnabled} onChange={() => setThreatDetectionEnabled(prev => !prev)} />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>警戒表示を見せる</span>
                  <input type="checkbox" checked={threatDisplayEnabled} onChange={() => setThreatDisplayEnabled(prev => !prev)} />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>Undo / Redo を表示</span>
                  <input type="checkbox" checked={showHistoryControls} onChange={() => setShowHistoryControls(prev => !prev)} />
                </label>
                <label className="flex items-center justify-between gap-3">
                  <span>デバッグモード</span>
                  <input type="checkbox" checked={debugMode} onChange={() => setDebugMode(prev => !prev)} />
                </label>
              </div>
              <div className={`mt-3 text-[10px] ${theme.subtitle}`}>P を押しながら DEBUG と入力しても切り替えできます。</div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="my-2 grid min-h-0 flex-1 grid-cols-[minmax(12.5rem,14rem)_1fr_minmax(13rem,15rem)] gap-2">
        <div className="z-20 flex min-h-0 flex-col gap-2">
          <PanelCard title="対局設定" subtitle="モードと盤面サイズ" className={theme.panel} contentClassName="text-xs">
            <div className="space-y-3 text-xs">
              <label className="block">
                <div className={`mb-1 text-[10px] uppercase tracking-[0.16em] ${theme.subtitle}`}>モード</div>
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
                <div className={`mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] ${theme.subtitle}`}>
                  <span>盤面サイズ</span>
                  <span className={theme.title}>{size} x {size} x {size}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="8"
                  value={size}
                  onChange={(event) => setSettings({ ...settings, boardSize: Number(event.target.value) })}
                  className="w-full accent-emerald-500"
                />
                <div className={`mt-1 text-[10px] ${theme.subtitle}`}>サイズ変更時は現在の対局をリセットします。</div>
              </label>
            </div>
          </PanelCard>

          <PanelCard title="インスペクタ" subtitle="選択中マスの状態" className={theme.panel} contentClassName="text-xs">
            <div className="space-y-2.5 text-xs">
              <div className={`flex items-center justify-between rounded-xl border px-3 py-2 font-mono ${theme.card}`}>
                <span className={theme.subtitle}>カーソル</span>
                <span className="text-emerald-400">({cx}, {cy}, {cz})</span>
              </div>

              <div className={`space-y-2 rounded-xl border p-3 ${theme.card}`}>
                <div className="flex items-center justify-between">
                  <span className={theme.subtitle}>最後の手</span>
                  {currentCell?.lastPlayer ? (
                    <span className="flex items-center gap-2 font-medium">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          currentCell.lastPlayer === 'white' ? 'bg-white ring-1 ring-slate-400' : 'bg-black ring-1 ring-slate-500'
                        }`}
                      />
                      <span className={theme.title}>{currentCell.lastPlayer === 'white' ? '白' : '黒'}</span>
                    </span>
                  ) : (
                    <span className={theme.subtitle}>空</span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className={theme.subtitle}>位相</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3.5 w-3.5 rounded"
                      style={{
                        backgroundColor: currentPhaseStyle.swatch,
                        border: `1px solid ${currentPhaseStyle.border}`,
                      }}
                    />
                    <span className={`font-mono ${theme.title}`}>{currentCell?.phase ?? 0}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/72 px-2 py-2 text-center">
                    <div className={`text-[10px] ${theme.subtitle}`}>白コンボ</div>
                    <div className="text-sm font-semibold text-white">{currentCell?.streak.white ?? 0}</div>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/72 px-2 py-2 text-center">
                    <div className={`text-[10px] ${theme.subtitle}`}>黒コンボ</div>
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

        <div className="z-20 flex min-h-0 flex-col gap-2">
          <PanelCard title="断面表示" subtitle="表示する切り出し面" className={theme.panel} contentClassName="text-xs">
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-4 gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1">
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
                  <div className={`flex items-center justify-between ${theme.subtle}`}>
                    <span>{sliceAxis} 位置</span>
                    <span className={theme.title}>
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
                <div className={`rounded-xl border px-3 py-2 ${theme.card} ${theme.subtitle}`}>全断面を表示中</div>
              )}
            </div>
          </PanelCard>

          <PanelCard
            title="警戒"
            subtitle="危険な筋を確認"
            defaultCollapsed={threats.length === 0}
            className={theme.panel}
            contentClassName="text-xs"
          >
            <div className="max-h-[14rem] space-y-1.5 overflow-y-auto pr-1 text-xs">
              {threats.length === 0 ? (
                <div className={`rounded-xl border px-3 py-3 text-center ${theme.card} ${theme.subtitle}`}>現在は警戒がありません</div>
              ) : (
                threats.map((threat, index) => {
                  const targetCell = threat.cells[0];
                  const axis = sliceAxis === 'none' ? 'Z' : sliceAxis;
                  const isStreak = threat.type === 'streak_pressure';

                  return (
                    <button
                      key={`${threat.type}-${index}`}
                      onClick={() => focusOnCell(targetCell, axis)}
                      className={`w-full rounded-xl border px-2.5 py-2 text-left text-[11px] transition-colors ${
                        isStreak
                          ? 'border-red-900/60 bg-red-950/20 text-red-200 hover:bg-red-950/35'
                          : 'border-amber-900/60 bg-amber-950/20 text-amber-200 hover:bg-amber-950/35'
                      }`}
                      title={threat.description}
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={12} />
                        <span className="shrink-0 font-semibold">{isStreak ? '同位置警戒' : '5連警戒'}</span>
                        <span className="shrink-0 font-mono opacity-80">{targetCell.join(',')}</span>
                        <span className="min-w-0 truncate opacity-90">{compactThreatText(threat.description)}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </PanelCard>
        </div>
      </div>

      <div className="grid grid-cols-[minmax(10rem,12rem)_1fr_minmax(13rem,15rem)] items-end gap-2">
        <div className="w-full max-w-[11.5rem]">
          <PanelCard title="位相ガイド" subtitle="位相色の早見表" defaultCollapsed className={theme.panel} contentClassName="text-xs">
            <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
              {Array.from({ length: 10 }).map((_, phase) => {
                const whiteStyle = getPhaseLegendStyle(phase, 'white', visualTuning);
                const blackStyle = getPhaseLegendStyle(phase, 'black', visualTuning);
                return (
                  <div key={phase} className={`rounded-lg border px-2 py-1.5 ${theme.card}`}>
                    <div className={`mb-1 text-[9px] ${theme.subtitle}`}>{phase}</div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: whiteStyle.swatch, border: `1px solid ${whiteStyle.border}` }} />
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: blackStyle.swatch, border: `1px solid ${blackStyle.border}` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </PanelCard>
        </div>

        <div />

        <div className="w-full max-w-[15rem] justify-self-end">
          <PanelCard title="操作" subtitle="ドラッグ・ホイール・切替" defaultCollapsed className={theme.panel} contentClassName="text-xs">
            <div className="space-y-1.5 text-[11px] text-slate-300">
              {controlRows.map(([label, detail]) => (
                <div key={label} className={`rounded-xl border px-3 py-2 ${theme.card}`}>
                  <span className={theme.title}>{label}</span>
                  <span className={`ml-2 ${theme.subtitle}`}>{detail}</span>
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
