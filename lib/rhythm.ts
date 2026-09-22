export type RhythmCard = {
  code: string
  level: number
  beats: number[] // expected tap timestamps in ms, relative to beat 1
  perfectMs: number // "đúng phách" window
  zeroMs: number // deviation at/above this scores 0
  passAt: number // pct to pass
  excellentAt: number // pct to pass "xuất sắc"
  baseAttempts: number
}

// Level 1 is the only real card today; deeper levels need real patterns/audio
// from the project owner (spec 6.2 [CONTENT]) before they can be added here.
export const RHYTHM_CARDS: RhythmCard[] = [
  { code: "2714", level: 1, beats: [0, 420, 840, 1260, 1680], perfectMs: 60, zeroMs: 250, passAt: 80, excellentAt: 95, baseAttempts: 2 },
]

export function findRhythmCard(code: string): RhythmCard | undefined {
  return RHYTHM_CARDS.find((c) => c.code === code)
}

export type BeatLabel = "moc" | "dung" | "som" | "muon" | "lech"

// dev = signed deviation from the expected interval, ms (negative = early, positive = late)
export type BeatScore = { e: number; dev: number; label: BeatLabel }

export type RhythmResult = { pct: number; beats: BeatScore[] } // beats[0] is the anchor (phách 1)

// Labeling thresholds from spec 6.5: <=60ms off = "đúng phách", <=150ms = "hơi sớm/muộn", else "lệch nhiều".
const LABEL_NEAR_MS = 60
const LABEL_FAR_MS = 150

export function scoreRhythm(beats: number[], taps: number[], perfectMs: number, zeroMs: number): RhythmResult {
  const scored: BeatScore[] = [{ e: 0, dev: 0, label: "moc" }]
  const scores: number[] = []
  for (let i = 1; i < beats.length; i++) {
    const T = beats[i] - beats[i - 1]
    const d = taps[i] - taps[i - 1]
    const dev = d - T
    const e = Math.abs(dev)
    const s = Math.min(1, Math.max(0, 1 - Math.max(0, e - perfectMs) / (zeroMs - perfectMs)))
    scores.push(s)
    const label: BeatLabel = e <= LABEL_NEAR_MS ? "dung" : e <= LABEL_FAR_MS ? (dev < 0 ? "som" : "muon") : "lech"
    scored.push({ e, dev, label })
  }
  const pct = Math.round(100 * (scores.reduce((a, b) => a + b, 0) / scores.length))
  return { pct, beats: scored }
}

export function rhythmAwarded(pct: number, card: RhythmCard): 0 | 1 | 2 {
  if (pct >= card.excellentAt) return 2
  if (pct >= card.passAt) return 1
  return 0
}
