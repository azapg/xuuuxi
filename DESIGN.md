# Xuuuxi Design Document

## Overview
Xuuuxi is a real-time multiplayer party card game. Players create rooms, join via a code, and take turns being the "Czar" to judge the best white card played in response to a black card prompt.

## Architecture
- **Frontend**: React + Vite (`/client`).
- **Backend**: Bun + SQLite (`/server`).
- **Shared**: Common types and game logic (`/shared`).

## Design Philosophy
- **Aesthetics**: The UI must feel premium, modern, and engaging. We prioritize vibrant accents, dark themes, and smooth micro-animations.
- **Iconography**: We strictly use `hugeicons-react`. Emojis are banned from the UI to maintain a sleek, unified, and professional look.
- **Scroll Areas**: All scroll areas should use the shadcn `scroll-area` component (built on Radix UI) instead of native vanilla scrollbars to ensure a consistent, modern, and customizable experience.
- **Responsiveness**: The game must be perfectly playable on mobile and desktop devices.
- **Vertical space is sacred**: In-room screens never show a persistent header or sidebar. All chrome lives in the `GameTopBar` overlay (logo, phase timer, sound toggle, player facepile), and secondary info (room code/info, leaderboard, exit) opens on demand in dialogs. The cards get the screen.
- **One card interaction**: The stage + carousel pattern from the hand view (`CylinderCarousel` + `PlayingCard`) is the standard for every card-picking phase — playing, judging, and discarding. Selected cards fly onto the center stage; the rest riffle by below with the hover push-apart animation.

## Sound
- All UI sounds are synthesized live via the Web Audio API — no audio files. Built-in cues come from `cuelume`; game-specific cues (card slides, deals, the win fanfare) are custom recipes in `client/src/lib/sound.ts` using the same layer format.
- Always trigger audio through `playSound()` from `@/lib/sound`. It handles mute state, throttling of rapid cues, and user-activation gating.
- Every sound must double a visual change, never replace one. Keep cues subtle; weight matches the action (paper tick for hover, fanfare only for winning).
- The mute toggle in `GameTopBar` persists to localStorage; users with `prefers-reduced-motion` default to muted.
- Standard buttons play press/release automatically (see `ui/button.tsx`, opt out with `silent`); dialogs play open/close sounds via `ui/dialog.tsx`.
