interface ActionControlsProps {
  canUndo: boolean;
  onNewGame: () => void;
  onUndo: () => void;
  onFlip: () => void;
}

export function ActionControls({
  canUndo,
  onNewGame,
  onUndo,
  onFlip,
}: ActionControlsProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={onNewGame}
          title="New Game (R)"
          className="col-span-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-md bg-[#81b64c] hover:bg-[#92c55d] text-white transition shadow"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          New
        </button>

        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo Move (U)"
          className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-[#2b2926] hover:bg-[#383531] disabled:opacity-30 disabled:pointer-events-none transition text-gray-200"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          Undo
        </button>

        <button
          onClick={onFlip}
          title="Flip Board (F)"
          className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-[#2b2926] hover:bg-[#383531] transition text-gray-200"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Flip
        </button>
      </div>

      <div className="text-center text-[10px] text-gray-500 font-mono">
        <kbd className="px-1 py-0.5 rounded bg-black/40 text-gray-400">U</kbd> undo ·{" "}
        <kbd className="px-1 py-0.5 rounded bg-black/40 text-gray-400">F</kbd> flip ·{" "}
        <kbd className="px-1 py-0.5 rounded bg-black/40 text-gray-400">R</kbd> reset ·{" "}
        <kbd className="px-1 py-0.5 rounded bg-black/40 text-gray-400">←/→</kbd> moves
      </div>
    </div>
  );
}

