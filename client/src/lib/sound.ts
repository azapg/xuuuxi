/**
 * Xuuuxi sound system.
 *
 * Built-in UI cues come from `cuelume` (synthesized live via the Web Audio
 * API — no files). Game-specific sounds (card slides, deals, the win
 * fanfare) are custom recipes in the same layer format, rendered by a small
 * local engine so everything shares one sonic identity.
 *
 * Every sound is a no-op until the user has interacted with the page, and
 * playback is globally mutable via `setMuted` (persisted in localStorage).
 */
import { play as cuelumePlay, setEnabled, type SoundName } from 'cuelume'

// ------------------------------------------------------------
// Custom recipes (cuelume layer format)
// ------------------------------------------------------------

type ToneLayer = {
  kind: 'tone'
  waveform: OscillatorType
  frequency: number
  glideTo?: number
  glideTime?: number
  detune?: number
  offset?: number
  attack: number
  decay: number
  peak: number
}

type NoiseLayer = {
  kind: 'noise'
  filterType: BiquadFilterType
  filterFrequency: number
  filterQ?: number
  offset?: number
  attack: number
  decay: number
  peak: number
}

type CustomRecipe = {
  masterGain: number
  layers: (ToneLayer | NoiseLayer)[]
}

const CUSTOM_RECIPES = {
  /** A papery slide with a soft landing thump — a card dropped on the table. */
  cardSlide: {
    masterGain: 0.5,
    layers: [
      { kind: 'noise', filterType: 'lowpass', filterFrequency: 1900, filterQ: 0.7, attack: 0.015, decay: 0.11, peak: 0.11 },
      { kind: 'tone', waveform: 'sine', frequency: 190, offset: 0.07, attack: 0.004, decay: 0.09, peak: 0.05 },
    ],
  },
  /** A short, brighter flick with a small upward lift — a card picked back up. */
  cardLift: {
    masterGain: 0.4,
    layers: [
      { kind: 'noise', filterType: 'lowpass', filterFrequency: 2600, filterQ: 0.7, attack: 0.008, decay: 0.07, peak: 0.09 },
      { kind: 'tone', waveform: 'sine', frequency: 360, glideTo: 620, glideTime: 0.09, attack: 0.006, decay: 0.09, peak: 0.022 },
    ],
  },
  /** The quietest cue we have — a feather-light paper tick for card hovers. */
  cardHover: {
    masterGain: 0.22,
    layers: [
      { kind: 'noise', filterType: 'bandpass', filterFrequency: 3000, filterQ: 1.1, attack: 0.003, decay: 0.03, peak: 0.09 },
    ],
  },
  /** A quiet flick while riffling through the hand carousel. */
  cardRiffle: {
    masterGain: 0.3,
    layers: [
      { kind: 'noise', filterType: 'lowpass', filterFrequency: 2300, filterQ: 0.8, attack: 0.004, decay: 0.045, peak: 0.1 },
    ],
  },
  /** Three quick papery flicks — a new hand being dealt. */
  deal: {
    masterGain: 0.45,
    layers: [
      { kind: 'noise', filterType: 'lowpass', filterFrequency: 2100, filterQ: 0.7, offset: 0, attack: 0.006, decay: 0.06, peak: 0.1 },
      { kind: 'noise', filterType: 'lowpass', filterFrequency: 2400, filterQ: 0.7, offset: 0.08, attack: 0.006, decay: 0.06, peak: 0.09 },
      { kind: 'noise', filterType: 'lowpass', filterFrequency: 2700, filterQ: 0.7, offset: 0.16, attack: 0.006, decay: 0.07, peak: 0.08 },
    ],
  },
  /** A warm ascending four-note arpeggio — you won the round. */
  fanfare: {
    masterGain: 0.55,
    layers: [
      { kind: 'tone', waveform: 'sine', frequency: 523.25, offset: 0, attack: 0.005, decay: 0.16, peak: 0.06 },
      { kind: 'tone', waveform: 'sine', frequency: 659.25, offset: 0.09, attack: 0.005, decay: 0.16, peak: 0.06 },
      { kind: 'tone', waveform: 'sine', frequency: 783.99, offset: 0.18, attack: 0.005, decay: 0.18, peak: 0.065 },
      { kind: 'tone', waveform: 'sine', frequency: 1046.5, offset: 0.27, attack: 0.005, decay: 0.34, peak: 0.075 },
      { kind: 'tone', waveform: 'sine', frequency: 1046.5, detune: 8, offset: 0.27, attack: 0.005, decay: 0.34, peak: 0.04 },
    ],
  },
} satisfies Record<string, CustomRecipe>

type CustomSoundName = keyof typeof CUSTOM_RECIPES

export type GameSoundName = SoundName | CustomSoundName

// ------------------------------------------------------------
// Custom render engine (mirrors cuelume's, for our own recipes)
// ------------------------------------------------------------

let customContext: AudioContext | null = null

function getContext(): AudioContext | null {
  if (customContext) return customContext
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  try {
    customContext = new Ctor()
  } catch {
    return null
  }
  return customContext
}

function renderCustom(context: AudioContext, recipe: CustomRecipe) {
  const now = context.currentTime
  const master = context.createGain()
  master.gain.value = recipe.masterGain
  master.connect(context.destination)

  let end = now
  for (const layer of recipe.layers) {
    const start = now + (layer.offset ?? 0)
    const stop = start + layer.attack + layer.decay + 0.05
    end = Math.max(end, stop)

    const gain = context.createGain()
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(layer.peak, start + layer.attack)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + layer.attack + layer.decay)
    gain.connect(master)

    if (layer.kind === 'tone') {
      const osc = context.createOscillator()
      osc.type = layer.waveform
      osc.frequency.setValueAtTime(layer.frequency, start)
      if (layer.detune) osc.detune.value = layer.detune
      if (layer.glideTo !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(
          layer.glideTo,
          start + (layer.glideTime ?? layer.attack + layer.decay),
        )
      }
      osc.connect(gain)
      osc.start(start)
      osc.stop(stop)
    } else {
      const length = Math.max(1, Math.floor((stop - start) * context.sampleRate))
      const buffer = context.createBuffer(1, length, context.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < length; i++) data[i] = 2 * Math.random() - 1
      const source = context.createBufferSource()
      source.buffer = buffer
      const filter = context.createBiquadFilter()
      filter.type = layer.filterType
      filter.frequency.value = layer.filterFrequency
      if (layer.filterQ !== undefined) filter.Q.value = layer.filterQ
      source.connect(filter).connect(gain)
      source.start(start)
      source.stop(stop)
    }
  }

  setTimeout(() => master.disconnect(), (end - now + 0.1) * 1000)
}

// ------------------------------------------------------------
// Mute state (persisted; defaults to muted for reduced-motion users)
// ------------------------------------------------------------

const STORAGE_KEY = 'xuuuxi_sound_muted'

function initialMuted(): boolean {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) return stored === 'true'
  // No explicit preference yet: respect reduced-motion as a sensitivity proxy.
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

let muted = initialMuted()
setEnabled(!muted)

const listeners = new Set<(muted: boolean) => void>()

export function isMuted(): boolean {
  return muted
}

export function setMuted(value: boolean) {
  muted = value
  setEnabled(!muted)
  try {
    localStorage.setItem(STORAGE_KEY, String(value))
  } catch {
    // Storage unavailable (private mode) — the in-memory flag still applies.
  }
  for (const listener of listeners) listener(muted)
}

export function subscribeMuted(listener: (muted: boolean) => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

// ------------------------------------------------------------
// Unified play()
// ------------------------------------------------------------

const lastPlayed = new Map<GameSoundName, number>()

/** Per-sound minimum gap so rapid interactions never machine-gun a cue. */
const THROTTLE_MS: Partial<Record<GameSoundName, number>> = {
  cardHover: 60,
  cardRiffle: 45,
  tick: 80,
  whisper: 150,
}

export function playSound(name: GameSoundName) {
  if (muted) return
  if (typeof navigator !== 'undefined' && navigator.userActivation?.hasBeenActive === false) return

  const throttle = THROTTLE_MS[name]
  if (throttle) {
    const now = performance.now()
    const last = lastPlayed.get(name) ?? -Infinity
    if (now - last < throttle) return
    lastPlayed.set(name, now)
  }

  if (name in CUSTOM_RECIPES) {
    const context = getContext()
    if (!context) return
    const recipe = CUSTOM_RECIPES[name as CustomSoundName]
    if (context.state === 'running') {
      renderCustom(context, recipe)
    } else {
      context.resume().then(
        () => {
          if (!muted && context.state === 'running') renderCustom(context, recipe)
        },
        () => {},
      )
    }
  } else {
    cuelumePlay(name as SoundName)
  }
}
