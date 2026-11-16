import type { Board, Piece, PieceColor, Position } from "../types/chess";
import { isInCheck } from "./threats.ts";
import { getAllLegalMoves } from "./moveGeneration.ts";

export function isCheckmate(
  board: Board,
  color: PieceColor,
  enPassantTarget: Position | null
): boolean {
  if (!isInCheck(board, color)) return false;
  return getAllLegalMoves(board, color, enPassantTarget).length === 0;
}

export function isStalemate(
  board: Board,
  color: PieceColor,
  enPassantTarget: Position | null
): boolean {
  if (isInCheck(board, color)) return false;
  return getAllLegalMoves(board, color, enPassantTarget).length === 0;
}

export function isInsufficientMaterial(board: Board): boolean {
  const pieces: Piece[] = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (p) pieces.push(p);
    }
  }

  // K vs K
  if (pieces.length === 2) return true;

  // K+B vs K or K+N vs K
  if (pieces.length === 3) {
    return pieces.some((p) => p.type === "bishop" || p.type === "knight");
  }

  // K+B vs K+B with bishops on the same color
  if (pieces.length === 4) {
    const bishops = pieces.filter((p) => p.type === "bishop");
    if (bishops.length === 2 && bishops[0].color !== bishops[1].color) {
      const bishopSquares: number[] = [];
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          const p = board[r][c];
          if (p && p.type === "bishop") {
            bishopSquares.push((r + c) % 2);
          }
        }
      }
      if (bishopSquares.length === 2 && bishopSquares[0] === bishopSquares[1]) {
        return true;
      }
    }
  }

  return false;
}
