import { useEffect, useState } from 'react';

// 타입 정의
type Cell = number | null;
export type Map2048 = Cell[][];
type Direction = 'up' | 'left' | 'right' | 'down';
type RotateDegree = 0 | 90 | 180 | 270;
type DirectionDegreeMap = Record<Direction, RotateDegree>;
type MoveResult = { result: Map2048; isMoved: boolean, gained: number };

// 게임판 유효 검사, 모든 행의 길이가 동일한지 확인
const validateMapIsNByM = (map: Map2048) => {
  const firstColumnCount = map[0].length;
  return map.every((row) => row.length === firstColumnCount);
};

// 어떤 방향이든 회전을 하여 left move만 구현하도록
// up -> 90도 반시계, right -> 180도, down -> 270도 반시계 회전
const rotateMapCounterClockwise = (
  map: Map2048,
  degree: RotateDegree
): Map2048 => {
  const rowLength = map.length;
  const columnLength = map[0].length;
  switch (degree) {
    case 0:
      return map;
    case 90:
      return Array.from({ length: columnLength }, (_, columnIndex) =>
        Array.from(
          { length: rowLength },
          (_, rowIndex) => map[rowIndex][columnLength - columnIndex - 1]
        )
      );
    case 180:
      return Array.from({ length: rowLength }, (_, rowIndex) =>
        Array.from(
          { length: columnLength },
          (_, columnIndex) =>
            map[rowLength - rowIndex - 1][columnLength - columnIndex - 1]
        )
      );
    case 270:
      return Array.from({ length: columnLength }, (_, columnIndex) =>
        Array.from(
          { length: rowLength },
          (_, rowIndex) => map[rowLength - rowIndex - 1][columnIndex]
        )
      );
  }
};

// left move 구현, 병합 및 이동
const moveRowLeft = (row: Cell[]): { result: Cell[]; isMoved: boolean; gained: number } => {
  const reduced = row.reduce(
    (acc: { lastCell: Cell; result: Cell[]; gained: number }, cell) => {
      if (cell === null) {
        return acc;
      } else if (acc.lastCell === null) {
        return { ...acc, lastCell: cell, gcained: acc.gained };
      } else if (acc.lastCell === cell) {
        return { result: [...acc.result, cell * 2], lastCell: null, gained: cell };
      } else {
        return { result: [...acc.result, acc.lastCell], lastCell: cell, gained: acc.gained };
      }
    },
    { lastCell: null, result: [], gained: 0 }
  );
  const result = [...reduced.result, reduced.lastCell];
  const resultRow = Array.from(
    { length: row.length },
    (_, i) => result[i] ?? null
  );
  return {
    result: resultRow,
    isMoved: row.some((cell, i) => cell !== resultRow[i]),
    gained: reduced.gained,
  };
};

const moveLeft = (map: Map2048): MoveResult => {
  const movedRows = map.map(moveRowLeft);
  const result = movedRows.map((movedRow) => movedRow.result);
  const isMoved = movedRows.some((movedRow) => movedRow.isMoved);
  const gained = movedRows.reduce((acc, movedRow) => acc + movedRow.gained, 0);
  return { result, isMoved, gained };
};

const rotateDegreeMap: DirectionDegreeMap = {
  up: 90,
  right: 180,
  down: 270,
  left: 0,
};
const revertDegreeMap: DirectionDegreeMap = {
  up: 270,
  right: 180,
  down: 90,
  left: 0,
};

export const moveMapIn2048Rule = (
  map: Map2048,
  direction: Direction,
): MoveResult => {
  if (!validateMapIsNByM(map)) throw new Error('Map is not N by M');
  const rotatedMap = rotateMapCounterClockwise(map, rotateDegreeMap[direction]);
  const { result, isMoved, gained } = moveLeft(rotatedMap);
  return {
    result: rotateMapCounterClockwise(result, revertDegreeMap[direction]),
    isMoved,
    gained,
  };
};

// Cell 컴포넌트
const CellView = ({ value }: { value: Cell }) => {
  const colors: Record<number, string> = {
    2: '#eee4da',
    4: '#ede0c8',
    8: '#f2b179',
    16: '#f59563',
    32: '#f67c5f',
    64: '#f65e3b',
    128: '#edcf72',
    256: '#edcc61',
    512: '#edc850',
    1024: '#edc53f',
    2048: '#edc22e',
  };
  const bg = value ? colors[value] || '#3c3a32' : '#cdc1b4';
  const color = value && value > 4 ? '#f9f6f2' : '#776e65';
  return (
    <div
      style={{
        width: '80px',
        height: '80px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        backgroundColor: bg,
        color: value ? color : '#776e65',
        borderRadius: '4px',
        userSelect: 'none',
      }}
    >
      {value ?? ''}
    </div>
  );
};

// board
const BoardGrid = ({ board, size }: { board: Map2048; size: number }) => {
  return (
    <div
      style={{
        position: 'relative',
        marginTop: '24px',
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, 80px)`,
        gap: '8px',
        backgroundColor: '#bbada0',
        padding: '8px',
        borderRadius: '10px',
      }}
    >
      {board.map((row, i) =>
        row.map((cell, j) => <CellView key={`${i}-${j}`} value={cell} />)
      )}
    </div>
  );
};

// HUD 컴포넌트, 점수판과 버튼
const HUD = ({
  score,
  historyLen,
  onNew,
  onUndo,
}: {
  score: number;
  historyLen: number;
  onNew: () => void;
  onUndo: () => void;
}) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '16px',
      }}
    >
      <div style={{ fontSize: '20px' }}>점수: {score}</div>
      <div>
        <button
          onClick={onNew}
          style={{
            marginRight: '8px',
            fontSize: '16px',
            width: '120px',
            height: '40px',
          }}
        >
          New Game
        </button>
        <button
          onClick={onUndo}
          disabled={historyLen === 0}
          style={{
            fontSize: '16px',
            width: '80px',
            height: '40px',
            opacity: historyLen === 0 ? 0.5 : 1,
          }}
        >
          Undo
        </button>
      </div>
    </div>
  );
};

// Game over 화면
const GameOverOverlay = ({
  show,
  onNew,
  board,
}: {
  show: boolean;
  onNew: () => void;
  board: Map2048;
}) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(238,228,218,0.8)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        borderRadius: '10px',
        visibility: show ? 'visible' : 'hidden',
      }}
    >
      <h2>
        {board.some((row) => row.some((c) => c === 128))
          ? '축하합니다! 128 타일을 만들었습니다.'
          : '게임 오버! 더 이상 이동할 수 없습니다.'}
      </h2>
      <button
        onClick={onNew}
        style={{
          marginTop: '16px',
          padding: '8px 16px',
          fontSize: '16px',
        }}
      >
        New Game
      </button>
    </div>
  );
};

// 메인 컴포넌트
const App = () => {
  const size = 4;

  // 초기 보드/점수
  const [board, setBoard] = useState<Map2048>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('board-2048');
      if (saved) {
          return JSON.parse(saved) as Map2048;
      }
    }
    const empty = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => null as Cell)
    );
    return addRandomTile(empty);
  });

  const [score, setScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('score-2048');
      if (saved) {
        const s = parseInt(saved, 10);
        if (!Number.isNaN(s)) return s;
      }
    }
    return 0;
  });

  const [history, setHistory] = useState<{ board: Map2048; score: number }[]>(
    []
  );
  const [gameOver, setGameOver] = useState<boolean>(false);

  // local storage에 보드/점수 저장, 새로고침 해도 화면 유지 가능
  useEffect(() => {
    localStorage.setItem('board-2048', JSON.stringify(board));
    localStorage.setItem('score-2048', score.toString());
  }, [board, score]);

  // 방향키 event
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      let dir: Direction | null = null;
      if (e.key === 'ArrowUp') dir = 'up';
      else if (e.key === 'ArrowDown') dir = 'down';
      else if (e.key === 'ArrowLeft') dir = 'left';
      else if (e.key === 'ArrowRight') dir = 'right';
      let point: number = 0;
      if (dir) {
        e.preventDefault();
        point = move(dir);
        setScore((s) => s + point);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [board, score, gameOver]);

  // 새로운 게임에서 2개의 타일을 무작위로 추가
  function addRandomTile(map: Map2048): Map2048 {
    const emptyCells: { row: number; col: number }[] = [];
    map.forEach((row, i) => {
      row.forEach((cell, j) => {
        if (cell === null) emptyCells.push({ row: i, col: j });
      });
    });
    const { row, col } =
      emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.1 ? 4 : 2;
    const newMap = map.map((r) => r.slice());
    newMap[row][col] = value;
    return newMap;
  }

  function canMove(map: Map2048): boolean {
    for (let i = 0; i < map.length; i++) {
      for (let j = 0; j < map[i].length; j++) {
        const cell = map[i][j];
        if (cell === null) return true;
        if (i + 1 < map.length && map[i + 1][j] === cell) return true;
        if (j + 1 < map[i].length && map[i][j + 1] === cell) return true;
      }
    }
    return false;
  }

  // board 이동 logic
  function move(direction: Direction) : number {
    const { result: newBoard, isMoved, gained } = moveMapIn2048Rule(board, direction);
    if (!isMoved) return 0; // 이동 불가
    setHistory([{ board, score }]); // undo는 연속으로 불가능
    const boardWithNewTile = addRandomTile(newBoard);
    setBoard(boardWithNewTile);
    setScore((s) => s + gained); // 함수형 업데이트(안전)
    if (
      boardWithNewTile.some((row) => row.some((c) => c === 128)) ||
      !canMove(boardWithNewTile)
    ) {
      setGameOver(true);
    }
    return gained;
  }

  const newGame = () => {
    const empty = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => null as Cell)
    );
    setBoard(addRandomTile(addRandomTile(empty)));
    setScore(0);
    setHistory([]);
    setGameOver(false);
  };

  const undo = () => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setBoard(last.board);
      setScore(last.score);
      setGameOver(false);
      return prev.slice(0, -1);
    });
  };

  // 반환(JSX) — 화면을 구성하는 컴포넌트들

  return (
    <div
      style={{
        maxWidth: '360px',
        margin: '0 auto',
        padding: '16px',
        fontFamily: 'sans-serif',
        position: 'relative',
      }}
    >
      <HUD
        score={score}
        historyLen={history.length}
        onNew={newGame}
        onUndo={undo}
      />
      {/* 보드 */}
      <div style={{ position: 'relative' }}>
        <BoardGrid board={board} size={size} />
        <GameOverOverlay show={gameOver} onNew={newGame} board={board} />
      </div>
    </div>
  );
};

export default App;
