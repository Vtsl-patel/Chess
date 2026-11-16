import { useEffect } from "react";

interface UseChessShortcutsProps {
  moveHistoryLength: number;
  viewIndex: number;
  onUndo: () => void;
  onFlip: () => void;
  onReset: () => void;
  onViewMove: (index: number) => void;
}

export function useChessShortcuts({
  moveHistoryLength,
  viewIndex,
  onUndo,
  onFlip,
  onReset,
  onViewMove,
}: UseChessShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const currentIdx = viewIndex === -1 ? moveHistoryLength - 1 : viewIndex;

      if ((e.key === "u" || e.key === "U") && moveHistoryLength > 0) {
        onUndo();
      } else if (e.key === "f" || e.key === "F") {
        onFlip();
      } else if (e.key === "r" || e.key === "R") {
        onReset();
      } else if (e.key === "ArrowLeft" && moveHistoryLength > 0) {
        onViewMove(Math.max(0, currentIdx - 1));
      } else if (e.key === "ArrowRight" && moveHistoryLength > 0 && viewIndex !== -1) {
        if (currentIdx + 1 >= moveHistoryLength - 1) {
          onViewMove(-1);
        } else {
          onViewMove(currentIdx + 1);
        }
      } else if (e.key === "Escape" || e.key === "ArrowDown") {
        onViewMove(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveHistoryLength, viewIndex, onUndo, onFlip, onReset, onViewMove]);
}

