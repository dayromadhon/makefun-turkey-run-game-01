// GOBBLE DASH — The Great Turkey Escape.
// Tuning and world constants. One place for every number the game balances on,
// so a play-test can retune the run without hunting through the other files.

export const VIEW_W = 1280;
export const VIEW_H = 720;

// The three running lanes, given by the y of the turkey's feet in each lane.
export const LANE_Y = [452, 540, 628];
export const GROUND_Y = 660;
export const TURKEY_X = 250;

export const ESCAPE_DISTANCE_M = 1000; // reach the forest gate and you are free
export const START_LIVES = 3;
export const START_GAP_PX = 150; // how far behind the turkey the farmer starts

export const BASE_SPEED = 275; // world scroll, px/s, at distance 0
export const SPEED_PER_M = 0.24; // extra px/s per metre already run
export const MAX_SPEED = 565;

export const GAP_DRAIN = 2.4; // px/s the farmer closes in all on his own
export const CORN_GAP_BONUS = 8; // px the farmer falls back per corn eaten
export const DASH_GAP_BONUS = 30; // px/s the farmer falls back while dashing
export const HIT_GAP_PENALTY = 58; // px the farmer lunges forward on a hit

export const CORN_SCORE = 50;
export const METRE_SCORE = 10; // points per metre run
export const DASH_TIME = 0.55; // seconds of dash
export const DASH_COOLDOWN = 2.4; // seconds before the next dash
export const INVULN_TIME = 1.5; // seconds of mercy after a hit

export const SPAWN_EVERY_S = 0.95; // seconds between spawn clusters
export const SPAWN_MIN_GAP_PX = 320; // minimum px between hazard clusters

// How the run changes as the turkey nears the kitchen: stage 0 is the farmyard,
// stage 1 the farmhouse yard, stage 2 the kitchen approach.
export const STAGE_CUTS_M = [0, 320, 680];

export const PALETTE = {
  skyTop: '#2e1a4e',
  skyMid: '#b83a5e',
  skyLow: '#ff9a3d',
  sun: '#ffd76a',
  hillFar: '#7a3b5e',
  hillNear: '#4d2a4a',
  ground: '#8a5a2b',
  groundTop: '#c98a3d',
  grass: '#7da23c',
  fence: '#6b4423',
  barnRed: '#a83232',
  barnRoof: '#5e2626',
  turkeyBody: '#8a5a2b',
  turkeyBelly: '#c98a3d',
  turkeyHead: '#d97b4f',
  wattle: '#e23b3b',
  featherA: '#e07b39',
  featherB: '#c94f2e',
  featherC: '#8a5a2b',
  farmerShirt: '#c0392b',
  farmerOveralls: '#2e5d8a',
  farmerSkin: '#f0c08a',
  farmerHat: '#d9b64a',
  ovenBody: '#5a5a66',
  ovenGlow: '#ff7a1a',
  knifeBlade: '#dfe6ee',
  knifeHandle: '#3a2a1a',
  corn: '#ffd23e',
  cornHusk: '#5da23c',
  hudBg: 'rgba(20, 8, 24, 0.72)',
  hudText: '#ffe9b0',
  hudGood: '#8dff6a',
  hudBad: '#ff5a4e',
};
