import type { Board, Coordinate, Player, GameSettings } from './types';
import { makeMove, checkWin, DIRECTIONS, isOutOfBounds } from './gameLogic';

// Evaluate all coordinates and find the best move for the AI player
export function computeBestMove(
  board: Board,
  aiPlayer: Player,
  settings: GameSettings
): Coordinate {
  const size = board.length;
  const humanPlayer: Player = aiPlayer === 'white' ? 'black' : 'white';

  let bestScore = -Infinity;
  let bestMoves: Coordinate[] = [];

  // Gather all playable coordinates
  // (In Phase Gomoku 5D, any coordinate is playable, even if it already has a stone)
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      for (let z = 0; z < size; z++) {
        const cell = board[x][y][z];
        let score = 0;

        // 1. STREAK WINNING OPPORTUNITY / BLOCKING
        // AI's streak on this cell
        if (cell.lastPlayer === aiPlayer) {
          // If we play here, our streak becomes cell.streak.ai + 1. If it reaches 5, we win!
          if (cell.streak[aiPlayer] === settings.streakWinLength - 1) {
            score += 100000; // Immediate win!
          } else {
            score += cell.streak[aiPlayer] * 200; // Value building own streak
          }
        } else if (cell.lastPlayer === humanPlayer) {
          // Opponent has streak. If we play here, we reset it.
          // If opponent was at 4, we MUST block.
          if (cell.streak[humanPlayer] === settings.streakWinLength - 1) {
            score += 80000; // Block immediate win
          } else {
            score += cell.streak[humanPlayer] * 250; // Block potential streak build
          }
        } else {
          // Empty cell. Placing here starts a streak of 1.
          score += 10;
        }

        // Simulate move to evaluate 5-in-a-row wins
        const simulatedBoard = makeMove(board, x, y, z, aiPlayer);
        const winInfo = checkWin(simulatedBoard, settings, aiPlayer);

        if (winInfo && winInfo.winner === aiPlayer) {
          score += 50000; // Completes 5-in-a-row (XYZ or Phase win)
        }

        // Simulate opponent move to check if we need to block their 5-in-a-row win
        const simulatedOpponentBoard = makeMove(board, x, y, z, humanPlayer);
        const opponentWinInfo = checkWin(simulatedOpponentBoard, settings, humanPlayer);

        if (opponentWinInfo && opponentWinInfo.winner === humanPlayer) {
          score += 25000; // Block opponent's 5-in-a-row win
        }

        // 2. LINE EVALUATION (XYZ Space & Phase alignments)
        // For each of the 13 directions, check what playing at (x, y, z) achieves
        for (const [dx, dy, dz] of DIRECTIONS) {
          // We look at lines of length 5 that cover (x, y, z)
          // There are 5 such offsets: offset = -4 to 0
          for (let offset = -4; offset <= 0; offset++) {
            const startX = x + offset * dx;
            const startY = y + offset * dy;
            const startZ = z + offset * dz;

            const endX = startX + 4 * dx;
            const endY = startY + 4 * dy;
            const endZ = startZ + 4 * dz;

            if (isOutOfBounds(startX, startY, startZ, size) || isOutOfBounds(endX, endY, endZ, size)) {
              continue;
            }

            // Get cells in this line
            const lineCells = [];
            for (let i = 0; i < 5; i++) {
              const cx = startX + i * dx;
              const cy = startY + i * dy;
              const cz = startZ + i * dz;
              // If it's the target cell, use our simulated player's value
              if (cx === x && cy === y && cz === z) {
                lineCells.push({ lastPlayer: aiPlayer, phase: (cell.phase + 1) % 10 });
              } else {
                lineCells.push(board[cx][cy][cz]);
              }
            }

            // A: XYZ Line potential
            const activeAIStones = lineCells.filter(c => c.lastPlayer === aiPlayer).length;
            const activeHumanStones = lineCells.filter(c => c.lastPlayer === humanPlayer).length;
            
            if (activeHumanStones === 0) {
              // pure AI line
              if (activeAIStones === 4) score += 1000;
              else if (activeAIStones === 3) score += 200;
              else if (activeAIStones === 2) score += 50;
            } else if (activeAIStones === 0) {
              // pure Human line (threat to us)
              if (activeHumanStones === 4) score += 800; // Block threat
              else if (activeHumanStones === 3) score += 150;
            }

            // B: Phase Line potential (Same Phase)
            const activePhases = lineCells.filter(c => c.lastPlayer !== null);
            if (activePhases.length >= 2) {
              // Count phase frequencies
              const phaseCounts: Record<number, number> = {};
              activePhases.forEach(c => {
                phaseCounts[c.phase] = (phaseCounts[c.phase] || 0) + 1;
              });
              for (const pStr in phaseCounts) {
                const count = phaseCounts[pStr];
                if (count === 4) score += 600;
                else if (count === 3) score += 120;
              }
            }
          }
        }

        // 3. SPATIAL CENTERING & PROXIMITY
        // Prefer playing near existing stones to create compact play
        let neighborCount = 0;
        for (let nx = -1; nx <= 1; nx++) {
          for (let ny = -1; ny <= 1; ny++) {
            for (let nz = -1; nz <= 1; nz++) {
              if (nx === 0 && ny === 0 && nz === 0) continue;
              const cx = x + nx;
              const cy = y + ny;
              const cz = z + nz;
              if (!isOutOfBounds(cx, cy, cz, size)) {
                if (board[cx][cy][cz].lastPlayer !== null) {
                  neighborCount++;
                }
              }
            }
          }
        }
        score += neighborCount * 8;

        // Prefer playing closer to the center of the board
        const center = (size - 1) / 2;
        const distToCenter = Math.sqrt(
          Math.pow(x - center, 2) + Math.pow(y - center, 2) + Math.pow(z - center, 2)
        );
        score += (size * Math.sqrt(3) - distToCenter) * 4;

        // Add a small amount of random noise to avoid deterministic ties
        score += Math.random() * 5;

        // Record the best score
        if (score > bestScore) {
          bestScore = score;
          bestMoves = [[x, y, z]];
        } else if (score === bestScore) {
          bestMoves.push([x, y, z]);
        }
      }
    }
  }

  // Choose a random move from the best moves to add variety
  const randomIndex = Math.floor(Math.random() * bestMoves.length);
  return bestMoves[randomIndex];
}
