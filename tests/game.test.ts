import test from 'node:test'
import assert from 'node:assert/strict'
import { adjacent, availableMove, collapse, createBoard, finish, matches, newGame, planSwap, planTool, reshuffle, scoreRemoval, toolCells } from '../src/game.ts'
import type { Kind, Tile } from '../src/game.ts'
import { tiles } from '../src/config.ts'
const seeded = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
const fixture = (): Tile[] => Array.from({ length: 56 }, (_, i) => ({ id: i + 1, kind: tiles[(Math.floor(i / 8) * 2 + i % 8) % 8][0] }))
function withKinds(changes: Record<number, Kind>) { return fixture().map((cell, i) => ({ ...cell, kind: changes[i] ?? cell.kind })) }
const last = <T,>(items: T[]) => items[items.length - 1]

test('500 random openings have 56 unique pieces, no existing matches, and a valid move', () => {
  for (let seed = 1; seed <= 500; seed++) {
    const b = createBoard(seeded(seed))
    assert.equal(b.length, 56); assert.equal(new Set(b.map(t => t.id)).size, 56)
    assert.equal(matches(b).length, 0); assert.ok(availableMove(b))
  }
})
test('adjacency excludes diagonals and wrapping rows', () => {
  assert.ok(adjacent(0, 1)); assert.ok(adjacent(0, 8)); assert.equal(adjacent(7, 8), false); assert.equal(adjacent(0, 9), false)
})
test('horizontal five and crossing vertical match count each tile once', () => {
  const b = withKinds({ 16: 'rabbit', 17: 'rabbit', 18: 'rabbit', 19: 'rabbit', 20: 'rabbit', 2: 'rabbit', 10: 'rabbit' })
  assert.deepEqual(matches(b), [2, 10, 16, 17, 18, 19, 20])
})
test('vertical three and L shaped matches are detected', () => {
  assert.deepEqual(matches(withKinds({0:'rabbit',8:'rabbit',16:'rabbit',24:'rose'})), [0,8,16])
  assert.deepEqual(matches(withKinds({0:'rabbit',8:'rabbit',16:'rabbit',17:'rabbit',18:'rabbit',24:'rose'})), [0,8,16,17,18])
})
test('invalid swap returns original state without spending a move', () => {
  const game = { ...newGame(), board: fixture() }
  const frames = planSwap(game, 0, 1)
  assert.equal(frames.length, 2); assert.equal(last(frames).game, game)
  assert.deepEqual(planSwap(game, 0, 9), [])
})
test('last move can win after resolution; moves are charged only once', () => {
  const game = { ...newGame(), board: withKinds({0:'classic',1:'rose',2:'classic',9:'classic'}), moves: 1, collected: {classic:9,rabbit:8,lantern:8} }
  const frames = planSwap(game, 1, 9, seeded(6))
  assert.equal(last(frames).game.status, 'won'); assert.equal(last(frames).game.moves, 0)
  assert.ok(last(frames).game.score >= 30)
  assert.equal(matches(last(frames).game.board).length, 0)
})
test('incomplete last move loses even with tools remaining; finished games reject actions', () => {
  const game = { ...newGame(), board: withKinds({0:'classic',1:'rose',2:'classic',9:'classic'}), moves: 1 }
  const end = last(planSwap(game, 1, 9, seeded(6))).game
  assert.equal(end.status, 'lost'); assert.equal(end.tools.hammer, 3)
  assert.deepEqual(planTool(end, 'hammer', 0), []); assert.deepEqual(planSwap(end, 0, 1), [])
})
test('bomb clips to boundaries and rainbow selects exactly one kind', () => {
  const b = fixture()
  assert.deepEqual(toolCells(b, 'bomb', 0), [0,1,8,9])
  assert.equal(toolCells(b, 'bomb', 27).length, 9)
  assert.deepEqual(toolCells(b, 'bomb', 55), [46,47,54,55])
  assert.ok(toolCells(b, 'rainbow', 0).every(i => b[i].kind === b[0].kind))
})
test('removal deduplicates cells, caps target progress, and scores excess', () => {
  const game = { ...newGame(), board: withKinds({0:'classic',1:'classic'}), collected: {classic:11,rabbit:0,lantern:0} }
  const result = scoreRemoval(game, [0,1,1])
  assert.equal(result.score,20); assert.equal(result.collected.classic,12); assert.equal(game.score,0)
})
test('collapse preserves survivor order and introduces exactly as many new pieces as removed', () => {
  const b = createBoard(seeded(5)), removed = [8,24,40]
  const result = collapse(b, removed, seeded(2))
  assert.deepEqual(result.board.filter((_,i)=>i%8===0).slice(3).map(t=>t.id), [0,16,32,48].map(i=>b[i].id))
  assert.equal(Object.keys(result.entering).length, 3)
})
test('tools consume one charge and no moves; empty tools and invalid targets do nothing', () => {
  for (const tool of ['hammer','rainbow','bomb','shuffle'] as const) {
    const game = newGame(seeded(10)), result = last(planTool(game,tool,0,seeded(8))).game
    assert.equal(result.moves,20); assert.equal(result.tools[tool], game.tools[tool]-1)
    assert.equal(matches(result.board).length,0)
    if(tool==='shuffle') { assert.equal(result.score,0); assert.deepEqual(result.collected,game.collected) }
    else assert.ok(result.score >= 10)
    assert.deepEqual(planTool({...game,tools:{...game.tools,[tool]:0}},tool,0),[])
  }
  assert.deepEqual(planTool(newGame(), 'hammer', -1), [])
})
test('dead board auto-shuffles for free; pathological random still terminates', () => {
  const game = {...newGame(),board:fixture(),score:100,moves:9}
  assert.equal(availableMove(game.board),null)
  const frame = finish(game,seeded(3))
  assert.equal(frame.phase,'shuffle'); assert.ok(availableMove(frame.game.board))
  assert.equal(frame.game.score,100); assert.equal(frame.game.moves,9); assert.deepEqual(frame.game.tools,game.tools)
  const fallback = reshuffle(Array.from({length:56},(_,i)=>({id:i,kind:'classic' as const})),()=>0)
  assert.equal(matches(fallback).length,0); assert.ok(availableMove(fallback))
})
test('multi-turn seeded games always settle and never spend extra moves for cascades', () => {
  let sawCascade = false
  for(let seed=1;seed<=30;seed++) {
    const random=seeded(seed); let game=newGame(random)
    while(game.status==='playing') {
      const move=availableMove(game.board); assert.ok(move)
      const frames=planSwap(game,...move,random), result=last(frames).game
      if(frames.filter(f=>f.phase==='remove').length>1) sawCascade=true
      assert.equal(result.moves,game.moves-1); assert.equal(matches(result.board).length,0)
      assert.equal(result.board.length,56); assert.equal(new Set(result.board.map(t=>t.id)).size,56)
      game=result
    }
  }
  assert.ok(sawCascade)
})

test('restarting creates a fresh full game with reset progress and resources', () => {
  const random=seeded(19), game=newGame(random)
  const played=last(planTool(game,'bomb',27,random)).game
  assert.ok(played.score>0)
  const fresh=newGame(random)
  assert.equal(fresh.score,0); assert.equal(fresh.moves,20)
  assert.deepEqual(fresh.collected,{classic:0,rabbit:0,lantern:0})
  assert.deepEqual(fresh.tools,{hammer:3,shuffle:3,rainbow:1,bomb:2})
  assert.equal(fresh.status,'playing'); assert.ok(availableMove(fresh.board))
  assert.equal(fresh.board.some(t=>played.board.some(old=>old.id===t.id)),false)
})

test('assisted refill changes only fresh pieces and produces a genuine match', () => {
  const board=fixture(), original=JSON.stringify(board)
  const removed=[0,1,2]
  const result=collapse(board,removed,seeded(42),1)
  assert.ok(matches(result.board).length>=3)
  assert.equal(JSON.stringify(board),original)
  const survivors=board.filter((_,i)=>!removed.includes(i))
  for(const old of survivors) assert.equal(result.board.find(cell=>cell.id===old.id),old)
  assert.equal(Object.keys(result.entering).length,3)
})

test('high-chain tuning gives frequent cascades, real matches, exact scores and bounded rounds', () => {
  let chains=0
  for(let seed=1;seed<=300;seed++) {
    const random=seeded(seed), game=newGame(random), move=availableMove(game.board)!
    const frames=planSwap(game,...move,random)
    const removals=frames.filter(frame=>frame.phase==='remove')
    chains+=Number(removals.length>=2)
    assert.ok(removals.length<=10)
    for(const frame of removals) {
      assert.deepEqual(new Set(frame.removed),new Set(matches(frame.game.board).map(i=>frame.game.board[i].id)))
    }
    assert.equal(last(frames).game.score,removals.reduce((sum,frame)=>sum+frame.removed!.length*10,0))
    assert.equal(last(frames).game.moves,19)
    assert.equal(matches(last(frames).game.board).length,0)
  }
  assert.ok(chains/300>=0.85, `Chain rate regressed: ${chains}/300`)
})

test('even a constant random source cannot exceed the chain cap', () => {
  const game={...newGame(seeded(9)),board:fixture()}
  const frames=planTool(game,'rainbow',0,()=>0)
  assert.ok(frames.filter(frame=>frame.phase==='remove').length<=10)
  assert.equal(matches(last(frames).game.board).length,0)
  assert.equal(last(frames).game.moves,20)
})
