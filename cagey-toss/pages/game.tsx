/**
 * Cagey — Game Screen
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, Pressable, Alert } from 'react-native';
import { createRoute, useNavigation } from '@granite-js/react-native';
import { Grid } from '../src/components/Grid';
import { NumPad } from '../src/components/NumPad';
import { COLORS, GRID_SIZES, DIFFICULTY_NAMES, MOCK_PUZZLE } from '../src/constants';
import puzzleBundle from '../src/data/puzzleBundle.json';
import { getDailyPuzzleIndex } from '../src/engine/daily';
import * as storage from '../src/services/storage';
import * as leaderboard from '../src/services/leaderboard';
import type { Puzzle, PuzzleWithSolution, CellDisplayStatus, Difficulty } from '../src/engine/types';

export const Route = createRoute('/game', {
  validateParams: (params) => params as { difficulty: string; isDaily: string },
  component: GameScreen,
});

/** Build a cellCageMap from a puzzle */
function buildCellCageMap(puzzle: Puzzle): number[] {
  const map = new Array(puzzle.size * puzzle.size).fill(-1);
  puzzle.cages.forEach((cage, ci) => {
    cage.cells.forEach((cellIdx) => {
      map[cellIdx] = ci;
    });
  });
  return map;
}

/** Compute cell display status based on current grid state */
function computeCellStatus(
  idx: number,
  grid: number[],
  puzzle: Puzzle,
  cellCageMap: number[],
): CellDisplayStatus {
  const cageIdx = cellCageMap[idx];
  if (cageIdx < 0) return 'incomplete';
  const cage = puzzle.cages[cageIdx];
  const values = cage.cells.map((ci) => grid[ci]);

  // If any cell in the cage is empty, it's incomplete
  if (values.some((v) => v === 0)) return 'incomplete';

  // Check cage constraint
  let result: number;
  if (cage.op === '+') {
    result = values.reduce((a, b) => a + b, 0);
  } else {
    result = values.reduce((a, b) => a * b, 1);
  }

  return result === cage.target ? 'correct' : 'incorrect';
}

function GameScreen() {
  const navigation = useNavigation();
  const params = Route.useParams();
  const difficulty = params.difficulty || 'easy';
  const isDaily = params.isDaily === 'true';
  const gridSize = GRID_SIZES[difficulty] || 4;

  // Load puzzle from bundle based on difficulty and daily mode
  const puzzle: PuzzleWithSolution = useMemo(() => {
    const bundle = (puzzleBundle as Record<string, PuzzleWithSolution[]>)[difficulty];
    if (!bundle || bundle.length === 0) return MOCK_PUZZLE;
    if (isDaily) {
      const idx = getDailyPuzzleIndex(bundle.length);
      return bundle[idx];
    }
    const idx = Math.floor(Math.random() * bundle.length);
    return bundle[idx];
  }, [difficulty, isDaily]);
  const cellCageMap = useMemo(() => buildCellCageMap(puzzle), [puzzle]);

  const [grid, setGrid] = useState<number[]>(() => new Array(puzzle.size * puzzle.size).fill(0));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hints, setHints] = useState(3);
  const [undoStack, setUndoStack] = useState<Array<{ idx: number; prev: number }>>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const elapsedSecondsRef = useRef(0);
  const [isComplete, setIsComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((s) => {
        const next = s + 1;
        elapsedSecondsRef.current = next;
        return next;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Stop timer on complete
  useEffect(() => {
    if (isComplete && timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, [isComplete]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getCellStatus = useCallback(
    (idx: number): CellDisplayStatus => computeCellStatus(idx, grid, puzzle, cellCageMap),
    [grid, puzzle, cellCageMap],
  );

  const checkCompletion = useCallback(
    (newGrid: number[]) => {
      if (newGrid.some((v) => v === 0)) return false;
      for (const cage of puzzle.cages) {
        const values = cage.cells.map((ci) => newGrid[ci]);
        let result: number;
        if (cage.op === '+') {
          result = values.reduce((a, b) => a + b, 0);
        } else {
          result = values.reduce((a, b) => a * b, 1);
        }
        if (result !== cage.target) return false;
      }
      return true;
    },
    [puzzle],
  );

  const handleComplete = useCallback(async () => {
    const seconds = elapsedSecondsRef.current;
    try {
      await storage.recordSolve(difficulty as Difficulty, seconds);
      if (isDaily) {
        await storage.updateStreak();
      }
      await leaderboard.submitScore(difficulty as Difficulty, seconds, isDaily);
      const stats = await storage.getStats();
      const streak = await storage.getStreak();
      await storage.checkAndUnlockBadges(stats, streak);
    } catch (err) {
      console.warn('[game] post-completion error:', err);
    }
    navigation.navigate('/clear', {
      time: String(seconds),
      difficulty,
    });
  }, [difficulty, isDaily, navigation]);

  const handleNumber = useCallback(
    (n: number) => {
      if (selectedIndex == null || isComplete) return;
      setGrid((prev) => {
        const next = [...prev];
        setUndoStack((stack) => [...stack, { idx: selectedIndex, prev: prev[selectedIndex] }]);
        next[selectedIndex] = n;
        if (checkCompletion(next)) {
          setIsComplete(true);
          // Record stats and navigate after short delay
          setTimeout(() => {
            handleComplete();
          }, 600);
        }
        return next;
      });
    },
    [selectedIndex, isComplete, checkCompletion, handleComplete],
  );

  const handleBackspace = useCallback(() => {
    if (selectedIndex == null || isComplete) return;
    setGrid((prev) => {
      const next = [...prev];
      setUndoStack((stack) => [...stack, { idx: selectedIndex, prev: prev[selectedIndex] }]);
      next[selectedIndex] = 0;
      return next;
    });
  }, [selectedIndex, isComplete]);

  const handleUndo = useCallback(() => {
    if (isComplete) return;
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const last = stack[stack.length - 1];
      setGrid((prev) => {
        const next = [...prev];
        next[last.idx] = last.prev;
        return next;
      });
      return stack.slice(0, -1);
    });
  }, [isComplete]);

  const handleHint = useCallback(() => {
    if (hints <= 0 || isComplete) return;
    // Find first empty cell and reveal from solution
    const solution = puzzle.solution;
    const emptyIdx = grid.findIndex((v) => v === 0);
    if (emptyIdx === -1) return;

    setHints((h) => h - 1);
    setGrid((prev) => {
      const next = [...prev];
      next[emptyIdx] = solution[emptyIdx];
      if (checkCompletion(next)) {
        setIsComplete(true);
        setTimeout(() => {
          handleComplete();
        }, 600);
      }
      return next;
    });
    setSelectedIndex(emptyIdx);
  }, [hints, isComplete, grid, puzzle, checkCompletion, handleComplete]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.screen}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.topCenter}>
          <Text style={styles.difficultyLabel}>
            {isDaily ? '오늘의 도전' : DIFFICULTY_NAMES[difficulty] || difficulty}
          </Text>
        </View>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
        </View>
      </View>

      {/* Grid */}
      <View style={styles.gridWrapper}>
        <Grid
          size={puzzle.size}
          grid={grid}
          cages={puzzle.cages}
          selectedIndex={selectedIndex}
          cellCageMap={cellCageMap}
          getCellStatus={getCellStatus}
          onCellPress={setSelectedIndex}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <Pressable
          style={[styles.actionButton, undoStack.length === 0 && styles.actionDisabled]}
          onPress={handleUndo}
          disabled={undoStack.length === 0}
        >
          <Text style={styles.actionIcon}>↩</Text>
          <Text style={styles.actionLabel}>실행취소</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, hints <= 0 && styles.actionDisabled]}
          onPress={handleHint}
          disabled={hints <= 0}
        >
          <Text style={styles.actionIcon}>💡</Text>
          <Text style={styles.actionLabel}>힌트 ({hints}회 남음)</Text>
        </Pressable>
      </View>

      {/* NumPad */}
      <NumPad
        maxNumber={puzzle.size}
        disabled={selectedIndex == null || isComplete}
        onNumber={handleNumber}
        onBackspace={handleBackspace}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  backText: {
    fontSize: 22,
    color: COLORS.textPrimary,
  },
  topCenter: {
    flex: 1,
    alignItems: 'center',
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  timerContainer: {
    width: 70,
    alignItems: 'flex-end',
  },
  timerText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  gridWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionDisabled: {
    opacity: 0.4,
  },
  actionIcon: {
    fontSize: 16,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
