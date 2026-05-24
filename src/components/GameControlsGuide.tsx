import React from 'react';
import { BookOpen, Hand, Keyboard, MousePointer, Trophy, X } from 'lucide-react';

interface GameControlsGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameControlsGuide: React.FC<GameControlsGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative w-[min(92vw,1100px)] rounded-2xl border border-gray-800 bg-slate-900/95 p-6 text-white shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between border-b border-gray-800 pb-4">
          <h2 className="flex items-center gap-2 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-xl font-bold tracking-wide text-transparent">
            <BookOpen size={20} />
            遊び方と操作ガイド
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid max-h-[75vh] gap-6 overflow-y-auto pr-2 md:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-gray-800/80 bg-slate-950/55 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <BookOpen size={16} />
                ゲーム概要
              </h3>
              <div className="space-y-2 text-sm leading-7 text-slate-200">
                <p>このゲームは 3D 空間の盤面に石を置いていく五次元五目です。</p>
                <p>ただ並べるだけではなく、各マスには位相があり、同じ場所に重ねて置くと位相と同位置コンボが進みます。</p>
                <p>断面表示を切り替えると、X / Y / Z ごとの層を確認しながら立体的に読み合えます。</p>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-800/80 bg-slate-950/55 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-400">
                <Trophy size={16} />
                勝利条件
              </h3>
              <div className="space-y-3 text-sm leading-7 text-slate-200">
                <p>1. 同じ場所に 5 回重ねて置き、同位置 5 コンボを作る。</p>
                <p>2. XYZ 空間上で 5 連を作り、さらにその 5 マスの位相がそろうか、階段状につながる。</p>
                <p>つまり、空間 5 連だけでは勝ちになりません。</p>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-800/80 bg-slate-950/55 p-4">
              <h3 className="mb-3 text-sm font-semibold text-sky-400">遊び方の流れ</h3>
              <div className="space-y-2 text-sm leading-7 text-slate-200">
                <p>・まず断面を確認して、狙いたい座標を見つけます。</p>
                <p>・必要なら X / Y / Z の断面を切り替えて、立体位置を把握します。</p>
                <p>・同じマスに重ねて置くと位相とコンボが進みます。</p>
                <p>・左のインスペクタでは、選んでいるマスの位相とコンボ数を確認できます。</p>
                <p>・警戒表示を有効にすると、あと 1 手で危険な筋を確認できます。</p>
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-2xl border border-gray-800/80 bg-slate-950/55 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-400">
                <Keyboard size={16} />
                キーボード
              </h3>
              <div className="space-y-2 text-xs text-slate-200">
                <div className="flex items-center justify-between rounded-lg border border-gray-800/70 bg-slate-950/60 px-3 py-2"><span>XY 移動</span><kbd className="rounded border border-gray-700 bg-gray-800 px-2 py-0.5 font-mono">W / A / S / D</kbd></div>
                <div className="flex items-center justify-between rounded-lg border border-gray-800/70 bg-slate-950/60 px-3 py-2"><span>Z 移動</span><kbd className="rounded border border-gray-700 bg-gray-800 px-2 py-0.5 font-mono">Q / E</kbd></div>
                <div className="flex items-center justify-between rounded-lg border border-gray-800/70 bg-slate-950/60 px-3 py-2"><span>石を置く</span><kbd className="rounded border border-gray-700 bg-gray-800 px-2 py-0.5 font-mono">Space / Enter</kbd></div>
                <div className="flex items-center justify-between rounded-lg border border-gray-800/70 bg-slate-950/60 px-3 py-2"><span>グリッド切替</span><kbd className="rounded border border-gray-700 bg-gray-800 px-2 py-0.5 font-mono">G</kbd></div>
                <div className="flex items-center justify-between rounded-lg border border-gray-800/70 bg-slate-950/60 px-3 py-2"><span>デバッグ切替</span><kbd className="rounded border border-gray-700 bg-gray-800 px-2 py-0.5 font-mono">P + DEBUG</kbd></div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-800/80 bg-slate-950/55 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-400">
                <MousePointer size={16} />
                マウス
              </h3>
              <div className="space-y-2 text-xs text-slate-200">
                <div className="rounded-lg border border-gray-800/70 bg-slate-950/60 px-3 py-2">通常ドラッグ: 回転</div>
                <div className="rounded-lg border border-gray-800/70 bg-slate-950/60 px-3 py-2">Shift + ドラッグ: X 断面変更</div>
                <div className="rounded-lg border border-gray-800/70 bg-slate-950/60 px-3 py-2">Alt + ドラッグ: 上下で Y、左右で Z 断面変更</div>
                <div className="rounded-lg border border-gray-800/70 bg-slate-950/60 px-3 py-2">ホイール: ズーム</div>
                <div className="rounded-lg border border-gray-800/70 bg-slate-950/60 px-3 py-2">Shift / Alt / Ctrl + ホイール: X / Y / Z の指定位置変更</div>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-800/80 bg-slate-950/55 p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-purple-400">
                <Hand size={16} />
                タッチ操作
              </h3>
              <div className="space-y-2 text-xs text-slate-200">
                <div className="rounded-lg border border-gray-800/70 bg-slate-950/60 px-3 py-2">1本指: 回転</div>
                <div className="rounded-lg border border-gray-800/70 bg-slate-950/60 px-3 py-2">2本指スワイプ: 断面移動</div>
                <div className="rounded-lg border border-gray-800/70 bg-slate-950/60 px-3 py-2">2本指ひねり: カメラのひねり回転</div>
              </div>
            </section>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-gray-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 px-5 py-2 text-sm font-semibold transition-all hover:from-blue-600 hover:to-emerald-600"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
