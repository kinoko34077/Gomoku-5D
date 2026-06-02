import { useState } from 'react';
import { Wifi, Wrench, X } from 'lucide-react';
import type { GameMode, GameSettings } from '../types';
import { normalizeGameSettings } from '../types';
import { SessionSettingsForm } from './SessionSettingsForm';

interface StartScreenProps {
  initialSettings: GameSettings;
  initialGameMode: GameMode;
  onStartLocal: (settings: GameSettings, mode: GameMode) => void;
}

export function StartScreen({
  initialSettings,
  initialGameMode,
  onStartLocal,
}: StartScreenProps) {
  const [gameMode, setGameMode] = useState<GameMode>(initialGameMode);
  const [settings, setSettings] = useState<GameSettings>(initialSettings);
  const [isCreditsOpen, setIsCreditsOpen] = useState(false);

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
            クレジット
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center">
          <div className="max-w-4xl text-center">
            <div className="mb-4 inline-flex rounded-full border border-emerald-400/18 bg-emerald-400/10 px-4 py-1.5 text-[11px] font-semibold tracking-[0.3em] text-emerald-300 backdrop-blur-sm">
              PHASE GOMOKU 5D
            </div>
            <h1 className="text-5xl font-black tracking-[0.18em] text-white md:text-7xl">
              5次元五目並べ
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
              XYZ の立体 5 連、位相条件、同位置コンボが重なるローカル対戦プロトタイプです。
              現在はローカル対戦の完成度を優先し、オンライン対戦は仕様と型の整備まで進んでいます。
            </p>
          </div>

          <div className="mt-10 grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
            <div className="rounded-[2rem] border border-slate-700/75 bg-slate-950/52 p-4 shadow-2xl backdrop-blur-2xl md:p-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-lg font-bold text-white">ローカル対戦を開始</div>
                  <div className="mt-1 text-sm text-slate-400">
                    盤面サイズ、位相数、持ち時間、引き分け手数、Undo/Redo 設定をここで決めます。
                  </div>
                </div>
                <button
                  onClick={handleStartLocal}
                  className="rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 text-sm font-black tracking-[0.14em] text-slate-950 transition-transform active:scale-[0.98]"
                >
                  対局開始
                </button>
              </div>

              <div className="mt-5">
                <SessionSettingsForm
                  settings={settings}
                  onSettingsChange={applySettings}
                  gameMode={gameMode}
                  onGameModeChange={setGameMode}
                  variant="hero"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[2rem] border border-sky-900/55 bg-sky-950/22 p-5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-sky-500/30 bg-sky-500/12 p-3 text-sky-300">
                    <Wifi size={20} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">オンライン対戦</div>
                    <div className="mt-1 text-sm text-slate-300">
                      プロトコル仕様、部屋コード、revision 管理、再接続方針までは定義済みです。
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-2xl border border-sky-900/65 bg-slate-950/55 p-4 text-sm text-slate-300">
                  WebSocket と部屋権威の実装は未接続です。部屋作成、参加、再接続、rematch はその後に有効化します。
                </div>
              </div>

              <div className="rounded-[2rem] border border-amber-900/55 bg-amber-950/22 p-5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/12 p-3 text-amber-300">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <div className="text-lg font-bold text-white">現在の重点</div>
                    <div className="mt-1 text-sm text-slate-300">
                      文字化け修正、ローカル UI の整合、時計と手数上限の見え方、検証導線の安定化を優先しています。
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 text-[11px] tracking-[0.18em] text-slate-500">
          <span>位相</span>
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
                <p className="mt-1 text-sm text-slate-400">プロトタイプの構成と現在の対象範囲です。</p>
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
              <p>名称: Phase Gomoku 5D Prototype</p>
              <p>技術: React / TypeScript / Vite / Three.js</p>
              <p>対象: ローカル対戦、対AI、時計・手数制限、オンライン仕様草案</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
