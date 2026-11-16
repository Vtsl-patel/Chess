import type { Board, Piece, PieceColor, PieceType, Position } from "../types/chess";
import { colToFile, posEquals, rowToRank } from "./coordinates.ts";
import { isInCheck } from "./threats.ts";
import { isCheckmate } from "./gameStatus.ts";
import { getLegalMoves } from "./moveGeneration.ts";

export function generateSAN(
  boardBefore: Board,
  from: Position,
  to: Position,
  piece: Piece,
  capturedPiece: Piece | null,
  isCastle: "kingside" | "queenside" | false,
  isEnPassant: boolean,
  promotion: PieceType | undefined,
  boardAfter: Board,
  opponentColor: PieceColor,
  enPassantTargetNext: Position | null
): string {
  if (isCastle === "kingside") return "O-O";
  if (isCastle === "queenside") return "O-O-O";

  let san = "";

  if (piece.type === "pawn") {
    if (capturedPiece || isEnPassant) {
      san += `${from.file}x${to.file}${to.rank}`;
    } else {
      san += `${to.file}${to.rank}`;
    }
    if (promotion && typeof promotion === "string") {
      const pChar = promotion === "knight" ? "N" : promotion.charAt(0).toUpperCase();
      san += `=${pChar}`;
    }
  } else {
    const pieceChar = piece.type === "knight" ? "N" : piece.type.charAt(0).toUpperCase();
    san += pieceChar;

    // Disambiguation: check if another identical piece of same color can legally move to `to`
    const samePieces: Position[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const other = boardBefore[r][c];
        if (
          other &&
          other.color === piece.color &&
          other.type === piece.type &&
          other.id !== piece.id
        ) {
          const otherPos: Position = { file: colToFile(c), rank: rowToRank(r) };
          const otherMoves = getLegalMoves(boardBefore, otherPos, null);
          if (otherMoves.some((m) => posEquals(m, to))) {
            samePieces.push(otherPos);
          }
        }
      }
    }

    if (samePieces.length > 0) {
      const sameFile = samePieces.some((p) => p.file === from.file);
      const sameRank = samePieces.some((p) => p.rank === from.rank);

      if (!sameFile) {
        san += from.file;
      } else if (!sameRank) {
        san += from.rank.toString();
      } else {
        san += `${from.file}${from.rank}`;
      }
    }

    if (capturedPiece) {
      san += "x";
    }
    san += `${to.file}${to.rank}`;
  }

  // Check or Mate symbols
  const inCheck = isInCheck(boardAfter, opponentColor);
  if (inCheck) {
    const mate = isCheckmate(boardAfter, opponentColor, enPassantTargetNext);
    san += mate ? "#" : "+";
  }

  return san;
}
