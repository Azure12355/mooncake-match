import test from 'node:test'
import assert from 'node:assert/strict'
import { loadPreferences, savePreferences } from '../src/storage.ts'

function withStorage(storage: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void }, run: () => void) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true })
  try { run() } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original)
    else Reflect.deleteProperty(globalThis, 'localStorage')
  }
}

test('fresh install and malformed records use playable defaults', () => {
  for (const record of [null, '{broken', 'null', '{"best":-10,"music":0,"effects":"no"}']) {
    withStorage({getItem:()=>record,setItem:()=>{}}, () => {
      assert.deepEqual(loadPreferences(), { best:0, music:true, effects:true })
    })
  }
})
test('high score and each sound preference survive reload, with no saved game state', () => {
  let saved = ''
  withStorage({getItem:()=>saved,setItem:(_,value)=>{saved=value}}, () => {
    savePreferences({best:1230,music:false,effects:true})
    assert.deepEqual(loadPreferences(),{best:1230,music:false,effects:true})
    assert.deepEqual(Object.keys(JSON.parse(saved)).sort(),['best','effects','music'])
  })
})
test('storage read/write rejection does not interrupt play', () => {
  withStorage({getItem:()=>{throw new Error('blocked')},setItem:()=>{throw new Error('full')}}, () => {
    assert.deepEqual(loadPreferences(),{best:0,music:true,effects:true})
    assert.doesNotThrow(()=>savePreferences({best:10,music:true,effects:false}))
  })
})
