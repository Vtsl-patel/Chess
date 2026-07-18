import React from "react";

interface CellProps {
  bgColor: string;
}

const Cell = ({ bgColor }: CellProps) => {
  return <span className={`w-25 h-25 ${bgColor} block`} />;
};

export const BoardRenderer = () => {
  const rows = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const cols = ["1", "2", "3", "4", "5", "6", "7", "8"];

  return (
    <div className="inline-block border border-black">
      {rows.map((rowId, rowIndex) => (
        <div className="grid grid-cols-8" key={rowId}>
          {cols.map((colId, colIndex) => (
            <Cell
              key={`${rowId}${colId}`}
              bgColor={
                (rowIndex + colIndex) % 2 === 0
                  ? "bg-[#739552]"
                  : "bg-[#EBECD0]"
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default BoardRenderer;