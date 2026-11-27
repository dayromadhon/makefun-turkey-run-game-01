// GOBBLE DASH — the moving world: what spawns, where it goes, what it hits.
// The turkey's lane, the farmer's gap and the hazards all live here.

import { LANE_Y, SPAWN_MIN_GAP_PX, STAGE_CUTS_M, TURKEY_X } from './config.js';

// A tiny deterministic RNG so a screenshot seed replays the same run.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function stageForDistance(metres) {
  if (metres >= STAGE_CUTS_M[2]) return 2;
  if (metres >= STAGE_CUTS_M[1]) return 1;
  return 0;
}

// One thing in the world: a hazard, a corn, or a piece of scenery.
export class WorldEntity {
  constructor(type, lane, x, opts = {}) {
    this.type = type; // 'oven' | 'knife' | 'hay' | 'corn' | 'pumpkin' | 'gate'
    this.lane = lane;
    this.x = x;
    this.y = opts.y ?? LANE_Y[lane];
    this.dead = false;
    this.wobble = opts.wobble ?? 0;
  }

  get feetY() {
    return this.y;
  }

  // Half-width and height used for collision: hazards are forgiving on purpose.
  get halfW() {
    if (this.type === 'oven') return 46;
    if (this.type === 'knife') return 58;
    if (this.type === 'hay') return 36;
    if (this.type === 'corn') return 16;
    return 40;
  }

  get height() {
    if (this.type === 'oven') return 150;
    if (this.type === 'knife') return 20;
    if (this.type === 'hay') return 52;
    if (this.type === 'corn') return 40;
    return 40;
  }

  get isHazard() {
    return this.type === 'oven' || this.type === 'knife' || this.type === 'hay';
  }

  get isCorn() {
    return this.type === 'corn';
  }
}

export class World {
  constructor(seed = 1) {
    this.rng = mulberry32(seed);
    this.entities = [];
    this.spawnTimer = 0.4;
    this.lastSpawnX = 0;
    this.gateSpawned = false;
    this.distancePx = 0;
  }

  get metres() {
    return this.distancePx / 50;
  }

  get stage() {
    return stageForDistance(this.metres);
  }

  reset(seed = 1) {
    this.rng = mulberry32(seed);
    this.entities = [];
    this.spawnTimer = 0.4;
    this.lastSpawnX = 0;
    this.gateSpawned = false;
    this.distancePx = 0;
  }

  // A cluster always leaves at least one lane open: the run is never unfair.
  spawnCluster() {
    const roll = this.rng();
    const lanes = [0, 1, 2];
    const shuffled = lanes.sort(() => this.rng() - 0.5);
    const x = 1360;
    const stage = this.stage;

    if (roll < 0.42) {
      // One hazard, corn waiting in another lane.
      const hazardLane = shuffled[0];
      const cornLane = shuffled[1];
      this.addHazard(hazardLane, x, stage);
      this.entities.push(new WorldEntity('corn', cornLane, x + 90));
    } else if (roll < 0.68) {
      // Two hazards side by side, one lane free, corn in the free lane.
      this.addHazard(shuffled[0], x, stage);
      this.addHazard(shuffled[1], x + 40, stage);
      this.entities.push(new WorldEntity('corn', shuffled[2], x + 120));
    } else if (roll < 0.86) {
      // A line of corn, with one hazard trailing behind.
      const cornLane = shuffled[0];
      for (let i = 0; i < 3; i++) {
        this.entities.push(new WorldEntity('corn', cornLane, x + i * 70));
      }
      this.addHazard(shuffled[1], x + 260, stage);
    } else {
      // A hay bale to hop past (dodge, not jump) and corn above it.
      this.entities.push(new WorldEntity('hay', shuffled[0], x));
      this.entities.push(new WorldEntity('corn', shuffled[0], x + 80));
      this.entities.push(new WorldEntity('corn', shuffled[1], x + 40));
    }

    // A pumpkin rolls by now and then, just for the autumn of it.
    if (this.rng() < 0.3) {
      this.entities.push(new WorldEntity('pumpkin', shuffled[2], x + 220));
    }
  }

  addHazard(lane, x, stage) {
    const roll = this.rng();
    if (stage === 0) {
      // The farmyard: knives and hay, the oven still warming up.
      this.entities.push(new WorldEntity(roll < 0.55 ? 'knife' : 'hay', lane, x));
    } else if (stage === 1) {
      this.entities.push(new WorldEntity(roll < 0.4 ? 'oven' : roll < 0.75 ? 'knife' : 'hay', lane, x));
    } else {
      // The kitchen approach: ovens everywhere, knives on the prowl.
      this.entities.push(new WorldEntity(roll < 0.5 ? 'oven' : 'knife', lane, x));
    }
  }

  update(dt, speed) {
    this.distancePx += speed * dt;
    this.spawnTimer -= dt;
    const lastX = this.entities.length ? Math.max(...this.entities.map((e) => e.x)) : 0;
    if (this.spawnTimer <= 0 && (this.entities.length === 0 || lastX < 1360 - SPAWN_MIN_GAP_PX)) {
      this.spawnCluster();
      const stage = this.stage;
      this.spawnTimer = 0.95 - stage * 0.12 - Math.min(0.25, this.metres / 4000);
      if (this.spawnTimer < 0.55) this.spawnTimer = 0.55;
    }

    // The forest gate appears once the turkey is almost home.
    if (!this.gateSpawned && this.metres >= 940) {
      this.entities.push(new WorldEntity('gate', 1, 1420));
      this.gateSpawned = true;
    }

    for (const entity of this.entities) {
      entity.x -= speed * dt;
      if (entity.type === 'knife') entity.x -= 40 * dt; // knives slide toward the turkey
      if (entity.x < -160) entity.dead = true;
    }
    this.entities = this.entities.filter((e) => !e.dead);
  }

  // What overlaps the turkey right now, given its lane and hurtbox.
  collisions(turkeyLane, turkeyFeetY) {
    const hits = [];
    for (const entity of this.entities) {
      if (entity.dead) continue;
      const dx = Math.abs(entity.x - TURKEY_X);
      if (dx > entity.halfW + 30) continue;
      if (entity.lane !== turkeyLane) continue;
      const top = turkeyFeetY - 110;
      const bottom = turkeyFeetY;
      const eTop = entity.feetY - entity.height;
      const eBottom = entity.feetY;
      if (bottom > eTop + 8 && top < eBottom - 4) hits.push(entity);
    }
    return hits;
  }

  // Has the turkey reached the forest gate?
  gateReached() {
    return this.entities.some((e) => e.type === 'gate' && e.x <= TURKEY_X + 40);
  }
}
