import { useState } from "react";
import type { PieceColor } from "../types/chess";
import { TIME_OPTIONS } from "../store/game-state";

interface HeaderProps {
  statusTitle: string;
  isCheck: boolean;
  isGameOver: boolean;
  turn: PieceColor;
  canUndo: boolean;
  onUndo: () => void;
  onFlip: () => void;
  onReset: () => void;
  timeControl: number | null;
  onSelectTimeControl: (seconds: number | null) => void;
}

export function Header({
  statusTitle,
  isCheck,
  isGameOver,
  turn,
  canUndo,
  onUndo,
  onFlip,
  onReset,
  timeControl,
  onSelectTimeControl,
}: HeaderProps) {
  const [showTimeModal, setShowTimeModal] = useState(false);

  return (
    <header className="h-14 sm:h-16 bg-[#21201d] border-b border-white/5 flex items-center justify-between px-3 sm:px-6 md:px-8 shrink-0 z-30 relative select-none">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#81b64c] flex items-center justify-center text-white text-lg sm:text-xl font-black shadow-md shadow-[#81b64c]/20">
          ♟
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white leading-tight">
              Chess<span className="text-[#81b64c]">ify</span>
            </h1>
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
              2P
            </span>
          </div>
          <p className="hidden sm:block text-[10px] text-gray-400 leading-none">
            Local Two-Player Chess
          </p>
        </div>
      </div>

      {/* Center: Live Match Status Pill */}
      <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-[#161512] rounded-full border border-white/10 text-xs shadow-inner max-w-[130px] sm:max-w-none">
        <span
          className={`w-2 h-2 rounded-full shrink-0 ${
            isCheck
              ? "bg-red-500 animate-ping"
              : isGameOver
              ? "bg-gray-400"
              : turn === "white"
              ? "bg-white ring-1 ring-gray-400"
              : "bg-gray-800 ring-1 ring-gray-600"
          }`}
        />
        <span className="font-medium text-gray-300 text-[11px] sm:text-xs truncate">
          {statusTitle}
        </span>
      </div>

      {/* Right: Quick Actions & Time Selector */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Time Control Quick Button */}
        <button
          onClick={() => setShowTimeModal(!showTimeModal)}
          title="Change Time Control"
          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-semibold rounded-md bg-[#2b2926] hover:bg-[#383531] text-gray-300 hover:text-white border border-white/5 transition"
        >
          <svg className="w-3.5 h-3.5 text-[#81b64c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[11px]">
            {timeControl ? `${Math.floor(timeControl / 60)}m` : "∞"}
          </span>
        </button>

        {/* Undo Button */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo Move (U)"
          className="p-1.5 sm:px-2.5 sm:py-1.5 flex items-center gap-1 text-xs font-medium rounded-md bg-[#2b2926] hover:bg-[#383531] text-gray-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none border border-white/5 transition"
        >
          <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
          <span className="hidden md:inline">Undo</span>
        </button>

        {/* Flip Board Button */}
        <button
          onClick={onFlip}
          title="Flip Board (F)"
          className="p-1.5 sm:px-2.5 sm:py-1.5 flex items-center gap-1 text-xs font-medium rounded-md bg-[#2b2926] hover:bg-[#383531] text-gray-300 hover:text-white border border-white/5 transition"
        >
          <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          <span className="hidden md:inline">Flip</span>
        </button>

        {/* New Game Button */}
        <button
          onClick={onReset}
          title="New Game (R)"
          className="px-2.5 sm:px-3 py-1.5 flex items-center gap-1 text-xs font-bold rounded-md bg-[#81b64c] hover:bg-[#92c55d] text-white shadow-sm transition active:scale-95"
        >
          <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden sm:inline">New</span>
        </button>
      </div>

      {/* Time Control Quick Dropdown / Modal */}
      {showTimeModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 sm:bg-transparent"
            onClick={() => setShowTimeModal(false)}
          />
          <div className="absolute right-3 sm:right-6 top-14 sm:top-16 z-50 bg-[#262421] border border-white/10 rounded-xl p-3 shadow-2xl w-56 animate-in fade-in zoom-in-95">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-2">
              Select Time Control
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    onSelectTimeControl(opt.seconds);
                    setShowTimeModal(false);
                  }}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-md text-center transition ${
                    timeControl === opt.seconds
                      ? "bg-[#81b64c] text-white font-bold"
                      : "bg-[#1f1e1b] text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {opt.label === "∞" ? "Untimed (∞)" : opt.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
