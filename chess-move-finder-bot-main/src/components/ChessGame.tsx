
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ChessBoard from "./ChessBoard";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  initialBoard, 
  initialGameState,
  makeComputerMove, 
  getPossibleMoves,
  updateGameState,
  canPromotePawn,
  promotePawn,
  isWhiteTurn, 
  isGameOver, 
  getGameStatus, 
  resetGame,
  isKingInCheck
} from "@/utils/chessEngine";
import { toast } from "@/components/ui/use-toast";

// Import the GameState interface or define it here
interface GameState {
  canWhiteCastleKingside: boolean;
  canWhiteCastleQueenside: boolean;
  canBlackCastleKingside: boolean;
  canBlackCastleQueenside: boolean;
}

const ChessGame = () => {
  const [board, setBoard] = useState(initialBoard());
  const [gameState, setGameState] = useState(initialGameState());
  const [selectedPiece, setSelectedPiece] = useState<{ row: number; col: number } | null>(null);
  const [availableMoves, setAvailableMoves] = useState<{ row: number; col: number }[]>([]);
  const [gameStatus, setGameStatus] = useState("Your turn");
  const [capturedWhite, setCapturedWhite] = useState<string[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);
  const [promotionPosition, setPromotionPosition] = useState<{row: number, col: number} | null>(null);

  // Handle when a cell is clicked on the board
  const handleCellClick = (row: number, col: number) => {
    // If game is over, don't allow more moves
    if (gameOver) return;

    // If showing promotion dialog, don't process clicks
    if (showPromotion) return;

    // If player turn (white pieces)
    if (isWhiteTurn(board)) {
      const piece = board[row][col];
      
      // If clicked on an available move, move the selected piece
      if (selectedPiece && availableMoves.some(move => move.row === row && move.col === col)) {
        const newBoard = [...board.map(rowArr => [...rowArr])];
        const movingPiece = newBoard[selectedPiece.row][selectedPiece.col];
        
        // Update game state (castling rights)
        const newGameState = updateGameState(
          selectedPiece.row,
          selectedPiece.col,
          row,
          col,
          newBoard,
          gameState
        );
        setGameState(newGameState);
        
        // Check if capturing a piece
        if (newBoard[row][col]) {
          if (newBoard[row][col].charAt(0) === 'b') {
            setCapturedBlack([...capturedBlack, newBoard[row][col]]);
          } else {
            setCapturedWhite([...capturedWhite, newBoard[row][col]]);
          }
        }
        
        // Move the piece
        newBoard[row][col] = movingPiece;
        newBoard[selectedPiece.row][selectedPiece.col] = '';
        
        // Check for pawn promotion
        if (movingPiece === 'wP' && row === 0) {
          setPromotionPosition({ row, col });
          setShowPromotion(true);
          setBoard(newBoard);
          return;
        }
        
        setBoard(newBoard);
        setSelectedPiece(null);
        setAvailableMoves([]);
        
        // Check if game is over after player move
        if (isGameOver(newBoard, newGameState)) {
          handleGameOver(newBoard, newGameState);
          return;
        }
        
        // Check if black king is in check after player's move
        if (isKingInCheck(newBoard, false)) {
          setGameStatus("Computer's king is in check!");
        } else {
          setGameStatus("Computer is thinking...");
        }
        
        // Make computer move after short delay
        setTimeout(() => {
          makeComputerMove(newBoard, newGameState).then(result => {
            setBoard(result.board);
            setGameState(result.gameState);
            updateCapturedPieces(result.board);
            
            if (isGameOver(result.board, result.gameState)) {
              handleGameOver(result.board, result.gameState);
            } else if (isKingInCheck(result.board, true)) {
              setGameStatus("Your king is in check!");
            } else {
              setGameStatus("Your turn");
            }
          });
        }, 500);
      } 
      // If clicked on own piece, select it and show available moves
      else if (piece && piece.charAt(0) === 'w') {
        const moves = getPossibleMoves(row, col, board, gameState);
        setSelectedPiece({ row, col });
        setAvailableMoves(moves);
      } 
      // If clicked elsewhere, deselect
      else {
        setSelectedPiece(null);
        setAvailableMoves([]);
      }
    }
  };

  // Handle pawn promotion choice
  const handlePromotion = (pieceType: string) => {
    if (!promotionPosition) return;
    
    const newBoard = [...board.map(row => [...row])];
    promotePawn(promotionPosition.row, promotionPosition.col, newBoard, pieceType);
    setBoard(newBoard);
    setShowPromotion(false);
    setPromotionPosition(null);
    
    // Check if game is over after promotion
    if (isGameOver(newBoard, gameState)) {
      handleGameOver(newBoard, gameState);
      return;
    }
    
    // Check if black king is in check after promotion
    if (isKingInCheck(newBoard, false)) {
      setGameStatus("Computer's king is in check!");
    } else {
      setGameStatus("Computer is thinking...");
    }
    
    // Make computer move after promotion
    setTimeout(() => {
      makeComputerMove(newBoard, gameState).then(result => {
        setBoard(result.board);
        setGameState(result.gameState);
        updateCapturedPieces(result.board);
        
        if (isGameOver(result.board, result.gameState)) {
          handleGameOver(result.board, result.gameState);
        } else if (isKingInCheck(result.board, true)) {
          setGameStatus("Your king is in check!");
        } else {
          setGameStatus("Your turn");
        }
      });
    }, 500);
  };

  // Update the captured pieces display
  const updateCapturedPieces = (newBoard: string[][]) => {
    const white: string[] = [];
    const black: string[] = [];
    
    // Find pieces that are no longer on the board
    for (let piece of getAllPieces(initialBoard())) {
      if (!isOnBoard(piece, newBoard)) {
        if (piece.charAt(0) === 'w') {
          white.push(piece);
        } else {
          black.push(piece);
        }
      }
    }
    
    setCapturedWhite(white);
    setCapturedBlack(black);
  };

  // Check if a piece is on the board
  const isOnBoard = (piece: string, currentBoard: string[][]) => {
    let count = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (currentBoard[row][col] === piece) {
          count++;
        }
      }
    }
    // Check if all instances of this piece type are present
    const initialCount = getAllPiecesCount(initialBoard(), piece);
    return count >= initialCount;
  };

  // Count the number of a specific piece on the board
  const getAllPiecesCount = (currentBoard: string[][], pieceType: string) => {
    let count = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (currentBoard[row][col] === pieceType) {
          count++;
        }
      }
    }
    return count;
  };

  // Get all pieces from a board
  const getAllPieces = (currentBoard: string[][]) => {
    const pieces: string[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (currentBoard[row][col]) pieces.push(currentBoard[row][col]);
      }
    }
    return pieces;
  };

  // Handle game over scenarios
  const handleGameOver = (currentBoard: string[][], currentGameState: GameState) => {
    const status = getGameStatus(currentBoard, currentGameState);
    setGameStatus(status);
    setGameOver(true);
    toast({
      title: "Game Over",
      description: status,
      variant: "destructive",
    });
  };

  // Reset the game
  const handleReset = () => {
    const result = resetGame();
    setBoard(result.board);
    setGameState(result.gameState);
    setSelectedPiece(null);
    setAvailableMoves([]);
    setGameStatus("Your turn");
    setCapturedWhite([]);
    setCapturedBlack([]);
    setGameOver(false);
    setShowPromotion(false);
    setPromotionPosition(null);
    toast({
      title: "New Game",
      description: "The board has been reset. It's your turn!",
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center justify-center w-full max-w-6xl px-4">
      <div className="flex-1 w-full max-w-lg">
        <ChessBoard 
          board={board} 
          selectedPiece={selectedPiece} 
          availableMoves={availableMoves} 
          onCellClick={handleCellClick} 
        />
      </div>
      
      <div className="flex-1 w-full max-w-sm">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Game Status</CardTitle>
            <CardDescription>Play as White against the computer</CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="mb-4">
              <h3 className="font-semibold text-lg">{gameStatus}</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Captured Black Pieces:</h4>
                <div className="flex gap-1 flex-wrap">
                  {capturedBlack.map((piece, i) => (
                    <div key={i} className="w-8 h-8 flex items-center justify-center">
                      {getPieceSymbol(piece)}
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium">Captured White Pieces:</h4>
                <div className="flex gap-1 flex-wrap">
                  {capturedWhite.map((piece, i) => (
                    <div key={i} className="w-8 h-8 flex items-center justify-center">
                      {getPieceSymbol(piece)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button onClick={handleReset} className="w-full">
              New Game
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Pawn Promotion Dialog */}
      <Dialog open={showPromotion} onOpenChange={setShowPromotion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promote Pawn</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-4 p-4">
            <Button onClick={() => handlePromotion('Q')} className="text-3xl h-16 w-16">♕</Button>
            <Button onClick={() => handlePromotion('R')} className="text-3xl h-16 w-16">♖</Button>
            <Button onClick={() => handlePromotion('B')} className="text-3xl h-16 w-16">♗</Button>
            <Button onClick={() => handlePromotion('N')} className="text-3xl h-16 w-16">♘</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
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

export default ChessGame;
