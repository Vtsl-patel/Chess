import type { Board, Piece, PieceColor, PieceType, Position, File, Rank, Move } from "../types/chess";

export const FILES: File[] = ["a", "b", "c", "d", "e", "f", "g", "h"];
export const RANKS: Rank[] = [1, 2, 3, 4, 5, 6, 7, 8];

export function fileToCol(file: File): number {
  return file.charCodeAt(0) - 97;
}

export function colToFile(col: number): File {
  return String.fromCharCode(97 + col) as File;
}

export function rankToRow(rank: Rank): number {
  return 8 - rank;
}

export function rowToRank(row: number): Rank {
  return (8 - row) as Rank;
}

export function posEquals(a: Position | null, b: Position | null): boolean {
  if (!a || !b) return false;
  return a.file === b.file && a.rank === b.rank;
}

export function posToKey(pos: Position): string {
  return `${pos.file}${pos.rank}`;
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function getPieceAt(board: Board, pos: Position): Piece | null {
  const row = rankToRow(pos.rank);
  const col = fileToCol(pos.file);
  if (row < 0 || row > 7 || col < 0 || col > 7) return null;
  return board[row][col];
}

export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: 8 }, () => Array(8).fill(null));

  const place = (rank: Rank, file: File, type: PieceType, color: PieceColor) => {
    const row = rankToRow(rank);
    const col = fileToCol(file);
    board[row][col] = {
      id: `${color}-${type}-${file}${rank}`,
      type,
      color,
      hasMoved: false,
    };
  };

  // Back ranks
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

export function isSquareAttacked(board: Board, target: Position, byColor: PieceColor): boolean {
  const tRow = rankToRow(target.rank);
  const tCol = fileToCol(target.file);

  // 1. Pawn attacks
  // If white is attacking target, white pawn is at tRow + 1
  // If black is attacking target, black pawn is at tRow - 1
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
        break; // Blocked
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
        break; // Blocked
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
      return true; // Can keep sliding
    } else {
      if (destPiece.color !== color) {
        moves.push({ file: colToFile(c), rank: rowToRank(r) });
      }
      return false; // Hit a piece, stop sliding
    }
  };

  if (type === "pawn") {
    const dir = color === "white" ? -1 : 1; // row direction
    const startRow = color === "white" ? 6 : 1; // rank 2 or 7

    // 1 square forward
    const nextRow = row + dir;
    if (nextRow >= 0 && nextRow < 8 && !board[nextRow][col]) {
      moves.push({ file: colToFile(col), rank: rowToRank(nextRow) });

      // 2 squares forward
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
          // En passant capture!
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
    // 8 adjacent
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

export function applyMoveInternal(
  board: Board,
  from: Position,
  to: Position,
  promotion?: PieceType
): { newBoard: Board; capturedPiece: Piece | null; isCastle: "kingside" | "queenside" | false; isEnPassant: boolean } {
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
    // Captured piece is on the same rank as from, at to.file
    const epRow = fromRow;
    const epCol = toCol;
    capturedPiece = newBoard[epRow][epCol];
    newBoard[epRow][epCol] = null;
    isEnPassant = true;
  }

  // Handle Castling
  if (piece.type === "king" && Math.abs(toCol - fromCol) === 2) {
    if (to.file === "g") {
      // Kingside: move rook from h to f
      isCastle = "kingside";
      const rook = newBoard[fromRow][7]!;
      newBoard[fromRow][7] = null;
      newBoard[fromRow][5] = { ...rook, hasMoved: true };
    } else if (to.file === "c") {
      // Queenside: move rook from a to d
      isCastle = "queenside";
      const rook = newBoard[fromRow][0]!;
      newBoard[fromRow][0] = null;
      newBoard[fromRow][3] = { ...rook, hasMoved: true };
    }
  }

  // Handle Promotion
  const isPawnPromotion =
    piece.type === "pawn" && ((piece.color === "white" && to.rank === 8) || (piece.color === "black" && to.rank === 1));

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
      // Find squares of the two bishops
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

export function calculateMaterial(capturedPieces: { white: Piece[]; black: Piece[] }) {
  const values: Record<PieceType, number> = {
    pawn: 1,
    knight: 3,
    bishop: 3,
    rook: 5,
    queen: 9,
    king: 0,
  };

  const whitePoints = capturedPieces.white.reduce((acc, p) => acc + (values[p.type] || 0), 0);
  const blackPoints = capturedPieces.black.reduce((acc, p) => acc + (values[p.type] || 0), 0);

  const diff = whitePoints - blackPoints;

  return {
    whiteScore: whitePoints,
    blackScore: blackPoints,
    whiteAdvantage: diff > 0 ? diff : 0,
    blackAdvantage: diff < 0 ? Math.abs(diff) : 0,
  };
}

export function executeMove(
  board: Board,
  from: Position,
  to: Position,
  turn: PieceColor,
  capturedPieces: { white: Piece[]; black: Piece[] },
  _moveHistory?: Move[],
  promotion?: PieceType
): {
  newBoard: Board;
  newTurn: PieceColor;
  move: Move;
  newCapturedPieces: { white: Piece[]; black: Piece[] };
  newEnPassantTarget: Position | null;
  status: "playing" | "check" | "checkmate" | "stalemate" | "draw-insufficient";
  winner: PieceColor | "draw" | null;
} {
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
  let status: "playing" | "check" | "checkmate" | "stalemate" | "draw-insufficient" = "playing";
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
