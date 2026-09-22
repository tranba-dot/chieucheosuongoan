// Self-check for lib/rhythm.ts's scoreRhythm against the 5 vectors from
// docs/ux-game-flow.md §6.5. Run with: node --experimental-strip-types scripts/check-rhythm.mjs
import { scoreRhythm } from "../lib/rhythm.ts"

const beats = [0, 420, 840, 1260, 1680]
const perfectMs = 60
const zeroMs = 250

const cases = [
  { taps: [0, 420, 840, 1260, 1680], expectPct: 100, label: "clean hit" },
  { taps: [0, 300, 600, 900, 1200], expectPct: 68, label: "even but too fast" },
  { taps: [0, 420, 840, 1360, 1680], expectPct: 89, label: "one beat slightly early" },
  { taps: [0, 100, 200, 300, 1680], expectPct: 0, label: "old span-only exploit" },
  { taps: [0, 460, 920, 1380, 1840], expectPct: 100, label: "uniformly late, within tolerance" },
]

let failures = 0
for (const c of cases) {
  const { pct } = scoreRhythm(beats, c.taps, perfectMs, zeroMs)
  const ok = pct === c.expectPct
  console.log(`${ok ? "PASS" : "FAIL"} ${c.label}: got ${pct}, expected ${c.expectPct}`)
  if (!ok) failures++
}

if (failures > 0) {
  console.error(`${failures} check(s) failed`)
  process.exit(1)
}
console.log("All scoreRhythm checks passed.")
