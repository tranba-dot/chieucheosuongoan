// Self-check for lib/chapterStats.ts -- run with: node --experimental-strip-types scripts/check-chapter-stats.mjs
import assert from "node:assert"
import { chapterStats } from "../lib/chapterStats.ts"

const session = {
  chapter: 2, storyId: "s", oanId: "o", oan: -1, hieu: 3,
  usedPerspectives: [], usedInterventions: [], rhythmAttempts: 2, rhythmBest: 95, rhythmUsed: true,
  venAsked: { 1: 2, 2: 1 },
  interventionLog: { "i-01": { at: 1, chapter: 1 }, "i-02": { at: 2, chapter: 2 } },
  events: [
    { t: 1, ch: 1, type: "perspective", oanId: "o", cardId: "p-01", effect: -1 },
    { t: 2, ch: 1, type: "perspective", oanId: "o", cardId: "p-02", effect: 1 },
    { t: 3, ch: 1, type: "rhythm", code: "2714" },
    { t: 4, ch: 1, type: "rhythm", code: "2714" },
    { t: 5, ch: 2, type: "ven", win: true },
    { t: 6, ch: 2, type: "ven", win: false },
    { t: 7, ch: 1, type: "intervention", id: "i-01" },
  ],
}

const ch1 = chapterStats(session, 1)
assert.strictEqual(ch1.oanDelta, 0, "ch1 oanDelta: -1 + 1 = 0")
assert.strictEqual(ch1.testimonies, 2)
assert.strictEqual(ch1.hieuDelta, 2, "ch1 hieuDelta: two rhythm completions, +1 each")
assert.strictEqual(ch1.rhythmCount, 2)
assert.deepStrictEqual(ch1.interventionsUsed, ["i-01"])
assert.strictEqual(ch1.venAsked, 2)

const ch2 = chapterStats(session, 2)
assert.strictEqual(ch2.oanDelta, 0)
assert.strictEqual(ch2.testimonies, 0)
assert.strictEqual(ch2.hieuDelta, 1, "ch2 hieuDelta: one ven win, one ven loss (0)")
assert.strictEqual(ch2.rhythmCount, 0)
assert.deepStrictEqual(ch2.interventionsUsed, ["i-02"])
assert.strictEqual(ch2.venAsked, 1)

const ch3 = chapterStats(session, 3)
assert.strictEqual(ch3.oanDelta, 0)
assert.strictEqual(ch3.venAsked, 0)
assert.deepStrictEqual(ch3.interventionsUsed, [])

console.log("chapterStats: all checks passed")
