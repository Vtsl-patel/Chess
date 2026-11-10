import type {
  GameState,
  Position,
  PieceType,
  Piece,
  Rank,
} from "../types/chess";
import {
  createInitialBoard,
  getLegalMoves,
  getPieceAt,
  posEquals,
  executeMove,
} from "../utils/chessLogic";

export const TIME_OPTIONS: { label: string; seconds: number | null }[] = [
  { label: "10m", seconds: 600 },
  { label: "5m", seconds: 300 },
  { label: "3m", seconds: 180 },
  { label: "1m", seconds: 60 },
  { label: "∞", seconds: null },
];

export const initialGameState: GameState = {
  board: createInitialBoard(),
  turn: "white",
  status: "playing",
  winner: null,
  moveHistory: [],
  viewIndex: -1,
  capturedPieces: {
    white: [],
    black: [],
  },
  selectedSquare: null,
  legalMoves: [],
  lastMove: null,
  enPassantTarget: null,
  isFlipped: false,
  whiteTime: 600,
  blackTime: 600,
  timeControl: 600,
};

export type ChessAction =
  | { type: "SELECT_SQUARE"; payload: Position }
  | { type: "CLEAR_SELECTION" }
  | { type: "MAKE_MOVE"; payload: { from: Position; to: Position; promotion?: PieceType } }
  | { type: "UNDO_MOVE" }
  | { type: "FLIP_BOARD" }
  | { type: "TICK_TIMER" }
  | { type: "SET_TIME_CONTROL"; payload: number | null }
  | { type: "VIEW_MOVE"; payload: number }
  | { type: "RESET_GAME" };

export function gameReducer(state: GameState, action: ChessAction): GameState {
  switch (action.type) {
    case "SELECT_SQUARE": {
      // If reviewing past position, jump back to live board on click
      if (state.viewIndex !== -1) {
        return { ...state, viewIndex: -1, selectedSquare: null, legalMoves: [] };
      }

      const { board, turn, enPassantTarget } = state;
      const clickedPos = action.payload;
      const clickedPiece = getPieceAt(board, clickedPos);

      // If clicking own piece, select it and show legal moves
      if (clickedPiece && clickedPiece.color === turn) {
        if (posEquals(state.selectedSquare, clickedPos)) {
          return { ...state, selectedSquare: null, legalMoves: [] };
        }
        const legal = getLegalMoves(board, clickedPos, enPassantTarget);
        return {
          ...state,
          selectedSquare: clickedPos,
          legalMoves: legal,
        };
      }

      // If already selected and clicked pos is a legal move, execute
      if (state.selectedSquare && state.legalMoves.some((m) => posEquals(m, clickedPos))) {
        return gameReducer(state, {
          type: "MAKE_MOVE",
          payload: { from: state.selectedSquare, to: clickedPos },
        });
      }

      return { ...state, selectedSquare: null, legalMoves: [] };
    }

    case "CLEAR_SELECTION": {
      return { ...state, selectedSquare: null, legalMoves: [] };
    }

    case "MAKE_MOVE": {
      const { from, to, promotion } = action.payload;
      const { board, turn, capturedPieces, moveHistory } = state;

      const piece = getPieceAt(board, from);
      if (!piece || piece.color !== turn) return state;

      const execution = executeMove(
        board,
        from,
        to,
        turn,
        capturedPieces,
        moveHistory,
        promotion
      );

      return {
        ...state,
        board: execution.newBoard,
        turn: execution.newTurn,
        status: execution.status,
        winner: execution.winner,
        moveHistory: [...moveHistory, execution.move],
        viewIndex: -1,
        capturedPieces: execution.newCapturedPieces,
        selectedSquare: null,
        legalMoves: [],
        lastMove: execution.move,
        enPassantTarget: execution.newEnPassantTarget,
      };
    }

    case "UNDO_MOVE": {
      if (state.moveHistory.length === 0) return state;

      const lastMove = state.moveHistory[state.moveHistory.length - 1];
      const newHistory = state.moveHistory.slice(0, -1);
      const previousMove = newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;

      const newCaptured: { white: Piece[]; black: Piece[] } = { white: [], black: [] };
      for (const m of newHistory) {
        if (m.capturedPiece) {
          if (m.piece.color === "white") {
            newCaptured.white.push(m.capturedPiece);
          } else {
            newCaptured.black.push(m.capturedPiece);
          }
        }
      }

      let epTarget: Position | null = null;
      if (
        previousMove &&
        previousMove.piece.type === "pawn" &&
        Math.abs(previousMove.from.rank - previousMove.to.rank) === 2
      ) {
        epTarget = {
          file: previousMove.from.file,
          rank: ((previousMove.from.rank + previousMove.to.rank) / 2) as Rank,
        };
      }

      return {
        ...state,
        board: lastMove.boardBefore,
        turn: lastMove.piece.color,
        status: "playing",
        winner: null,
        moveHistory: newHistory,
        viewIndex: -1,
        capturedPieces: newCaptured,
        selectedSquare: null,
        legalMoves: [],
        lastMove: previousMove,
        enPassantTarget: epTarget,
      };
    }

    case "VIEW_MOVE": {
      const idx = action.payload;
      if (idx < -1 || idx >= state.moveHistory.length) return state;
      return {
        ...state,
        viewIndex: idx,
        selectedSquare: null,
        legalMoves: [],
      };
    }

    case "TICK_TIMER": {
      if (state.status !== "playing" && state.status !== "check") return state;
      if (state.timeControl === null) return state;

      if (state.turn === "white") {
        const nextTime = state.whiteTime - 1;
        if (nextTime <= 0) {
          return {
            ...state,
            whiteTime: 0,
            status: "timeout",
            winner: "black",
          };
        }
        return { ...state, whiteTime: nextTime };
      } else {
        const nextTime = state.blackTime - 1;
        if (nextTime <= 0) {
          return {
            ...state,
            blackTime: 0,
            status: "timeout",
            winner: "white",
          };
        }
        return { ...state, blackTime: nextTime };
      }
    }

    case "SET_TIME_CONTROL": {
      const tc = action.payload;
      const initialSecs = tc ?? 0;
      return {
        ...state,
        timeControl: tc,
        whiteTime: initialSecs,
        blackTime: initialSecs,
      };
    }

    case "FLIP_BOARD": {
      return {
        ...state,
        isFlipped: !state.isFlipped,
      };
    }

    case "RESET_GAME": {
      const initialSecs = state.timeControl ?? 0;
      return {
        ...initialGameState,
        timeControl: state.timeControl,
        whiteTime: initialSecs,
        blackTime: initialSecs,
        isFlipped: state.isFlipped,
      };
    }

    default:
      return state;
  }
}
