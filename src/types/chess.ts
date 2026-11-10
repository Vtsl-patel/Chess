export type PieceColor = "white" | "black";

export type PieceType = "pawn" | "knight" | "bishop" | "rook" | "queen" | "king";

export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface Position {
  file: File;
  rank: Rank;
}

export interface Piece {
  id: string;
  type: PieceType;
  color: PieceColor;
  hasMoved: boolean;
}

export type Board = (Piece | null)[][]; // 8x8 matrix: row 0 is rank 8, row 7 is rank 1. col 0 is file a, col 7 is file h.

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece | null;
  promotion?: PieceType;
  isCastle?: "kingside" | "queenside" | false;
  isEnPassant?: boolean;
  san: string;
  boardBefore: Board;
  boardAfter: Board;
}

export type GameStatus =
  | "playing"
  | "check"
  | "checkmate"
  | "stalemate"
  | "draw-insufficient"
  | "timeout";

export interface GameState {
  board: Board;
  turn: PieceColor;
  status: GameStatus;
  winner: PieceColor | "draw" | null;
  moveHistory: Move[];
  viewIndex: number; // -1 for live board, or 0..N-1 for past move review
  capturedPieces: {
    white: Piece[]; // Captured by white (black pieces)
    black: Piece[]; // Captured by black (white pieces)
  };
  selectedSquare: Position | null;
  legalMoves: Position[];
  lastMove: Move | null;
  enPassantTarget: Position | null;
  isFlipped: boolean;
  whiteTime: number; // in seconds
  blackTime: number; // in seconds
  timeControl: number | null; // null for untimed, or initial seconds
}
