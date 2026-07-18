import { type PieceColor, type PieceType } from "./piece";

export type Piece = {
    id: string;
    type: PieceType;
    color: PieceColor;
    hasMoved: boolean;
};

export type Square = Piece | null;

export type Board = Square[][];