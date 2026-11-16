import type { Board, PieceColor, Position, Rank } from "../types/chess";
import { colToFile, fileToCol, posEquals, rankToRow, rowToRank } from "./coordinates.ts";
import { getPieceAt } from "./board.ts";
import { isInCheck, isSquareAttacked } from "./threats.ts";
import { applyMoveInternal } from "./moveApplication.ts";

export function getPseudoLegalMoves(
  board: Board,
  pos: Position,
  enPassantTarget: Position | null
): Position[] {
  const piece = getPieceAt(board, pos);
  if (!piece) return [];

  const row = rankToRow(pos.rank);
  const col = fileToCol(pos.file);
  const { type, color } = piece;
  const moves: Position[] = [];

  const addIfOnBoard = (r: number, c: number): boolean => {
    if (r < 0 || r > 7 || c < 0 || c > 7) return false;
    const destPiece = board[r][c];
    if (!destPiece) {
      moves.push({ file: colToFile(c), rank: rowToRank(r) });
      return true;
    } else {
      if (destPiece.color !== color) {
        moves.push({ file: colToFile(c), rank: rowToRank(r) });
      }
      return false;
    }
  };

  if (type === "pawn") {
    const dir = color === "white" ? -1 : 1;
    const startRow = color === "white" ? 6 : 1;

    // 1 square forward
    const nextRow = row + dir;
    if (nextRow >= 0 && nextRow < 8 && !board[nextRow][col]) {
      moves.push({ file: colToFile(col), rank: rowToRank(nextRow) });

      // 2 squares forward from start rank
      const doubleRow = row + 2 * dir;
      if (row === startRow && !board[doubleRow][col]) {
        moves.push({ file: colToFile(col), rank: rowToRank(doubleRow) });
      }
    }

    // Diagonal captures
    for (const cOffset of [-1, 1]) {
      const capCol = col + cOffset;
      if (nextRow >= 0 && nextRow < 8 && capCol >= 0 && capCol < 8) {
        const destPiece = board[nextRow][capCol];
        const destPos: Position = { file: colToFile(capCol), rank: rowToRank(nextRow) };

        if (destPiece && destPiece.color !== color) {
          moves.push(destPos);
        } else if (!destPiece && enPassantTarget && posEquals(destPos, enPassantTarget)) {
          moves.push(destPos);
        }
      }
    }
  } else if (type === "knight") {
    const offsets = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1],
    ];
    for (const [dr, dc] of offsets) {
      addIfOnBoard(row + dr, col + dc);
    }
  } else if (type === "bishop" || type === "rook" || type === "queen") {
    const dirs: [number, number][] = [];
    if (type === "bishop" || type === "queen") {
      dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
    }
    if (type === "rook" || type === "queen") {
      dirs.push([-1, 0], [1, 0], [0, -1], [0, 1]);
    }

    for (const [dr, dc] of dirs) {
      let r = row + dr;
      let c = col + dc;
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const canContinue = addIfOnBoard(r, c);
        if (!canContinue) break;
        r += dr;
        c += dc;
      }
    }
  } else if (type === "king") {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        addIfOnBoard(row + dr, col + dc);
      }
    }

    // Castling
    if (!piece.hasMoved) {
      const opponent: PieceColor = color === "white" ? "black" : "white";
      const currentRank: Rank = color === "white" ? 1 : 8;

      if (!isInCheck(board, color) && pos.rank === currentRank && pos.file === "e") {
        // Kingside castling (g file)
        const kingsideRook = getPieceAt(board, { file: "h", rank: currentRank });
        if (kingsideRook && kingsideRook.type === "rook" && !kingsideRook.hasMoved) {
          const fSquare: Position = { file: "f", rank: currentRank };
          const gSquare: Position = { file: "g", rank: currentRank };
          if (
            !getPieceAt(board, fSquare) &&
            !getPieceAt(board, gSquare) &&
            !isSquareAttacked(board, fSquare, opponent) &&
            !isSquareAttacked(board, gSquare, opponent)
          ) {
            moves.push(gSquare);
          }
        }

        // Queenside castling (c file)
        const queensideRook = getPieceAt(board, { file: "a", rank: currentRank });
        if (queensideRook && queensideRook.type === "rook" && !queensideRook.hasMoved) {
          const bSquare: Position = { file: "b", rank: currentRank };
          const cSquare: Position = { file: "c", rank: currentRank };
          const dSquare: Position = { file: "d", rank: currentRank };
          if (
            !getPieceAt(board, bSquare) &&
            !getPieceAt(board, cSquare) &&
            !getPieceAt(board, dSquare) &&
            !isSquareAttacked(board, dSquare, opponent) &&
            !isSquareAttacked(board, cSquare, opponent)
          ) {
            moves.push(cSquare);
          }
        }
      }
    }
  }

  return moves;
}

export function getLegalMoves(
  board: Board,
  pos: Position,
  enPassantTarget: Position | null
): Position[] {
  const piece = getPieceAt(board, pos);
  if (!piece) return [];

  const pseudoMoves = getPseudoLegalMoves(board, pos, enPassantTarget);
  const legalMoves: Position[] = [];

  for (const to of pseudoMoves) {
    const { newBoard } = applyMoveInternal(board, pos, to);
    if (!isInCheck(newBoard, piece.color)) {
      legalMoves.push(to);
    }
  }

  return legalMoves;
}

export function getAllLegalMoves(
  board: Board,
  color: PieceColor,
  enPassantTarget: Position | null
): { from: Position; to: Position }[] {
  const allMoves: { from: Position; to: Position }[] = [];

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const from: Position = { file: colToFile(c), rank: rowToRank(r) };
        const moves = getLegalMoves(board, from, enPassantTarget);
        for (const to of moves) {
          allMoves.push({ from, to });
        }
      }
    }
  }

  return allMoves;
}
