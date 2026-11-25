[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/laithzz21/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/laithzz21/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
<sub>Entered on [make.fun](https://make.fun/?ref=5kda0hwb&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>

# Sizzle & Serve — Rush Hour Kitchen

An entry for the make.fun bounty [Make the best cooking game](https://make.fun/bounty/best-cooking-game-20261125-0137): a complete, original cooking game that runs offline in a desktop browser from its own static files.

## How to play

You are the chef on a 150-second shift. Orders appear on the board with a patience timer — serve them before they walk out.

1. **Grab ingredients** from the counter bins (buns, patties, tomatoes, lettuce, cheese).
2. **Grill** raw patties on the grill — take them off in time or they burn.
3. **Chop** tomato and lettuce on the chopping board.
4. **Build** the dish on the assembly counter's plate, then press E again to serve it when it matches an order.
5. **Bin** mistakes (burnt patties, wrong items) in the bin.

Controls: **WASD / arrow keys** to move, **E** (or Space) to use the station in front of you, **P** to pause, or **click a station** to walk to it and use it. Serve fast: a dish pays its price plus a patience bonus.

## Run it

```sh
node serve.ts   # then open http://localhost:8080
```

No build step, no network requests, no libraries — just `game/index.html` and its ES modules. Screenshots are staged deterministically with `?shot=start|play|end&seed=1` (see `shots.json`).

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json` with the vendored make.fun library.
- `game/index.html` — the page; `game/src/` holds one file per job: `config.js` (stations, recipes), `world.js` (rules), `render.js` (all drawn art), `input.js` (keyboard + mouse), `shots.js` (deterministic screenshot scenes), `main.js` (boot + loop), `random.js` (seeded RNG).
- `vendor/makefun-game.ts` — the kit's library, unchanged.
- `screenshots/` — real renders of the game's own code in a browser.
