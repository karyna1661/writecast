export type GameMode = "fill-blank" | "frame-word"

export interface GameState {
  mode: GameMode | null
  step: "idle" | "creating" | "writing" | "preview" | "playing" | "guessing"

  // Creation state
  hiddenWord: string
  masterpiece: string
  gameId: string

  // Playing state
  currentGameId: string
  currentGame: { hiddenWord: string; masterpiece: string; mode: GameMode } | null
  guess: string
  attempts: number
}

export const initialGameState: GameState = {
  mode: null,
  step: "idle",
  hiddenWord: "",
  masterpiece: "",
  gameId: "",
  currentGameId: "",
  currentGame: null,
  guess: "",
  attempts: 0,
}

export const MOCK_GAMES: Record<string, { hiddenWord: string; masterpiece: string; mode: GameMode }> = {
  // Fill-in-blank games
  ABC123: {
    mode: "fill-blank",
    hiddenWord: "innovation",
    masterpiece:
      "The future of technology lies in innovation and creativity. We must embrace change and push boundaries to create something truly remarkable. Innovation drives progress and transforms industries.",
  },
  XYZ789: {
    mode: "fill-blank",
    hiddenWord: "serendipity",
    masterpiece:
      "Life is full of unexpected moments. Sometimes the best discoveries come from serendipity, those happy accidents that lead us to places we never imagined. Embrace the unknown.",
  },
  TECH42: {
    mode: "fill-blank",
    hiddenWord: "blockchain",
    masterpiece:
      "Decentralized systems powered by blockchain technology are revolutionizing how we think about trust and transparency. The blockchain enables peer-to-peer transactions without intermediaries, creating new possibilities for digital ownership.",
  },
  WORD99: {
    mode: "fill-blank",
    hiddenWord: "metamorphosis",
    masterpiece:
      "Change is the only constant in life. Through metamorphosis, we shed our old selves and emerge transformed. This metamorphosis is not just physical but spiritual, a complete transformation of being.",
  },
  POET88: {
    mode: "fill-blank",
    hiddenWord: "ephemeral",
    masterpiece:
      "Beauty is often ephemeral, fleeting like cherry blossoms in spring. We chase these ephemeral moments, knowing they cannot last, yet finding meaning in their transience. The ephemeral nature of life makes each moment precious.",
  },
  SAGE77: {
    mode: "fill-blank",
    hiddenWord: "wisdom",
    masterpiece:
      "True wisdom comes not from books but from lived experience. With wisdom, we navigate life's complexities with grace and understanding. Ancient wisdom teaches us that knowledge without wisdom is merely information.",
  },

  // Frame-the-word games
  FRAME1: {
    mode: "frame-word",
    hiddenWord: "resilience",
    masterpiece:
      "When storms come and winds blow fierce, we bend but never break. Through every challenge and setback, we find strength within ourselves. The journey shapes us, molds us, makes us stronger than we ever imagined possible.",
  },
  FRAME2: {
    mode: "frame-word",
    hiddenWord: "courage",
    masterpiece:
      "Fear whispers in our ears, but we step forward anyway. In the face of uncertainty, we choose action over paralysis. Not because we are fearless, but because something matters more than our fear.",
  },
  FRAME3: {
    mode: "frame-word",
    hiddenWord: "solitude",
    masterpiece:
      "In the quiet spaces between noise, we find ourselves. Away from the crowd's demands and expectations, we can finally hear our own voice. These moments alone are not lonely but liberating, a sanctuary for the soul.",
  },
  FRAME4: {
    mode: "frame-word",
    hiddenWord: "nostalgia",
    masterpiece:
      "Old photographs fade, but memories remain vivid. We return to places that no longer exist except in our minds. The past calls to us with a bittersweet song, reminding us of who we were and how far we've come.",
  },
  FRAME5: {
    mode: "frame-word",
    hiddenWord: "ambition",
    masterpiece:
      "Dreams fuel our journey forward, pushing us beyond comfortable limits. We reach for stars that seem impossibly distant, driven by an inner fire that refuses to be extinguished. Success is not the destination but the relentless pursuit itself.",
  },
  FRAME6: {
    mode: "frame-word",
    hiddenWord: "melancholy",
    masterpiece:
      "Gray skies mirror the weight in our hearts. There's a strange beauty in sadness, a depth that joy cannot reach. We sit with this feeling, not rushing to escape it, finding poetry in the ache.",
  },
}
