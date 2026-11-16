import { useEffect } from "react";
import type { GameStatus } from "../types/chess";

interface UseChessTimerProps {
  status: GameStatus;
  timeControl: number | null;
  onTick: () => void;
}

export function useChessTimer({ status, timeControl, onTick }: UseChessTimerProps) {
  useEffect(() => {
    if (status !== "playing" && status !== "check") return;
    if (timeControl === null) return;

    const timer = setInterval(() => {
      onTick();
    }, 1000);

    return () => clearInterval(timer);
  }, [status, timeControl, onTick]);
}

