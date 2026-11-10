import React from "react";
import type { Position, Piece as PieceType } from "../types/chess";
import { Piece } from "./Piece";

interface SquareProps {
  position: Position;
  isLight: boolean;
  piece: PieceType | null;
  isSelected: boolean;
  isLegalMove: boolean;
  isLastMoveFrom: boolean;
  isLastMoveTo: boolean;
  isInCheck: boolean;
  showRankLabel: boolean;
  showFileLabel: boolean;
  canDrag: boolean;
  onClick: (pos: Position) => void;
  onDragStart: (e: React.DragEvent, pos: Position) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, pos: Position) => void;
}

export function Square({
  position,
  isLight,
  piece,
  isSelected,
  isLegalMove,
  isLastMoveFrom,
  isLastMoveTo,
  isInCheck,
  showRankLabel,
  showFileLabel,
  canDrag,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
}: SquareProps) {
  // Base square colors
  const baseBg = isLight ? "bg-[#ebecd0]" : "bg-[#739552]";
  const textColor = isLight ? "text-[#739552]" : "text-[#ebecd0]";

  // Highlights
  let highlightClass = "";
  if (isInCheck) {
    highlightClass = "bg-[#e05353]";
  } else if (isSelected) {
    highlightClass = isLight ? "bg-[#f5f682]" : "bg-[#baca44]";
  } else if (isLastMoveFrom || isLastMoveTo) {
    highlightClass = isLight ? "bg-[#f5f682cc]" : "bg-[#baca44cc]";
  }

  const isCapture = isLegalMove && piece !== null;
  const isEmptyLegal = isLegalMove && piece === null;

  return (
    <div
      onClick={() => onClick(position)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, position)}
      data-square={`${position.file}${position.rank}`}
      className={`relative w-full h-full select-none flex items-center justify-center cursor-pointer transition-colors duration-100 ${
        highlightClass || baseBg
      }`}
    >
      {/* Rank coordinate label (top-left) */}
      {showRankLabel && (
        <span
          className={`absolute top-0.5 left-1 text-[11px] font-bold pointer-events-none leading-none ${textColor}`}
        >
          {position.rank}
        </span>
      )}

      {/* File coordinate label (bottom-right) */}
      {showFileLabel && (
        <span
          className={`absolute bottom-0.5 right-1 text-[11px] font-bold pointer-events-none leading-none ${textColor}`}
        >
          {position.file}
        </span>
      )}

      {/* Piece */}
      {piece && (
        <Piece
          type={piece.type}
          color={piece.color}
          draggable={canDrag}
          onDragStart={(e) => onDragStart(e, position)}
        />
      )}

      {/* Legal Move Indicators (Chess.com style) */}
      {isEmptyLegal && (
        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-black/20 pointer-events-none" />
      )}

      {isCapture && (
        <div className="absolute inset-0 sm:inset-0.5 rounded-full border-4 border-black/25 pointer-events-none" />
      )}
    </div>
  );
}
