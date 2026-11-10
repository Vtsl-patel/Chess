import React from "react";
import type { PieceColor, PieceType } from "../types/chess";

interface PieceProps {
  type: PieceType;
  color: PieceColor;
  size?: number | string;
  className?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

export function Piece({
  type,
  color,
  size = "100%",
  className = "",
  draggable = false,
  onDragStart,
}: PieceProps) {
  // Use public asset png with SVG fallback
  const imgSrc = `/assets/pieces/${color}/${type}.png`;

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className={`relative select-none flex items-center justify-center ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={imgSrc}
        alt={`${color} ${type}`}
        draggable={false}
        className="w-[88%] h-[88%] object-contain drop-shadow-md pointer-events-none transition-transform duration-100"
      />
    </div>
  );
}
