import type { Board, Piece, PieceType, Position } from "../types/chess";
import { fileToCol, rankToRow } from "./coordinates.ts";
import { cloneBoard } from "./board.ts";

export interface ApplyMoveResult {
  newBoard: Board;
  capturedPiece: Piece | null;
  isCastle: "kingside" | "queenside" | false;
  isEnPassant: boolean;
}

export function applyMoveInternal(
  board: Board,
  from: Position,
  to: Position,
  promotion?: PieceType
): ApplyMoveResult {
  const newBoard = cloneBoard(board);
  const fromRow = rankToRow(from.rank);
  const fromCol = fileToCol(from.file);
  const toRow = rankToRow(to.rank);
  const toCol = fileToCol(to.file);

  const piece = newBoard[fromRow][fromCol]!;
  let capturedPiece: Piece | null = newBoard[toRow][toCol];
  let isCastle: "kingside" | "queenside" | false = false;
  let isEnPassant = false;

  // Clear source square
  newBoard[fromRow][fromCol] = null;

  // Handle En Passant
  if (piece.type === "pawn" && from.file !== to.file && !capturedPiece) {
    const epRow = fromRow;
    const epCol = toCol;
    capturedPiece = newBoard[epRow][epCol];
    newBoard[epRow][epCol] = null;
    isEnPassant = true;
  }

  // Handle Castling
  if (piece.type === "king" && Math.abs(toCol - fromCol) === 2) {
    if (to.file === "g") {
      isCastle = "kingside";
      const rook = newBoard[fromRow][7]!;
      newBoard[fromRow][7] = null;
      newBoard[fromRow][5] = { ...rook, hasMoved: true };
    } else if (to.file === "c") {
      isCastle = "queenside";
      const rook = newBoard[fromRow][0]!;
      newBoard[fromRow][0] = null;
      newBoard[fromRow][3] = { ...rook, hasMoved: true };
    }
  }

  // Handle Promotion
  const isPawnPromotion =
    piece.type === "pawn" &&
    ((piece.color === "white" && to.rank === 8) || (piece.color === "black" && to.rank === 1));

  if (isPawnPromotion) {
    const promoType = promotion || "queen";
    newBoard[toRow][toCol] = {
      id: `${piece.color}-${promoType}-${to.file}${to.rank}-${Date.now()}`,
      type: promoType,
      color: piece.color,
      hasMoved: true,
    };
  } else {
    newBoard[toRow][toCol] = {
      ...piece,
      hasMoved: true,
    };
  }

  return { newBoard, capturedPiece, isCastle, isEnPassant };
}
