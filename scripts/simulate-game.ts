import { newGame, adjacent, matches, swapped, planSwap } from '../src/game.ts'
import type { Tile } from '../src/game.ts'
const randomFor = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
function moves(board: Tile[]) {
  const list: [number,number][]=[]
  for(let a=0;a<56;a++) for(const b of [a+1,a+8]) if(adjacent(a,b) && board[a].kind!==board[b].kind && matches(swapped(board,a,b)).length) list.push([a,b])
  return list
}
const games=300
let actions=0,wins=0,totalRounds=0,totalTiles=0,chains=0,longChains=0,openingMoves=0,maxRounds=0,totalMoves=0
for(let seed=1;seed<=games;seed++) {
  const random=randomFor(seed);let game=newGame(random);openingMoves+=moves(game.board).length
  while(game.status==='playing') {
    const options=moves(game.board)
    if(!options.length) throw Error('Dead board')
    const move=options[Math.floor(random()*options.length)]
    const frames=planSwap(game,...move,random)
    const rounds=frames.filter(frame=>frame.phase==='remove')
    totalRounds+=rounds.length;totalTiles+=rounds.reduce((sum,frame)=>sum+(frame.removed?.length??0),0)
    chains+=Number(rounds.length>=2);longChains+=Number(rounds.length>=4);maxRounds=Math.max(maxRounds,rounds.length);actions++
    game=frames[frames.length-1].game
  }
  wins+=Number(game.status==='won');totalMoves+=20-game.moves
}
console.log(JSON.stringify({games,policy:'Seeds 1–300, choose uniformly among valid swaps, no tools',actions,openingMoves:openingMoves/games,chainRate:chains/actions,fourPlusRate:longChains/actions,meanRounds:totalRounds/actions,meanTiles:totalTiles/actions,maxRounds,winRate:wins/games,meanMovesPerGame:totalMoves/games},null,2))
