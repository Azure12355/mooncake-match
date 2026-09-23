export type Preferences = { best: number; music: boolean; effects: boolean }
const key = 'mooncake-match:preferences'
export function loadPreferences(): Preferences {
  const defaults = { best: 0, music: true, effects: true }
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null')
    return {
      best: Number.isSafeInteger(value?.best) && value.best >= 0 ? value.best : 0,
      music: typeof value?.music === 'boolean' ? value.music : true,
      effects: typeof value?.effects === 'boolean' ? value.effects : true,
    }
  } catch { return defaults }
}
export function savePreferences(value: Preferences) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Play remains available without storage. */ }
}
