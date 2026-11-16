import type { Piece as PieceType, PieceColor, PieceType as ChessPieceType } from "../types/chess";
import { Piece } from "./Piece";

interface PlayerBarProps {
  color: PieceColor;
  timeRemaining: number;
  timeControlActive: boolean;
  isTurn: boolean;
  capturedPieces: PieceType[];
  advantage: number;
}

const CAPTURE_ORDER: ChessPieceType[] = ["pawn", "knight", "bishop", "rook", "queen"];

function formatTime(seconds: number): string {
  if (seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PlayerBar({
  color,
  timeRemaining,
  timeControlActive,
  isTurn,
  capturedPieces,
  advantage,
}: PlayerBarProps) {
  const isLowTime = timeControlActive && timeRemaining < 30 && timeRemaining > 0;
  const opponentColor: PieceColor = color === "white" ? "black" : "white";

  // Count captured pieces
  const counts: Record<string, number> = {};
  capturedPieces.forEach((p) => {
    counts[p.type] = (counts[p.type] || 0) + 1;
  });

  return (
    <div
      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
        isTurn
          ? "bg-[#282623] border-[#81b64c]/40 shadow-md"
          : "bg-[#21201d] border-white/5"
      }`}
    >
      {/* Left: Avatar, Name, Rating, Captured */}
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-base shadow-sm shrink-0 ${
            color === "white"
              ? "bg-[#e2e2dc] text-[#1a1a1a] ring-1 ring-white/20"
              : "bg-[#181715] text-white ring-1 ring-white/10"
          }`}
        >
          {color === "white" ? "♔" : "♚"}
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs sm:text-sm text-gray-200 capitalize">
              {color} Player
            </span>
            <span className="text-[10px] font-bold text-gray-400 bg-[#2d2b27] px-1.5 py-0.5 rounded">
              1500
            </span>
          </div>

          {/* Captured Pieces */}
          <div className="mt-0.5 flex items-center gap-1">
            {CAPTURE_ORDER.map((t) => {
              const count = counts[t];
              if (!count) return null;
              return (
                <div key={t} className="flex items-center">
                  <div className="w-4 h-4 sm:w-5 sm:h-5">
                    <Piece type={t} color={opponentColor} size={18} />
                  </div>
                  {count > 1 && (
                    <span className="text-[10px] font-bold text-gray-400 ml-0.5">
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
            {advantage > 0 && (
              <span className="text-[10px] font-bold text-gray-300 ml-1.5 px-1.5 py-0.5 rounded bg-[#383531]">
                +{advantage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Digital Clock */}
      {timeControlActive ? (
        <div
          className={`font-mono text-sm sm:text-base font-bold px-3 py-1 rounded transition-all shadow-sm ${
            isTurn
              ? isLowTime
                ? "bg-red-600 text-white animate-pulse"
                : "bg-white text-black shadow"
              : "bg-[#181715] text-gray-400"
          }`}
        >
          {formatTime(timeRemaining)}
        </div>
      ) : (
        <span className="text-[11px] font-semibold text-gray-500 uppercase px-2">
          Untimed
        </span>
      )}
    </div>
  );
}

