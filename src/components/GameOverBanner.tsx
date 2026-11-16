interface GameOverBannerProps {
  statusTitle: string;
  statusSubtitle: string;
  onPlayAgain: () => void;
}

export function GameOverBanner({
  statusTitle,
  statusSubtitle,
  onPlayAgain,
}: GameOverBannerProps) {
  return (
    <div className="w-full flex items-center justify-between px-4 py-3 bg-[#262421] rounded-lg border border-[#81b64c]/40 text-xs shadow-xl mt-1 animate-in fade-in">
      <div>
        <p className="font-bold text-white text-sm">{statusTitle}</p>
        <p className="text-gray-400 text-xs">{statusSubtitle}</p>
      </div>
      <button
        onClick={onPlayAgain}
        className="px-4 py-2 font-bold text-white bg-[#81b64c] hover:bg-[#92c55d] rounded-md transition shadow"
      >
        Play Again
      </button>
    </div>
  );
}

