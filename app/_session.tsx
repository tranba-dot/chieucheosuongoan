"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

// events[] is a chapter-scoped log kept ALONGSIDE the flat running totals below (not
// replacing them, spec 4.3's full GameSessionV2 migration is out of scope here) -- it exists
// only because the flat fields (oan, hieu, usedPerspectives...) can't be filtered by chapter,
// which the chapter-summary screen (5.11) needs. See design log 2026-09-23 (Đợt 4 kickoff).
export type GameEvent =
  | { t: number; ch: number; type: "perspective"; oanId: string; cardId: string; effect: -1 | 0 | 1 }
  | { t: number; ch: number; type: "intervention"; id: string }
  | { t: number; ch: number; type: "ven"; win: boolean }
  // hieuDelta is the actual credit applied to session.hieu for THIS attempt (no stacking across
  // retries) -- kept explicit rather than re-derived from `awarded`, since re-deriving would
  // double-count a chapter where a later attempt raises the tier after an earlier one already scored.
  | { t: number; ch: number; type: "rhythm"; code: string; pct: number; awarded: 0 | 1 | 2; hieuDelta: number }

export type GameSession = {
  chapter: number
  storyId: string
  oanId: string
  oan: number
  hieu: number
  usedPerspectives: string[]
  usedInterventions: string[]
  rhythmAttempts: number
  rhythmBest: number
  rhythmUsed: boolean
  venAsked: Record<number, number>
  lastPerspectiveEffect?: number
  interventionLog?: Record<string, { at: number; chapter: number }>
  events: GameEvent[]
  startedAt?: number
  finished?: boolean
}

export const blankSession: GameSession = {
  chapter: 1,
  storyId: "story-01",
  oanId: "oan-01",
  oan: 0,
  hieu: 0,
  usedPerspectives: [],
  usedInterventions: [],
  rhythmAttempts: 0,
  rhythmBest: 0,
  rhythmUsed: false,
  venAsked: {},
  events: [],
}

// Also stamps startedAt on first use if missing: a QR-scanned card (or, until QR exists, any
// direct-link visit) acting on a session before the hub's own "Bắt đầu ván mới" is spec 4.5's
// "tham gia giữa chừng" auto-start, not a reason to keep the hub stuck on its empty state.
export function logEvent(next: GameSession, ev: Omit<GameEvent, "t">): GameSession {
  return { ...next, startedAt: next.startedAt ?? Date.now(), events: [...(next.events || []), { ...ev, t: Date.now() } as GameEvent] }
}

const STORAGE_KEY = "ccts-game-session"

type SessionCtx = {
  session: GameSession
  save: (next: GameSession) => void
  loading: boolean
  storageError: boolean
}

const SessionContext = createContext<SessionCtx | null>(null)

// Lives in the root layout (never remounts between route changes), so the
// session no longer resets to blankSession and flashes "0/0/0" on every
// in-app navigation the way it did when this state lived inside AppShell.
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<GameSession>(blankSession)
  const [loading, setLoading] = useState(true)
  const [storageError, setStorageError] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setSession({ ...blankSession, ...JSON.parse(raw) })
    } catch {
      setStorageError(true)
    }
    setLoading(false)
  }, [])

  const save = useCallback((next: GameSession) => {
    setSession(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      setStorageError(true)
    }
  }, [])

  return <SessionContext.Provider value={{ session, save, loading, storageError }}>{children}</SessionContext.Provider>
}

export function useGameSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error("useGameSession must be used within SessionProvider")
  return ctx
}
