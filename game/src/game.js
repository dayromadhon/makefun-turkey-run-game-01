// GOBBLE DASH — the game itself: states, the run, the HUD and the screens.
// Title, playing, caught and escaped all live here; world.js moves the
// things, art.js draws them, this file decides what happens.

import {
  BASE_SPEED, CORN_GAP_BONUS, CORN_SCORE, DASH_COOLDOWN, DASH_GAP_BONUS, DASH_TIME,
  ESCAPE_DISTANCE_M, GAP_DRAIN, GROUND_Y, HIT_GAP_PENALTY, INVULN_TIME, LANE_Y,
  MAX_SPEED, METRE_SCORE, PALETTE, SPEED_PER_M, START_GAP_PX, START_LIVES,
  TURKEY_X, VIEW_H, VIEW_W,
} from './config.js';
import { SoundBoard } from './audio.js';
import { Input } from './input.js';
import { World, stageForDistance } from './world.js';
import {
  drawBarn, drawCorn, drawFarmer, drawForestGate, drawGround, drawHayBale,
  drawKnife, drawLaneGuides, drawOven, drawPumpkin, drawSky, drawTurkey,
  outlinedText, roundRect,
} from './art.js';

const STAGE_NAMES = ['THE FARMYARD', 'THE FARMHOUSE YARD', 'THE KITCHEN APPROACH'];

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.sounds = new SoundBoard();
    this.world = new World(20261127);
    this.state = 'title';
    this.time = 0;
    this.scroll = 0;
    this.lane = 1; // index of the lane the turkey is running in
    this.laneY = LANE_Y[1]; // smoothed feet position while switching lanes
    this.lives = START_LIVES;
    this.gap = START_GAP_PX; // px between the turkey and the farmer
    this.cornEaten = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.invulnTimer = 0;
    this.shakeTimer = 0;
    this.stompTimer = 0;
    this.best = 0;
    this.frozen = false; // screenshot mode: draw a fixed scene, advance nothing
    this.shotName = null;
    try {
      this.best = Number(window.localStorage.getItem('gobble-dash-best') ?? 0) || 0;
    } catch {
      this.best = 0;
    }
  }

  get metres() {
    return this.world.metres;
  }

  get score() {
    return Math.floor(this.metres) * METRE_SCORE + this.cornEaten * CORN_SCORE;
  }

  get speed() {
    return Math.min(MAX_SPEED, BASE_SPEED + this.metres * SPEED_PER_M);
  }

  get stage() {
    return stageForDistance(this.metres);
  }

  startRun(seed) {
    this.world.reset(seed ?? Math.floor(Math.random() * 1e9));
    this.state = 'playing';
    this.lane = 1;
    this.laneY = LANE_Y[1];
    this.lives = START_LIVES;
    this.gap = START_GAP_PX;
    this.cornEaten = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.invulnTimer = 0;
    this.shakeTimer = 0;
    this.sounds.ensure();
    this.sounds.gobble();
  }

  endRun(escaped) {
    this.state = escaped ? 'escaped' : 'caught';
    if (this.score > this.best) {
      this.best = this.score;
      try {
        window.localStorage.setItem('gobble-dash-best', String(this.best));
      } catch {
        // Best score is a nicety, not a requirement.
      }
    }
    if (escaped) this.sounds.fanfare();
    else this.sounds.caughtSting();
  }

  update(dt) {
    this.time += dt;

    if (this.state === 'title') {
      this.scroll += 40 * dt;
      if (this.input.consumeAny(['Enter', 'Space']) || this.input.consumeClick()) {
        this.sounds.ensure();
        this.sounds.click();
        this.startRun();
      }
      if (this.input.consume('KeyM')) this.sounds.toggleMute();
      this.input.endFrame();
      return;
    }

    if (this.state === 'caught' || this.state === 'escaped') {
      if (this.input.consumeAny(['Enter', 'Space']) || this.input.consumeClick()) {
        this.sounds.click();
        this.startRun();
      }
      this.input.endFrame();
      return;
    }

    if (this.state === 'paused') {
      if (this.input.consume('KeyP') || this.input.consumeAny(['Enter', 'Space']) || this.input.consumeClick()) {
        this.state = 'playing';
        this.sounds.ensure();
      }
      this.input.endFrame();
      return;
    }

    if (this.state !== 'playing') {
      this.input.endFrame();
      return;
    }

    // Lane switching, one lane per press.
    if (this.input.consumeAny(['ArrowUp', 'KeyW'])) {
      if (this.lane > 0) {
        this.lane--;
        this.sounds.gobble();
      }
    }
    if (this.input.consumeAny(['ArrowDown', 'KeyS'])) {
      if (this.lane < 2) {
        this.lane++;
        this.sounds.gobble();
      }
    }
    this.laneY += (LANE_Y[this.lane] - this.laneY) * Math.min(1, dt * 14);

    // Dash: a short burst that also puts the farmer further behind.
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.input.consume('Space') && this.dashCooldown <= 0) {
      this.dashTimer = DASH_TIME;
      this.dashCooldown = DASH_COOLDOWN;
      this.sounds.dash();
    }
    const dashing = this.dashTimer > 0;
    if (this.dashTimer > 0) this.dashTimer -= dt;

    const speed = this.speed * (dashing ? 1.7 : 1);
    this.world.update(dt, speed);
    this.scroll += speed * dt;

    // The farmer never stops closing in.
    this.gap -= GAP_DRAIN * dt;
    if (dashing) this.gap += DASH_GAP_BONUS * dt;
    if (this.gap < 70) {
      this.stompTimer -= dt;
      if (this.stompTimer <= 0) {
        this.sounds.stomp();
        this.stompTimer = 0.55;
      }
    }

    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.shakeTimer > 0) this.shakeTimer -= dt;

    // Collisions with whatever shares the turkey's lane.
    const hits = this.world.collisions(this.lane, this.laneY);
    for (const hit of hits) {
      if (hit.dead) continue;
      if (hit.isCorn) {
        hit.dead = true;
        this.cornEaten++;
        this.gap = Math.min(320, this.gap + CORN_GAP_BONUS);
        this.sounds.pickup();
      } else if (hit.isHazard && this.invulnTimer <= 0 && !dashing) {
        hit.dead = true;
        this.lives--;
        this.gap -= HIT_GAP_PENALTY;
        this.invulnTimer = INVULN_TIME;
        this.shakeTimer = 0.4;
        this.sounds.hit();
        if (this.lives <= 0 || this.gap <= 0) {
          this.endRun(false);
          this.input.endFrame();
          return;
        }
      }
    }
    if (this.gap <= 0) {
      this.endRun(false);
      this.input.endFrame();
      return;
    }

    // The forest gate means freedom.
    if (this.world.gateReached() || this.metres >= ESCAPE_DISTANCE_M) {
      this.endRun(true);
      this.input.endFrame();
      return;
    }

    if (this.input.consume('KeyM')) this.sounds.toggleMute();
    if (this.input.consume('KeyP')) this.state = 'paused';
    this.input.endFrame();
  }

  // ---------------------------------------------------------------- drawing

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    ctx.save();
    if (this.shakeTimer > 0) {
      ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 8);
    }

    drawSky(ctx, this.stage);
    // The barn stands at the start of the run and scrolls away behind the turkey.
    const barnX = 1080 - this.scroll * 0.25;
    if (barnX > -220 && this.stage === 0 && this.state !== 'title') drawBarn(ctx, barnX, GROUND_Y, 1);
    drawGround(ctx, this.scroll, this.stage);
    drawLaneGuides(ctx);

    // World entities, back lane first so nearer ones overlap.
    const sorted = [...this.world.entities].sort((a, b) => a.lane - b.lane);
    for (const entity of sorted) {
      if (entity.type === 'oven') drawOven(ctx, entity.x, entity.feetY, this.time);
      else if (entity.type === 'knife') drawKnife(ctx, entity.x, entity.feetY - 6, this.time);
      else if (entity.type === 'hay') drawHayBale(ctx, entity.x, entity.feetY);
      else if (entity.type === 'corn') drawCorn(ctx, entity.x, entity.feetY - 46, this.time);
      else if (entity.type === 'pumpkin') drawPumpkin(ctx, entity.x, entity.feetY, this.time);
      else if (entity.type === 'gate') drawForestGate(ctx, entity.x, entity.feetY, this.time);
    }

    // The farmer, always behind the turkey, closer when the gap is small.
    // On the title screen the posed pair in drawTitle stands in for him.
    // On the caught screen he stands beside the turkey he just caught.
    if (this.state !== 'title') {
      const farmerX = this.state === 'caught' ? TURKEY_X - 140 : TURKEY_X - this.gap;
      if (farmerX > -120) {
        drawFarmer(ctx, farmerX, this.laneY, this.time, { standing: this.state === 'caught' });
      }
    }

    // The turkey, blinking while invulnerable after a hit.
    const blink = this.invulnTimer > 0 && Math.floor(this.time * 12) % 2 === 0;
    if (!blink && this.state !== 'title') {
      drawTurkey(ctx, TURKEY_X, this.laneY, this.time, {
        dashing: this.dashTimer > 0,
        dizzy: this.state === 'caught',
      });
    }

    ctx.restore();

    if (this.state === 'playing' || this.state === 'paused') this.drawHud(ctx);
    if (this.state === 'title') this.drawTitle(ctx);
    if (this.state === 'caught') this.drawCaught(ctx);
    if (this.state === 'escaped') this.drawEscaped(ctx);
    if (this.state === 'paused') {
      ctx.fillStyle = 'rgba(20, 8, 24, 0.55)';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      outlinedText(ctx, 'PAUSED', VIEW_W / 2, VIEW_H / 2 - 20, 64, PALETTE.hudText);
      outlinedText(ctx, 'Press P or click to keep running', VIEW_W / 2, VIEW_H / 2 + 40, 24, '#ffffff');
    }
  }

  drawHud(ctx) {
    // Top bar.
    ctx.fillStyle = PALETTE.hudBg;
    roundRect(ctx, 16, 12, VIEW_W - 32, 74, 12);
    ctx.fill();

    // Score.
    outlinedText(ctx, 'SCORE', 44, 34, 16, '#c9a86a', 'left');
    outlinedText(ctx, String(this.score), 44, 62, 30, PALETTE.hudText, 'left');

    // Distance and the road to freedom.
    const distText = `${Math.floor(this.metres)} m / ${ESCAPE_DISTANCE_M} m`;
    outlinedText(ctx, 'DISTANCE', 330, 34, 16, '#c9a86a', 'left');
    outlinedText(ctx, distText, 330, 62, 30, PALETTE.hudText, 'left');
    const barX = 560;
    const barW = 300;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    roundRect(ctx, barX, 44, barW, 16, 8);
    ctx.fill();
    ctx.fillStyle = '#8dff6a';
    const filled = Math.min(1, this.metres / ESCAPE_DISTANCE_M) * barW;
    if (filled > 4) {
      roundRect(ctx, barX, 44, filled, 16, 8);
      ctx.fill();
    }
    outlinedText(ctx, STAGE_NAMES[this.stage], barX + barW / 2, 78, 13, '#ffe9b0');

    // Lives, as little turkey hearts.
    outlinedText(ctx, 'LIVES', 900, 34, 16, '#c9a86a', 'left');
    for (let i = 0; i < START_LIVES; i++) {
      const hx = 920 + i * 34;
      const hy = 60;
      ctx.font = "28px 'Trebuchet MS', Verdana, sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(30, 8, 20, 0.9)';
      ctx.strokeText('♥', hx, hy);
      ctx.fillStyle = i < this.lives ? '#ff5a4e' : 'rgba(255, 255, 255, 0.25)';
      ctx.fillText('♥', hx, hy);
    }

    // How far behind the farmer is: the run's real pressure gauge.
    const gapM = Math.max(0, Math.round(this.gap / 12));
    const danger = this.gap < 70;
    outlinedText(ctx, 'FARMER', 1060, 34, 16, '#c9a86a', 'left');
    outlinedText(
      ctx,
      danger ? `⚠ ${gapM} m BEHIND!` : `${gapM} m behind`,
      1060,
      62,
      24,
      danger ? PALETTE.hudBad : PALETTE.hudGood,
      'left',
    );

    // Dash readiness, bottom left.
    const dashReady = this.dashCooldown <= 0;
    ctx.fillStyle = PALETTE.hudBg;
    roundRect(ctx, 16, VIEW_H - 52, 250, 36, 10);
    ctx.fill();
    outlinedText(
      ctx,
      dashReady ? 'SPACE — DASH READY!' : 'DASH recharging…',
      28,
      VIEW_H - 34,
      18,
      dashReady ? PALETTE.hudGood : '#c9a86a',
      'left',
    );
    if (!dashReady) {
      const w = 200 * (1 - this.dashCooldown / DASH_COOLDOWN);
      ctx.fillStyle = '#8dff6a';
      roundRect(ctx, 216, VIEW_H - 44, Math.max(0, w), 8, 4);
      ctx.fill();
    }
    outlinedText(ctx, 'M — mute · P — pause', VIEW_W - 28, VIEW_H - 34, 15, 'rgba(255, 233, 176, 0.75)', 'right');
  }

  drawTitle(ctx) {
    ctx.fillStyle = 'rgba(20, 8, 24, 0.45)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // The turkey and the farmer, face to face under the title.
    drawTurkey(ctx, 300, 612, this.time, {});
    drawFarmer(ctx, 980, 612, this.time, { standing: true });
    outlinedText(ctx, 'GOBBLE DASH', VIEW_W / 2, 150, 92, '#ffd76a');
    outlinedText(ctx, 'THE GREAT TURKEY ESCAPE', VIEW_W / 2, 220, 34, '#ffe9b0');
    outlinedText(ctx, 'Thanksgiving is coming. The farmer is coming faster.', VIEW_W / 2, 268, 24, '#ffffff');
    outlinedText(ctx, 'Dodge the oven. Dodge the carving knife. Eat the corn.', VIEW_W / 2, 300, 24, '#ffffff');
    outlinedText(ctx, 'Reach the forest gate 1000 m away — and live to gobble again.', VIEW_W / 2, 332, 24, '#ffffff');
    outlinedText(ctx, '↑ ↓ or W S — switch lanes      SPACE — dash      M — mute', VIEW_W / 2, 400, 22, '#ffe9b0');
    const pulse = 0.7 + Math.sin(this.time * 4) * 0.3;
    ctx.globalAlpha = pulse;
    outlinedText(ctx, 'PRESS ENTER OR CLICK TO RUN', VIEW_W / 2, 462, 30, PALETTE.hudGood);
    ctx.globalAlpha = 1;
    if (this.best > 0) {
      outlinedText(ctx, `Best score: ${this.best}`, VIEW_W / 2, 510, 20, '#c9a86a');
    }
    outlinedText(ctx, 'A 100% original game — no turkeys were harmed (yet)', VIEW_W / 2, 690, 16, 'rgba(255, 233, 176, 0.6)');
  }

  drawCaught(ctx) {
    ctx.fillStyle = 'rgba(60, 8, 8, 0.42)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    outlinedText(ctx, 'CAUGHT!', VIEW_W / 2, 150, 96, '#ff5a4e');
    outlinedText(ctx, 'The farmer got you. Dinner is served…', VIEW_W / 2, 230, 30, '#ffffff');
    outlinedText(ctx, '…but a turkey never stops running. Try again!', VIEW_W / 2, 268, 24, '#ffe9b0');
    outlinedText(ctx, `SCORE  ${this.score}`, VIEW_W / 2, 340, 34, PALETTE.hudText);
    outlinedText(ctx, `DISTANCE  ${Math.floor(this.metres)} m  ·  CORN  ${this.cornEaten}`, VIEW_W / 2, 384, 24, '#ffffff');
    if (this.score >= this.best && this.score > 0) {
      outlinedText(ctx, '★ NEW BEST SCORE ★', VIEW_W / 2, 424, 24, '#ffd76a');
    }
    const pulse = 0.7 + Math.sin(this.time * 4) * 0.3;
    ctx.globalAlpha = pulse;
    outlinedText(ctx, 'PRESS ENTER OR CLICK TO RUN AGAIN', VIEW_W / 2, 500, 28, PALETTE.hudGood);
    ctx.globalAlpha = 1;
  }

  drawEscaped(ctx) {
    ctx.fillStyle = 'rgba(8, 40, 16, 0.32)';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    outlinedText(ctx, 'ESCAPED!', VIEW_W / 2, 150, 96, '#8dff6a');
    outlinedText(ctx, 'You reached the forest gate. Freedom tastes sweet —', VIEW_W / 2, 230, 30, '#ffffff');
    outlinedText(ctx, 'and there is no oven tonight. Gobble on, free turkey!', VIEW_W / 2, 268, 24, '#ffe9b0');
    outlinedText(ctx, `SCORE  ${this.score}`, VIEW_W / 2, 340, 34, PALETTE.hudText);
    outlinedText(ctx, `DISTANCE  ${Math.floor(this.metres)} m  ·  CORN  ${this.cornEaten}`, VIEW_W / 2, 384, 24, '#ffffff');
    if (this.score >= this.best && this.score > 0) {
      outlinedText(ctx, '★ NEW BEST SCORE ★', VIEW_W / 2, 424, 24, '#ffd76a');
    }
    const pulse = 0.7 + Math.sin(this.time * 4) * 0.3;
    ctx.globalAlpha = pulse;
    outlinedText(ctx, 'PRESS ENTER OR CLICK TO RUN AGAIN', VIEW_W / 2, 500, 28, PALETTE.hudGood);
    ctx.globalAlpha = 1;
  }
}
