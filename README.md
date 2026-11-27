# Gobble Dash — The Great Turkey Escape

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/dayromadhon/makefun-turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/dayromadhon/makefun-turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Thanksgiving is coming, and one turkey refuses to be dinner. **Gobble Dash** is a
complete, original 2D escape game that runs offline in a desktop browser from
static files — no build step, no network request, no libraries.

## How to play

Serve `game/` and open it in a desktop browser:

```sh
node serve.ts        # then open http://localhost:8080
```

- **↑ / ↓ or W / S** — switch between the three running lanes
- **SPACE** — dash (a burst of speed that also puts the farmer further behind)
- **M** — mute · **P** — pause · **ENTER / click** — start and restart

Run 1000 m through the farmyard, the farmhouse yard and the kitchen approach
to reach the forest gate and escape. The farmer chases you the whole way: he
closes in on his own, lunges forward every time you hit something, and falls
back when you eat corn or dash. Dodge the **oven** and the **carving knife**,
grab **corn** for score, and keep three lives intact. Get caught and dinner is
served; reach the gate and you gobble another day.

## What's inside

- `game/index.html` — the page, a canvas and one module script
- `game/src/config.js` — every tuning number in one place
- `game/src/game.js` — states (title / playing / caught / escaped), the run, the HUD
- `game/src/world.js` — spawning, movement and collisions (always leaves a lane open)
- `game/src/art.js` — all art drawn with canvas paths: turkey, farmer, oven, knife, farm
- `game/src/audio.js` — WebAudio sounds, synthesized live (gobbles, pickups, fanfare)
- `game/src/input.js` — keyboard and mouse, kept apart from the game logic
- `game/src/shots.js` — deterministic screenshot scenes (`?shot=title|play|caught|escaped`)
- `game/src/main.js` — bootstrap and game loop
- `main.ts` — the entry program: copies `game/` and `screenshots/` and writes `dossier.json`
- `screenshots/` — real renders of the game's own code in a browser

All art and sounds are original and made for this game. The turkey, the farmer,
the oven and the knife are drawn in code; nothing is borrowed from another game.

<sub>Entered on [make.fun](https://make.fun/?ref=sf3mmt2f&utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
