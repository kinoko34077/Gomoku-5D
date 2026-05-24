import React from 'react';
import { X, Keyboard, MousePointer, Hand } from 'lucide-react';

interface GameControlsGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GameControlsGuide: React.FC<GameControlsGuideProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative w-full max-w-2xl bg-slate-900/90 backdrop-blur-xl border border-gray-800 text-white rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
          <h2 className="text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 flex items-center gap-2">
            操作方法ガイド (Controls Guide)
          </h2>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2">
          
          {/* Keyboard Controls */}
          <div>
            <h3 className="text-sm font-semibold text-emerald-400 mb-2.5 flex items-center gap-2">
              <Keyboard size={16} /> キーボード操作 (Keyboard)
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/50 p-3 rounded-xl border border-gray-800/80">
              <div className="flex items-center justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">XY平面移動</span>
                <kbd className="px-2 py-0.5 bg-gray-800 rounded border border-gray-700 text-[10px] font-mono">W / A / S / D</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">XY平面移動 (代替)</span>
                <kbd className="px-2 py-0.5 bg-gray-800 rounded border border-gray-700 text-[10px] font-mono">↑ / ↓ / ← / →</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">Z軸深度変更</span>
                <kbd className="px-2 py-0.5 bg-gray-800 rounded border border-gray-700 text-[10px] font-mono">Q (上) / E (下)</kbd>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">石を配置する</span>
                <kbd className="px-2.5 py-0.5 bg-gray-800 rounded border border-gray-700 text-[10px] font-mono">Space / Enter</kbd>
              </div>
            </div>
          </div>

          {/* Mouse Controls */}
          <div>
            <h3 className="text-sm font-semibold text-blue-400 mb-2.5 flex items-center gap-2">
              <MousePointer size={16} /> マウス操作 (Mouse)
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/50 p-3 rounded-xl border border-gray-800/80">
              <div className="flex items-center justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">石を直接配置</span>
                <span className="text-gray-200 font-medium">左クリック (スライス面上のみ)</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">カメラ回転</span>
                <span className="text-gray-200 font-medium">右ドラッグ</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">カメラのパン (平行移動)</span>
                <span className="text-gray-200 font-medium">中ドラッグ / Space + ドラッグ</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">Z軸深度変更 (スルーホイール)</span>
                <span className="text-gray-200 font-medium">ホイール回転</span>
              </div>
              <div className="flex items-center justify-between py-1 col-span-2">
                <span className="text-gray-400">カメラのズーム (拡大・縮小)</span>
                <kbd className="px-2 py-0.5 bg-gray-800 rounded border border-gray-700 text-[10px] font-mono">Ctrl + ホイール</kbd>
              </div>
            </div>
          </div>

          {/* Touch Controls */}
          <div>
            <h3 className="text-sm font-semibold text-purple-400 mb-2.5 flex items-center gap-2">
              <Hand size={16} /> タッチ操作 (Touch - スマホ/タブレット)
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/50 p-3 rounded-xl border border-gray-800/80">
              <div className="flex items-center justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">石の配置 / 選択</span>
                <span className="text-gray-200 font-medium">1本指でタップ</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">カメラ回転</span>
                <span className="text-gray-200 font-medium">2本指でドラッグ</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">カメラズーム</span>
                <span className="text-gray-200 font-medium">ピンチイン / ピンチアウト</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-800/40">
                <span className="text-gray-400">Z軸深度変更</span>
                <span className="text-gray-200 font-medium">画面横の Zスライダー 操作</span>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="text-xs bg-slate-950/80 border border-emerald-500/20 text-gray-400 rounded-xl p-3.5 leading-relaxed space-y-1.5">
            <span className="text-emerald-400 font-semibold block">【ヒント】内部の石への干渉方法</span>
            <p>
              3Dのままだと内側のマスが手前の石に隠れてクリックしづらくなります。
              画面右側の<strong>「断面表示 (Slice Controls)」</strong>で特定のレイヤーに制限（例: Z軸の2層目）すると、
              その平面上のマスだけが強調され、視覚を遮ることなく直接内側のマスへ石を置くことができます。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 border-t border-gray-800 pt-4 flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 font-semibold rounded-xl text-sm transition-all shadow-lg hover:shadow-emerald-500/20"
          >
            閉じる (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
