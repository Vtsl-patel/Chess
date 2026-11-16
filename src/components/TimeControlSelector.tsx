import { TIME_OPTIONS } from "../store/game-state";

interface TimeControlSelectorProps {
  currentControl: number | null;
  onSelectControl: (seconds: number | null) => void;
}

export function TimeControlSelector({
  currentControl,
  onSelectControl,
}: TimeControlSelectorProps) {
  return (
    <div>
      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1.5">
        Time Control
      </span>
      <div className="grid grid-cols-5 gap-1">
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            onClick={() => onSelectControl(opt.seconds)}
            className={`py-1 text-xs font-semibold rounded text-center transition ${
              currentControl === opt.seconds
                ? "bg-[#81b64c] text-white font-bold"
                : "bg-[#181715] text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

