
// Chess engine for handling game logic and AI moves

// Board representation: 2D array of strings
// Each piece is represented as a two-character string:
// First character: 'w' for white, 'b' for black
// Second character: 'P' = pawn, 'R' = rook, 'N' = knight, 'B' = bishop, 'Q' = queen, 'K' = king
// Empty squares are represented as empty strings

// Initialize a new chess board with pieces in starting positions
export const initialBoard = (): string[][] => {
  return [
    ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
    ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
    ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR']
  ];
};

// Game state tracking
interface GameState {
  canWhiteCastleKingside: boolean;
  canWhiteCastleQueenside: boolean;
  canBlackCastleKingside: boolean;
  canBlackCastleQueenside: boolean;
}

export const initialGameState = (): GameState => {
  return {
    canWhiteCastleKingside: true,
    canWhiteCastleQueenside: true,
    canBlackCastleKingside: true,
    canBlackCastleQueenside: true
  };
};

// Check if it's white's turn
export const isWhiteTurn = (board: string[][]): boolean => {
  // In a real chess engine, this would track moves
  // For this demo, we'll use a simple heuristic
  let whitePieceCount = 0;
  let blackPieceCount = 0;
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece.startsWith('w')) whitePieceCount++;
      if (piece.startsWith('b')) blackPieceCount++;
    }
  }
  
  // If both sides have the same number of pieces, it's white's turn
  // This is a simplification - real chess would track the actual turn
  return whitePieceCount <= 16 && whitePieceCount >= blackPieceCount;
};

// Find the position of a king
const findKing = (board: string[][], isWhite: boolean): {row: number, col: number} | null => {
  const kingPiece = isWhite ? 'wK' : 'bK';
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (board[row][col] === kingPiece) {
        return { row, col };
      }
    }
  }
  
  return null;
};

// Check if a position is under attack by the opponent
const isSquareUnderAttack = (
  row: number, 
  col: number, 
  board: string[][], 
  byWhite: boolean
): boolean => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      
      const isPieceWhite = piece.charAt(0) === 'w';
      if (isPieceWhite === byWhite) {
        const moves = getRawPossibleMoves(r, c, board);
        if (moves.some(move => move.row === row && move.col === col)) {
          return true;
        }
      }
    }
  }
  
  return false;
};

// Check if a king is in check
export const isKingInCheck = (board: string[][], isWhiteKing: boolean): boolean => {
  const kingPos = findKing(board, isWhiteKing);
  if (!kingPos) return false;
  
  return isSquareUnderAttack(kingPos.row, kingPos.col, board, !isWhiteKing);
};

// Get raw possible moves without checking if they leave the king in check
const getRawPossibleMoves = (
  row: number, 
  col: number, 
  board: string[][]
): {row: number, col: number}[] => {
  const piece = board[row][col];
  if (!piece) return [];
  
  const possibleMoves: {row: number, col: number}[] = [];
  const pieceType = piece.charAt(1);
  const isWhite = piece.charAt(0) === 'w';
  
  // Pawn moves
  if (pieceType === 'P') {
    const direction = isWhite ? -1 : 1;
    
    // Forward move
    if (row + direction >= 0 && row + direction < 8 && !board[row + direction][col]) {
      possibleMoves.push({ row: row + direction, col });
      
      // Double move from starting position
      const startRow = isWhite ? 6 : 1;
      if (row === startRow && !board[row + 2 * direction][col]) {
        possibleMoves.push({ row: row + 2 * direction, col });
      }
    }
    
    // Capture moves
    for (const offset of [-1, 1]) {
      if (col + offset >= 0 && col + offset < 8) {
        const targetPiece = board[row + direction][col + offset];
        if (targetPiece && targetPiece.charAt(0) !== piece.charAt(0)) {
          possibleMoves.push({ row: row + direction, col: col + offset });
        }
      }
    }
  }
  
  // Rook moves
  if (pieceType === 'R' || pieceType === 'Q') {
    // Horizontal and vertical moves
    for (const direction of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      let r = row + direction[0];
      let c = col + direction[1];
      
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        if (!board[r][c]) {
          possibleMoves.push({ row: r, col: c });
        } else {
          if (board[r][c].charAt(0) !== piece.charAt(0)) {
            possibleMoves.push({ row: r, col: c });
          }
          break;
        }
        r += direction[0];
        c += direction[1];
      }
    }
  }
  
  // Knight moves
  if (pieceType === 'N') {
    for (const offset of [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]]) {
      const r = row + offset[0];
      const c = col + offset[1];
      
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        if (!board[r][c] || board[r][c].charAt(0) !== piece.charAt(0)) {
          possibleMoves.push({ row: r, col: c });
        }
      }
    }
  }
  
  // Bishop moves
  if (pieceType === 'B' || pieceType === 'Q') {
    // Diagonal moves
    for (const direction of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) {
      let r = row + direction[0];
      let c = col + direction[1];
      
      while (r >= 0 && r < 8 && c >= 0 && c < 8) {
        if (!board[r][c]) {
          possibleMoves.push({ row: r, col: c });
        } else {
          if (board[r][c].charAt(0) !== piece.charAt(0)) {
            possibleMoves.push({ row: r, col: c });
          }
          break;
        }
        r += direction[0];
        c += direction[1];
      }
    }
  }
  
  // King moves
  if (pieceType === 'K') {
    // Regular moves
    for (const offset of [[0, 1], [1, 1], [1, 0], [1, -1], [0, -1], [-1, -1], [-1, 0], [-1, 1]]) {
      const r = row + offset[0];
      const c = col + offset[1];
      
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        if (!board[r][c] || board[r][c].charAt(0) !== piece.charAt(0)) {
          possibleMoves.push({ row: r, col: c });
        }
      }
    }
  }
  
  return possibleMoves;
};

// Get all possible moves for a piece that don't leave the king in check
export const getPossibleMoves = (
  row: number, 
  col: number, 
  board: string[][], 
  gameState: GameState
): {row: number, col: number}[] => {
  const piece = board[row][col];
  if (!piece) return [];
  
  const isWhite = piece.charAt(0) === 'w';
  const pieceType = piece.charAt(1);
  
  // Get raw moves
  let possibleMoves = getRawPossibleMoves(row, col, board);
  
  // Add castling moves for king if applicable
  if (pieceType === 'K') {
    if (isWhite) {
      // Kingside castling
      if (gameState.canWhiteCastleKingside && 
          !board[7][5] && !board[7][6] && 
          board[7][7] === 'wR' &&
          !isKingInCheck(board, true) &&
          !isSquareUnderAttack(7, 5, board, false) &&
          !isSquareUnderAttack(7, 6, board, false)) {
        possibleMoves.push({ row: 7, col: 6 });
      }
      
      // Queenside castling
      if (gameState.canWhiteCastleQueenside && 
          !board[7][1] && !board[7][2] && !board[7][3] && 
          board[7][0] === 'wR' &&
          !isKingInCheck(board, true) &&
          !isSquareUnderAttack(7, 2, board, false) &&
          !isSquareUnderAttack(7, 3, board, false)) {
        possibleMoves.push({ row: 7, col: 2 });
      }
    } else {
      // Kingside castling
      if (gameState.canBlackCastleKingside && 
          !board[0][5] && !board[0][6] && 
          board[0][7] === 'bR' &&
          !isKingInCheck(board, false) &&
          !isSquareUnderAttack(0, 5, board, true) &&
          !isSquareUnderAttack(0, 6, board, true)) {
        possibleMoves.push({ row: 0, col: 6 });
      }
      
      // Queenside castling
      if (gameState.canBlackCastleQueenside && 
          !board[0][1] && !board[0][2] && !board[0][3] && 
          board[0][0] === 'bR' &&
          !isKingInCheck(board, false) &&
          !isSquareUnderAttack(0, 2, board, true) &&
          !isSquareUnderAttack(0, 3, board, true)) {
        possibleMoves.push({ row: 0, col: 2 });
      }
    }
  }
  
  // Filter moves that would leave the king in check
  const validMoves: {row: number, col: number}[] = [];
  
  for (const move of possibleMoves) {
    // Create a copy of the board to test the move
    const testBoard = board.map(row => [...row]);
    
    // Make the move
    testBoard[move.row][move.col] = testBoard[row][col];
    testBoard[row][col] = '';
    
    // Check if the king is in check after the move
    if (!isKingInCheck(testBoard, isWhite)) {
      validMoves.push(move);
    }
  }
  
  return validMoves;
};

// Update game state after a move
export const updateGameState = (
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
  board: string[][],
  gameState: GameState
): GameState => {
  const newGameState = { ...gameState };
  const piece = board[fromRow][fromCol];
  
  // Update castling rights if a king moves
  if (piece === 'wK') {
    newGameState.canWhiteCastleKingside = false;
    newGameState.canWhiteCastleQueenside = false;
    
    // Handle castling move
    if (fromRow === 7 && fromCol === 4) {
      // Kingside castling
      if (toCol === 6) {
        // Move the rook as well
        board[7][5] = board[7][7];
        board[7][7] = '';
      }
      // Queenside castling
      else if (toCol === 2) {
        // Move the rook as well
        board[7][3] = board[7][0];
        board[7][0] = '';
      }
    }
  } else if (piece === 'bK') {
    newGameState.canBlackCastleKingside = false;
    newGameState.canBlackCastleQueenside = false;
    
    // Handle castling move
    if (fromRow === 0 && fromCol === 4) {
      // Kingside castling
      if (toCol === 6) {
        // Move the rook as well
        board[0][5] = board[0][7];
        board[0][7] = '';
      }
      // Queenside castling
      else if (toCol === 2) {
        // Move the rook as well
        board[0][3] = board[0][0];
        board[0][0] = '';
      }
    }
  }
  
  // Update castling rights if a rook moves or is captured
  if (piece === 'wR') {
    if (fromRow === 7 && fromCol === 0) {
      newGameState.canWhiteCastleQueenside = false;
    } else if (fromRow === 7 && fromCol === 7) {
      newGameState.canWhiteCastleKingside = false;
    }
  } else if (piece === 'bR') {
    if (fromRow === 0 && fromCol === 0) {
      newGameState.canBlackCastleQueenside = false;
    } else if (fromRow === 0 && fromCol === 7) {
      newGameState.canBlackCastleKingside = false;
    }
  }
  
  // Check if a rook is captured
  const targetPiece = board[toRow][toCol];
  if (targetPiece === 'wR') {
    if (toRow === 7 && toCol === 0) {
      newGameState.canWhiteCastleQueenside = false;
    } else if (toRow === 7 && toCol === 7) {
      newGameState.canWhiteCastleKingside = false;
    }
  } else if (targetPiece === 'bR') {
    if (toRow === 0 && toCol === 0) {
      newGameState.canBlackCastleQueenside = false;
    } else if (toRow === 0 && toCol === 7) {
      newGameState.canBlackCastleKingside = false;
    }
  }
  
  return newGameState;
};

// Check if a pawn can be promoted
export const canPromotePawn = (row: number, col: number, board: string[][]): boolean => {
  const piece = board[row][col];
  if (!piece || piece.charAt(1) !== 'P') return false;
  
  return (piece.charAt(0) === 'w' && row === 0) || (piece.charAt(0) === 'b' && row === 7);
};

// Promote a pawn
export const promotePawn = (row: number, col: number, board: string[][], newPiece: string): void => {
  const piece = board[row][col];
  if (!piece || piece.charAt(1) !== 'P') return;
  
  const color = piece.charAt(0);
  board[row][col] = color + newPiece;
};

// Check if any valid moves are available for a player
const hasAnyValidMoves = (board: string[][], isWhite: boolean, gameState: GameState): boolean => {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.charAt(0) === (isWhite ? 'w' : 'b')) {
        const moves = getPossibleMoves(row, col, board, gameState);
        if (moves.length > 0) {
          return true;
        }
      }
    }
  }
  return false;
};

// Make a move for the computer (black pieces)
export const makeComputerMove = async (
  board: string[][], 
  gameState: GameState
): Promise<{ board: string[][], gameState: GameState }> => {
  // Create a copy of the board
  const newBoard = [...board.map(row => [...row])];
  let newGameState = { ...gameState };
  
  // Find all black pieces and their possible moves
  const blackPieces: {row: number, col: number, piece: string, moves: {row: number, col: number}[]}[] = [];
  
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col];
      if (piece && piece.charAt(0) === 'b') {
        const moves = getPossibleMoves(row, col, board, gameState);
        if (moves.length > 0) {
          blackPieces.push({row, col, piece, moves});
        }
      }
    }
  }
  
  // If there are black pieces with valid moves, make a move
  if (blackPieces.length > 0) {
    // For simplicity, we'll choose a random piece that can move
    const randomPieceIndex = Math.floor(Math.random() * blackPieces.length);
    const selectedPiece = blackPieces[randomPieceIndex];
    
    // Choose a random valid move
    const randomMoveIndex = Math.floor(Math.random() * selectedPiece.moves.length);
    const targetMove = selectedPiece.moves[randomMoveIndex];
    
    // Update game state
    newGameState = updateGameState(
      selectedPiece.row, 
      selectedPiece.col, 
      targetMove.row, 
      targetMove.col, 
      newBoard,
      newGameState
    );
    
    // Move the piece
    newBoard[targetMove.row][targetMove.col] = selectedPiece.piece;
    newBoard[selectedPiece.row][selectedPiece.col] = '';
    
    // Check for pawn promotion
    if (canPromotePawn(targetMove.row, targetMove.col, newBoard)) {
      // AI always promotes to queen for simplicity
      promotePawn(targetMove.row, targetMove.col, newBoard, 'Q');
    }
  }
  
  // Return the new board and game state after the computer's move
  return { board: newBoard, gameState: newGameState };
};

// Check if the game is over
export const isGameOver = (board: string[][], gameState: GameState): boolean => {
  // Check if white king is in checkmate
  if (isKingInCheck(board, true) && !hasAnyValidMoves(board, true, gameState)) {
    return true;
  }
  
  // Check if black king is in checkmate
  if (isKingInCheck(board, false) && !hasAnyValidMoves(board, false, gameState)) {
    return true;
  }
  
  // Check for stalemate (no legal moves but king is not in check)
  if (!isKingInCheck(board, true) && !hasAnyValidMoves(board, true, gameState)) {
    return true;
  }
  
  if (!isKingInCheck(board, false) && !hasAnyValidMoves(board, false, gameState)) {
    return true;
  }
  
  return false;
};

// Get the game status text
export const getGameStatus = (board: string[][], gameState: GameState): string => {
  // Check for checkmate
  if (isKingInCheck(board, true) && !hasAnyValidMoves(board, true, gameState)) {
    return "Checkmate! Computer wins.";
  }
  
  if (isKingInCheck(board, false) && !hasAnyValidMoves(board, false, gameState)) {
    return "Checkmate! You win!";
  }
  
  // Check for stalemate
  if (!isKingInCheck(board, true) && !hasAnyValidMoves(board, true, gameState)) {
    return "Stalemate! Game is a draw.";
  }
  
  if (!isKingInCheck(board, false) && !hasAnyValidMoves(board, false, gameState)) {
    return "Stalemate! Game is a draw.";
  }
  
  // Check if king is in check but not checkmate
  if (isKingInCheck(board, true)) {
    return "Your king is in check!";
  }
  
  if (isKingInCheck(board, false)) {
    return "Computer's king is in check!";
  }
  
  return "Game in progress";
};

// Reset the game
export const resetGame = (): { board: string[][], gameState: GameState } => {
  return {
    board: initialBoard(),
    gameState: initialGameState()
  };
};
