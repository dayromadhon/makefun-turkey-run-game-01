// GOBBLE DASH — the entry point: canvas, game loop, screenshot mode.
// Loads as an ES module from index.html; the game needs no build step and
// makes no network request.

import { VIEW_H, VIEW_W } from './config.js';
import { Game } from './game.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const game = new Game(canvas);

// A handle for play-testing: the test driver reads the state and drives keys.
window.__gobble = game;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') ?? 20261127);
if (shot) {
  if (!applyShot(game, shot, Number.isFinite(seed) ? seed : 20261127)) {
    document.title = 'Gobble Dash — unknown shot';
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.frozen) game.update(dt);
  game.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
