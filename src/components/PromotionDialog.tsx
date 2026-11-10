import type { PieceColor, PieceType } from "../types/chess";
import { Piece } from "./Piece";

interface PromotionDialogProps {
  open: boolean;
  color: PieceColor;
  onSelect: (pieceType: PieceType) => void;
  onCancel: () => void;
}

const PROMO_OPTIONS: { type: PieceType; label: string }[] = [
  { type: "queen", label: "Queen" },
  { type: "knight", label: "Knight" },
  { type: "rook", label: "Rook" },
  { type: "bishop", label: "Bishop" },
];

export function PromotionDialog({
  open,
  color,
  onSelect,
  onCancel,
}: PromotionDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#262421] border border-white/10 rounded-xl p-5 max-w-xs w-full text-center shadow-xl">
        <h3 className="text-base font-bold text-white mb-1">Promote Pawn</h3>
        <p className="text-xs text-gray-400 mb-4">Choose a piece</p>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {PROMO_OPTIONS.map((opt) => (
            <button
              key={opt.type}
              onClick={() => onSelect(opt.type)}
              className="flex flex-col items-center p-2 rounded-lg bg-[#302e2b] hover:bg-[#3d3a36] border border-white/5 hover:border-[#81b64c] transition"
            >
              <div className="w-10 h-10 flex items-center justify-center">
                <Piece type={opt.type} color={color} size={40} />
              </div>
              <span className="text-[11px] font-medium text-gray-300 mt-1">
                {opt.label}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="w-full py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-[#1f1e1b] rounded transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
