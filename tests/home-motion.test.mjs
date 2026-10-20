import { test } from 'node:test'
import assert from 'node:assert/strict'
import { initHomeMotion } from '../src/lib/homeMotion.ts'

test('home entry runs once per card and finishes when reduced motion is enabled', (t) => {
  const originals = Object.fromEntries(['window', 'document', 'getComputedStyle', 'IntersectionObserver'].map((key) => [key, globalThis[key]]))
  t.after(() => Object.entries(originals).forEach(([key, value]) => value === undefined ? delete globalThis[key] : globalThis[key] = value))
  let preferenceChanged, intersected
  const played = [], finished = [], unobserved = []
  let disconnected = false
  const card = {
    dataset: { entryDelay: '80' },
    addEventListener() {},
    animate(frames, options) {
      assert.equal(options.duration, 700)
      assert.equal(options.delay, 80)
      return { pause() {}, play() { played.push(card) }, finish() { finished.push(card) } }
    },
  }
  globalThis.window = { matchMedia: () => ({ matches: false, addEventListener: (_, callback) => { preferenceChanged = callback } }), IntersectionObserver: true }
  globalThis.document = { documentElement: {}, querySelectorAll: () => [card] }
  globalThis.getComputedStyle = () => ({ getPropertyValue: () => '' })
  globalThis.IntersectionObserver = class {
    constructor(callback) { intersected = callback }
    observe() {}
    unobserve(target) { unobserved.push(target) }
    disconnect() { disconnected = true }
  }
  initHomeMotion()
  intersected([{ target: card, isIntersecting: false }])
  assert.equal(played.length, 0)
  intersected([{ target: card, isIntersecting: true }])
  assert.deepEqual(played, [card])
  assert.deepEqual(unobserved, [card])
  preferenceChanged({ matches: true })
  assert.deepEqual(finished, [card])
  assert.ok(disconnected)
  globalThis.window.matchMedia = () => ({ matches: true })
  globalThis.document.querySelectorAll = () => { throw new Error('must not animate with reduced motion') }
  initHomeMotion()
})
