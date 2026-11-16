import { useReducer, useState, useCallback } from "react";
import type { Position, PieceType, PieceColor } from "../types/chess";
import { gameReducer, initialGameState } from "../store/game-state";
import { Board } from "./Board";
import { MoveHistory } from "./MoveHistory";
import { PromotionDialog } from "./PromotionDialog";
import { Header } from "./Header";
import { PlayerBar } from "./PlayerBar";
import { GameStatusCard } from "./GameStatusCard";
import { TimeControlSelector } from "./TimeControlSelector";
import { ActionControls } from "./ActionControls";
import { GameOverBanner } from "./GameOverBanner";
import { useChessTimer } from "../hooks/useChessTimer";
import { useChessShortcuts } from "../hooks/useChessShortcuts";
import { getPieceAt, findKing, posEquals, calculateMaterial } from "../engine";

export function ChessApp() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Position;
    to: Position;
    color: PieceColor;
  } | null>(null);

  // Hook 1: Timer interval management
  useChessTimer({
    status: state.status,
    timeControl: state.timeControl,
    onTick: useCallback(() => dispatch({ type: "TICK_TIMER" }), []),
  });

  // Hook 2: Global keyboard shortcuts management
  useChessShortcuts({
    moveHistoryLength: state.moveHistory.length,
    viewIndex: state.viewIndex,
    onUndo: useCallback(() => dispatch({ type: "UNDO_MOVE" }), []),
    onFlip: useCallback(() => dispatch({ type: "FLIP_BOARD" }), []),
    onReset: useCallback(() => dispatch({ type: "RESET_GAME" }), []),
    onViewMove: useCallback((idx) => dispatch({ type: "VIEW_MOVE", payload: idx }), []),
  });

  // Attempt to move a piece
  const attemptMove = useCallback(
    (from: Position, to: Position) => {
      const piece = getPieceAt(state.board, from);
      if (!piece || piece.color !== state.turn) return;

      const isLegal = state.legalMoves.some((m) => posEquals(m, to));
      if (!isLegal) return;

      // Intercept for pawn promotion
      const isPromotion =
        piece.type === "pawn" &&
        ((piece.color === "white" && to.rank === 8) ||
          (piece.color === "black" && to.rank === 1));

      if (isPromotion) {
        setPendingPromotion({ from, to, color: piece.color });
        return;
      }

      dispatch({ type: "MAKE_MOVE", payload: { from, to } });
    },
    [state.board, state.turn, state.legalMoves]
  );

  // Square click handler
  const handleSquareClick = useCallback(
    (pos: Position) => {
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

  // Perspective and active boards
  const displayBoard =
    state.viewIndex !== -1
      ? state.moveHistory[state.viewIndex].boardAfter
      : state.board;

  const displayLastMove =
    state.viewIndex !== -1
      ? state.moveHistory[state.viewIndex]
      : state.lastMove;

  const checkKingPos =
    state.viewIndex === -1 && (state.status === "check" || state.status === "checkmate")
      ? findKing(state.board, state.turn)
      : null;

  const topColor: PieceColor = state.isFlipped ? "white" : "black";
  const bottomColor: PieceColor = state.isFlipped ? "black" : "white";

  const topTime = topColor === "white" ? state.whiteTime : state.blackTime;
  const bottomTime = bottomColor === "white" ? state.whiteTime : state.blackTime;

  // Material evaluation
  const material = calculateMaterial(state.capturedPieces);
  const topAdvantage = topColor === "white" ? material.whiteAdvantage : material.blackAdvantage;
  const bottomAdvantage = bottomColor === "white" ? material.whiteAdvantage : material.blackAdvantage;

  const isGameOver =
    state.status === "checkmate" ||
    state.status === "stalemate" ||
    state.status === "draw-insufficient" ||
    state.status === "timeout";

  // Status presentation formatting
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
    statusTitle = "Checkmate!";
    statusSubtitle = `${winner} is victorious!`;
    statusBadgeBg = "bg-[#81b64c] text-white border-transparent";
  } else if (state.status === "timeout") {
    const winner = state.winner === "white" ? "White" : "Black";
    statusTitle = "Time Out!";
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

  return (
    <div className="min-h-screen bg-[#161512] text-gray-100 flex flex-col font-sans select-none">
      <Header
        statusTitle={statusTitle}
        isCheck={state.status === "check"}
        isGameOver={isGameOver}
        turn={state.turn}
        canUndo={state.moveHistory.length > 0}
        onUndo={() => dispatch({ type: "UNDO_MOVE" })}
        onFlip={() => dispatch({ type: "FLIP_BOARD" })}
        onReset={() => dispatch({ type: "RESET_GAME" })}
        timeControl={state.timeControl}
        onSelectTimeControl={(secs) => dispatch({ type: "SET_TIME_CONTROL", payload: secs })}
      />

      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center p-3 sm:p-6 gap-6 max-w-6xl mx-auto w-full">
        {/* Left Column: Board Console */}
        <div className="flex flex-col items-center gap-2 w-full max-w-[640px] xl:max-w-[680px]">
          <PlayerBar
            color={topColor}
            timeRemaining={topTime}
            timeControlActive={state.timeControl !== null}
            isTurn={state.turn === topColor && !isGameOver && state.viewIndex === -1}
            capturedPieces={topColor === "white" ? state.capturedPieces.white : state.capturedPieces.black}
            advantage={topAdvantage}
          />

          <Board
            board={displayBoard}
            turn={state.turn}
            isFlipped={state.isFlipped}
            selectedSquare={state.selectedSquare}
            legalMoves={state.viewIndex === -1 ? state.legalMoves : []}
            lastMove={displayLastMove}
            checkKingPosition={checkKingPos}
            isInteractive={state.viewIndex === -1 && (state.status === "playing" || state.status === "check")}
            onSquareClick={handleSquareClick}
            onMovePiece={attemptMove}
          />

          <PlayerBar
            color={bottomColor}
            timeRemaining={bottomTime}
            timeControlActive={state.timeControl !== null}
            isTurn={state.turn === bottomColor && !isGameOver && state.viewIndex === -1}
            capturedPieces={bottomColor === "white" ? state.capturedPieces.white : state.capturedPieces.black}
            advantage={bottomAdvantage}
          />

          {isGameOver && (
            <GameOverBanner
              statusTitle={statusTitle}
              statusSubtitle={statusSubtitle}
              onPlayAgain={() => dispatch({ type: "RESET_GAME" })}
            />
          )}
        </div>

        {/* Right Column: Game Sidebar */}
        <aside className="w-full max-w-[640px] lg:w-80 xl:w-96 h-[500px] lg:h-[680px] flex flex-col gap-3">
          <GameStatusCard
            statusTitle={statusTitle}
            statusSubtitle={statusSubtitle}
            statusBadgeBg={statusBadgeBg}
            badgeText={state.viewIndex !== -1 ? "Review" : state.turn}
          />

          <div className="flex-1 min-h-0">
            <MoveHistory
              moves={state.moveHistory}
              viewIndex={state.viewIndex}
              onViewMove={(idx) => dispatch({ type: "VIEW_MOVE", payload: idx })}
            />
          </div>

          <div className="bg-[#21201d] rounded-lg border border-white/5 p-3 flex flex-col gap-3 shadow-sm">
            <TimeControlSelector
              currentControl={state.timeControl}
              onSelectControl={(secs) => dispatch({ type: "SET_TIME_CONTROL", payload: secs })}
            />

            <ActionControls
              canUndo={state.moveHistory.length > 0}
              onNewGame={() => dispatch({ type: "RESET_GAME" })}
              onUndo={() => dispatch({ type: "UNDO_MOVE" })}
              onFlip={() => dispatch({ type: "FLIP_BOARD" })}
            />
          </div>
        </aside>
      </main>

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
