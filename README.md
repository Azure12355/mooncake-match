<h1 align="center">Mooncake Match</h1>
<p align="center"><img src="./public/assets/images/tile-classic.png" width="128" height="128" alt="Mooncake"></p>
<p align="center"><strong>A cozy Mid-Autumn match-three game, built with React, Vite and TypeScript.</strong></p>
<p align="center">
  <a href="./LICENSE"><img alt="MIT code license" src="https://img.shields.io/badge/code-MIT-blue"></a>
  <a href="https://github.com/Azure12355/mooncake-match/stargazers"><img alt="GitHub stars" src="https://img.shields.io/github/stars/Azure12355/mooncake-match"></a>
</p>
<p align="center"><strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a></p>

[Play online](https://pages.weilanx.com/games/mooncake-match/)

## Features

- Swap adjacent tiles by tapping or swiping on an 8 × 7 board with eight tile types.
- Collect 12 classic mooncakes, 8 rabbits and 8 lanterns within 20 moves.
- Frequent cascades, four free tools and automatic reshuffling when no move remains.
- Responsive single-screen layout, gilded osmanthus frame and desktop festival backgrounds.
- Music/effect toggles, background-tab audio pause and locally saved best score.

Pure frontend: no accounts, backend, payments or online leaderboard. Reloading starts a new game. Music begins after interaction. The public build uses synthesized music; the live demo may use different music.

## Quick start

Use Node.js 24 and npm. From the repository root:

```sh
npm ci
npm run dev
```

Open the address printed by Vite.

```sh
npm test
npm run lint
npm run build
node scripts/simulate-game.ts
```

Build output is `dist/`. For subdirectory hosting, supply the actual base path, for example:

```sh
npm run build -- --base=/games/mooncake-match/
```

## Agent Quickstart

Read [AGENTS.md](./AGENTS.md) before editing. Keep changes scoped; preserve unrelated work and existing artwork. Browser interaction requires the user's explicit consent. Never publish credentials or private music.

| Source | Purpose |
|---|---|
| [PRD](./docs/PRD.md) | Product rules and scope |
| `src/config.ts` | Board, targets, tools and cascade tuning |
| `src/game.ts` | Pure rule engine and animation plans |
| `src/App.tsx`, `src/App.css`, `src/index.css` | UI, input and screen fitting |
| `src/useAudio.ts`, `src/storage.ts` | Audio and preferences |
| `tests/` | Rule and storage validation |
| [Balance notes](./docs/BALANCE.md) | Reproducible 300-game simulation |
| [Asset inventory](./docs/ASSETS.md) | Assets and generation prompts |

Change only relevant implementation and documentation, run the commands above as appropriate, and report actual validation. Rule changes must preserve real matches, exact scoring and the 10-round cascade limit. Probability changes require before/after simulation; simulation does not prove player retention.

## Validation and limitations

20 unit tests and production build pass. Lint reports two non-blocking state-in-effect warnings. Browser interaction, real audio playback and cross-device visual acceptance have not been completed. Asset availability checks do not substitute for gameplay testing.

## Contributing and security

See [CONTRIBUTING.md](./CONTRIBUTING.md) and [SECURITY.md](./SECURITY.md).

## License

Code and documentation use [MIT](./LICENSE). Fonts and artwork have separate terms in [ASSET-LICENSES.md](./ASSET-LICENSES.md). Private music is excluded.
