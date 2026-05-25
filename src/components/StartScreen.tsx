import { useMemo, useState } from 'react';
import { Search, Users, Wifi, X } from 'lucide-react';
import { formatRoomCode, normalizeRoomCode } from '../online/protocol';
import type { GameMode, GameSettings } from '../types';
import { normalizeGameSettings } from '../types';
import { SessionSettingsForm } from './SessionSettingsForm';

type StartMode = 'local' | 'online_create' | 'online_join';

interface StartScreenProps {
  initialSettings: GameSettings;
  initialGameMode: GameMode;
  onStartLocal: (settings: GameSettings, mode: GameMode) => void;
}

const modeTabs: Array<{ id: StartMode; label: string }> = [
  { id: 'local', label: 'ローカル / AI' },
  { id: 'online_create', label: '部屋を作る' },
  { id: 'online_join', label: '部屋に入る' },
];

export function StartScreen({
  initialSettings,
  initialGameMode,
  onStartLocal,
}: StartScreenProps) {
  const [startMode, setStartMode] = useState<StartMode>('local');
  const [gameMode, setGameMode] = useState<GameMode>(initialGameMode);
  const [settings, setSettings] = useState<GameSettings>(initialSettings);
  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);

  const normalizedRoomCode = useMemo(() => formatRoomCode(joinRoomCode), [joinRoomCode]);

  const applySettings = (nextSettings: GameSettings) => {
    setSettings(normalizeGameSettings(nextSettings));
  };

  const handleStartLocal = () => {
    onStartLocal(normalizeGameSettings(settings), gameMode);
  };

  return (
    <div className="absolute inset-0 z-[120] overflow-hidden bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.82)_0%,rgba(15,23,42,0.9)_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.18)_0%,rgba(2,6,23,0.78)_70%,rgba(2,6,23,0.94)_100%)]" />
      <div className="relative flex min-h-screen flex-col justify-between px-6 py-7">
        <div className="flex justify-end">
          <button
            onClick={() => setIsCreditsOpen(true)}
            className="pointer-events-auto rounded-full border border-slate-700/80 bg-slate-950/42 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-slate-300 backdrop-blur-md transition-colors hover:border-slate-500 hover:text-white"
          >
            CREDITS
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center">
          <div className="max-w-4xl text-center">
            <div className="mb-4 inline-flex rounded-full border border-emerald-400/18 bg-emerald-400/10 px-4 py-1.5 text-[11px] font-semibold tracking-[0.3em] text-emerald-300 backdrop-blur-sm">
              GOMOKU 5D / PHASE GOMOKU
            </div>
            <h1 className="text-5xl font-black tracking-[0.22em] text-white md:text-7xl">五次元五目並べ</h1>
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
              XYZ の立体 5 連と位相条件、同位置コンボを重ねて競う五目並べです。対局前に条件を決め、必要な時だけ UI を開いて盤面に集中できる構成へ整えます。
            </p>
          </div>

          <div className="mt-10 flex w-full max-w-4xl flex-wrap items-center justify-center gap-2 rounded-full border border-slate-700/75 bg-slate-950/48 p-2 backdrop-blur-xl">
            {modeTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setStartMode(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  startMode === tab.id
                    ? 'bg-white text-slate-950 shadow-[0_0_24px_rgba(255,255,255,0.18)]'
                    : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6 w-full max-w-6xl rounded-[2rem] border border-slate-700/75 bg-slate-950/52 p-4 shadow-2xl backdrop-blur-2xl md:p-5">
            {startMode === 'local' ? (
              <div className="space-y-5">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <div className="text-lg font-bold text-white">対局開始設定</div>
                    <div className="mt-1 text-sm text-slate-400">中央で条件を決め、盤面へそのまま入ります。</div>
                  </div>
                  <button
                    onClick={handleStartLocal}
                    className="rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 text-sm font-black tracking-[0.14em] text-slate-950 transition-transform active:scale-[0.98]"
                  >
                    START GAME
                  </button>
                </div>

                <SessionSettingsForm
                  settings={settings}
                  onSettingsChange={applySettings}
                  gameMode={gameMode}
                  onGameModeChange={setGameMode}
                  variant="hero"
                />
              </div>
            ) : null}

            {startMode === 'online_create' ? (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-sky-500/30 bg-sky-500/12 p-3 text-sky-300">
                    <Wifi size={20} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">部屋を作る</div>
                    <div className="mt-1 text-sm text-slate-400">対局条件はここで確定し、部屋作成時にそのまま送信する想定です。</div>
                  </div>
                </div>

                <SessionSettingsForm
                  settings={settings}
                  onSettingsChange={applySettings}
                  gameMode={gameMode}
                  onGameModeChange={setGameMode}
                  variant="hero"
                />

                <div className="rounded-2xl border border-sky-900/55 bg-sky-950/18 px-4 py-3 text-sm text-sky-100">
                  部屋番号発行と通信接続は次段階です。UI と設定受け皿のみ先行しています。
                </div>
              </div>
            ) : null}

            {startMode === 'online_join' ? (
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_20rem]">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-violet-500/30 bg-violet-500/12 p-3 text-violet-300">
                      <Users size={20} />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-white">部屋番号で参加</div>
                      <div className="mt-1 text-sm text-slate-400">共有された番号を入力して参加する導線です。</div>
                    </div>
                  </div>

                  <label className="block rounded-2xl border border-slate-800 bg-slate-950/48 px-4 py-4">
                    <div className="mb-2 text-xs font-semibold text-slate-200">部屋番号</div>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3">
                      <Search size={18} className="text-slate-500" />
                      <input
                        value={normalizedRoomCode}
                        onChange={event => setJoinRoomCode(normalizeRoomCode(event.target.value))}
                        placeholder="ABC-DEF"
                        className="w-full bg-transparent text-lg font-black tracking-[0.28em] text-white outline-none placeholder:text-slate-600"
                      />
                    </div>
                    <div className="mt-2 text-xs text-slate-400">英数字 6 文字。表示は `ABC-DEF` に整形します。</div>
                  </label>
                </div>

                <div className="rounded-2xl border border-violet-900/55 bg-violet-950/18 px-4 py-4 text-sm text-violet-100">
                  参加側は対局条件を変更せず、サーバから権威 snapshot を受け取る前提です。通信層接続後に有効化します。
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 text-[11px] tracking-[0.18em] text-slate-500">
          <span>PHASE</span>
          <span>XYZ + 位相条件</span>
          <span>同位置コンボ</span>
        </div>
      </div>

      {isCreditsOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-700 bg-slate-950/96 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">クレジット</h2>
                <p className="mt-1 text-sm text-slate-400">プロトタイプ仕様と現行実装の整合ベース</p>
              </div>
              <button
                onClick={() => setIsCreditsOpen(false)}
                className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                title="閉じる"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
              <p>企画 / 仕様: Phase Gomoku 5D Prototype</p>
              <p>実装基盤: React / TypeScript / Vite / Three.js</p>
              <p>対局設計: ローカル / AI / オンライン拡張前提</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
