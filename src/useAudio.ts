import { useCallback, useEffect, useRef } from 'react'

export type Sound = 'swap' | 'invalid' | 'match' | 'tool' | 'win' | 'lose'

export function useAudio(music: boolean, effects: boolean) {
  const bank = useRef<Partial<Record<Sound | 'bgm', HTMLAudioElement>>>({})
  const unlocked = useRef(false)
  const settings = useRef({ music, effects })
  useEffect(() => {
    const sounds = ['bgm', 'swap', 'invalid', 'match', 'tool', 'win', 'lose'] as const
    for (const id of sounds) {
      const audio = new Audio(`${import.meta.env.BASE_URL}assets/audio/${id}.wav`)
      audio.loop = id === 'bgm'
      audio.volume = id === 'bgm' ? 0.24 : 0.55
      bank.current[id] = audio
    }
    const visibility = () => {
      if (document.hidden) Object.values(bank.current).forEach(audio => audio.pause())
      else if (unlocked.current && settings.current.music) void bank.current.bgm?.play().catch(() => {})
    }
    document.addEventListener('visibilitychange', visibility)
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      for (const audio of Object.values(bank.current)) { audio.pause(); audio.removeAttribute('src'); audio.load() }
      bank.current = {}
    }
  }, [])
  useEffect(() => {
    settings.current = { music, effects }
    if (unlocked.current && music && !document.hidden) void bank.current.bgm?.play().catch(() => {})
    else bank.current.bgm?.pause()
    if (!effects) for (const [id, audio] of Object.entries(bank.current)) if (id !== 'bgm') audio.pause()
  }, [music, effects])
  const unlock = useCallback(() => {
    unlocked.current = true
    if (settings.current.music && !document.hidden && bank.current.bgm?.paused) void bank.current.bgm.play().catch(() => {})
  }, [])
  const sound = useCallback((id: Sound, combo = 1) => {
    if (!unlocked.current || !settings.current.effects || document.hidden) return
    const audio = bank.current[id]
    if (audio) { audio.playbackRate = id === 'match' ? Math.min(1.45, 1 + (combo - 1) * 0.07) : 1; audio.preservesPitch = false; audio.currentTime = 0; void audio.play().catch(() => {}) }
  }, [])
  return { unlock, sound }
}
