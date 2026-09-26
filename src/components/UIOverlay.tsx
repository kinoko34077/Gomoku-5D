import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpenText,
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
  X,
} from 'lucide-react';
import type { Threat } from '../gameLogic';
import { getPhaseLegendStyle } from '../phasePalette';
import {
  normalizeGameSettings,
  type Board,
  type Coordinate,
  type FooterInfoMode,
  type GameMode,
  type GameSettings,
  type Player,
  type PlayerClock,
  type WinInfo,
} from '../types';
import type { VisualTuning } from '../visualTuning';
import {
  formatAxisIndexToXLabel,
  formatAxisIndexToYLabel,
  formatAxisIndexToZLabel,
  formatDisplayCoordinate,
} from './gameBoardHelpers';
import { PanelCard } from './PanelCard';
import { SessionSettingsForm } from './SessionSettingsForm';
import { useModalFocus } from '../hooks/useModalFocus';

interface UIOverlayProps {
  board: Board;
  settings: GameSettings;
  setSettings: (s: GameSettings) => void;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  activePlayer: Player;
  cursor: Coordinate;
  hoveredCoord: Coordinate | null;
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
  threatsEnabled: boolean;
  setThreatsEnabled: (value: boolean | ((prev: boolean) => boolean)) => void;
  showRuler: boolean;
  setShowRuler: (value: boolean | ((prev: boolean) => boolean)) => void;
  footerInfoMode: FooterInfoMode;
  setFooterInfoMode: (value: FooterInfoMode) => void;
  debugMode: boolean;
  setDebugMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  showHistoryControls: boolean;
  setShowHistoryControls: (value: boolean | ((prev: boolean) => boolean)) => void;
  onUndo: () => void;
  onRedo: () => void;
  onReset: () => void;
  onRematch: () => void;
  onReturnToTitle: () => void;
  canUndo: boolean;
  canRedo: boolean;
  moveCount: number;
  playerClockMs: PlayerClock;
  isGuideOpen: boolean;
  onGuideToggle: () => void;
  onCellClick: (x: number, y: number, z: number) => void;
}

type LeftPanelId = 'display' | 'inspector' | 'colors';
type RightPanelId = 'slice' | 'threats' | 'controls';
type PanelState = Record<LeftPanelId | RightPanelId, boolean>;

const controlRows = [
  ['矢印 / WASD', 'カーソル移動'],
  ['Q / E', 'Z 軸へ移動'],
  ['Enter / Space', '現在マスに置く'],
  ['Ctrl+Z / Ctrl+Y', 'Undo / Redo'],
  ['G', 'グリッド補助の表示切替'],
  ['H', 'ガイドの開閉'],
  ['M / I / C', '左パネル切替'],
  ['L / V / O', '右パネル切替'],
] as const;

const INITIAL_PANEL_STATE: PanelState = {
  display: false,
  inspector: false,
  colors: false,
  slice: true,
  threats: false,
  controls: false,
};

function formatClock(ms: number | null) {
  if (ms === null) return '時間制なし';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getModeLabel(gameMode: GameMode) {
  if (gameMode === 'local') return 'ローカル 2P';
  if (gameMode === 'ai_black') return '対 AI: あなたが白';
  return '対 AI: あなたが黒';
}

function getThreatLabel(threat: Threat) {
  if (threat.type === 'streak_pressure') return 'streak 警戒';
  if (threat.type === 'phase_4') return '同位相 4 連';
  return '連番 4 連';
}

function formatSliceIndexLabel(axis: 'X' | 'Y' | 'Z', index: number) {
  if (axis === 'X') return formatAxisIndexToXLabel(index);
  if (axis === 'Y') return formatAxisIndexToYLabel(index);
  return formatAxisIndexToZLabel(index);
}

function HotkeyHint({ keyLabel }: { keyLabel: string }) {
  return (
    <span className="text-[10px] text-slate-400">
      (<span className="underline underline-offset-2">{keyLabel}</span>)
    </span>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center justify-between gap-3 rounded-xl border border-slate-800/90 px-3 py-2 ${disabled ? 'opacity-50' : ''}`}>
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
    </label>
  );
}

function FooterModePicker({
  value,
  onChange,
}: {
  value: FooterInfoMode;
  onChange: (next: FooterInfoMode) => void;
}) {
  const options: Array<{ value: FooterInfoMode; label: string }> = [
    { value: 'always', label: '常時' },
    { value: 'hover', label: 'ホバー時' },
    { value: 'hidden', label: '非表示' },
  ];

  return (
    <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-800 bg-slate-950/70 p-1">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
            value === option.value ? 'bg-emerald-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function SummaryClock({
  label,
  active,
  value,
}: {
  label: string;
  active: boolean;
  value: string;
}) {
  return (
    <div className={`rounded-2xl border px-3 py-2 ${active ? 'border-emerald-400/35 bg-emerald-500/10' : 'border-slate-800 bg-slate-950/55'}`}>
      <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className={`mt-1 text-lg font-bold ${active ? 'text-emerald-300' : 'text-slate-100'}`}>{value}</div>
    </div>
  );
}

function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialogRef = useModalFocus<HTMLDivElement>(true, onClose);

  return (
    <div className="pointer-events-auto fixed inset-0 z-[95] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-title-confirm-title"
        tabIndex={-1}
        className="w-full max-w-sm rounded-3xl border border-slate-700 bg-slate-950/96 p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="return-title-confirm-title" className="text-lg font-bold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            title="閉じる"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-rose-400"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function WinOverlay({
  winInfo,
  onClose,
  onRematch,
  onReturnToTitle,
}: {
  winInfo: WinInfo;
  onClose: () => void;
  onRematch: () => void;
  onReturnToTitle: () => void;
}) {
  const title = winInfo.type === 'draw'
    ? '引き分け'
    : winInfo.winner === 'white'
      ? '白の勝ち'
      : '黒の勝ち';
  const subtitle = winInfo.type === 'streak'
    ? 'streak 勝利'
    : winInfo.type === 'timeout'
      ? '時間切れ'
      : winInfo.type === 'draw'
        ? '手数上限に到達'
        : 'XYZ + 位相勝利';
  const dialogRef = useModalFocus<HTMLDivElement>(true, onClose);

  return (
    <div className="pointer-events-auto fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="win-overlay-title"
        tabIndex={-1}
        className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-950/96 p-6 text-center shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <div />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            title="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mx-auto mt-1 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 text-3xl font-black text-slate-950">
          {winInfo.type === 'draw' ? '=' : 'W'}
        </div>
        <h2 id="win-overlay-title" className="mt-4 text-2xl font-black tracking-wide text-yellow-300">{title}</h2>
        <div className="mt-1 text-[11px] tracking-[0.2em] text-slate-500">{subtitle}</div>
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/72 p-4 text-sm leading-7 text-slate-200">
          {winInfo.description}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onReturnToTitle}
            className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-100 transition-colors hover:bg-slate-800"
          >
            タイトルに戻る
          </button>
          <button
            type="button"
            onClick={onRematch}
            className="rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition-transform active:scale-[0.98]"
          >
            再戦
          </button>
        </div>
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

export function UIOverlay({
  board,
  settings,
  setSettings,
  gameMode,
  setGameMode,
  activePlayer,
  cursor,
  hoveredCoord,
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
  threatsEnabled,
  setThreatsEnabled,
  showRuler,
  setShowRuler,
  footerInfoMode,
  setFooterInfoMode,
  debugMode,
  setDebugMode,
  showHistoryControls,
  setShowHistoryControls,
  onUndo,
  onRedo,
  onReset,
  onRematch,
  onReturnToTitle,
  canUndo,
  canRedo,
  moveCount,
  playerClockMs,
  isGuideOpen,
  onGuideToggle,
  onCellClick,
}: UIOverlayProps) {
  const [cx, cy, cz] = cursor;
  const size = settings.boardSize;
  const currentCell = board[cx]?.[cy]?.[cz];
  const [isWinOverlayVisible, setIsWinOverlayVisible] = useState(false);
  const [isReturnToTitleConfirmOpen, setIsReturnToTitleConfirmOpen] = useState(false);
  const [panelState, setPanelState] = useState<PanelState>(INITIAL_PANEL_STATE);
  const isBrightBackdrop = visualTuning.backgroundGray >= 92;

  useEffect(() => {
    setIsWinOverlayVisible(Boolean(winInfo));
  }, [winInfo]);

  useEffect(() => {
    if (!threatsEnabled) {
      setPanelState(prev => ({ ...prev, threats: false }));
    }
  }, [threatsEnabled]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const key = event.key.toLowerCase();
      if (key === 'escape') {
        setIsReturnToTitleConfirmOpen(false);
        return;
      }

      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const panelByKey: Partial<Record<string, keyof PanelState>> = {
        m: 'display',
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
      if (panelId === 'threats' && !threatsEnabled) return;

      event.preventDefault();
      setPanelState(prev => ({
        ...prev,
        [panelId]: !prev[panelId],
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onGuideToggle, threatsEnabled]);

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

  const footerVisible = footerInfoMode === 'always' || (footerInfoMode === 'hover' && hoveredCoord !== null);
  const displayedCoord = hoveredCoord ?? cursor;
  const moveHeadline = `現在 ${moveCount}手目`;
  const playerLabel = activePlayer === 'white' ? '白' : '黒';
  const cellOwnerLabel = currentCell?.lastPlayer === 'white'
    ? '白'
    : currentCell?.lastPlayer === 'black'
      ? '黒'
      : 'なし';
  const sliceLabel = sliceAxis === 'none' ? '全表示' : `${sliceAxis}:${formatSliceIndexLabel(sliceAxis, sliceIndex)}`;

  const togglePanel = (panelId: keyof PanelState) => {
    if (panelId === 'threats' && !threatsEnabled) return;
    setPanelState(prev => ({
      ...prev,
      [panelId]: !prev[panelId],
    }));
  };

  const focusOnCell = (coord: Coordinate, axis: 'X' | 'Y' | 'Z') => {
    setSliceAxis(axis);
    if (axis === 'X') setSliceIndex(coord[0]);
    if (axis === 'Y') setSliceIndex(coord[1]);
    if (axis === 'Z') setSliceIndex(coord[2]);
    onCursorChange(coord);
  };

  const handleConfirmReturnToTitle = () => {
    setIsReturnToTitleConfirmOpen(false);
    onReturnToTitle();
  };

  return (
    <div className="pointer-events-none absolute inset-0 select-none text-white">
      <div className="absolute left-4 top-4 z-40 w-[18rem] max-w-[calc(100vw-7rem)]">
        <div className={`pointer-events-auto rounded-3xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${theme.panel}`}>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-emerald-400">
            <span>現在の対局</span>
            <span className="text-slate-600">/</span>
            <span className={theme.subtitle}>{getModeLabel(gameMode)}</span>
          </div>
          <div className="mt-2 text-3xl font-black tracking-wide text-white">{moveHeadline}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-300">
              {playerLabel}の手番
            </span>
            {settings.drawMoveLimit > 0 ? (
              <span className="rounded-full border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-slate-300">
                引き分け上限 {settings.drawMoveLimit} 手
              </span>
            ) : null}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <SummaryClock label="白" active={activePlayer === 'white'} value={formatClock(playerClockMs.white)} />
            <SummaryClock label="黒" active={activePlayer === 'black'} value={formatClock(playerClockMs.black)} />
          </div>
        </div>
      </div>

      <div className="absolute right-4 top-4 z-40">
        <button
          type="button"
          onClick={() => setIsReturnToTitleConfirmOpen(true)}
          className="pointer-events-auto rounded-2xl border border-slate-700 bg-slate-950/88 px-4 py-3 text-sm font-semibold text-slate-100 shadow-2xl backdrop-blur-xl transition-colors hover:bg-slate-900"
        >
          タイトルに戻る
        </button>
      </div>

      <div
        className={`pointer-events-auto absolute left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full border px-2 py-1.5 shadow-2xl backdrop-blur-xl ${theme.panel}`}
      >
        {showHistoryControls && settings.undoRedoEnabled ? (
          <>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`rounded-full p-2 transition-all ${canUndo ? 'text-slate-100 hover:bg-slate-800' : 'cursor-not-allowed text-slate-600'}`}
              title="ひとつ戻す"
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
          onClick={() => togglePanel('display')}
          className={`rounded-full p-2 transition-colors hover:bg-slate-800 ${panelState.display ? 'bg-slate-800 text-emerald-300' : 'text-slate-100'}`}
          title="表示設定 (M)"
        >
          <Settings2 size={16} />
        </button>
        <button
          onClick={onGuideToggle}
          className={`rounded-full p-2 transition-colors hover:bg-slate-800 ${isGuideOpen ? 'text-emerald-300' : 'text-slate-100'}`}
          title="ガイドを開く (H)"
        >
          <HelpCircle size={16} />
        </button>
      </div>

      <div className="absolute left-4 top-[12.5rem] z-40 flex items-start gap-3">
        <div className="pointer-events-auto flex flex-col gap-2 rounded-[1.4rem] border border-white/10 bg-slate-950/8 p-1.5 backdrop-blur-md">
          <IconRailButton icon={<Gauge size={17} />} label="表示設定" hotkey="M" active={panelState.display} onClick={() => togglePanel('display')} />
          <IconRailButton icon={<Eye size={17} />} label="セル詳細" hotkey="I" active={panelState.inspector} onClick={() => togglePanel('inspector')} />
          <IconRailButton icon={<Palette size={17} />} label="位相配色" hotkey="C" active={panelState.colors} onClick={() => togglePanel('colors')} />
        </div>

        <div className="flex flex-col gap-3">
          {panelState.display ? (
            <PanelCard
              title="表示設定"
              subtitle="HUD と盤面補助の設定"
              className={`w-[20rem] ${theme.panel}`}
              contentClassName="max-h-[calc(100vh-12rem)] overflow-y-auto text-xs"
              onClose={() => togglePanel('display')}
              headerTrailing={<HotkeyHint keyLabel="M" />}
            >
              <div className="space-y-3">
                <ToggleRow label="グリッド補助を表示" checked={showGridAssist} onChange={() => setShowGridAssist(prev => !prev)} />
                <ToggleRow label="ルーラーを表示" checked={showRuler} onChange={() => setShowRuler(prev => !prev)} />
                <ToggleRow label="脅威表示を有効化" checked={threatsEnabled} onChange={() => setThreatsEnabled(prev => !prev)} />
                <ToggleRow label="Undo / Redo を表示" checked={showHistoryControls} onChange={() => setShowHistoryControls(prev => !prev)} disabled={!settings.undoRedoEnabled} />
                <ToggleRow label="デバッグ表示" checked={debugMode} onChange={() => setDebugMode(prev => !prev)} />
                <div className={`rounded-xl border px-3 py-3 ${theme.card}`}>
                  <div className={`mb-2 text-[11px] font-semibold ${theme.title}`}>フッター表示</div>
                  <FooterModePicker value={footerInfoMode} onChange={setFooterInfoMode} />
                </div>
                {debugMode ? (
                  <div className="space-y-3">
                    <div className={`rounded-xl border px-3 py-2 ${theme.card} ${theme.subtitle}`}>
                      デバッグ表示中のみ、ここから対局設定をその場で変更できます。
                    </div>
                    <SessionSettingsForm
                      settings={settings}
                      onSettingsChange={nextSettings => setSettings(normalizeGameSettings(nextSettings))}
                      gameMode={gameMode}
                      onGameModeChange={setGameMode}
                      compact
                    />
                  </div>
                ) : null}
              </div>
            </PanelCard>
          ) : null}

          {panelState.inspector ? (
            <PanelCard
              title="セル詳細"
              subtitle="現在カーソル位置の情報"
              className={`w-[18.5rem] ${theme.panel}`}
              contentClassName="max-h-[calc(100vh-12rem)] overflow-y-auto text-xs"
              onClose={() => togglePanel('inspector')}
              headerTrailing={<HotkeyHint keyLabel="I" />}
            >
              <div className="space-y-2.5">
                <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${theme.card}`}>
                  <span className={theme.subtitle}>座標</span>
                  <span className="font-semibold tracking-[0.18em] text-emerald-400">{formatDisplayCoordinate(cursor)}</span>
                </div>
                <div className={`space-y-2 rounded-xl border p-3 ${theme.card}`}>
                  <div className="flex items-center justify-between">
                    <span className={theme.subtitle}>最後に置いた色</span>
                    <span className={theme.title}>{cellOwnerLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={theme.subtitle}>位相</span>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3.5 w-3.5 rounded"
                        style={{ backgroundColor: currentPhaseStyle.swatch, border: `1px solid ${currentPhaseStyle.border}` }}
                      />
                      <span className={`font-mono ${theme.title}`}>{currentCell?.phase ?? 0}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="rounded-lg border border-slate-800 bg-slate-950/72 px-2 py-2 text-center">
                      <div className={`text-[10px] ${theme.subtitle}`}>白 streak</div>
                      <div className="text-sm font-semibold text-white">{currentCell?.streak.white ?? 0}</div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-slate-950/72 px-2 py-2 text-center">
                      <div className={`text-[10px] ${theme.subtitle}`}>黒 streak</div>
                      <div className="text-sm font-semibold text-slate-300">{currentCell?.streak.black ?? 0}</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onCellClick(cx, cy, cz)}
                  className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2 font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20"
                >
                  このマスに置く
                </button>
              </div>
            </PanelCard>
          ) : null}

          {panelState.colors ? (
            <PanelCard
              title="位相配色"
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

      <div className="absolute right-4 top-32 z-40 flex items-start gap-3">
        <div className="flex flex-col gap-3">
          {panelState.slice ? (
            <PanelCard
              title="スライス表示"
              subtitle="見たい断面を切り替える"
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
                      {axis === 'none' ? '全表示' : axis}
                    </button>
                  ))}
                </div>

                {sliceAxis !== 'none' ? (
                  <div className="space-y-2">
                    <div className={`flex items-center justify-between ${theme.subtle}`}>
                      <span>{sliceAxis} 軸の断面</span>
                      <span className={theme.title}>
                        {formatSliceIndexLabel(sliceAxis, sliceIndex)} / {formatSliceIndexLabel(sliceAxis, size - 1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSliceIndex(Math.max(0, sliceIndex - 1))} className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800">-</button>
                      <input type="range" min="0" max={size - 1} value={sliceIndex} onChange={event => setSliceIndex(Number(event.target.value))} className="w-full accent-sky-500" />
                      <button onClick={() => setSliceIndex(Math.min(size - 1, sliceIndex + 1))} className="rounded-lg border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800">+</button>
                    </div>
                  </div>
                ) : (
                  <div className={`rounded-xl border px-3 py-2 ${theme.card} ${theme.subtitle}`}>全断面を同時表示しています。</div>
                )}
              </div>
            </PanelCard>
          ) : null}

          {threatsEnabled && panelState.threats ? (
            <PanelCard
              title="脅威表示"
              subtitle="現在検出されている危険手"
              className={`w-[18rem] ${theme.panel}`}
              contentClassName="max-h-[calc(100vh-12rem)] overflow-y-auto text-xs"
              onClose={() => togglePanel('threats')}
              headerTrailing={<HotkeyHint keyLabel="V" />}
            >
              <div className="space-y-1.5">
                {threats.length === 0 ? (
                  <div className={`rounded-xl border px-3 py-3 text-center ${theme.card} ${theme.subtitle}`}>現在は脅威が検出されていません。</div>
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
                          <span className="shrink-0 font-semibold">{getThreatLabel(threat)}</span>
                          <span className="shrink-0 font-semibold tracking-[0.16em] opacity-80">{formatDisplayCoordinate(targetCell)}</span>
                        </div>
                        <div className="mt-1 text-[10px] opacity-85">{threat.description}</div>
                      </button>
                    );
                  })
                )}
              </div>
            </PanelCard>
          ) : null}

          {panelState.controls ? (
            <PanelCard
              title="操作ガイド"
              subtitle="キーボードと表示切替"
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
          <IconRailButton icon={<Layers3 size={17} />} label="スライス表示" hotkey="L" active={panelState.slice} onClick={() => togglePanel('slice')} />
          {threatsEnabled ? (
            <IconRailButton icon={<ShieldAlert size={17} />} label="脅威表示" hotkey="V" active={panelState.threats} onClick={() => togglePanel('threats')} />
          ) : null}
          <IconRailButton icon={<BookOpenText size={17} />} label="操作ガイド" hotkey="O" active={panelState.controls} onClick={() => togglePanel('controls')} />
        </div>
      </div>

      {winInfo && !isWinOverlayVisible ? (
        <button
          type="button"
          onClick={() => setIsWinOverlayVisible(true)}
          className="pointer-events-auto absolute right-4 z-40 rounded-full border border-amber-400/35 bg-amber-500/12 px-4 py-2 text-sm font-semibold text-amber-200 shadow-xl backdrop-blur-md"
          style={{ bottom: footerVisible ? '6.5rem' : '1rem' }}
        >
          対局終了
        </button>
      ) : null}

      {footerVisible ? (
        <div className={`pointer-events-auto absolute inset-x-4 bottom-4 z-40 rounded-3xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${theme.panel}`}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            <span><span className={theme.subtitle}>モード:</span> {getModeLabel(gameMode)}</span>
            <span><span className={theme.subtitle}>盤面:</span> {size} x {size} x {size}</span>
            <span><span className={theme.subtitle}>位相:</span> {settings.maxPhases}</span>
            <span><span className={theme.subtitle}>勝利:</span> XYZ {settings.winLength} 連 / streak {settings.streakWinLength} 連</span>
            <span><span className={theme.subtitle}>持ち時間:</span> {settings.timeLimitSeconds > 0 ? `${settings.timeLimitSeconds} 秒` : '時間制なし'}</span>
            <span><span className={theme.subtitle}>引き分け:</span> {settings.drawMoveLimit > 0 ? `${settings.drawMoveLimit} 手` : 'なし'}</span>
            <span><span className={theme.subtitle}>スライス:</span> {sliceLabel}</span>
          </div>
          <div className={`mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs ${theme.title}`}>
            {hoveredCoord ? (
              <>
                <span><span className={theme.subtitle}>ホバー:</span> <span className="font-semibold tracking-[0.16em]">{formatDisplayCoordinate(hoveredCoord)}</span></span>
                <span><span className={theme.subtitle}>選択:</span> <span className="font-semibold tracking-[0.16em]">{formatDisplayCoordinate(cursor)}</span></span>
              </>
            ) : (
              <span><span className={theme.subtitle}>座標:</span> <span className="font-semibold tracking-[0.16em]">{formatDisplayCoordinate(displayedCoord)}</span></span>
            )}
          </div>
        </div>
      ) : null}

      {winInfo && isWinOverlayVisible ? (
        <WinOverlay
          winInfo={winInfo}
          onClose={() => setIsWinOverlayVisible(false)}
          onRematch={onRematch}
          onReturnToTitle={onReturnToTitle}
        />
      ) : null}

      {isReturnToTitleConfirmOpen ? (
        <ConfirmDialog
          title="タイトルに戻りますか？"
          body="現在の対局を終了してタイトルに戻りますか？ この操作で盤面と履歴はリセットされます。"
          confirmLabel="タイトルに戻る"
          onConfirm={handleConfirmReturnToTitle}
          onClose={() => setIsReturnToTitleConfirmOpen(false)}
        />
      ) : null}
    </div>
  );
}
