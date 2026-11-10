import React, { useCallback } from "react";
import type { Board as BoardType, Position, Piece, Move, PieceColor } from "../types/chess";
import { FILES, RANKS, posEquals, getPieceAt, fileToCol, rankToRow } from "../utils/chessLogic";
import { Square } from "./Square";

interface BoardProps {
  board: BoardType;
  turn: PieceColor;
  isFlipped: boolean;
  selectedSquare: Position | null;
  legalMoves: Position[];
  lastMove: Move | null;
  checkKingPosition: Position | null;
  isInteractive: boolean;
  onSquareClick: (pos: Position) => void;
  onMovePiece: (from: Position, to: Position) => void;
}

export function Board({
  board,
  turn,
  isFlipped,
  selectedSquare,
  legalMoves,
  lastMove,
  checkKingPosition,
  isInteractive,
  onSquareClick,
  onMovePiece,
}: BoardProps) {
  const displayRanks = isFlipped ? [...RANKS] : [...RANKS].reverse();
  const displayFiles = isFlipped ? [...FILES].reverse() : [...FILES];

  const handleDragStart = useCallback(
    (e: React.DragEvent, pos: Position) => {
      if (!isInteractive) return;
      const piece = getPieceAt(board, pos);
      if (piece && piece.color === turn) {
        e.dataTransfer.setData("text/plain", JSON.stringify(pos));
        e.dataTransfer.effectAllowed = "move";
        // Also select it
        onSquareClick(pos);
      }
    },
    [board, isInteractive, turn, onSquareClick]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, toPos: Position) => {
      e.preventDefault();
      if (!isInteractive) return;
      try {
        const raw = e.dataTransfer.getData("text/plain");
        if (!raw) return;
        const fromPos = JSON.parse(raw) as Position;
        if (!posEquals(fromPos, toPos)) {
          onMovePiece(fromPos, toPos);
        }
      } catch {
        // Drop parse error
      }
    },
    [isInteractive, onMovePiece]
  );

  return (
    <div className="w-full max-w-[640px] xl:max-w-[680px] aspect-square rounded-md overflow-hidden shadow-2xl border-4 border-[#2b2926] ring-1 ring-black/40 select-none">
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {displayRanks.map((rank, rankIdx) =>
          displayFiles.map((file, fileIdx) => {
            const pos: Position = { file, rank };
            const piece: Piece | null = getPieceAt(board, pos);

            const col = fileToCol(file);
            const row = rankToRow(rank);
            const isLight = (col + row) % 2 === 0;

            const isSelected = posEquals(selectedSquare, pos);
            const isLegalMove = legalMoves.some((m) => posEquals(m, pos));
            const isLastMoveFrom = !!lastMove && posEquals(lastMove.from, pos);
            const isLastMoveTo = !!lastMove && posEquals(lastMove.to, pos);
            const isInCheck = !!checkKingPosition && posEquals(checkKingPosition, pos);

            const showRankLabel = fileIdx === 0;
            const showFileLabel = rankIdx === 7;
            const canDrag = isInteractive && !!piece && piece.color === turn;

            return (
              <Square
                key={`${file}${rank}`}
                position={pos}
                isLight={isLight}
                piece={piece}
                isSelected={isSelected}
                isLegalMove={isLegalMove}
                isLastMoveFrom={isLastMoveFrom}
                isLastMoveTo={isLastMoveTo}
                isInCheck={isInCheck}
                showRankLabel={showRankLabel}
                showFileLabel={showFileLabel}
                canDrag={canDrag}
                onClick={onSquareClick}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
