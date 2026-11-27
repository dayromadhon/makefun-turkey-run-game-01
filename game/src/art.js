// GOBBLE DASH — every picture the game shows, drawn with canvas paths.
// No image files: the turkey, the farmer, the oven, the knife and the farm
// are all drawn here, so the game ships as code alone.

import { GROUND_Y, LANE_Y, PALETTE, VIEW_H, VIEW_W } from './config.js';

// ---------------------------------------------------------------- helpers

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

export function outlinedText(ctx, text, x, y, size, color, align = 'center') {
  ctx.font = `bold ${size}px 'Trebuchet MS', Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, size / 7);
  ctx.strokeStyle = 'rgba(30, 8, 20, 0.9)';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// ---------------------------------------------------------------- scenery

export function drawSky(ctx, stage) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, PALETTE.skyTop);
  g.addColorStop(0.55, PALETTE.skyMid);
  g.addColorStop(0.82, PALETTE.skyLow);
  g.addColorStop(1, '#3a1c33');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Low autumn sun.
  const sunX = 1060;
  const sunY = 150;
  const glow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 130);
  glow.addColorStop(0, 'rgba(255, 215, 106, 0.95)');
  glow.addColorStop(0.4, 'rgba(255, 160, 80, 0.45)');
  glow.addColorStop(1, 'rgba(255, 160, 80, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(sunX - 140, sunY - 140, 280, 280);
  ellipse(ctx, sunX, sunY, 46, 46, PALETTE.sun);

  // A few drifting clouds.
  ctx.fillStyle = 'rgba(255, 220, 200, 0.5)';
  for (const [cx, cy, s] of [[180, 110, 1], [520, 70, 0.7], [860, 190, 0.85]]) {
    ellipse(ctx, cx, cy, 52 * s, 16 * s, 'rgba(255, 220, 200, 0.5)');
    ellipse(ctx, cx + 34 * s, cy + 6, 36 * s, 13 * s, 'rgba(255, 220, 200, 0.5)');
  }

  // Distant hills, darker as the run leaves the farmyard for the kitchen.
  ctx.fillStyle = stage === 2 ? '#3d1f3d' : PALETTE.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, 470);
  ctx.quadraticCurveTo(320, 380, 640, 460);
  ctx.quadraticCurveTo(960, 530, 1280, 440);
  ctx.lineTo(1280, VIEW_H);
  ctx.lineTo(0, VIEW_H);
  ctx.closePath();
  ctx.fill();
}

export function drawBarn(ctx, x, y, scale) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = PALETTE.barnRed;
  ctx.fillRect(-70, -90, 140, 90);
  ctx.fillStyle = PALETTE.barnRoof;
  ctx.beginPath();
  ctx.moveTo(-82, -88);
  ctx.lineTo(0, -150);
  ctx.lineTo(82, -88);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f5e6c8';
  ctx.fillRect(-22, -58, 44, 58);
  ctx.strokeStyle = '#5e2626';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-22, -58);
  ctx.lineTo(22, 0);
  ctx.moveTo(22, -58);
  ctx.lineTo(-22, 0);
  ctx.stroke();
  ctx.fillStyle = '#ffe9b0';
  ctx.fillRect(-58, -72, 22, 18);
  ctx.fillRect(36, -72, 22, 18);
  ctx.restore();
}

export function drawGround(ctx, scroll, stage) {
  // Dirt ground with a grassy top edge.
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
  ctx.fillStyle = PALETTE.groundTop;
  ctx.fillRect(0, GROUND_Y, VIEW_W, 10);
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(0, GROUND_Y - 6, VIEW_W, 8);

  // Rolling fence posts along the back of the yard.
  ctx.fillStyle = PALETTE.fence;
  const spacing = 130;
  const offset = -(scroll % spacing);
  for (let x = offset; x < VIEW_W + spacing; x += spacing) {
    ctx.fillRect(x, GROUND_Y - 62, 10, 62);
    ctx.beginPath();
    ctx.moveTo(x - 2, GROUND_Y - 62);
    ctx.lineTo(x + 5, GROUND_Y - 74);
    ctx.lineTo(x + 12, GROUND_Y - 62);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillRect(0, GROUND_Y - 52, VIEW_W, 7);
  ctx.fillRect(0, GROUND_Y - 30, VIEW_W, 7);

  // Pebbles and tufts that scroll past, so the ground reads as moving.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  for (let i = 0; i < 26; i++) {
    const px = ((i * 173 - scroll * 1.0) % (VIEW_W + 40) + VIEW_W + 40) % (VIEW_W + 40) - 20;
    const py = GROUND_Y + 18 + ((i * 47) % 44);
    ellipse(ctx, px, py, 5, 3, 'rgba(0, 0, 0, 0.25)');
  }
  void stage;
}

export function drawHayBale(ctx, x, feetY) {
  ctx.fillStyle = '#d9a83c';
  ctx.beginPath();
  ctx.ellipse(x, feetY - 26, 42, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a67c1e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, feetY - 26, 30, 18, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, feetY - 26, 16, 9, 0, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawPumpkin(ctx, x, feetY, t) {
  const bob = Math.sin(t * 2 + x * 0.01) * 1.5;
  ctx.fillStyle = '#e0701f';
  ellipse(ctx, x, feetY - 16 + bob, 22, 17, '#e0701f');
  ctx.strokeStyle = '#b34d0d';
  ctx.lineWidth = 2;
  for (const dx of [-10, 0, 10]) {
    ctx.beginPath();
    ctx.ellipse(x + dx, feetY - 16 + bob, 6, 16, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#3f7a2a';
  ctx.fillRect(x - 2, feetY - 38 + bob, 5, 8);
}

// The forest gate: the finish line. A wooden arch draped in autumn leaves.
export function drawForestGate(ctx, x, feetY, t) {
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(x - 70, feetY - 210, 18, 210);
  ctx.fillRect(x + 52, feetY - 210, 18, 210);
  // A warm wooden arch with a golden trim, so it reads against the dusk sky.
  ctx.fillStyle = '#8a5a30';
  ctx.beginPath();
  ctx.arc(x, feetY - 210, 78, Math.PI, 0);
  ctx.lineTo(x + 78, feetY - 178);
  ctx.lineTo(x - 78, feetY - 178);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(x, feetY - 210, 78, Math.PI, 0);
  ctx.stroke();
  const sway = Math.sin(t * 1.4) * 4;
  for (const [lx, ly, c] of [
    [-58, -196, '#ff9a3d'], [-20, -222, '#ff5a4e'], [24, -218, '#ffd23e'],
    [58, -192, '#e07b39'], [0, -190, '#ff5a4e'], [-38, -176, '#ffd23e'],
  ]) {
    ellipse(ctx, x + lx + sway, feetY + ly, 14, 9, c);
  }
  outlinedText(ctx, 'FREEDOM', x, feetY - 130, 26, '#ffe9b0');
}

// ---------------------------------------------------------------- the turkey

export function drawTurkey(ctx, x, feetY, t, opts = {}) {
  const { dashing = false, dizzy = false, scale = 1 } = opts;
  const run = Math.sin(t * 14);
  const lean = dashing ? 0.35 : 0.08;
  ctx.save();
  ctx.translate(x, feetY);
  ctx.scale(scale, scale);
  ctx.rotate(lean);

  // Legs, pumping while running.
  ctx.strokeStyle = '#e08a3c';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const legSwing = dizzy ? 0 : run * 10;
  ctx.beginPath();
  ctx.moveTo(-6, -26);
  ctx.lineTo(-6 + legSwing, 0);
  ctx.moveTo(8, -26);
  ctx.lineTo(8 - legSwing, 0);
  ctx.stroke();

  // Tail feathers, fanned behind.
  const featherColors = [PALETTE.featherA, PALETTE.featherB, PALETTE.featherC, PALETTE.featherB, PALETTE.featherA];
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i - 2) * 0.42;
    const fx = -26 + Math.cos(angle) * 30;
    const fy = -52 + Math.sin(angle) * 30;
    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(angle + Math.PI / 2);
    ellipse(ctx, 0, 0, 11, 24, featherColors[i]);
    ellipse(ctx, 0, -8, 5, 10, '#ffe9b0');
    ctx.restore();
  }

  // Body and belly.
  ellipse(ctx, 0, -46, 34, 28, PALETTE.turkeyBody);
  ellipse(ctx, 6, -40, 24, 18, PALETTE.turkeyBelly);

  // Wing, tucked while running, flapping while dashing.
  const wingFlap = dashing ? Math.sin(t * 26) * 8 : run * 2;
  ctx.save();
  ctx.translate(-4, -48);
  ctx.rotate(-0.5 + wingFlap * 0.05);
  ellipse(ctx, 0, 0, 20, 11, '#6b4423');
  ctx.restore();

  // Neck and head.
  ctx.fillStyle = PALETTE.turkeyHead;
  ctx.beginPath();
  ctx.moveTo(22, -62);
  ctx.quadraticCurveTo(34, -88, 40, -96);
  ctx.quadraticCurveTo(48, -88, 44, -72);
  ctx.lineTo(36, -58);
  ctx.closePath();
  ctx.fill();
  ellipse(ctx, 42, -96, 15, 14, PALETTE.turkeyHead);

  // Beak.
  ctx.fillStyle = '#f2a541';
  ctx.beginPath();
  ctx.moveTo(54, -100);
  ctx.lineTo(70, -94);
  ctx.lineTo(54, -89);
  ctx.closePath();
  ctx.fill();

  // Wattle.
  ctx.fillStyle = PALETTE.wattle;
  ctx.beginPath();
  ctx.ellipse(50, -84, 5, 9, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eye: bright and alert, or dizzy X when caught.
  if (dizzy) {
    ctx.strokeStyle = '#1c0f16';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(38, -104);
    ctx.lineTo(48, -94);
    ctx.moveTo(48, -104);
    ctx.lineTo(38, -94);
    ctx.stroke();
  } else {
    ellipse(ctx, 44, -99, 3.4, 3.4, '#1c0f16');
    ellipse(ctx, 45, -100, 1.2, 1.2, '#ffffff');
  }

  ctx.restore();
}

// ---------------------------------------------------------------- the farmer

export function drawFarmer(ctx, x, feetY, t, opts = {}) {
  const { standing = false } = opts;
  const run = Math.sin(t * 13);
  const legSwing = standing ? 0 : run * 12;
  ctx.save();
  ctx.translate(x, feetY);

  // Legs in blue overalls.
  ctx.strokeStyle = PALETTE.farmerOveralls;
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -58);
  ctx.lineTo(-8 + legSwing, -2);
  ctx.moveTo(10, -58);
  ctx.lineTo(10 - legSwing, -2);
  ctx.stroke();

  // Big red-shirted body.
  ellipse(ctx, 0, -92, 40, 36, PALETTE.farmerShirt);
  // Overall straps.
  ctx.fillStyle = PALETTE.farmerOveralls;
  ctx.fillRect(-16, -128, 9, 34);
  ctx.fillRect(7, -128, 9, 34);
  ctx.fillRect(-16, -100, 32, 8);

  // Arms pumping as he runs.
  ctx.strokeStyle = PALETTE.farmerShirt;
  ctx.lineWidth = 12;
  const armSwing = standing ? 4 : run * 10;
  ctx.beginPath();
  ctx.moveTo(-34, -108);
  ctx.lineTo(-52, -78 + armSwing);
  ctx.moveTo(34, -108);
  ctx.lineTo(52, -78 - armSwing);
  ctx.stroke();
  // Hands.
  ellipse(ctx, -52, -78 + armSwing, 7, 7, PALETTE.farmerSkin);
  ellipse(ctx, 52, -78 - armSwing, 7, 7, PALETTE.farmerSkin);

  // Head, angry and red-cheeked.
  ellipse(ctx, 0, -148, 24, 24, PALETTE.farmerSkin);
  // Straw hat.
  ctx.fillStyle = PALETTE.farmerHat;
  ellipse(ctx, 0, -164, 34, 9, PALETTE.farmerHat);
  ctx.beginPath();
  ctx.ellipse(0, -172, 20, 12, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#8a6d2a';
  ctx.fillRect(-20, -168, 40, 5);
  // Angry brows, moustache, open shouting mouth.
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-14, -156);
  ctx.lineTo(-4, -151);
  ctx.moveTo(14, -156);
  ctx.lineTo(4, -151);
  ctx.stroke();
  ellipse(ctx, -12, -144, 3, 3, '#1c0f16');
  ellipse(ctx, 12, -144, 3, 3, '#1c0f16');
  ctx.fillStyle = '#7a5a2a';
  ctx.fillRect(-12, -138, 24, 6);
  ctx.fillStyle = '#5a1a1a';
  ellipse(ctx, 0, -128, 7, 5, '#5a1a1a');

  ctx.restore();
}

// ---------------------------------------------------------------- hazards

export function drawOven(ctx, x, feetY, t) {
  ctx.save();
  ctx.translate(x, feetY);
  // Heat waves shimmering above the oven.
  ctx.strokeStyle = 'rgba(255, 150, 60, 0.65)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    const wx = -30 + i * 30;
    const wob = Math.sin(t * 5 + i * 2) * 5;
    ctx.beginPath();
    ctx.moveTo(wx + wob, -150);
    ctx.quadraticCurveTo(wx - wob, -168, wx + wob, -186);
    ctx.stroke();
  }
  // Body.
  ctx.fillStyle = PALETTE.ovenBody;
  roundRect(ctx, -52, -150, 104, 150, 8);
  ctx.fill();
  ctx.fillStyle = '#3a3a44';
  roundRect(ctx, -44, -142, 88, 26, 5);
  ctx.fill();
  // Glowing door window: dinner is cooking in there.
  const glowPulse = 0.75 + Math.sin(t * 3) * 0.25;
  ctx.fillStyle = `rgba(255, 122, 26, ${glowPulse})`;
  roundRect(ctx, -36, -104, 72, 62, 6);
  ctx.fill();
  ctx.strokeStyle = '#2a2a32';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = 'rgba(60, 10, 10, 0.85)';
  ctx.fillRect(-30, -92, 60, 8);
  ctx.fillRect(-30, -70, 60, 8);
  // Knobs and a very hot warning.
  ctx.fillStyle = '#dfe6ee';
  for (let i = 0; i < 3; i++) ellipse(ctx, -24 + i * 24, -128, 6, 6, '#dfe6ee');
  outlinedText(ctx, 'HOT!', 0, -52, 20, '#ffd76a');
  // Chimney with smoke.
  ctx.fillStyle = '#3a3a44';
  ctx.fillRect(28, -186, 20, 40);
  ctx.fillStyle = 'rgba(230, 230, 230, 0.5)';
  for (let i = 0; i < 3; i++) {
    const sy = -196 - i * 16 - ((t * 22 + i * 30) % 48);
    ellipse(ctx, 38 + Math.sin(t * 2 + i) * 6, sy, 9 - i * 2, 7 - i, 'rgba(230, 230, 230, 0.45)');
  }
  ctx.restore();
}

export function drawKnife(ctx, x, feetY, t) {
  ctx.save();
  ctx.translate(x, feetY);
  ctx.rotate(-0.16 + Math.sin(t * 2.2) * 0.03);
  // Handle.
  ctx.fillStyle = PALETTE.knifeHandle;
  roundRect(ctx, -58, -12, 42, 16, 6);
  ctx.fill();
  ctx.fillStyle = '#c9a86a';
  for (let i = 0; i < 3; i++) ellipse(ctx, -48 + i * 12, -4, 2.5, 2.5, '#c9a86a');
  // Blade, glinting.
  const glint = ctx.createLinearGradient(-16, -16, 62, 4);
  glint.addColorStop(0, PALETTE.knifeBlade);
  glint.addColorStop(0.55, '#ffffff');
  glint.addColorStop(1, '#9fb0c3');
  ctx.fillStyle = glint;
  ctx.beginPath();
  ctx.moveTo(-16, -16);
  ctx.lineTo(58, -8);
  ctx.lineTo(66, -4);
  ctx.lineTo(58, 2);
  ctx.lineTo(-16, 6);
  ctx.closePath();
  ctx.fill();
  // A sharp glint that sweeps along the blade.
  const sweep = ((t * 90) % 70) - 10;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sweep, -14);
  ctx.lineTo(sweep + 8, 2);
  ctx.stroke();
  ctx.restore();
}

export function drawCorn(ctx, x, y, t) {
  const bob = Math.sin(t * 3 + x * 0.02) * 4;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(-0.5);
  // Husk leaves.
  ctx.fillStyle = PALETTE.cornHusk;
  ctx.beginPath();
  ctx.moveTo(-8, 14);
  ctx.quadraticCurveTo(-26, 4, -18, -14);
  ctx.quadraticCurveTo(-6, -6, -4, 8);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, 14);
  ctx.quadraticCurveTo(26, 4, 18, -14);
  ctx.quadraticCurveTo(6, -6, 4, 8);
  ctx.closePath();
  ctx.fill();
  // The cob.
  ctx.fillStyle = PALETTE.corn;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8a91c';
  for (let row = -2; row <= 2; row++) {
    for (let col = -1; col <= 1; col++) {
      ellipse(ctx, col * 6, row * 7, 2.2, 2.2, '#e8a91c');
    }
  }
  ctx.restore();
}

// Lane guide dots, faint, so the player reads the three lanes at a glance.
export function drawLaneGuides(ctx) {
  ctx.fillStyle = 'rgba(255, 233, 176, 0.16)';
  for (const y of LANE_Y) {
    for (let x = 20; x < VIEW_W; x += 46) {
      ellipse(ctx, x, y + 4, 4, 2.5, 'rgba(255, 233, 176, 0.16)');
    }
  }
}
