export const gameConfig = {
  columns: 8,
  rows: 7,
  moves: 20,
  pointsPerTile: 10,
  minimumOpeningMoves: 10,
  chainAssist: [0.98, 0.94, 0.86, 0.72, 0.46, 0.20],
  maxChainRounds: 10,
  targets: { classic: 12, rabbit: 8, lantern: 8 },
  tools: { hammer: 3, shuffle: 3, rainbow: 1, bomb: 2 },
} as const

export const tiles = [
  ['classic', '花纹月饼'], ['rose', '玫瑰月饼'],
  ['matcha', '抹茶月饼'], ['snow', '雪皮月饼'],
  ['yolk', '蛋黄月饼'], ['cocoa', '可可月饼'],
  ['rabbit', '玉兔'], ['lantern', '灯笼'],
] as const

export const assets = [
  ...tiles.map(([id, name]) => ({ id: `tile-${id}`, name, category: '棋子' })),
  { id: 'tool-hammer', name: '锤子', category: '道具' },
  { id: 'tool-shuffle', name: '换一换', category: '道具' },
  { id: 'tool-rainbow', name: '彩虹月饼', category: '道具' },
  { id: 'tool-bomb', name: '月光炸弹', category: '道具' },
  { id: 'background', name: '中秋夜景', category: '界面' },
  { id: 'title', name: '游戏标题', category: '界面' },
  { id: 'panel', name: '通用面板', category: '界面' },
  { id: 'button', name: '通用按钮', category: '界面' },
  { id: 'icon-settings', name: '设置', category: '界面' },
  { id: 'effect-sparkle', name: '消除星光', category: '反馈' },
  { id: 'result-win', name: '胜利玉兔', category: '反馈' },
  { id: 'result-lose', name: '再试一次玉兔', category: '反馈' },
]
