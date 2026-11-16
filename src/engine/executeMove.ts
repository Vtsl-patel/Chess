import type { Board, GameStatus, Move, Piece, PieceColor, PieceType, Position, Rank } from "../types/chess";
import { getPieceAt } from "./board.ts";
import { applyMoveInternal } from "./moveApplication.ts";
import { generateSAN } from "./san.ts";
import { isInCheck } from "./threats.ts";
import { isCheckmate, isInsufficientMaterial, isStalemate } from "./gameStatus.ts";

export interface ExecuteMoveResult {
  newBoard: Board;
  newTurn: PieceColor;
  move: Move;
  newCapturedPieces: { white: Piece[]; black: Piece[] };
  newEnPassantTarget: Position | null;
  status: GameStatus;
  winner: PieceColor | "draw" | null;
}

export function executeMove(
  board: Board,
  from: Position,
  to: Position,
  turn: PieceColor,
  capturedPieces: { white: Piece[]; black: Piece[] },
  _moveHistory?: Move[],
  promotion?: PieceType
): ExecuteMoveResult {
  const piece = getPieceAt(board, from)!;
  const opponentColor: PieceColor = turn === "white" ? "black" : "white";

  const { newBoard, capturedPiece, isCastle, isEnPassant } = applyMoveInternal(
    board,
    from,
    to,
    promotion
  );

  // New en passant target: pawn moved two ranks
  let newEnPassantTarget: Position | null = null;
  if (piece.type === "pawn" && Math.abs(from.rank - to.rank) === 2) {
    const targetRank = ((from.rank + to.rank) / 2) as Rank;
    newEnPassantTarget = { file: from.file, rank: targetRank };
  }

  // Update captured pieces
  const newCaptured = {
    white: [...capturedPieces.white],
    black: [...capturedPieces.black],
  };

  if (capturedPiece) {
    if (turn === "white") {
      newCaptured.white.push(capturedPiece);
    } else {
      newCaptured.black.push(capturedPiece);
    }
  }

  const san = generateSAN(
    board,
    from,
    to,
    piece,
    capturedPiece,
    isCastle,
    isEnPassant,
    promotion,
    newBoard,
    opponentColor,
    newEnPassantTarget
  );

  const move: Move = {
    from,
    to,
    piece,
    capturedPiece,
    promotion,
    isCastle,
    isEnPassant,
    san,
    boardBefore: board,
    boardAfter: newBoard,
  };

  // Determine game status
  let status: GameStatus = "playing";
  let winner: PieceColor | "draw" | null = null;

  if (isCheckmate(newBoard, opponentColor, newEnPassantTarget)) {
    status = "checkmate";
    winner = turn;
  } else if (isStalemate(newBoard, opponentColor, newEnPassantTarget)) {
    status = "stalemate";
    winner = "draw";
  } else if (isInsufficientMaterial(newBoard)) {
    status = "draw-insufficient";
    winner = "draw";
  } else if (isInCheck(newBoard, opponentColor)) {
    status = "check";
  }

  return {
    newBoard,
    newTurn: opponentColor,
    move,
    newCapturedPieces: newCaptured,
    newEnPassantTarget,
    status,
    winner,
  };
}
