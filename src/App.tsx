import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent, ReactNode } from 'react'
import { assets, gameConfig, tiles } from './config'
import { adjacent, newGame, planSwap, planTool, targetKeys } from './game'
import type { Frame, Tool } from './game'
import { loadPreferences, savePreferences } from './storage'
import { useAudio } from './useAudio'
import './App.css'

const image = (id: string) => `/assets/images/${id}.png`
const tileNames = Object.fromEntries(tiles)
const tools: { id: Tool; title: string; detail: string; prompt: string }[] = [
  { id: 'hammer', title: '锤子', detail: '消除一格', prompt: '点选一个棋子，轻轻敲掉它' },
  { id: 'shuffle', title: '换一换', detail: '重排棋盘', prompt: '' },
  { id: 'rainbow', title: '彩虹月饼', detail: '消除同类', prompt: '点选一个棋子，消除所有同类' },
  { id: 'bomb', title: '月光炸弹', detail: '消除周围', prompt: '点选中心，消除周围 3 × 3 区域' },
]

function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose?: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const node = ref.current!
    const previous = document.activeElement as HTMLElement | null
    node.showModal()
    return () => { node.close(); previous?.focus() }
  }, [])
  return <dialog ref={ref} className="dialog" aria-labelledby="dialog-title"
    onCancel={event => { event.preventDefault(); onClose?.() }}>
    <div className="dialog-content">
      <h2 id="dialog-title">{title}</h2>
      {children}
      {onClose && <button className="text-button" onClick={onClose}>返回游戏</button>}
    </div>
  </dialog>
}

function App() {
  const viewportRef = useRef<HTMLDivElement>(null)
  const fitRef = useRef<HTMLDivElement>(null)
  const shellRef = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const viewport = viewportRef.current!
    const fit = fitRef.current!
    const shell = shellRef.current!
    const resize = () => {
      const style = getComputedStyle(viewport)
      const width = viewport.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
      const height = viewport.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
      // Measure the unscaled canvas so image/font loading cannot crop the footer.
      const scale = Math.max(0, Math.min(width / shell.offsetWidth, height / shell.offsetHeight, 1.25))
      fit.style.width = `${shell.offsetWidth * scale}px`
      fit.style.height = `${shell.offsetHeight * scale}px`
      shell.style.transform = `scale(${scale})`
      shell.style.visibility = 'visible'
    }
    const observer = new ResizeObserver(resize)
    observer.observe(viewport)
    observer.observe(shell)
    resize()
    return () => observer.disconnect()
  }, [])

  const [game, setGame] = useState(() => newGame())
  const [frames, setFrames] = useState<Frame[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [modal, setModal] = useState<'settings' | 'help' | 'restart' | null>(null)
  const [preferences, setPreferences] = useState(loadPreferences)
  const [announcement, setAnnouncement] = useState('交换相邻图案，连成三个即可消除')
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const busyRef = useRef(false)
  const pointer = useRef<{ id: number; index: number; x: number; y: number } | null>(null)
  const suppressClick = useRef(false)
  const frame = frames[0]
  const view = frame?.game ?? game
  const busy = frames.length > 0
  const locked = busy || !ready || view.status !== 'playing' || modal !== null
  const { unlock, sound } = useAudio(preferences.music, preferences.effects)

  useEffect(() => {
    let canceled = false
    Promise.all(assets.map(asset => new Promise<void>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve()
      img.onerror = reject
      img.src = image(asset.id)
    }))).then(() => { if (!canceled) { setReady(true); setLoadError(false) } })
      .catch(() => { if (!canceled) setLoadError(true) })
    return () => { canceled = true }
  }, [loadAttempt])

  useEffect(() => {
    if (!frame) return
    if (frame.sound) sound(frame.sound, frame.combo)
    if (frame.message) setAnnouncement(frame.message)
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 30 : frame.duration
    const timeout = window.setTimeout(() => {
      setGame(frame.game)
      setFrames(previous => previous.slice(1))
      if (frames.length === 1) busyRef.current = false
    }, duration)
    return () => window.clearTimeout(timeout)
  }, [frame, frames.length, sound])

  useEffect(() => {
    setPreferences(previous => view.score > previous.best ? { ...previous, best: view.score } : previous)
  }, [view.score])
  useEffect(() => { savePreferences(preferences) }, [preferences])

  const play = useCallback((sequence: Frame[]) => {
    if (busyRef.current || !sequence.length) return
    busyRef.current = true
    setSelected(null); setSelectedTool(null); setFrames(sequence)
  }, [])

  function choose(index: number) {
    if (locked || busyRef.current) return
    if (selectedTool) { play(planTool(view, selectedTool, index)); return }
    if (selected === index) setSelected(null)
    else if (selected !== null && adjacent(selected, index)) play(planSwap(view, selected, index))
    else setSelected(index)
  }

  function activateTool(tool: Tool) {
    if (locked || busyRef.current || view.tools[tool] <= 0) return
    setSelected(null)
    if (tool === 'shuffle') play(planTool(view, tool))
    else setSelectedTool(previous => previous === tool ? null : tool)
  }

  function startPointer(event: PointerEvent<HTMLButtonElement>, index: number) {
    if (locked || busyRef.current || !event.isPrimary || event.button !== 0) return
    suppressClick.current = false
    pointer.current = { id: event.pointerId, index, x: event.clientX, y: event.clientY }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function endPointer(event: PointerEvent<HTMLButtonElement>) {
    const start = pointer.current
    if (!start || start.id !== event.pointerId) return
    pointer.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    const dx = event.clientX - start.x, dy = event.clientY - start.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 14 || selectedTool) return
    suppressClick.current = true
    if (locked || busyRef.current) return
    const target = start.index + (Math.abs(dx) > Math.abs(dy) ? Math.sign(dx) : Math.sign(dy) * gameConfig.columns)
    if (adjacent(start.index, target)) play(planSwap(view, start.index, target))
  }

  function restart() {
    if (busyRef.current) return
    setGame(newGame()); setSelected(null); setSelectedTool(null); setModal(null)
    setAnnouncement('新的一局，月饼香香，好运满满')
  }

  const prompt = selectedTool ? tools.find(tool => tool.id === selectedTool)!.prompt : announcement
  const removed = new Set(frame?.removed ?? [])
  return <div className="game-viewport" ref={viewportRef} onPointerDownCapture={unlock} onKeyDownCapture={unlock}>
    <div className="game-fit" ref={fitRef}>
    <main className="game-shell" ref={shellRef}>
    <div className="scene" aria-hidden="true" />
    <header className="game-header">
      <button className="settings-button" aria-label="打开设置" onClick={() => setModal('settings')} disabled={busy || !ready || view.status !== 'playing'}>
        <img src={image('icon-settings')} alt="" />
      </button>
      <p className="season">但愿人长久 · 千里共婵娟</p>
      <h1><img className="game-title" src={image('title')} alt="月饼消消乐" /></h1>
      <p className="tagline">消除美味月饼　共度中秋佳节</p>
    </header>

    <section className="scoreboard" aria-label="本局进度">
      <div className="score-box"><span>分数</span><strong>{view.score.toLocaleString('zh-CN')}</strong><small>最高 {preferences.best.toLocaleString('zh-CN')}</small></div>
      <div className={`moves-box ${view.moves <= 5 ? 'low-moves' : ''}`}><span>剩余步数</span><strong>{view.moves}</strong></div>
      <div className="targets-box"><span>本关目标</span><div className="targets">
        {targetKeys.map(key => <div className={`target ${view.collected[key] >= gameConfig.targets[key] ? 'complete' : ''}`} key={key}
          aria-label={`${tileNames[key]}：${view.collected[key]}/${gameConfig.targets[key]}`}>
          <img src={image(`tile-${key}`)} alt="" />
          <strong>{view.collected[key]}/{gameConfig.targets[key]}</strong>
        </div>)}
      </div></div>
    </section>

    <div className={`status-line ${(frame?.combo ?? 0) >= 2 ? 'combo-active' : ''}`} role="status" aria-live="polite">
      <span>{!ready ? (loadError ? '素材加载失败，请重试' : '月饼正在出炉…') : prompt}</span>
      {selectedTool && <button className="cancel-tool" onClick={() => setSelectedTool(null)}>取消</button>}
    </div>

    <section className="board-frame" aria-label="游戏棋盘">
      <div className={`board ${frame?.phase === 'shuffle' ? 'shuffling' : ''}`} aria-busy={busy} style={{ '--step-duration': `${frame?.duration ?? 180}ms` } as CSSProperties}>
        <div className="board-cells" aria-hidden="true">{Array.from({ length: 56 }, (_, i) => <div key={i} />)}</div>
        {view.board.map((cell, index) => {
          const entering = frame?.entering?.[cell.id]
          return <button key={cell.id}
            className={`piece ${selected === index ? 'selected' : ''} ${removed.has(cell.id) ? 'removing' : ''} ${selectedTool ? 'tool-target' : ''}`}
            style={{ '--x': index % 8, '--y': Math.floor(index / 8), '--drop': entering ?? 0 } as CSSProperties}
            aria-label={`第 ${Math.floor(index / 8) + 1} 行第 ${index % 8 + 1} 列，${tileNames[cell.kind]}`}
            aria-pressed={selected === index} aria-disabled={locked} tabIndex={locked ? -1 : 0}
            onPointerDown={event => startPointer(event, index)} onPointerUp={endPointer}
            onPointerCancel={() => { pointer.current = null; suppressClick.current = true }}
            onClick={event => {
              if (event.detail !== 0 && suppressClick.current) { suppressClick.current = false; return }
              choose(index)
            }}>
            <span className={entering ? 'falling' : ''}><img src={image(`tile-${cell.kind}`)} alt="" draggable="false" /></span>
            {removed.has(cell.id) && <img className="sparkle" src={image('effect-sparkle')} alt="" />}
          </button>
        })}
      </div>
      {!ready && <div className="loading-overlay"><p>{loadError ? '月饼还没准备好' : '正在准备中秋小食…'}</p>{loadError && <button className="gold-button" onClick={() => { setLoadError(false); setLoadAttempt(x => x + 1) }}>重新加载</button>}</div>}
    </section>

    <section className="toolbox" aria-label="道具，每局免费使用">
      {tools.map(tool => <button key={tool.id} className={`tool ${selectedTool === tool.id ? 'active' : ''}`}
        disabled={locked || view.tools[tool.id] === 0} aria-pressed={selectedTool === tool.id}
        aria-label={`${tool.title}，${tool.detail}，剩余 ${view.tools[tool.id]} 次`} onClick={() => activateTool(tool.id)}>
        <span className="tool-image"><img src={image(`tool-${tool.id}`)} alt="" /><b>{view.tools[tool.id]}</b></span>
        <span className="tool-name">{tool.title}</span><small>{tool.detail}</small>
      </button>)}
    </section>
    <footer className="game-footer"><span>小小月饼，连起大大的团圆</span><button onClick={() => setModal('help')} disabled={busy || view.status !== 'playing'}>玩法说明</button></footer>

    </main>
    </div>

    {modal === 'settings' && <Dialog title="休息一下，赏一会儿月" onClose={() => setModal(null)}>
      <div className="sound-settings">
        <label>背景音乐<button role="switch" aria-checked={preferences.music} onClick={() => setPreferences(p => ({ ...p, music: !p.music }))}>{preferences.music ? '已开启' : '已关闭'}</button></label>
        <label>游戏音效<button role="switch" aria-checked={preferences.effects} onClick={() => setPreferences(p => ({ ...p, effects: !p.effects }))}>{preferences.effects ? '已开启' : '已关闭'}</button></label>
      </div>
      <button className="gold-button" onClick={() => setModal('help')}>玩法说明</button>
      <button className="gold-button" onClick={() => setModal('restart')}>重新开始</button>
    </Dialog>}
    {modal === 'help' && <Dialog title="月饼消消乐 · 玩法" onClose={() => setModal(null)}>
      <ul className="help-list">
        <li>点击相邻两格，或滑动棋子，连成横向或纵向三个相同图案即可消除。</li>
        <li>每次有效交换消耗 1 步，无效交换和连锁不额外扣步。补入的棋子更容易凑成组合，连续消除更过瘾！</li>
        <li>在 20 步内收集花纹月饼 12 个、玉兔 8 个、灯笼 8 个即可获胜。</li>
        <li>道具不扣步，消除计入目标。先选道具再点棋子，可随时取消。</li>
        <li>最后一步的连锁结束后判定胜负；步数用完后不能继续使用道具。</li>
        <li>没有有效交换时自动免费重排。每消除一格得 10 分。</li>
      </ul>
    </Dialog>}
    {modal === 'restart' && <Dialog title="重新开始这一局？" onClose={() => setModal(null)}>
      <p>当前棋盘和收集进度将重置，道具次数恢复。最高分会保留。</p>
      <button className="gold-button" onClick={restart}>确认重新开始</button>
    </Dialog>}
    {!busy && view.status !== 'playing' && <Dialog title={view.status === 'won' ? '月圆人团圆，挑战成功！' : '月饼还香，再试一次'}>
      <img className="result-art" src={image(view.status === 'won' ? 'result-win' : 'result-lose')} alt="" />
      <p>{view.status === 'won' ? '三份心意都已集齐，送你一轮圆满。' : '步数已用完，下次一定更接近圆满。'}</p>
      <div className="result-score"><span>本局得分<strong>{view.score}</strong></span><span>历史最高<strong>{preferences.best}</strong></span></div>
      <button className="gold-button" autoFocus onClick={restart}>再玩一次</button>
    </Dialog>}
  </div>
}
export default App
