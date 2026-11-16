import type { PieceColor } from "../types/chess";

interface GameStatusCardProps {
  statusTitle: string;
  statusSubtitle: string;
  statusBadgeBg: string;
  badgeText: string | PieceColor;
}

export function GameStatusCard({
  statusTitle,
  statusSubtitle,
  statusBadgeBg,
  badgeText,
}: GameStatusCardProps) {
  return (
    <div className="bg-[#21201d] rounded-lg border border-white/5 p-4 flex items-center justify-between shadow-sm">
      <div>
        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
          Status
        </span>
        <h2 className="text-sm sm:text-base font-bold text-white mt-0.5">
          {statusTitle}
        </h2>
        <p className="text-xs text-gray-400">{statusSubtitle}</p>
      </div>
      <div
        className={`px-2.5 py-1 rounded text-xs font-bold border capitalize ${statusBadgeBg}`}
      >
        {badgeText}
      </div>
    </div>
  );
}

