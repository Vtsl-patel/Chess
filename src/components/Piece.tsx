import React, { useRef, useState } from "react";
import type { PieceColor, PieceType } from "../types/chess";

interface PieceProps {
  type: PieceType;
  color: PieceColor;
  size?: number | string;
  className?: string;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function Piece({
  type,
  color,
  size = "100%",
  className = "",
  draggable = false,
  onDragStart,
  onDragEnd,
}: PieceProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const imgSrc = `/assets/pieces/${color}/${type}.png`;

  const handleDragStart = (e: React.DragEvent) => {
    if (!draggable) return;

    if (imgRef.current) {
      // Use exclusively the piece image as the drag ghost, centered on cursor
      const width = imgRef.current.width || imgRef.current.clientWidth || 50;
      const height = imgRef.current.height || imgRef.current.clientHeight || 50;
      e.dataTransfer.setDragImage(imgRef.current, width / 2, height / 2);
    }

    // Defer origin piece dimming so the browser takes a full-opacity drag snapshot first
    setTimeout(() => {
      setIsDragging(true);
    }, 0);

    onDragStart?.(e);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    onDragEnd?.(e);
  };

  return (
    <div
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`relative select-none flex items-center justify-center transition-opacity ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${isDragging ? "opacity-30" : "opacity-100"} ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        ref={imgRef}
        src={imgSrc}
        alt={`${color} ${type}`}
        draggable={false}
        className="w-[88%] h-[88%] object-contain drop-shadow-md pointer-events-none"
      />
    </div>
  );
}
