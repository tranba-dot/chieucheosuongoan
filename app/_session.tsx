"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

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
