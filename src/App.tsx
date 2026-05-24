import { useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { DebugVisualPanel } from './components/DebugVisualPanel';
import { GameControlsGuide } from './components/GameControlsGuide';
import { UIOverlay } from './components/UIOverlay';
import { useFiveDGomoku } from './hooks/useFiveDGomoku';
import { defaultVisualTuning, type VisualTuning } from './visualTuning';

export default function App() {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [visualTuning, setVisualTuning] = useState<VisualTuning>(defaultVisualTuning);
  const {
    settings,
    setSettings,
    gameMode,
    setGameMode,
    isAiThinking,
    board,
    activePlayer,
    cursor,
    syncCursor,
    winInfo,
    threats,
    performanceState,
    sliceAxis,
    setSliceAxis,
    sliceIndex,
    setSliceIndex,
    showGridAssist,
    syncSlice,
    executeMove,
    handleUndo,
    handleRedo,
    handleReset,
    canUndo,
    canRedo,
  } = useFiveDGomoku();

  return (
    <div
      className="relative h-screen w-screen overflow-hidden"
      style={{
        backgroundColor: `rgb(${visualTuning.backgroundGray}, ${visualTuning.backgroundGray}, ${visualTuning.backgroundGray + 6})`,
      }}
    >
      <div className="bg-ambient-gradient" />

      <div className="absolute inset-0 z-10">
        <GameBoard
          board={board}
          settings={settings}
          cursor={cursor}
          onCursorChange={syncCursor}
          onSliceChange={syncSlice}
          onCellClick={executeMove}
          sliceAxis={sliceAxis}
          sliceIndex={sliceIndex}
          winInfo={winInfo}
          threats={threats}
          showGridAssist={showGridAssist}
          visualTuning={visualTuning}
        />

        <UIOverlay
          board={board}
          settings={settings}
          setSettings={setSettings}
          gameMode={gameMode}
          setGameMode={setGameMode}
          activePlayer={activePlayer}
          cursor={cursor}
          onCursorChange={syncCursor}
          sliceAxis={sliceAxis}
          setSliceAxis={setSliceAxis}
          sliceIndex={sliceIndex}
          setSliceIndex={setSliceIndex}
          winInfo={winInfo}
          threats={threats}
          visualTuning={visualTuning}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onReset={handleReset}
          canUndo={canUndo}
          canRedo={canRedo}
          onGuideOpen={() => setIsGuideOpen(true)}
          onCellClick={executeMove}
        />
      </div>

      {isAiThinking ? (
        <div className="absolute left-1/2 top-8 z-50 flex -translate-x-1/2 items-center space-x-3 rounded-full border border-purple-500/30 bg-slate-900/90 px-5 py-2.5 shadow-xl backdrop-blur-md">
          <div className="flex space-x-1">
            <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: '0ms' }} />
            <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: '150ms' }} />
            <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-purple-400" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="font-sans text-xs font-semibold tracking-wide text-purple-300">
            AI is planning...
          </span>
        </div>
      ) : null}

      {performanceState.isLagging ? (
        <div className="absolute bottom-4 left-4 z-40 rounded-2xl border border-red-500/30 bg-red-950/80 px-4 py-3 text-xs text-red-100 shadow-xl backdrop-blur-md">
          <div className="font-semibold">Performance warning</div>
          <div>threat calc: {performanceState.threatCalcMs.toFixed(1)} ms</div>
          <div>worst frame: {performanceState.worstFrameMs.toFixed(1)} ms</div>
        </div>
      ) : null}

      <DebugVisualPanel visualTuning={visualTuning} onChange={setVisualTuning} />

      <GameControlsGuide isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}
