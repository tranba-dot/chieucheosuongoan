import type { GameSession } from "@/app/_session"

export type ChapterStats = {
  oanDelta: number
  hieuDelta: number
  testimonies: number
  venAsked: number
  interventionsUsed: string[]
  rhythmCount: number
}

// Filters the chapter-scoped events[] log (see app/_session.tsx) down to one chapter's
// contribution -- used by the chapter-summary screen (spec 5.11, AC-TK-1: numbers must match events).
export function chapterStats(session: GameSession, chapter: number): ChapterStats {
  const events = session.events || []
  let oanDelta = 0
  let hieuDelta = 0
  let testimonies = 0
  let rhythmCount = 0
  for (const ev of events) {
    if (ev.ch !== chapter) continue
    if (ev.type === "perspective") {
      oanDelta += ev.effect
      testimonies++
    } else if (ev.type === "ven") {
      if (ev.win) hieuDelta += 1
    } else if (ev.type === "rhythm") {
      hieuDelta += 1
      rhythmCount++
    }
  }
  const interventionsUsed = Object.entries(session.interventionLog || {})
    .filter(([, v]) => v.chapter === chapter)
    .map(([id]) => id)
  return { oanDelta, hieuDelta, testimonies, venAsked: session.venAsked[chapter] || 0, interventionsUsed, rhythmCount }
}
