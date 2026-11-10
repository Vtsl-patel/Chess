import { useReducer, useState, useCallback, useEffect } from "react";
import type { Position, PieceType, PieceColor, Piece } from "../types/chess";
import { gameReducer, initialGameState, TIME_OPTIONS } from "../store/game-state";
import { Board } from "./Board";
import { Piece as ChessPiece } from "./Piece";
import { MoveHistory } from "./MoveHistory";
import { PromotionDialog } from "./PromotionDialog";
import { getPieceAt, findKing, posEquals, calculateMaterial } from "../utils/chessLogic";

export function ChessApp() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Position;
    to: Position;
    color: PieceColor;
  } | null>(null);

  // Timer countdown interval
  useEffect(() => {
    if (state.status !== "playing" && state.status !== "check") return;
    if (state.timeControl === null) return;

    const timer = setInterval(() => {
      dispatch({ type: "TICK_TIMER" });
    }, 1000);

    return () => clearInterval(timer);
  }, [state.status, state.timeControl]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const movesCount = state.moveHistory.length;
      const currentIdx = state.viewIndex === -1 ? movesCount - 1 : state.viewIndex;

      if ((e.key === "u" || e.key === "U") && movesCount > 0) {
        dispatch({ type: "UNDO_MOVE" });
      } else if (e.key === "f" || e.key === "F") {
        dispatch({ type: "FLIP_BOARD" });
      } else if (e.key === "r" || e.key === "R") {
        dispatch({ type: "RESET_GAME" });
      } else if (e.key === "ArrowLeft" && movesCount > 0) {
        dispatch({ type: "VIEW_MOVE", payload: Math.max(0, currentIdx - 1) });
      } else if (e.key === "ArrowRight" && movesCount > 0 && state.viewIndex !== -1) {
        if (currentIdx + 1 >= movesCount - 1) {
          dispatch({ type: "VIEW_MOVE", payload: -1 });
        } else {
          dispatch({ type: "VIEW_MOVE", payload: currentIdx + 1 });
        }
      } else if (e.key === "Escape" || e.key === "ArrowDown") {
        dispatch({ type: "VIEW_MOVE", payload: -1 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.moveHistory.length, state.viewIndex]);

  // Attempt to move a piece
  const attemptMove = useCallback(
    (from: Position, to: Position) => {
      const piece = getPieceAt(state.board, from);
      if (!piece || piece.color !== state.turn) return;

      const isLegal = state.legalMoves.some((m) => posEquals(m, to));
      if (!isLegal) return;

      // Check for pawn promotion
      const isPromotion =
        piece.type === "pawn" &&
        ((piece.color === "white" && to.rank === 8) ||
          (piece.color === "black" && to.rank === 1));

      if (isPromotion) {
        setPendingPromotion({ from, to, color: piece.color });
        return;
      }

      dispatch({
        type: "MAKE_MOVE",
        payload: { from, to },
      });
    },
    [state.board, state.turn, state.legalMoves]
  );

  // Square click handler
  const handleSquareClick = useCallback(
    (pos: Position) => {
      // If clicking board while in review mode, snap to live board
      if (state.viewIndex !== -1) {
        dispatch({ type: "VIEW_MOVE", payload: -1 });
        return;
      }

      if (
        state.status === "checkmate" ||
        state.status === "stalemate" ||
        state.status === "draw-insufficient" ||
        state.status === "timeout"
      ) {
        return;
      }

      if (state.selectedSquare && state.legalMoves.some((m) => posEquals(m, pos))) {
        attemptMove(state.selectedSquare, pos);
      } else {
        dispatch({ type: "SELECT_SQUARE", payload: pos });
      }
    },
    [state.viewIndex, state.status, state.selectedSquare, state.legalMoves, attemptMove]
  );

  // Promotion choice
  const handlePromotionSelect = useCallback(
    (pieceType: PieceType) => {
      if (!pendingPromotion) return;
      dispatch({
        type: "MAKE_MOVE",
        payload: {
          from: pendingPromotion.from,
          to: pendingPromotion.to,
          promotion: pieceType,
        },
      });
      setPendingPromotion(null);
    },
    [pendingPromotion]
  );

  // Board and lastMove to display (live vs history review)
  const displayBoard =
    state.viewIndex !== -1
      ? state.moveHistory[state.viewIndex].boardAfter
      : state.board;

  const displayLastMove =
    state.viewIndex !== -1
      ? state.moveHistory[state.viewIndex]
      : state.lastMove;

  // King in check position
  const checkKingPos =
    state.viewIndex === -1 && (state.status === "check" || state.status === "checkmate")
      ? findKing(state.board, state.turn)
      : null;

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Determine top and bottom perspective based on flip
  const topColor: PieceColor = state.isFlipped ? "white" : "black";
  const bottomColor: PieceColor = state.isFlipped ? "black" : "white";

  const topTime = topColor === "white" ? state.whiteTime : state.blackTime;
  const bottomTime = bottomColor === "white" ? state.whiteTime : state.blackTime;

  // Material evaluation
  const material = calculateMaterial(state.capturedPieces);
  const topAdvantage = topColor === "white" ? material.whiteAdvantage : material.blackAdvantage;
  const bottomAdvantage = bottomColor === "white" ? material.whiteAdvantage : material.blackAdvantage;

  // Captured pieces display helper
  const renderCaptured = (pieces: Piece[], capturedColor: PieceColor, advantage: number) => {
    const counts: Record<string, number> = {};
    pieces.forEach((p) => {
      counts[p.type] = (counts[p.type] || 0) + 1;
    });

    const types: PieceType[] = ["pawn", "knight", "bishop", "rook", "queen"];

    return (
      <div className="flex items-center gap-1">
        {types.map((t) => {
          const count = counts[t];
          if (!count) return null;
          return (
            <div key={t} className="flex items-center">
              <div className="w-4 h-4 sm:w-5 sm:h-5">
                <ChessPiece type={t} color={capturedColor} size={18} />
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
    );
  };

  const isGameOver =
    state.status === "checkmate" ||
    state.status === "stalemate" ||
    state.status === "draw-insufficient" ||
    state.status === "timeout";

  // Status banner text
  let statusTitle = `${state.turn === "white" ? "White" : "Black"}'s Turn`;
  let statusSubtitle = `Move ${Math.floor(state.moveHistory.length / 2) + 1}`;
  let statusBadgeBg = "bg-[#81b64c]/20 text-[#81b64c] border-[#81b64c]/40";

  if (state.viewIndex !== -1) {
    statusTitle = `Reviewing Move ${state.viewIndex + 1}`;
    statusSubtitle = "Click board or '>' to resume";
    statusBadgeBg = "bg-sky-500/20 text-sky-400 border-sky-500/40";
  } else if (state.status === "check") {
    statusTitle = `${state.turn === "white" ? "White" : "Black"} in Check!`;
    statusSubtitle = "Must protect the King";
    statusBadgeBg = "bg-red-500/20 text-red-400 border-red-500/40";
  } else if (state.status === "checkmate") {
    const winner = state.winner === "white" ? "White" : "Black";
    statusTitle = `Checkmate!`;
    statusSubtitle = `${winner} is victorious!`;
    statusBadgeBg = "bg-[#81b64c] text-white border-transparent";
  } else if (state.status === "timeout") {
    const winner = state.winner === "white" ? "White" : "Black";
    statusTitle = `Time Out!`;
    statusSubtitle = `${winner} won on time`;
    statusBadgeBg = "bg-[#81b64c] text-white border-transparent";
  } else if (state.status === "stalemate") {
    statusTitle = "Stalemate";
    statusSubtitle = "Game drawn by stalemate";
    statusBadgeBg = "bg-amber-500/20 text-amber-400 border-amber-500/40";
  } else if (state.status === "draw-insufficient") {
    statusTitle = "Draw";
    statusSubtitle = "Insufficient material to checkmate";
    statusBadgeBg = "bg-amber-500/20 text-amber-400 border-amber-500/40";
  }

  // Player Bar Component
  const renderPlayerBar = (
    color: PieceColor,
    time: number,
    captured: Piece[],
    advantage: number
  ) => {
    const isTurn = state.turn === color && !isGameOver && state.viewIndex === -1;
    const isLow = state.timeControl !== null && time < 30 && time > 0;
    const capturedColor = color === "white" ? "black" : "white";

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
            <div className="mt-0.5">
              {renderCaptured(captured, capturedColor, advantage)}
            </div>
          </div>
        </div>

        {/* Right: Digital Clock */}
        {state.timeControl !== null ? (
          <div
            className={`font-mono text-sm sm:text-base font-bold px-3 py-1 rounded transition-all shadow-sm ${
              isTurn
                ? isLow
                  ? "bg-red-600 text-white animate-pulse"
                  : "bg-white text-black shadow"
                : "bg-[#181715] text-gray-400"
            }`}
          >
            {formatTime(time)}
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-gray-500 uppercase px-2">
            Untimed
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#161512] text-gray-100 flex flex-col font-sans select-none">
      {/* Top Header */}
      <header className="h-14 bg-[#21201d] border-b border-white/5 flex items-center justify-between px-4 sm:px-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#81b64c] flex items-center justify-center text-white text-lg font-black shadow-md">
            ♟
          </div>
          <div>
            <h1 className="font-bold text-sm sm:text-base tracking-tight text-white leading-tight">
              Chess<span className="text-[#81b64c]">.clone</span>
            </h1>
            <p className="text-[10px] text-gray-400 leading-none">Local 2-Player Match</p>
          </div>
        </div>

        {/* Status Pill in Header */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-[#161512] rounded-full border border-white/10 text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              state.status === "check"
                ? "bg-red-500 animate-ping"
                : isGameOver
                ? "bg-gray-400"
                : "bg-[#81b64c]"
            }`}
          />
          <span className="font-medium text-gray-300">{statusTitle}</span>
        </div>
      </header>

      {/* Main Game Layout */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-3 sm:p-6 gap-6 max-w-6xl mx-auto w-full">
        {/* Left / Center Column: Board Console */}
        <div className="flex flex-col items-center gap-2 w-full max-w-[640px] xl:max-w-[680px]">
          {/* Top Player Strip */}
          {renderPlayerBar(
            topColor,
            topTime,
            topColor === "white" ? state.capturedPieces.white : state.capturedPieces.black,
            topAdvantage
          )}

          {/* 8x8 Chess Board */}
          <Board
            board={displayBoard}
            turn={state.turn}
            isFlipped={state.isFlipped}
            selectedSquare={state.selectedSquare}
            legalMoves={state.viewIndex === -1 ? state.legalMoves : []}
            lastMove={displayLastMove}
            checkKingPosition={checkKingPos}
            isInteractive={
              state.viewIndex === -1 &&
              (state.status === "playing" || state.status === "check")
            }
            onSquareClick={handleSquareClick}
            onMovePiece={attemptMove}
          />

          {/* Bottom Player Strip */}
          {renderPlayerBar(
            bottomColor,
            bottomTime,
            bottomColor === "white" ? state.capturedPieces.white : state.capturedPieces.black,
            bottomAdvantage
          )}

          {/* Game Over Banner */}
          {isGameOver && (
            <div className="w-full flex items-center justify-between px-4 py-3 bg-[#262421] rounded-lg border border-[#81b64c]/40 text-xs shadow-xl mt-1 animate-in fade-in">
              <div>
                <p className="font-bold text-white text-sm">{statusTitle}</p>
                <p className="text-gray-400 text-xs">{statusSubtitle}</p>
              </div>
              <button
                onClick={() => dispatch({ type: "RESET_GAME" })}
                className="px-4 py-2 font-bold text-white bg-[#81b64c] hover:bg-[#92c55d] rounded-md transition shadow"
              >
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Game Sidebar */}
        <aside className="w-full max-w-[640px] lg:w-80 xl:w-96 h-[500px] lg:h-[680px] flex flex-col gap-3">
          {/* Card 1: Game Status */}
          <div className="bg-[#21201d] rounded-lg border border-white/5 p-4 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                Status
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">
                {statusTitle}
              </h2>
              <p className="text-xs text-gray-400">{statusSubtitle}</p>
            </div>
            <div
              className={`px-2.5 py-1 rounded text-xs font-bold border capitalize ${statusBadgeBg}`}
            >
              {state.viewIndex !== -1 ? "Review" : state.turn}
            </div>
          </div>

          {/* Card 2: Move History Table */}
          <div className="flex-1 min-h-0">
            <MoveHistory
              moves={state.moveHistory}
              viewIndex={state.viewIndex}
              onViewMove={(idx) => dispatch({ type: "VIEW_MOVE", payload: idx })}
            />
          </div>

          {/* Card 3: Game Controls & Time Controls */}
          <div className="bg-[#21201d] rounded-lg border border-white/5 p-3 flex flex-col gap-3 shadow-sm">
            {/* Time Control Selector */}
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1.5">
                Time Control
              </span>
              <div className="grid grid-cols-5 gap-1">
                {TIME_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => dispatch({ type: "SET_TIME_CONTROL", payload: opt.seconds })}
                    className={`py-1 text-xs font-semibold rounded text-center transition ${
                      state.timeControl === opt.seconds
                        ? "bg-[#81b64c] text-white font-bold"
                        : "bg-[#181715] text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => dispatch({ type: "RESET_GAME" })}
                title="New Game (R)"
                className="col-span-1 flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-md bg-[#81b64c] hover:bg-[#92c55d] text-white transition shadow"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                New
              </button>

              <button
                onClick={() => dispatch({ type: "UNDO_MOVE" })}
                disabled={state.moveHistory.length === 0}
                title="Undo Move (U)"
                className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-[#2b2926] hover:bg-[#383531] disabled:opacity-30 disabled:pointer-events-none transition text-gray-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                Undo
              </button>

              <button
                onClick={() => dispatch({ type: "FLIP_BOARD" })}
                title="Flip Board (F)"
                className="flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-semibold rounded-md bg-[#2b2926] hover:bg-[#383531] transition text-gray-200"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                Flip
              </button>
            </div>

            {/* Keyboard shortcut hint */}
            <div className="text-center text-[10px] text-gray-500 font-mono">
              <kbd className="px-1 py-0.5 rounded bg-black/40 text-gray-400">U</kbd> undo ·{" "}
              <kbd className="px-1 py-0.5 rounded bg-black/40 text-gray-400">F</kbd> flip ·{" "}
              <kbd className="px-1 py-0.5 rounded bg-black/40 text-gray-400">R</kbd> reset ·{" "}
              <kbd className="px-1 py-0.5 rounded bg-black/40 text-gray-400">←/→</kbd> moves
            </div>
          </div>
        </aside>
      </main>

      {/* Pawn Promotion Dialog */}
      <PromotionDialog
        open={pendingPromotion !== null}
        color={pendingPromotion?.color || "white"}
        onSelect={handlePromotionSelect}
        onCancel={() => {
          setPendingPromotion(null);
          dispatch({ type: "CLEAR_SELECTION" });
        }}
      />
    </div>
  );
}
