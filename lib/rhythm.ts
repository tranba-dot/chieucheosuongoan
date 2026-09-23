// Nhịp–Phách is a physical clap-along game: the website's only job is to identify the drawn
// card (by code, scanned via QR or typed) and play its audio file so the group can clap along.
// No tap capture, no timing score, no AI/LLM judging the clap -- per the project owner's brief
// (design log 2026-09-23), the site is a bridge from card to audio, nothing else.
export type RhythmCard = {
  code: string
  level: number
  audioFile: string
  // Vestigial: Thẻ Can Thiệp i-02 ("Giữ nhịp câu chuyện")'s eligibility check still reads this
  // even though nothing here produces a score anymore -- i-02's redesign is deliberately
  // deferred (see app/_app-shell.tsx UpdatedIntervention and the design log), not touched here.
  passAt: number
}

// Level 1 is the only real card today; deeper levels need real audio from the project owner.
// audioFile is a repo-static placeholder shared by every code until real recordings arrive --
// static files were chosen over a real database/Supabase since there's no backend today and
// only a handful of cards (see design log 2026-09-23).
export const RHYTHM_CARDS: RhythmCard[] = [
  { code: "2714", level: 1, audioFile: "/audio/nhip-phach-demo.wav", passAt: 80 },
]

export function findRhythmCard(code: string): RhythmCard | undefined {
  return RHYTHM_CARDS.find((c) => c.code === code)
}
