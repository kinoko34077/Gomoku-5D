import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpenText,
  Cpu,
  Eye,
  Gauge,
  HelpCircle,
  Layers3,
  Palette,
  Redo2,
  RotateCcw,
  Settings2,
  ShieldAlert,
  Undo2,
  User,
  X,
} from 'lucide-react';
import type { Threat } from '../gameLogic';
import { getPhaseLegendStyle } from '../phasePalette';
import { normalizeGameSettings, type Board, type Coordinate, type GameMode, type GameSettings, type Player, type WinInfo } from '../types';
import type { VisualTuning } from '../visualTuning';
import { PanelCard } from './PanelCard';
import { SessionSettingsForm } from './SessionSettingsForm';

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
  isGuideOpen: boolean;
  onGuideToggle: () => void;
  onCellClick: (x: number, y: number, z: number) => void;
}

type LeftPanelId = 'session' | 'inspector' | 'colors';
type RightPanelId = 'slice' | 'threats' | 'controls';
type PanelState = Record<LeftPanelId | RightPanelId, boolean>;

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

const INITIAL_PANEL_STATE: PanelState = {
  session: true,
  inspector: false,
  colors: false,
  slice: true,
  threats: false,
  controls: false,
};

function compactThreatText(description: string) {
  return description
    .replace(/白が1手で/g, '白1手')
    .replace(/黒が1手で/g, '黒1手')
    .replace(/同位置コンボ警戒/g, '同位置警戒')
    .replace(/XYZ \+ /g, '')
    .replace(/階段位相5連/g, '階段5連')
    .replace(/同位相5連/g, '同位相5連');
}

function HotkeyHint({ keyLabel }: { keyLabel: string }) {
  return (
    <span className="text-[10px] text-slate-400">
      (<span className="underline underline-offset-2">{keyLabel}</span>)
    </span>
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

function IconRailButton({
  icon,
  label,
  hotkey,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hotkey: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pointer-events-auto flex h-11 w-11 items-center justify-center rounded-2xl border backdrop-blur-md transition-all ${
        active
          ? 'border-white/25 bg-slate-950/90 text-white shadow-[0_0_24px_rgba(15,23,42,0.45)]'
          : 'border-white/10 bg-slate-950/10 text-slate-200 hover:border-white/18 hover:bg-slate-950/25'
      }`}
      title={`${label} (${hotkey})`}
    >
      {icon}
    </button>
  );
}

function isEditableTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName?.toLowerCase();
  return tag === 'input' || tag === 'select' || tag === 'textarea' || element.isContentEditable;
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
  isGuideOpen,
  onGuideToggle,
  onCellClick,
}) => {
  const [cx, cy, cz] = cursor;
  const size = settings.boardSize;
  const currentCell = board[cx]?.[cy]?.[cz];
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWinOverlayVisible, setIsWinOverlayVisible] = useState(false);
  const [panelState, setPanelState] = useState<PanelState>(INITIAL_PANEL_STATE);
  const settingsRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setIsSettingsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();
      if (key === 'escape') {
        setPanelState(prev => {
          const next = { ...prev };
          (Object.keys(next) as Array<keyof PanelState>).forEach(panelId => {
            next[panelId] = false;
          });
          return next;
        });
        setIsSettingsOpen(false);
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const panelByKey: Partial<Record<string, keyof PanelState>> = {
        m: 'session',
        i: 'inspector',
        c: 'colors',
        l: 'slice',
        v: 'threats',
        o: 'controls',
      };

      if (key === 'h') {
        event.preventDefault();
        onGuideToggle();
        return;
      }

      const panelId = panelByKey[key];
      if (!panelId) return;

      event.preventDefault();
      setPanelState(prev => ({
        ...prev,
        [panelId]: !prev[panelId],
      }));
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onGuideToggle]);

  const currentPhaseStyle = useMemo(
    () => getPhaseLegendStyle(currentCell?.phase ?? 0, currentCell?.lastPlayer ?? 'white', visualTuning),
    [currentCell?.phase, currentCell?.lastPlayer, visualTuning],
  );

  const theme = isBrightBackdrop
    ? {
        panel: 'bg-slate-950/95 border-slate-700/95 text-slate-100',
        title: 'text-slate-100',
        subtitle: 'text-slate-400',
        subtle: 'text-slate-400',
        card: 'bg-slate-900/80 border-slate-800',
        popup: 'bg-slate-950/98 border-slate-700/95 backdrop-blur-xl shadow-2xl',
      }
    : {
        panel: 'bg-slate-900/94 border-slate-700/85 text-slate-50',
        title: 'text-slate-100',
        subtitle: 'text-slate-400',
        subtle: 'text-slate-300',
        card: 'bg-slate-950/70 border-slate-800',
        popup: 'bg-slate-950/98 border-slate-700/90 backdrop-blur-xl shadow-2xl',
      };

  const focusOnCell = (coord: Coordinate, axis: 'X' | 'Y' | 'Z') => {
    setSliceAxis(axis);
    if (axis === 'X') setSliceIndex(coord[0]);
    if (axis === 'Y') setSliceIndex(coord[1]);
    if (axis === 'Z') setSliceIndex(coord[2]);
    onCursorChange(coord);
  };

  const togglePanel = (panelId: keyof PanelState) => {
    setPanelState(prev => ({
      ...prev,
      [panelId]: !prev[panelId],
    }));
  };

  return (
    <div className="pointer-events-none absolute inset-0 select-none text-white">
      <div className="absolute left-4 top-4 z-40 flex items-center gap-2">
        <div className={`pointer-events-auto rounded-2xl border px-3 py-2 shadow-2xl backdrop-blur-xl ${theme.panel}`}>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-emerald-400">
            <span>五次元五目並べ</span>
            <span className="text-slate-600">/</span>
            <span className={theme.subtitle}>位相五目</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
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
      </div>

      <div className={`pointer-events-auto absolute left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full border px-2 py-1.5 shadow-2xl backdrop-blur-xl ${theme.panel}`} ref={settingsRef}>
        {showHistoryControls ? (
          <>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`rounded-full p-2 transition-all ${canUndo ? 'text-slate-100 hover:bg-slate-800' : 'cursor-not-allowed text-slate-600'}`}
              title="元に戻す"
            >
              <Undo2 size={16} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`rounded-full p-2 transition-all ${canRedo ? 'text-slate-100 hover:bg-slate-800' : 'cursor-not-allowed text-slate-600'}`}
              title="やり直す"
            >
              <Redo2 size={16} />
            </button>
          </>
        ) : null}
        <button
          onClick={onReset}
          className="rounded-full p-2 text-slate-100 transition-colors hover:bg-slate-800 hover:text-red-300"
          title="対局をリセット"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={() => setIsSettingsOpen(prev => !prev)}
          className="rounded-full p-2 text-slate-100 transition-colors hover:bg-slate-800"
          title="設定"
        >
          <Settings2 size={16} />
        </button>
        <button
          onClick={onGuideToggle}
          className={`rounded-full p-2 transition-colors hover:bg-slate-800 ${isGuideOpen ? 'text-emerald-300' : 'text-slate-100'}`}
          title="遊び方と操作ガイド (H)"
        >
          <HelpCircle size={16} />
        </button>

        {isSettingsOpen ? (
          <div className={`absolute left-1/2 top-[calc(100%+0.65rem)] z-[85] w-72 -translate-x-1/2 rounded-[1.6rem] border p-4 text-xs ${theme.popup}`}>
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

      <div className="absolute left-4 top-28 z-40 flex items-start gap-3">
        <div className="pointer-events-auto flex flex-col gap-2 rounded-[1.4rem] border border-white/10 bg-slate-950/8 p-1.5 backdrop-blur-md">
          <IconRailButton icon={<Gauge size={17} />} label="対局設定" hotkey="M" active={panelState.session} onClick={() => togglePanel('session')} />
          <IconRailButton icon={<Eye size={17} />} label="インスペクタ" hotkey="I" active={panelState.inspector} onClick={() => togglePanel('inspector')} />
          <IconRailButton icon={<Palette size={17} />} label="色見本" hotkey="C" active={panelState.colors} onClick={() => togglePanel('colors')} />
        </div>

        <div className="flex flex-col gap-3">
          {panelState.session ? (
            <PanelCard
              title="対局設定"
              subtitle="開始前条件と現在ルール"
              className={`w-[20rem] ${theme.panel}`}
              contentClassName="max-h-[calc(100vh-12rem)] overflow-y-auto text-xs"
              onClose={() => togglePanel('session')}
              headerTrailing={<HotkeyHint keyLabel="M" />}
            >
              {debugMode ? (
                <div className="space-y-3">
                  <div className={`rounded-xl border px-3 py-2 ${theme.card} ${theme.subtitle}`}>
                    デバッグ中のみ対局設定をリアルタイム変更できます。
                  </div>
                  <SessionSettingsForm
                    settings={settings}
                    onSettingsChange={nextSettings => setSettings(normalizeGameSettings(nextSettings))}
                    gameMode={gameMode}
                    onGameModeChange={setGameMode}
                    compact
                  />
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className={`rounded-xl border px-3 py-2 ${theme.card}`}>
                    <div className={`text-[10px] uppercase tracking-[0.16em] ${theme.subtitle}`}>モード</div>
                    <div className={`mt-1 font-semibold ${theme.title}`}>
                      {gameMode === 'local'
                        ? 'ローカル2P'
                        : gameMode === 'ai_black'
                          ? '対AI: あなたは白'
                          : '対AI: あなたは黒'}
                    </div>
                  </div>
                  <div className={`rounded-xl border px-3 py-2 ${theme.card}`}>
                    <div className={`text-[10px] uppercase tracking-[0.16em] ${theme.subtitle}`}>ルール</div>
                    <div className={`mt-1 space-y-1 ${theme.title}`}>
                      <div>{size} x {size} x {size}</div>
                      <div>位相数 {settings.maxPhases}</div>
                      <div>XYZ {settings.winLength} 連 / 同位置 {settings.streakWinLength} 連</div>
                      <div>Undo {settings.undoRedoEnabled ? '有効' : '無効'}</div>
                      <div>持ち時間 {settings.timeLimitSeconds > 0 ? `${settings.timeLimitSeconds}秒` : '無制限'}</div>
                      <div>引き分け {settings.drawMoveLimit > 0 ? `${settings.drawMoveLimit}手` : 'なし'}</div>
                    </div>
                  </div>
                </div>
              )}
            </PanelCard>
          ) : null}

          {panelState.inspector ? (
            <PanelCard
              title="インスペクタ"
              subtitle="選択中マスの状態"
              className={`w-[18.5rem] ${theme.panel}`}
              contentClassName="max-h-[calc(100vh-12rem)] overflow-y-auto text-xs"
              onClose={() => togglePanel('inspector')}
              headerTrailing={<HotkeyHint keyLabel="I" />}
            >
              <div className="space-y-2.5">
                <div className={`flex items-center justify-between rounded-xl border px-3 py-2 font-mono ${theme.card}`}>
                  <span className={theme.subtitle}>カーソル</span>
                  <span className="text-emerald-400">({cx}, {cy}, {cz})</span>
                </div>
                <div className={`space-y-2 rounded-xl border p-3 ${theme.card}`}>
                  <div className="flex items-center justify-between">
                    <span className={theme.subtitle}>最後の手</span>
                    {currentCell?.lastPlayer ? (
                      <span className="flex items-center gap-2 font-medium">
                        <span className={`inline-block h-2.5 w-2.5 rounded-full ${currentCell.lastPlayer === 'white' ? 'bg-white ring-1 ring-slate-400' : 'bg-black ring-1 ring-slate-500'}`} />
                        <span className={theme.title}>{currentCell.lastPlayer === 'white' ? '白' : '黒'}</span>
                      </span>
                    ) : <span className={theme.subtitle}>空</span>}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={theme.subtitle}>位相</span>
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-3.5 rounded" style={{ backgroundColor: currentPhaseStyle.swatch, border: `1px solid ${currentPhaseStyle.border}` }} />
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
          ) : null}

          {panelState.colors ? (
            <PanelCard
              title="色見本"
              subtitle="位相ごとの白石 / 黒石"
              className={`w-[16rem] ${theme.panel}`}
              contentClassName="max-h-[calc(100vh-12rem)] overflow-y-auto text-xs"
              onClose={() => togglePanel('colors')}
              headerTrailing={<HotkeyHint keyLabel="C" />}
            >
              <div className="space-y-1.5">
                {Array.from({ length: settings.maxPhases }).map((_, phase) => {
                  const whiteStyle = getPhaseLegendStyle(phase, 'white', visualTuning);
                  const blackStyle = getPhaseLegendStyle(phase, 'black', visualTuning);
                  return (
                    <div key={phase} className={`flex items-center justify-between rounded-xl border px-3 py-2 ${theme.card}`}>
                      <span className={`w-6 text-[11px] font-mono ${theme.title}`}>{phase}</span>
                      <div className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: whiteStyle.swatch, border: `1px solid ${whiteStyle.border}` }} />
                        <span className="text-[10px] text-slate-400">白</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: blackStyle.swatch, border: `1px solid ${blackStyle.border}` }} />
                        <span className="text-[10px] text-slate-400">黒</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </PanelCard>
          ) : null}
        </div>
      </div>

      <div className="absolute right-4 top-28 z-40 flex items-start gap-3">
        <div className="flex flex-col gap-3">
          {panelState.slice ? (
            <PanelCard
              title="断面表示"
              subtitle="表示する切り出し面"
              className={`w-[18rem] ${theme.panel}`}
              contentClassName="max-h-[calc(100vh-12rem)] overflow-y-auto text-xs"
              onClose={() => togglePanel('slice')}
              headerTrailing={<HotkeyHint keyLabel="L" />}
            >
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-1 rounded-xl border border-slate-800 bg-slate-900 p-1">
                  {(['Z', 'Y', 'X', 'none'] as const).map(axis => (
                    <button
                      key={axis}
                      onClick={() => setSliceAxis(axis)}
                      className={`rounded-lg px-2 py-1.5 font-semibold transition-colors ${sliceAxis === axis ? 'bg-sky-500 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                    >
                      {axis === 'none' ? '全層' : axis}
                    </button>
                  ))}
                </div>

                {sliceAxis !== 'none' ? (
                  <div className="space-y-2">
                    <div className={`flex items-center justify-between ${theme.subtle}`}>
                      <span>{sliceAxis} 位置</span>
                      <span className={theme.title}>{sliceIndex} / {size - 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSliceIndex(Math.max(0, sliceIndex - 1))} className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800">-</button>
                      <input type="range" min="0" max={size - 1} value={sliceIndex} onChange={event => setSliceIndex(Number(event.target.value))} className="w-full accent-sky-500" />
                      <button onClick={() => setSliceIndex(Math.min(size - 1, sliceIndex + 1))} className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800">+</button>
                    </div>
                  </div>
                ) : (
                  <div className={`rounded-xl border px-3 py-2 ${theme.card} ${theme.subtitle}`}>全断面を表示中</div>
                )}
              </div>
            </PanelCard>
          ) : null}

          {panelState.threats ? (
            <PanelCard
              title="警戒"
              subtitle="危険な筋を確認"
              className={`w-[18rem] ${theme.panel}`}
              contentClassName="max-h-[calc(100vh-12rem)] overflow-y-auto text-xs"
              onClose={() => togglePanel('threats')}
              headerTrailing={<HotkeyHint keyLabel="V" />}
            >
              <div className="space-y-1.5">
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
          ) : null}

          {panelState.controls ? (
            <PanelCard
              title="操作方法"
              subtitle="ドラッグ・ホイール・切替"
              className={`w-[20rem] ${theme.panel}`}
              contentClassName="max-h-[calc(100vh-12rem)] overflow-y-auto text-xs"
              onClose={() => togglePanel('controls')}
              headerTrailing={<HotkeyHint keyLabel="O" />}
            >
              <div className="space-y-1.5 text-[11px] text-slate-300">
                {controlRows.map(([label, detail]) => (
                  <div key={label} className={`rounded-xl border px-3 py-2 ${theme.card}`}>
                    <span className={theme.title}>{label}</span>
                    <span className={`ml-2 ${theme.subtitle}`}>{detail}</span>
                  </div>
                ))}
              </div>
            </PanelCard>
          ) : null}
        </div>

        <div className="pointer-events-auto flex flex-col gap-2 rounded-[1.4rem] border border-white/10 bg-slate-950/8 p-1.5 backdrop-blur-md">
          <IconRailButton icon={<Layers3 size={17} />} label="断面表示" hotkey="L" active={panelState.slice} onClick={() => togglePanel('slice')} />
          <IconRailButton icon={<ShieldAlert size={17} />} label="警戒" hotkey="V" active={panelState.threats} onClick={() => togglePanel('threats')} />
          <IconRailButton icon={<BookOpenText size={17} />} label="操作方法" hotkey="O" active={panelState.controls} onClick={() => togglePanel('controls')} />
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
