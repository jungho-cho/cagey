/**
 * Cagey — Grid Component
 * Renders NxN puzzle grid with cage borders, labels, and status colors.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { Cell } from './Cell';
import { COLORS } from '../constants';
import type { Cage, CellDisplayStatus } from '../engine/types';

interface GridProps {
  size: number; // NxN
  grid: number[]; // flat array of cell values
  cages: Cage[];
  selectedIndex: number | null;
  cellCageMap: number[]; // maps cell index -> cage index
  getCellStatus: (idx: number) => CellDisplayStatus;
  onCellPress: (idx: number) => void;
}

const GRID_PADDING = 16;
const SCREEN_WIDTH = Dimensions.get('window').width;

function GridComponent({
  size,
  grid,
  cages,
  selectedIndex,
  cellCageMap,
  getCellStatus,
  onCellPress,
}: GridProps) {
  const cellSize = Math.floor((SCREEN_WIDTH - GRID_PADDING * 2 - 4) / size);

  // Pre-compute cage labels: only show on the first cell of each cage
  const cageLabels = useMemo(() => {
    const labels: Record<number, string> = {};
    for (const cage of cages) {
      if (cage.cells.length > 0) {
        const firstCell = cage.cells[0];
        const opSymbol = cage.op === '+' ? '+' : '×';
        labels[firstCell] = `${cage.target}${opSymbol}`;
      }
    }
    return labels;
  }, [cages]);

  // Pre-compute thick borders: border is thick if adjacent cell is in a different cage
  const borderMap = useMemo(() => {
    const map: Array<{ top: boolean; right: boolean; bottom: boolean; left: boolean }> = [];
    for (let idx = 0; idx < size * size; idx++) {
      const row = Math.floor(idx / size);
      const col = idx % size;
      const myCage = cellCageMap[idx];

      map.push({
        top: row === 0 || cellCageMap[(row - 1) * size + col] !== myCage,
        right: col === size - 1 || cellCageMap[row * size + col + 1] !== myCage,
        bottom: row === size - 1 || cellCageMap[(row + 1) * size + col] !== myCage,
        left: col === 0 || cellCageMap[row * size + col - 1] !== myCage,
      });
    }
    return map;
  }, [size, cellCageMap]);

  const rows: React.ReactNode[] = [];
  for (let r = 0; r < size; r++) {
    const cells: React.ReactNode[] = [];
    for (let c = 0; c < size; c++) {
      const idx = r * size + c;
      const borders = borderMap[idx];
      cells.push(
        <Cell
          key={idx}
          value={grid[idx]}
          isSelected={selectedIndex === idx}
          status={getCellStatus(idx)}
          cageLabel={cageLabels[idx]}
          size={cellSize}
          borderTop={borders.top}
          borderRight={borders.right}
          borderBottom={borders.bottom}
          borderLeft={borders.left}
          onPress={() => onCellPress(idx)}
        />,
      );
    }
    rows.push(
      <View key={r} style={styles.row}>
        {cells}
      </View>,
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.gridOuter, { borderColor: COLORS.cageBorder }]}>{rows}</View>
    </View>
  );
}

export const Grid = React.memo(GridComponent);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: GRID_PADDING,
  },
  gridOuter: {
    borderWidth: 2.5,
    borderRadius: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
  },
});
