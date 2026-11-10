import { useEffect, useRef } from "react";
import type { Move } from "../types/chess";

interface MoveHistoryProps {
  moves: Move[];
  viewIndex: number;
  onViewMove: (idx: number) => void;
}

export function MoveHistory({ moves, viewIndex, onViewMove }: MoveHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom only when viewing live board
  useEffect(() => {
    if (viewIndex === -1 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length, viewIndex]);

  const rows: {
    number: number;
    white: { san: string; index: number } | null;
    black: { san: string; index: number } | null;
  }[] = [];

  for (let i = 0; i < moves.length; i += 2) {
    rows.push({
      number: Math.floor(i / 2) + 1,
      white: { san: moves[i]?.san || "", index: i },
      black: i + 1 < moves.length ? { san: moves[i + 1]?.san || "", index: i + 1 } : null,
    });
  }

  const effectiveIndex = viewIndex === -1 ? moves.length - 1 : viewIndex;

  return (
    <div className="flex flex-col h-full bg-[#262421] rounded-lg border border-white/5 overflow-hidden shadow-inner">
      {/* Table Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1f1e1b] border-b border-white/5 text-[11px] font-bold uppercase tracking-wider text-gray-400 select-none">
        <span>Moves ({moves.length})</span>
        {viewIndex !== -1 && (
          <span className="text-[10px] text-[#81b64c] font-semibold bg-[#81b64c]/10 px-1.5 py-0.5 rounded">
            Reviewing
          </span>
        )}
      </div>

      {/* Move list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto font-mono text-xs scrollbar-thin select-none"
      >
        {rows.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 italic py-12 text-xs">
            Moves will appear here
          </div>
        ) : (
          <div className="p-1 space-y-0.5">
            {rows.map((row) => (
              <div
                key={row.number}
                className="grid grid-cols-[36px_1fr_1fr] px-2 py-0.5 items-center rounded hover:bg-white/[0.04]"
              >
                <span className="text-gray-500 font-semibold text-[11px]">
                  {row.number}.
                </span>

                {/* White Move */}
                {row.white ? (
                  <button
                    onClick={() => onViewMove(row.white!.index)}
                    className={`text-left px-1.5 py-0.5 rounded font-semibold transition ${
                      effectiveIndex === row.white.index
                        ? "bg-[#81b64c] text-white"
                        : "text-gray-200 hover:bg-white/10"
                    }`}
                  >
                    {row.white.san}
                  </button>
                ) : (
                  <div />
                )}

                {/* Black Move */}
                {row.black ? (
                  <button
                    onClick={() => onViewMove(row.black!.index)}
                    className={`text-left px-1.5 py-0.5 rounded font-semibold transition ${
                      effectiveIndex === row.black.index
                        ? "bg-[#81b64c] text-white"
                        : "text-gray-300 hover:bg-white/10"
                    }`}
                  >
                    {row.black.san}
                  </button>
                ) : (
                  <div />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom History Navigation Toolbar */}
      <div className="flex items-center justify-around py-1.5 px-2 bg-[#1f1e1b] border-t border-white/5 text-gray-400">
        <button
          onClick={() => onViewMove(0)}
          disabled={moves.length === 0 || effectiveIndex <= 0}
          title="First Move"
          className="p-1.5 rounded hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => onViewMove(Math.max(0, effectiveIndex - 1))}
          disabled={moves.length === 0 || effectiveIndex <= 0}
          title="Previous Move"
          className="p-1.5 rounded hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => {
            if (effectiveIndex + 1 >= moves.length - 1) {
              onViewMove(-1);
            } else {
              onViewMove(effectiveIndex + 1);
            }
          }}
          disabled={moves.length === 0 || viewIndex === -1 || effectiveIndex >= moves.length - 1}
          title="Next Move"
          className="p-1.5 rounded hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => onViewMove(-1)}
          disabled={moves.length === 0 || viewIndex === -1}
          title="Live Board"
          className="p-1.5 rounded hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
