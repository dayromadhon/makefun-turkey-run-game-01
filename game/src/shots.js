// GOBBLE DASH — deterministic screenshot scenes.
// ?shot=title | play | caught | escaped (with an optional &seed=) freezes the
// game into one fixed, reproducible frame so the screenshots are real renders
// of the game's own code, taken again and again the same way.

import { LANE_Y, START_GAP_PX } from './config.js';
import { WorldEntity } from './world.js';

export function applyShot(game, name, seed = 20261127) {
  game.frozen = true;
  game.shotName = name;
  game.time = 2.4; // a fixed moment, so every render looks the same
  game.scroll = 420;

  if (name === 'title') {
    game.state = 'title';
    game.world.reset(seed);
    return true;
  }

  if (name === 'play') {
    game.state = 'playing';
    game.world.reset(seed);
    game.lane = 1;
    game.laneY = LANE_Y[1];
    game.lives = 3;
    game.gap = 64; // the farmer is right on the turkey's tail
    game.cornEaten = 7;
    game.dashCooldown = 0;
    game.invulnTimer = 0;
    // A busy mid-run: an oven and a knife ahead, corn to grab, the farmer close.
    game.world.distancePx = 347 * 50;
    game.world.entities = [
      new WorldEntity('oven', 0, 720),
      new WorldEntity('knife', 2, 940),
      new WorldEntity('corn', 1, 560),
      new WorldEntity('corn', 1, 620),
      new WorldEntity('corn', 1, 680),
      new WorldEntity('corn', 2, 1120),
      new WorldEntity('hay', 2, 1180),
      new WorldEntity('pumpkin', 0, 420),
    ];
    return true;
  }

  if (name === 'caught') {
    game.state = 'caught';
    game.world.reset(seed);
    game.lane = 1;
    game.laneY = LANE_Y[1];
    game.lives = 0;
    game.gap = 0;
    game.cornEaten = 9;
    game.world.distancePx = 512 * 50;
    // The farmer stands over the dizzy turkey at the end of the run.
    game.world.entities = [
      new WorldEntity('oven', 0, 1080),
      new WorldEntity('knife', 2, 900),
      new WorldEntity('pumpkin', 2, 480),
    ];
    return true;
  }

  if (name === 'escaped') {
    game.state = 'escaped';
    game.world.reset(seed);
    game.lane = 1;
    game.laneY = LANE_Y[1];
    game.lives = 2;
    game.gap = 240;
    game.cornEaten = 21;
    game.world.distancePx = 1000 * 50;
    game.world.entities = [
      new WorldEntity('gate', 1, 1060),
      new WorldEntity('corn', 0, 620),
      new WorldEntity('corn', 2, 700),
    ];
    return true;
  }

  return false;
}
