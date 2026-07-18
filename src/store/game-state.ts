type GameState = {
    board: Board;

    turn: "white" | "black";

    moveHistory: Move[];

    enPassantTarget?: Position;

    castlingRights: {
        whiteKing: boolean;
        whiteQueen: boolean;
        blackKing: boolean;
        blackQueen: boolean;
    };
};