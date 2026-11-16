import type { Board, Piece, PieceColor, PieceType, Position } from "../types/chess";
import { FILES, colToFile, fileToCol, rankToRow, rowToRank } from "./coordinates.ts";

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function getPieceAt(board: Board, pos: Position): Piece | null {
  const row = rankToRow(pos.rank);
  const col = fileToCol(pos.file);
  if (row < 0 || row > 7 || col < 0 || col > 7) return null;
  return board[row][col];
}

export function findKing(board: Board, color: PieceColor): Position | null {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === "king" && piece.color === color) {
        return { file: colToFile(c), rank: rowToRank(r) };
      }
    }
  }
  return null;
}

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));

  const place = (rank: Position["rank"], file: Position["file"], type: PieceType, color: PieceColor) => {
    const row = rankToRow(rank);
    const col = fileToCol(file);
    board[row][col] = {
      id: `${color}-${type}-${file}${rank}`,
      type,
      color,
      hasMoved: false,
    };
  };

  const majorPieces: PieceType[] = [
    "rook",
    "knight",
    "bishop",
    "queen",
    "king",
    "bishop",
    "knight",
    "rook",
  ];

  FILES.forEach((f, idx) => {
    place(8, f, majorPieces[idx], "black");
    place(7, f, "pawn", "black");
    place(2, f, "pawn", "white");
    place(1, f, majorPieces[idx], "white");
  });

  return board;
}
