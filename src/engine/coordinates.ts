import type { File, Position, Rank } from "../types/chess";

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

