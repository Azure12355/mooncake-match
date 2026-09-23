import { gameConfig, tiles } from './config.ts'

export type Kind = typeof tiles[number][0]
export type Tool = keyof typeof gameConfig.tools
export type Target = keyof typeof gameConfig.targets
export type Tile = { id: number; kind: Kind }
export type Game = {
  board: Tile[]
  moves: number
  score: number
  collected: Record<Target, number>
  tools: Record<Tool, number>
  status: 'playing' | 'won' | 'lost'
}
export type Frame = {
  game: Game
  phase: 'swap' | 'remove' | 'fall' | 'shuffle' | 'settle'
  duration: number
  combo?: number
  removed?: number[]
  entering?: Record<number, number>
  message?: string
  sound?: 'swap' | 'invalid' | 'match' | 'tool' | 'win' | 'lose'
}
export type Random = () => number
const { columns: W, rows: H } = gameConfig
const kinds = tiles.map(([kind]) => kind)
let nextId = 1
const tile = (kind: Kind): Tile => ({ id: nextId++, kind })
const pick = <T,>(items: readonly T[], random: Random): T => items[Math.floor(random() * items.length)]
export const targetKeys = Object.keys(gameConfig.targets) as Target[]

export function adjacent(a: number, b: number) {
  if (a < 0 || b < 0 || a >= W * H || b >= W * H) return false
  return Math.abs(Math.floor(a / W) - Math.floor(b / W)) + Math.abs(a % W - b % W) === 1
}

export function matches(board: Tile[]): number[] {
  const found = new Set<number>()
  for (const [length, lines, stride, startStep] of [[W, H, 1, W], [H, W, W, 1]]) {
    for (let line = 0; line < lines; line++) {
      let start = 0
      while (start < length) {
        let end = start + 1
        const index = line * startStep + start * stride
        while (end < length && board[line * startStep + end * stride].kind === board[index].kind) end++
        if (end - start >= 3) for (let i = start; i < end; i++) found.add(line * startStep + i * stride)
        start = end
      }
    }
  }
  return [...found].sort((a, b) => a - b)
}

export function swapped(board: Tile[], a: number, b: number): Tile[] {
  const copy = [...board]
  ;[copy[a], copy[b]] = [copy[b], copy[a]]
  return copy
}

export function availableMoves(board: Tile[]): [number, number][] {
  const result: [number, number][] = []
  for (let i = 0; i < board.length; i++) {
    for (const j of [i + 1, i + W]) {
      if (adjacent(i, j) && board[i].kind !== board[j].kind && matches(swapped(board, i, j)).length) result.push([i, j])
    }
  }
  return result
}

export function availableMove(board: Tile[]): [number, number] | null {
  return availableMoves(board)[0] ?? null
}

export function createBoard(random: Random = Math.random): Tile[] {
  let best: Tile[] | null = null
  let bestMoves = 0
  for (let attempt = 0; attempt < 24; attempt++) {
    const board: Tile[] = []
    for (let i = 0; i < W * H; i++) {
      const options = kinds.filter(kind => !(
        (i % W >= 2 && board[i - 1].kind === kind && board[i - 2].kind === kind) ||
        (i >= W * 2 && board[i - W].kind === kind && board[i - W * 2].kind === kind)
      ))
      board.push(tile(pick(options, random)))
    }
    const moveCount = availableMoves(board).length
    if (moveCount >= gameConfig.minimumOpeningMoves) return board
    if (moveCount > bestMoves) { best = board; bestMoves = moveCount }
  }
  if (best) return best
  // Deterministic playable arrangement even for a degenerate random source.
  const board = Array.from({ length: W * H }, (_, i) => tile(kinds[(Math.floor(i / W) * 2 + i % W) % kinds.length]))
  board[0] = tile('classic'); board[1] = tile('rose'); board[2] = tile('classic'); board[W + 1] = tile('classic')
  return board
}

export function newGame(random: Random = Math.random): Game {
  return { board: createBoard(random), moves: gameConfig.moves, score: 0,
    collected: { classic: 0, rabbit: 0, lantern: 0 }, tools: { ...gameConfig.tools }, status: 'playing' }
}

export function reshuffle(board: Tile[], random: Random = Math.random): Tile[] {
  for (let attempt = 0; attempt < 128; attempt++) {
    const copy = [...board]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    if (!matches(copy).length && availableMove(copy)) return copy
  }
  return createBoard(random)
}

export function toolCells(board: Tile[], tool: Exclude<Tool, 'shuffle'>, index: number): number[] {
  if (index < 0 || index >= board.length) return []
  if (tool === 'hammer') return [index]
  if (tool === 'rainbow') return board.flatMap((cell, i) => cell.kind === board[index].kind ? [i] : [])
  return board.flatMap((_, i) => Math.abs(i % W - index % W) <= 1 && Math.abs(Math.floor(i / W) - Math.floor(index / W)) <= 1 ? [i] : [])
}

export function scoreRemoval(game: Game, cells: number[]): Game {
  const unique = [...new Set(cells)]
  const collected = { ...game.collected }
  for (const index of unique) {
    const kind = game.board[index].kind
    if (targetKeys.includes(kind as Target)) {
      const key = kind as Target
      collected[key] = Math.min(gameConfig.targets[key], collected[key] + 1)
    }
  }
  return { ...game, score: game.score + unique.length * gameConfig.pointsPerTile, collected }
}

export function collapse(board: Tile[], removed: number[], random: Random = Math.random, assistChance = 0) {
  const gone = new Set(removed)
  const result = [...board]
  const entering: Record<number, number> = {}
  for (let col = 0; col < W; col++) {
    const kept = board.filter((_, i) => i % W === col && !gone.has(i))
    const count = H - kept.length
    for (let row = 0; row < H; row++) {
      const cell = row < count ? tile(pick(kinds, random)) : kept[row - count]
      result[row * W + col] = cell
      if (row < count) entering[cell.id] = count
    }
  }
  if (!matches(result).length && assistChance > 0 && random() < assistChance) {
    const candidates: { cells: number[]; kind: Kind }[] = []
    for (let start = 0; start < W * H; start++) {
      for (const stride of [1, W]) {
        if (stride === 1 ? start % W > W - 3 : start + W * 2 >= W * H) continue
        const cells = [start, start + stride, start + stride * 2]
        const fresh = cells.filter(i => result[i].id in entering)
        if (!fresh.length) continue
        const fixed = cells.filter(i => !(result[i].id in entering))
        const fixedKinds = new Set(fixed.map(i => result[i].kind))
        if (fixedKinds.size <= 1) candidates.push({ cells: fresh, kind: fixed.length ? result[fixed[0]].kind : pick(kinds, random) })
      }
    }
    if (candidates.length) {
      const candidate = pick(candidates, random)
      // Only newly spawned pieces can be assisted. Existing pieces retain their identity and kind.
      for (const i of candidate.cells) result[i] = { ...result[i], kind: candidate.kind }
    }
  }
  return { board: result, entering }
}

export function finish(game: Game, random: Random = Math.random): Frame {
  if (targetKeys.every(key => game.collected[key] >= gameConfig.targets[key])) {
    return { game: { ...game, status: 'won' }, phase: 'settle', duration: 200, sound: 'win' }
  }
  if (game.moves === 0) return { game: { ...game, status: 'lost' }, phase: 'settle', duration: 200, sound: 'lose' }
  if (!availableMove(game.board)) return { game: { ...game, board: reshuffle(game.board, random) }, phase: 'shuffle', duration: 500, message: '没有可消除的组合，已免费重新排列' }
  return { game, phase: 'settle', duration: 80 }
}

function resolve(game: Game, cells: number[], random: Random, frames: Frame[], tool = false): Frame[] {
  let current = game
  let round = 0
  while (cells.length) {
    current = scoreRemoval(current, cells)
    frames.push({ game: current, phase: 'remove', duration: Math.max(130, 250 - round * 25), combo: round + 1, removed: cells.map(i => current.board[i].id),
      message: round ? `${round >= 4 ? '停不下来！' : round >= 2 ? '太过瘾了！' : '好事成双！'} ${round + 1} 连消 · +${cells.length * gameConfig.pointsPerTile}` : `+${cells.length * gameConfig.pointsPerTile}`, sound: tool && !round ? 'tool' : 'match' })
    const fall = collapse(current.board, cells, random, gameConfig.chainAssist[round] ?? 0)
    current = { ...current, board: fall.board }
    frames.push({ game: current, phase: 'fall', duration: Math.max(170, 300 - round * 25), combo: round + 1, entering: fall.entering })
    cells = matches(current.board)
    round++
    // Bound each chain so the player regains control promptly.
    if (round >= gameConfig.maxChainRounds && cells.length) {
      current = { ...current, board: reshuffle(current.board, random) }
      frames.push({ game: current, phase: 'shuffle', duration: 400, message: '连消收官 · 再来一手！' })
      break
    }
  }
  frames.push(finish(current, random))
  return frames
}

export function planSwap(game: Game, a: number, b: number, random: Random = Math.random): Frame[] {
  if (game.status !== 'playing' || game.moves <= 0 || !adjacent(a, b)) return []
  const board = swapped(game.board, a, b)
  const cells = matches(board)
  if (!cells.length) return [
    { game: { ...game, board }, phase: 'swap', duration: 180, sound: 'swap' },
    { game, phase: 'swap', duration: 180, sound: 'invalid', message: '连成三个相同图案才能消除，不扣步' },
  ]
  const current = { ...game, board, moves: game.moves - 1 }
  return resolve(current, cells, random, [{ game: current, phase: 'swap', duration: 180, sound: 'swap' }])
}

export function planTool(game: Game, tool: Tool, index = 0, random: Random = Math.random): Frame[] {
  if (game.status !== 'playing' || game.moves <= 0 || game.tools[tool] <= 0) return []
  if (tool !== 'shuffle' && (index < 0 || index >= game.board.length)) return []
  const current = { ...game, tools: { ...game.tools, [tool]: game.tools[tool] - 1 } }
  if (tool === 'shuffle') return [{ game: { ...current, board: reshuffle(game.board, random) }, phase: 'shuffle', duration: 500, sound: 'tool', message: '棋盘已重新排列，不消耗步数' }]
  return resolve(current, toolCells(current.board, tool, index), random, [], true)
}
