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
