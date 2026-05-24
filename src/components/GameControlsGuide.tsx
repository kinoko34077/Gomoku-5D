import React from 'react';
import { BookOpen, Hand, Keyboard, MousePointer, Trophy, X } from 'lucide-react';

interface GameControlsGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const playSteps = [
  '断面を見ながら、狙いたい座標を探します。',
  '必要に応じて X / Y / Z の断面を切り替え、立体位置を把握します。',
  '同じマスに重ねて置くと、位相と同位置コンボが進みます。',
  'インスペクタで現在マスの位相とコンボ数を確認できます。',
  '警戒表示を有効にすると、あと1手で危険な筋を確認できます。',
];

const keyboardRows = [
  ['XY 移動', 'W / A / S / D'],
  ['Z 移動', 'Q / E'],
  ['石を置く', 'Space / Enter'],
  ['グリッド切替', 'G'],
  ['デバッグ切替', 'P + DEBUG'],
];

const mouseRows = [
  '通常ドラッグ: 回転',
  'Shift + ホバー / クリック: X 軸固定',
  'Ctrl + ホバー / クリック: Z 軸固定',
  'Shift + Ctrl: XZ 軸固定',
  'Alt + ドラッグ: 上下で Y、左右で Z 断面変更',
  'ホイール: ズーム',
  'Shift / Alt / Ctrl + ホイール: X / Y / Z の指定位置変更',
];

const touchRows = [
  '1本指: 回転',
  '2本指スワイプ: 断面移動',
  '2本指ひねり: カメラのひねり回転',
];

function GuideSection({
  title,
  icon,
  accentClass,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  accentClass: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-800/80 bg-slate-950/55 p-4">
      <h3 className={`mb-3 flex items-center gap-2 text-sm font-semibold ${accentClass}`}>
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
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
            title="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid max-h-[75vh] gap-6 overflow-y-auto pr-2 md:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <GuideSection title="ゲーム概要" icon={<BookOpen size={16} />} accentClass="text-emerald-400">
              <div className="space-y-2 text-sm leading-7 text-slate-200">
                <p>このゲームは 3D 空間の盤面に石を置いていく五次元五目です。</p>
                <p>各マスには位相があり、同じ場所に重ねて置くと位相と同位置コンボが進みます。</p>
                <p>断面表示を切り替えることで、X / Y / Z ごとの層を見ながら立体的に読み合えます。</p>
              </div>
            </GuideSection>

            <GuideSection title="勝利条件" icon={<Trophy size={16} />} accentClass="text-amber-400">
              <div className="space-y-3 text-sm leading-7 text-slate-200">
                <p>1. 同じ場所に 5 回重ねて置き、同位置 5 コンボを作る。</p>
                <p>2. XYZ 空間上で 5 連を作り、その 5 マスの位相がそろうか、階段状につながる。</p>
                <p>つまり、空間 5 連だけでは勝ちになりません。</p>
              </div>
            </GuideSection>

            <GuideSection title="遊び方の流れ" accentClass="text-sky-400">
              <div className="space-y-2 text-sm leading-7 text-slate-200">
                {playSteps.map(step => (
                  <p key={step}>・{step}</p>
                ))}
              </div>
            </GuideSection>
          </div>

          <div className="space-y-5">
            <GuideSection title="キーボード" icon={<Keyboard size={16} />} accentClass="text-emerald-400">
              <div className="space-y-2 text-xs text-slate-200">
                {keyboardRows.map(([label, key]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-lg border border-gray-800/70 bg-slate-950/60 px-3 py-2"
                  >
                    <span>{label}</span>
                    <kbd className="rounded border border-gray-700 bg-gray-800 px-2 py-0.5 font-mono">{key}</kbd>
                  </div>
                ))}
              </div>
            </GuideSection>

            <GuideSection title="マウス" icon={<MousePointer size={16} />} accentClass="text-blue-400">
              <div className="space-y-2 text-xs text-slate-200">
                {mouseRows.map(row => (
                  <div key={row} className="rounded-lg border border-gray-800/70 bg-slate-950/60 px-3 py-2">
                    {row}
                  </div>
                ))}
              </div>
            </GuideSection>

            <GuideSection title="タッチ操作" icon={<Hand size={16} />} accentClass="text-purple-400">
              <div className="space-y-2 text-xs text-slate-200">
                {touchRows.map(row => (
                  <div key={row} className="rounded-lg border border-gray-800/70 bg-slate-950/60 px-3 py-2">
                    {row}
                  </div>
                ))}
              </div>
            </GuideSection>
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
