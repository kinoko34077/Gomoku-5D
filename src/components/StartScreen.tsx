import { useMemo, useState } from 'react';
import { HelpCircle, Search, Users, Wifi, X } from 'lucide-react';
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
    <div className="absolute inset-0 z-[120] overflow-auto bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_28%),linear-gradient(180deg,#030712_0%,#111827_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8">
        <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,1.1fr)_24rem]">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold tracking-[0.24em] text-emerald-300">
                GOMOKU 5D / PHASE GOMOKU
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-[0.08em] text-white md:text-5xl">五次元五目並べ</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                  XYZ の立体 5 連に、位相と同位置コンボを重ねた対戦ゲームです。開始前に対局条件を決めてから遊び、デバッグモード時のみ対局中のリアルタイム変更を許可します。
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <button
                onClick={() => setStartMode('local')}
                className={`rounded-3xl border p-5 text-left transition-all ${
                  startMode === 'local'
                    ? 'border-emerald-400 bg-emerald-400/10 text-white shadow-[0_0_30px_rgba(16,185,129,0.18)]'
                    : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="text-lg font-bold">ローカル / AI</div>
                <div className="mt-2 text-sm text-slate-400">1 台で遊ぶか、AI と遊ぶ設定をここで決めます。</div>
              </button>

              <button
                onClick={() => setStartMode('online_create')}
                className={`rounded-3xl border p-5 text-left transition-all ${
                  startMode === 'online_create'
                    ? 'border-sky-400 bg-sky-400/10 text-white shadow-[0_0_30px_rgba(56,189,248,0.18)]'
                    : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 text-lg font-bold">
                  <Wifi size={18} />
                  <span>部屋を作る</span>
                </div>
                <div className="mt-2 text-sm text-slate-400">オンライン用の部屋設定と共有番号の導線です。</div>
              </button>

              <button
                onClick={() => setStartMode('online_join')}
                className={`rounded-3xl border p-5 text-left transition-all ${
                  startMode === 'online_join'
                    ? 'border-violet-400 bg-violet-400/10 text-white shadow-[0_0_30px_rgba(139,92,246,0.18)]'
                    : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2 text-lg font-bold">
                  <Users size={18} />
                  <span>部屋に入る</span>
                </div>
                <div className="mt-2 text-sm text-slate-400">部屋番号検索と参加導線をここにまとめます。</div>
              </button>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/60 p-6 shadow-2xl backdrop-blur-xl">
              {startMode === 'local' ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">対局開始設定</h2>
                    <p className="mt-1 text-sm text-slate-400">ローカル 2P / 対 AI の開始条件をここで決めます。</p>
                  </div>

                  <SessionSettingsForm
                    settings={settings}
                    onSettingsChange={applySettings}
                    gameMode={gameMode}
                    onGameModeChange={setGameMode}
                  />

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleStartLocal}
                      className="rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 font-bold text-slate-950 transition-transform active:scale-[0.98]"
                    >
                      この設定で開始
                    </button>
                    <button
                      onClick={() => setIsCreditsOpen(true)}
                      className="rounded-2xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-900"
                    >
                      クレジット
                    </button>
                  </div>
                </div>
              ) : null}

              {startMode === 'online_create' ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">部屋作成</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      部屋番号、同期、再接続の設計は入っています。通信バックエンド接続は次段階です。
                    </p>
                  </div>

                  <SessionSettingsForm
                    settings={settings}
                    onSettingsChange={applySettings}
                    gameMode={gameMode}
                    onGameModeChange={setGameMode}
                  />

                  <div className="rounded-2xl border border-sky-900/50 bg-sky-950/20 px-4 py-3 text-sm text-sky-100">
                    ここで設定した内容は、将来のルーム作成時にそのまま初期対局条件として送信します。
                  </div>

                  <button
                    disabled
                    className="cursor-not-allowed rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-3 font-bold text-slate-500"
                  >
                    部屋作成は通信実装後に有効化
                  </button>
                </div>
              ) : null}

              {startMode === 'online_join' ? (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white">部屋番号で参加</h2>
                    <p className="mt-1 text-sm text-slate-400">検索欄、整形、形式チェックは先に組み込んでいます。</p>
                  </div>

                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-200">部屋番号</span>
                    <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3">
                      <Search size={18} className="text-slate-500" />
                      <input
                        value={normalizedRoomCode}
                        onChange={event => setJoinRoomCode(normalizeRoomCode(event.target.value))}
                        placeholder="ABC-DEF"
                        className="w-full bg-transparent text-lg font-black tracking-[0.28em] text-white outline-none placeholder:text-slate-600"
                      />
                    </div>
                    <div className="text-xs text-slate-400">英数字 6 文字。内部では ABCDEF として扱います。</div>
                  </label>

                  <div className="rounded-2xl border border-violet-900/50 bg-violet-950/20 px-4 py-3 text-sm text-violet-100">
                    参加側はルーム設定を変更しません。参加後にサーバ権威 snapshot を受け取って盤面へ入る想定です。
                  </div>

                  <button
                    disabled
                    className="cursor-not-allowed rounded-2xl border border-slate-700 bg-slate-900/70 px-6 py-3 font-bold text-slate-500"
                  >
                    部屋参加は通信実装後に有効化
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/60 p-5 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <HelpCircle size={16} className="text-sky-400" />
                <span>遊び方</span>
              </div>
              <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
                <p>同位置に重ねて置くと位相と同位置コンボが進みます。</p>
                <p>勝利条件は「XYZ 5 連 + 同位相 / 階段位相」または「同位置 5 コンボ」です。</p>
                <p>開始前設定は通常ここで決め、対局中にリアルタイム変更できるのはデバッグモード時のみです。</p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/60 p-5 shadow-2xl backdrop-blur-xl">
              <div className="text-sm font-bold text-white">オンライン設計の現在地</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>・部屋番号仕様あり</li>
                <li>・権威 snapshot / revision 設計あり</li>
                <li>・再接続トークン設計あり</li>
                <li>・ルーム作成 / 参加 UI の受け皿あり</li>
                <li>・通信サーバ自体は未接続</li>
              </ul>
            </div>
          </aside>
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
              <p>この画面は、開始前に対局条件を確定するためのハブとして配置しています。</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
