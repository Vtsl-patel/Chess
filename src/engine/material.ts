import type { Piece, PieceType } from "../types/chess";

export interface MaterialScore {
  whiteScore: number;
  blackScore: number;
  whiteAdvantage: number;
  blackAdvantage: number;
}

const PIECE_VALUES: Record<PieceType, number> = {
  pawn: 1,
  knight: 3,
  bishop: 3,
  rook: 5,
  queen: 9,
  king: 0,
};

export function calculateMaterial(capturedPieces: { white: Piece[]; black: Piece[] }): MaterialScore {
  const whitePoints = capturedPieces.white.reduce(
    (acc, p) => acc + (PIECE_VALUES[p.type] || 0),
    0
  );
  const blackPoints = capturedPieces.black.reduce(
    (acc, p) => acc + (PIECE_VALUES[p.type] || 0),
    0
  );

  const diff = whitePoints - blackPoints;

  return {
    whiteScore: whitePoints,
    blackScore: blackPoints,
    whiteAdvantage: diff > 0 ? diff : 0,
    blackAdvantage: diff < 0 ? Math.abs(diff) : 0,
  };
}

