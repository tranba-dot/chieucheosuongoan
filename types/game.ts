export type Chapter = { id: number; title: string; description: string; mechanic: string; objective: string }
export type PerspectiveCard = { code: string; year: string; name: string; role: string; traits: string[]; meaning: string; evidence: string[] }
export type InjusticeCard = { id: string; chapter: number; title: string; situation: string; prompt: string; validPerspectiveCodes: string[]; source: string }
