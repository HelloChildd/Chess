
import React from "react";
import { cn } from "@/lib/utils";

interface ChessBoardProps {
  board: string[][];
  selectedPiece: { row: number; col: number } | null;
  availableMoves: { row: number; col: number }[];
  onCellClick: (row: number, col: number) => void;
}

const ChessBoard: React.FC<ChessBoardProps> = ({
  board,
  selectedPiece,
  availableMoves,
  onCellClick,
}) => {
  // Get the CSS class for a chess cell based on its position
  const getCellClass = (row: number, col: number) => {
    const isSelected = selectedPiece?.row === row && selectedPiece?.col === col;
    const isAvailableMove = availableMoves.some(
      (move) => move.row === row && move.col === col
    );
    const isDarkSquare = (row + col) % 2 !== 0;

    return cn(
      "w-full aspect-square flex items-center justify-center text-3xl sm:text-4xl md:text-5xl relative transition-all cursor-pointer border border-transparent",
      isDarkSquare ? "bg-blue-800" : "bg-blue-100",
      isSelected && "ring-4 ring-yellow-400 z-10",
      isAvailableMove && 
        (board[row][col] 
          ? "ring-2 ring-red-500" 
          : "after:content-[''] after:absolute after:w-1/3 after:h-1/3 after:bg-green-500 after:rounded-full after:opacity-70")
    );
  };

  // Function to get the Unicode symbol for a chess piece
  const getPieceSymbol = (piece: string): string => {
    const symbols: Record<string, string> = {
      'wP': '♙', 'wR': '♖', 'wN': '♘', 'wB': '♗', 'wQ': '♕', 'wK': '♔',
      'bP': '♟', 'bR': '♜', 'bN': '♞', 'bB': '♝', 'bQ': '♛', 'bK': '♚'
    };
    return symbols[piece] || '';
  };

  // Function to get the color class for a piece
  const getPieceColorClass = (piece: string): string => {
    if (!piece) return '';
    return piece.charAt(0) === 'w' ? 'text-white drop-shadow-md' : 'text-black drop-shadow-md';
  };

  return (
    <div className="w-full aspect-square max-w-[600px] border-2 border-slate-700 shadow-xl rounded-sm overflow-hidden">
      <div className="w-full h-full grid grid-cols-8 grid-rows-8">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={getCellClass(rowIndex, colIndex)}
              onClick={() => onCellClick(rowIndex, colIndex)}
            >
              <span className={getPieceColorClass(cell)}>
                {getPieceSymbol(cell)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChessBoard;
