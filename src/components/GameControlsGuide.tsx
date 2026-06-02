import React from 'react';
import { BookOpen, Hand, Keyboard, MousePointer, Trophy, X } from 'lucide-react';

interface GameControlsGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const playSteps = [
  '盤面を見ながら、置きたい座標にカーソルを合わせます。',
  '必要なら X / Y / Z のスライス表示を切り替えて、奥行き方向の位置を確認します。',
  '同じマスに重ねて置くと、そのマスの位相と streak が進みます。',
  'インスペクタでは現在マスの位相、最後に置いた色、streak を確認できます。',
  '脅威表示を有効にすると、次の一手で危険な位置を一覧できます。',
];

const keyboardRows = [
  ['XY 移動', 'W / A / S / D'],
  ['Z 移動', 'Q / E'],
  ['現在マスに置く', 'Space / Enter'],
  ['グリッド補助', 'G'],
  ['ガイド開閉', 'H'],
  ['パネル切替', 'M / I / C / L / V / O'],
];

const mouseRows = [
  '左ドラッグ: 視点回転',
  'ホイール: ズーム',
  'Shift + ホイール: X 軸スライス移動',
  'Alt + ホイール: Y 軸スライス移動',
  'Ctrl + ホイール: Z 軸スライス移動',
  'クリック: マス選択',
];

const touchRows = [
  '1本指: 視点回転',
  '2本指スワイプ: 盤面移動',
  'ピンチ: ズーム',
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
                <p>このゲームは 3D 盤面の各マスに石を重ねて置いていく五目並べです。</p>
                <p>各マスには位相があり、連続して置くと位相と streak が進みます。</p>
                <p>スライス表示を切り替えることで、X / Y / Z ごとの断面を見ながら考えられます。</p>
              </div>
            </GuideSection>

            <GuideSection title="勝利条件" icon={<Trophy size={16} />} accentClass="text-amber-400">
              <div className="space-y-3 text-sm leading-7 text-slate-200">
                <p>1. 同じマスに 5 回連続で置いて streak 5 を作る。</p>
                <p>2. XYZ の一直線上で 5 連を作り、その 5 マスの位相が同じか連番になる。</p>
                <p>どちらかを満たした時点で勝利です。</p>
              </div>
            </GuideSection>

            <GuideSection title="基本の流れ" accentClass="text-sky-400">
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
