import type { Board, PieceColor, Position } from "../types/chess";
import { fileToCol, rankToRow } from "./coordinates.ts";
import { findKing } from "./board.ts";

export function isSquareAttacked(board: Board, target: Position, byColor: PieceColor): boolean {
  const tRow = rankToRow(target.rank);
  const tCol = fileToCol(target.file);

  // 1. Pawn attacks
  const pawnRow = byColor === "white" ? tRow + 1 : tRow - 1;
  for (const cOffset of [-1, 1]) {
    const pCol = tCol + cOffset;
    if (pawnRow >= 0 && pawnRow < 8 && pCol >= 0 && pCol < 8) {
      const p = board[pawnRow][pCol];
      if (p && p.type === "pawn" && p.color === byColor) {
        return true;
      }
    }
  }

  // 2. Knight attacks
  const knightOffsets = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ];
  for (const [dr, dc] of knightOffsets) {
    const r = tRow + dr;
    const c = tCol + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = board[r][c];
      if (p && p.type === "knight" && p.color === byColor) {
        return true;
      }
    }
  }

  // 3. Straight lines (Rook & Queen)
  const straightDirs = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
  ];
  for (const [dr, dc] of straightDirs) {
    let r = tRow + dr;
    let c = tCol + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = board[r][c];
      if (p) {
        if (p.color === byColor && (p.type === "rook" || p.type === "queen")) {
          return true;
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }

  // 4. Diagonals (Bishop & Queen)
  const diagDirs = [
    [-1, -1], [-1, 1], [1, -1], [1, 1],
  ];
  for (const [dr, dc] of diagDirs) {
    let r = tRow + dr;
    let c = tCol + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const p = board[r][c];
      if (p) {
        if (p.color === byColor && (p.type === "bishop" || p.type === "queen")) {
          return true;
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }

  // 5. King adjacent squares
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = tRow + dr;
      const c = tCol + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const p = board[r][c];
        if (p && p.type === "king" && p.color === byColor) {
          return true;
        }
      }
    }
  }

  return false;
}

export function isInCheck(board: Board, color: PieceColor): boolean {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;
  const opponentColor: PieceColor = color === "white" ? "black" : "white";
  return isSquareAttacked(board, kingPos, opponentColor);
}
