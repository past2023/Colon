/* =====================================================================
   LA AVENTURA DE COLÓN
   Juego de plataformas 2D pixel-art sobre la vida de Cristóbal Colón.
   Sin dependencias: canvas + WebAudio. Funciona abriendo index.html.
   ===================================================================== */
'use strict';

/* ============================ UTILIDADES ============================ */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const TILE = 16, VIEW_W = 512, VIEW_H = 288;
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
};

/* ---------------- Fábrica de sprites pixel-art ---------------- */
function makeSprite(rows, palette) {
  const h = rows.length;
  const w = Math.max(...rows.map(r => r.length));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  for (let j = 0; j < h; j++) {
    const row = rows[j];
    for (let i = 0; i < row.length; i++) {
      const col = palette[row[i]];
      if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); }
    }
  }
  return c;
}
function spriteURL(spr, scale) {
  const c = document.createElement('canvas');
  c.width = spr.width * scale; c.height = spr.height * scale;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.drawImage(spr, 0, 0, c.width, c.height);
  return c.toDataURL();
}
function tintSprite(spr, color) {
  const c = document.createElement('canvas');
  c.width = spr.width; c.height = spr.height;
  const x = c.getContext('2d');
  x.drawImage(spr, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  return c;
}

/* ============================ SPRITES ============================ */
const PAL = {
  h: '#6b3f1d', s: '#f2c187', c: '#b8322e', k: '#7e1f1c', p: '#2e4a8f',
  b: '#4a2c14', w: '#f5efe0', d: '#1c1c1c',
  g: '#9a9a9a', e: '#e0455a', v: '#6b2fa0', V: '#4a1f75',
  W: '#b9c4d8', n: '#35405c', Y: '#ffd23e', t: '#d8a0a8'
};

/* --- Colón con sombrero (16x16, mirando a la derecha) --- */
const BODY = [
  "....dddd........",
  "...dkkkkd.......",
  "..dkkkkkkd......",
  "..dhhhhhhhd.....",
  "..dssssssssd....",
  "..dssdsdsssd....",
  "..dssssssssd....",
  "..dsssddsssd....",
  "...dssssssd.....",
  "..dcdcwccwcd....",
  "..dccYccYccd....",
  ".ddccccccccdd...",
  "..dppppppppd...."
];
const LEGS_IDLE = [
  "..dppd..dppd....",
  "..dppd..dppd....",
  ".ddddd..ddddd..."
];
const LEGS_RUN1 = [
  "..dppd....dppd..",
  ".dppd......dppd.",
  "ddddd......ddddd"
];
const LEGS_JUMP = [
  "..dppd..dppd....",
  ".dddd....dddd...",
  "................"
];
const SPR_PLAYER_IDLE = makeSprite(BODY.concat(LEGS_IDLE), PAL);
const SPR_PLAYER_RUN1 = makeSprite(BODY.concat(LEGS_RUN1), PAL);
const SPR_PLAYER_RUN2 = makeSprite(BODY.concat(LEGS_RUN1.map(r => r.split('').reverse().join(''))), PAL);
const SPR_PLAYER_JUMP = makeSprite(BODY.concat(LEGS_JUMP), PAL);

/* --- Rata del puerto con cola y orejas (16x12) --- */
const SPR_RAT = makeSprite([
  "................",
  "................",
  "................",
  "................",
  ".....dd.........",
  "....dgedd.......",
  "...dgggggdd.....",
  "..dgggggdggdd...",
  ".dgggdgggggggd..",
  ".dtggggggggggd..",
  "..dddddddddd....",
  "...d.d..d.d....."
], PAL);

/* --- Cortesano envidioso con gorguera (12x16) --- */
const SPR_COURT = makeSprite([
  "....dddd........",
  "...dhhhhhd......",
  "..dhhhhhhhd.....",
  "..dssssssssd....",
  "..dsdddsddsd....",
  "..dssssssssd....",
  "..dssddddssd....",
  "...dwwwwwd......",
  "..dwwwwwwwd.....",
  "..dvvvvvvvd.....",
  ".ddvvvvvvvdd....",
  ".ddvvVvvVvdd....",
  "..dvvvvvvvd.....",
  "..dvvvvvvvd.....",
  ".dvvvvvvvvvd....",
  ".ddddddddddd...."
], PAL);

/* --- Nube de tormenta (14x10) --- */
const SPR_CLOUD = makeSprite([
  "................",
  "................",
  ".....dddd.......",
  "...ddWWWWdd.....",
  "..dWWWWWWWWd....",
  ".dWWWWWWWWWWd...",
  ".dWddWWWWddWd...",
  ".dWWWWWWWWWWd...",
  "..dddddddddd....",
  "...n..n..n......",
  "................",
  "................"
], PAL);

/* --- Moneda (maravedí) 8x8 --- */
const SPR_COIN = makeSprite([
  ".dddddd.",
  "dYYYYYYd",
  "dYWddWYd",
  "dYWdWWYd",
  "dYWdWWYd",
  "dYWddWYd",
  "dYYYYYYd",
  ".dddddd."
], { d: '#8a5a10', Y: '#ffd23e', W: '#fff3b0' });

/* --- Página de bitácora 12x12 --- */
const SPR_SCROLL = makeSprite([
  "..dddddddd..",
  ".dppppppppd.",
  "dppppppppppd",
  "dppdppdppppd",
  "dppppppppppd",
  "dpppdppdpppd",
  "dpppRRRppppd",
  "dpppRRRppppd",
  "dppppppppppd",
  ".dppppppppd.",
  ".dd......dd.",
  "..dddddddd.."
], { d: '#7a5a20', p: '#f4e3b2', R: '#c0392b' });

/* --- Corazones --- */
const HEART_ROWS = [
  ".dd..dd.",
  "dRRddRRd",
  "dRRRRRRd",
  "dRRRRRRd",
  ".dRRRRd.",
  "..dRRd..",
  "...dd..."
];
const SPR_HEART = makeSprite(HEART_ROWS, { d: '#4a0d16', R: '#e0455a' });
const SPR_HEART_OFF = makeSprite(HEART_ROWS, { d: '#22263a', R: '#4a5068' });

/* --- Bandera de la expedición (cruz verde) --- */
const SPR_FLAG = makeSprite([
  "dddddddddd..",
  "dwwwwwwwwwd.",
  "dwwGGwwwwwd.",
  "dwwGGwwwwwd.",
  "dGGGGGGGwwd.",
  "dwwGGwwwwwd.",
  "dwwGGwwwwwd.",
  "dwwwwwwwwwd.",
  "dddddddddd.."
], { d: '#4a4a4a', w: '#f5efe0', G: '#2e8b57' });

/* --- Tejas / bloques (se generan por tema) --- */
function groundSprite(top, base, dark) {
  return makeSprite([
    "tttttttttttttttt",
    "tdtttttttdtttttt",
    "tttttdtttttttdtt",
    "bbdbbbdbbbdbbbdb",
    "bbbbdbbbdbbbdbbd",
    "bbdbbbdbbbdbbbdb",
    "bdbbbdbbbdbbbdbb",
    "bbdbbbdbbbdbbbdb",
    "bbbbdbbbdbbbdbbd",
    "bbdbbbdbbbdbbbdb",
    "bdbbbdbbbdbbbdbb",
    "bbdbbbdbbbdbbbdb",
    "bbbbdbbbdbbbdbbd",
    "bbdbbbdbbbdbbbdb",
    "bdbbbdbbbdbbbdbb",
    "bbbbbbbbbbbbbbbb"
  ], { t: top, b: base, d: dark });
}
function brickSprite(a, b) {
  return makeSprite([
    "AAAAAAAAAAAAAAAA",
    "AbbAbbAAbbAbbAbA",
    "AbbAbbAAbbAbbAbA",
    "AAAAAAAAAAAAAAAA",
    "AAbbAbbAbbAAbbAA",
    "AAbbAbbAbbAAbbAA",
    "AAAAAAAAAAAAAAAA",
    "AbbAbbAAbbAbbAbA",
    "AbbAbbAAbbAbbAbA",
    "AAAAAAAAAAAAAAAA",
    "AAbbAbbAbbAAbbAA",
    "AAbbAbbAbbAAbbAA",
    "AAAAAAAAAAAAAAAA",
    "AbbAbbAAbbAbbAbA",
    "AbbAbbAAbbAbbAbA",
    "AAAAAAAAAAAAAAAA"
  ], { A: b, b: a });
}
function woodSprite() {
  return makeSprite([
    "wwwwwwwwwwwwwwww",
    "wddwddwddwddwddw",
    "wwwwwwwwwwwwwwww",
    "dddddddddddddddd",
    "wwwwwwwwwwwwwwww",
    "wddwddwddwddwddw",
    "wwwwwwwwwwwwwwww",
    "dddddddddddddddd",
    "wwwwwwwwwwwwwwww",
    "wddwddwddwddwddw",
    "wwwwwwwwwwwwwwww",
    "dddddddddddddddd",
    "wwwwwwwwwwwwwwww",
    "wddwddwddwddwddw",
    "wwwwwwwwwwwwwwww",
    "dddddddddddddddd"
  ], { w: '#a06a34', d: '#5f3c1a' });
}
const SPR_QBLOCK = makeSprite([
  "dddddddddddddddd",
  "dGGGGGGGGGGGGGGd",
  "dGdGGGGGGGGGGdGd",
  "dGGGGddddGGGGGGd",
  "dGGGdGGGGdGGGGGd",
  "dGGGGGGGGdGGGGGd",
  "dGGGGGGddGGGGGGd",
  "dGGGGGGdGGGGGGGd",
  "dGGGGGGGGGGGGGGd",
  "dGGGGGGdGGGGGGGd",
  "dGGGGGGGGGGGGGGd",
  "dGdGGGGGGGGGGdGd",
  "dGGGGGGGGGGGGGGd",
  "dGGGGGGGGGGGGGGd",
  "dGGGGGGGGGGGGGGd",
  "dddddddddddddddd"
], { d: '#5c3a08', G: '#f2b32c' });
const SPR_XBLOCK = makeSprite([
  "dddddddddddddddd",
  "dPPPPPPPPPPPPPPd",
  "dPdPPPPPPPPPPdPd",
  "dPPPPddPPddPPPPd",
  "dPPPPPdPPdPPPPPd",
  "dPPPPPddddPPPPPd",
  "dPPPPPdPPdPPPPPd",
  "dPPPPddPPddPPPPd",
  "dPPPPPPPPPPPPPPd",
  "dPPPPPPPPPPPPPPd",
  "dPdPPPPPPPPPPdPd",
  "dPPPPPPPPPPPPPPd",
  "dPPPPPPPPPPPPPPd",
  "dPPPPPPPPPPPPPPd",
  "dPPPPPPPPPPPPPPd",
  "dddddddddddddddd"
], { d: '#4a2c05', P: '#e2b25a' });
const SPR_USED = makeSprite([
  "dddddddddddddddd",
  "dUUUUUUUUUUUUUUd",
  "dUdUUUUUUUUUUdUd",
  "dUUUUUUUUUUUUUUd",
  "dUUUUUUUUUUUUUUd",
  "dUUUUUUUUUUUUUUd",
  "dUUUUUUUUUUUUUUd",
  "dUUUUUUUUUUUUUUd",
  "dUUUUUUUUUUUUUUd",
  "dUUUUUUUUUUUUUUd",
  "dUUUUUUUUUUUUUUd",
  "dUUUUUUUUUUUUUUd",
  "dUUUUUUUUUUUUUUd",
  "dUdUUUUUUUUUUdUd",
  "dUUUUUUUUUUUUUUd",
  "dddddddddddddddd"
], { d: '#3d3527', U: '#9a8a6a' });
const SPR_POLE = makeSprite(["dY", "dY"], { d: '#5c3a08', Y: '#ffd23e' });
const SPR_BALL = makeSprite([
  ".dd.",
  "dYYd",
  "dYYd",
  ".dd."
], { d: '#5c3a08', Y: '#ffd23e' });
const SPR_CLOUD_BG = makeSprite([
  ".....wwww.......",
  "...wwwwwwww.....",
  "..wwwwwwwwww....",
  ".wwwwwwwwwwww...",
  "wwwwwwwwwwwwww.."
], { w: '#ffffff' });

const WATER_FRAMES = [
  makeSprite([
    "wwBwwBwwBwwBwwBw",
    "BBBBBBBBBBBBBBBB",
    "BBBbBBBBBbBBBBbB",
    "BBBBBBBBBBBBBBBB",
    "BbBBBBbBBBBBbBBB",
    "BBBBBBBBBBBBBBBB",
    "BBBbBBBBBbBBBBbB",
    "BBBBBBBBBBBBBBBB",
    "BBBBbBBBBbBBBBBB",
    "BBBBBBBBBBBBBBBB",
    "BbBBBBBbBBBBbBBB",
    "BBBBBBBBBBBBBBBB",
    "BBBbBBBBbBBBBbBB",
    "BBBBBBBBBBBBBBBB",
    "BbBBBBBbBBBBBbBB",
    "BBBBBBBBBBBBBBBB"
  ], { B: '#2878c8', b: '#5aa8e8', w: '#bfe6ff' }),
  makeSprite([
    "BwwBwwBwwBwwBwwB",
    "BBBBBBBBBBBBBBBB",
    "BbBBBBBbBBBBbBBB",
    "BBBBBBBBBBBBBBBB",
    "BBBbBBBBBbBBBBbB",
    "BBBBBBBBBBBBBBBB",
    "BBBBbBBBBbBBBBBB",
    "BBBBBBBBBBBBBBBB",
    "BBBbBBBBBbBBBBbB",
    "BBBBBBBBBBBBBBBB",
    "BbBBBBBbBBBBbBBB",
    "BBBBBBBBBBBBBBBB",
    "BBBBbBBBBbBBBBBB",
    "BBBBBBBBBBBBBBBB",
    "BBBbBBBBBbBBBBbB",
    "BBBBBBBBBBBBBBBB"
  ], { B: '#2878c8', b: '#5aa8e8', w: '#bfe6ff' })
];

/* ============================ AUDIO ============================ */
const AudioSys = {
  ctx: null, muted: false, musicTimer: null, step: 0,
  init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },
  tone(freq, dur, type, vol, slideTo, when) {
    if (!this.ctx || this.muted) return;
    const t = (when || this.ctx.currentTime);
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t + dur);
    g.gain.setValueAtTime(vol || 0.15, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + dur + 0.02);
  },
  sfx(name) {
    if (!this.ctx) return;
    const n = this.ctx.currentTime;
    switch (name) {
      case 'jump': this.tone(280, 0.18, 'square', 0.12, 620); break;
      case 'coin': this.tone(988, 0.07, 'square', 0.12); this.tone(1319, 0.22, 'square', 0.1, null, n + 0.06); break;
      case 'scroll':
        [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.11, 'triangle', 0.14, null, n + i * 0.07));
        break;
      case 'stomp': this.tone(220, 0.12, 'square', 0.16, 60); break;
      case 'bump': this.tone(140, 0.08, 'square', 0.12, 90); break;
      case 'hurt': this.tone(400, 0.3, 'sawtooth', 0.14, 100); break;
      case 'death':
        [392, 330, 262, 196, 131].forEach((f, i) => this.tone(f, 0.16, 'square', 0.12, null, n + i * 0.13));
        break;
      case 'flag':
        [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.14, 'square', 0.13, null, n + i * 0.09));
        break;
      case 'right':
        [523, 659, 784].forEach((f, i) => this.tone(f, 0.12, 'triangle', 0.16, null, n + i * 0.08));
        break;
      case 'wrong': this.tone(160, 0.35, 'sawtooth', 0.14, 110); break;
      case 'click': this.tone(700, 0.05, 'square', 0.08); break;
      case 'splash': this.tone(300, 0.25, 'sine', 0.13, 60); break;
      case 'win':
        [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.18, 'square', 0.13, null, n + i * 0.14));
        break;
    }
  },
  LEAD: [
    74, 74, 0, 74, 0, 72, 74, 0, 79, 0, 77, 0, 76, 0, 0, 0,
    72, 72, 0, 72, 0, 74, 76, 0, 77, 0, 76, 0, 74, 0, 0, 0,
    74, 74, 0, 74, 0, 72, 74, 0, 79, 0, 77, 0, 76, 0, 81, 0,
    79, 0, 77, 0, 76, 0, 74, 0, 72, 0, 74, 0, 0, 0, 0, 0
  ],
  BASS: [50, 0, 53, 0, 57, 0, 53, 0, 48, 0, 52, 0, 55, 0, 48, 0],
  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    const stepDur = (60 / 150) / 2 * 1000;
    this.musicTimer = setInterval(() => {
      if (this.muted) return;
      const i = this.step % this.LEAD.length;
      const m = this.LEAD[i];
      if (m) this.tone(440 * Math.pow(2, (m - 69) / 12), 0.19, 'square', 0.045);
      const b = this.BASS[this.step % this.BASS.length];
      if (b) this.tone(440 * Math.pow(2, (b - 69) / 12), 0.24, 'triangle', 0.07);
      this.step++;
    }, stepDur);
  },
  toggle() {
    this.muted = !this.muted;
    const btn = document.getElementById('btn-music');
    btn.classList.toggle('off', this.muted);
  }
};

/* ============================ CONTENIDO ============================ */
const CODES = { EMPTY: 0, GROUND: 1, BRICK: 2, QCOIN: 3, QSCROLL: 4, USED: 5, WATER: 7 };
const SOLID = new Set([1, 2, 3, 4, 5]);

function levelBuilder(w, h) {
  const grid = [];
  for (let y = 0; y < h; y++) grid.push(new Array(w).fill(0));
  const L = {
    w, h, grid, coins: [], scrolls: [], enemies: [],
    flag: null, playerStart: { x: 2 * TILE, y: 0 },
    ground(x0, x1, top) {
      for (let x = x0; x <= x1; x++)
        for (let y = top; y < h; y++) grid[y][x] = CODES.GROUND;
    },
    water(x0, x1, top) {
      for (let x = x0; x <= x1; x++)
        for (let y = top; y < h; y++) grid[y][x] = CODES.WATER;
    },
    fill(x, y, ww, hh, code) {
      for (let j = y; j < y + hh; j++)
        for (let i = x; i < x + ww; i++)
          if (j >= 0 && j < h && i >= 0 && i < w) grid[j][i] = code;
    },
    coinRow(x, y, n) { for (let i = 0; i < n; i++) L.coins.push({ x: (x + i) * TILE + 4, y: y * TILE + 4, got: false }); },
    coinArc(cx, cy) {
      L.coins.push(
        { x: cx * TILE + 4, y: cy * TILE + 4, got: false },
        { x: (cx + 1) * TILE + 4, y: (cy - 1) * TILE + 4, got: false },
        { x: (cx + 2) * TILE + 4, y: (cy - 1) * TILE + 4, got: false },
        { x: (cx + 3) * TILE + 4, y: cy * TILE + 4, got: false });
    },
    scroll(x, y) { L.scrolls.push({ x: x * TILE + 2, y: y * TILE + 2, got: false }); },
    enemy(x, yTile, type) { L.enemies.push({ x: x * TILE, yTile, type }); },
    setFlag(x, baseTile) { L.flag = { x: x * TILE + 6, top: (baseTile - 7) * TILE, base: baseTile * TILE }; },
    start(x, topTile) { L.playerStart = { x: x * TILE + 3, y: topTile * TILE - 14 }; }
  };
  return L;
}

const LEVELS = [];

/* --------- NIVEL 1: Génova, 1451 --------- */
(function () {
  const L = levelBuilder(140, 18);
  const G = 15; // fila superior del suelo
  L.ground(0, 29, G); L.ground(32, 49, G); L.ground(53, 74, G); L.ground(79, 139, G);
  L.fill(10, 11, 1, 1, CODES.QCOIN); L.fill(12, 11, 1, 1, CODES.QSCROLL); L.fill(14, 11, 1, 1, CODES.QCOIN);
  L.fill(20, 12, 4, 1, CODES.BRICK); L.fill(21, 12, 1, 1, CODES.QCOIN);
  L.fill(27, 11, 1, 1, CODES.QSCROLL);
  L.fill(40, 12, 3, 1, CODES.BRICK);
  // escalinata
  L.fill(60, 14, 3, 1, CODES.GROUND); L.fill(64, 13, 3, 2, CODES.GROUND); L.fill(68, 12, 3, 3, CODES.GROUND);
  L.fill(90, 11, 4, 1, CODES.BRICK); L.fill(91, 11, 1, 1, CODES.QSCROLL);
  L.fill(104, 12, 4, 1, CODES.BRICK); L.fill(105, 12, 1, 1, CODES.QCOIN);
  L.fill(118, 11, 1, 1, CODES.QCOIN);
  // escaleras antes de la bandera
  L.fill(126, 14, 2, 1, CODES.GROUND); L.fill(128, 13, 2, 2, CODES.GROUND);
  L.fill(130, 12, 2, 3, CODES.GROUND); L.fill(132, 11, 2, 4, CODES.GROUND);
  L.coinArc(28, 12); L.coinRow(43, 13, 5); L.coinArc(49, 12);
  L.coinRow(61, 10, 3); L.coinRow(65, 9, 3); L.coinArc(74, 12); L.coinRow(95, 9, 4);
  L.coinRow(119, 13, 4); L.coinArc(118, 8);
  L.scroll(34, 10); L.scroll(66, 8); L.scroll(106, 9);
  L.enemy(18, G, 'rat'); L.enemy(38, G, 'rat'); L.enemy(57, G, 'rat');
  L.enemy(86, G, 'rat'); L.enemy(112, G, 'rat');
  L.start(2, G);
  L.setFlag(135, 15);
  LEVELS.push({
    data: L, name: 'NIVEL 1', title: 'GÉNOVA, 1451', sub: 'La infancia de un soñador',
    theme: {
      skyA: '#7ec8f7', skyB: '#d8f1ff', deco: 'genoa',
      groundTop: '#3fae4a', ground: '#8a5a2c', groundDark: '#5f3c1a',
      brickA: '#c06048', brickB: '#7e3427', cloud: '#ffffff', grass: '#2f8f3e'
    },
    facts: [
      'Cristóbal Colón nació en Génova (Italia) en el año 1451.',
      'Su padre, Domenico Colombo, era tejedor de lana, y el joven Cristóbal le ayudaba en el taller.',
      'Desde muy joven se hizo a la mar y navegó por todo el mar Mediterráneo.',
      'Colón aprendió navegación, cartografía y matemáticas leyendo muchos libros.',
      'En 1476 sobrevivió a un naufragio nadando hasta la costa de Portugal, donde decidió instalarse.',
      'En Portugal, Colón estudió los vientos y las corrientes del Atlántico y se convirtió en un gran marinero.'
    ],
    quiz: [{
      q: '¿En qué ciudad nació Cristóbal Colón?',
      answers: [
        { t: 'Génova (Italia)', right: true },
        { t: 'Sevilla (España)', right: false },
        { t: 'Lisboa (Portugal)', right: false }
      ]
    }]
  });
})();

/* --------- NIVEL 2: La corte de los Reyes --------- */
(function () {
  const L = levelBuilder(150, 18);
  const G = 15;
  L.ground(0, 34, G); L.ground(38, 69, G); L.ground(74, 109, G); L.ground(113, 149, G);
  L.fill(8, 11, 1, 1, CODES.QCOIN); L.fill(10, 11, 1, 1, CODES.QSCROLL); L.fill(12, 11, 1, 1, CODES.QCOIN);
  L.fill(18, 12, 4, 1, CODES.BRICK);
  L.fill(24, 11, 1, 1, CODES.QSCROLL);
  // pasillo elevado del castillo
  L.fill(38, 13, 2, 2, CODES.BRICK);
  L.fill(41, 11, 14, 1, CODES.BRICK);
  L.fill(57, 13, 2, 2, CODES.BRICK);
  L.fill(66, 12, 3, 1, CODES.BRICK);
  L.fill(80, 11, 4, 1, CODES.BRICK); L.fill(81, 11, 1, 1, CODES.QCOIN);
  L.fill(96, 12, 1, 1, CODES.QCOIN); L.fill(98, 12, 1, 1, CODES.QSCROLL);
  L.fill(118, 11, 3, 1, CODES.BRICK); L.fill(119, 11, 1, 1, CODES.QCOIN);
  L.fill(132, 14, 2, 1, CODES.GROUND); L.fill(134, 13, 2, 2, CODES.GROUND);
  L.fill(136, 12, 2, 3, CODES.GROUND); L.fill(138, 11, 2, 4, CODES.GROUND);
  L.coinRow(41, 9, 8); L.coinRow(50, 9, 5); L.coinArc(35, 12); L.coinArc(70, 12);
  L.coinRow(83, 9, 4); L.coinArc(110, 12); L.coinRow(122, 13, 5); L.coinRow(133, 8, 6);
  L.scroll(47, 8); L.scroll(90, 9); L.scroll(125, 9);
  L.enemy(20, G, 'court'); L.enemy(44, G, 'court'); L.enemy(62, G, 'court');
  L.enemy(86, G, 'court'); L.enemy(104, G, 'court'); L.enemy(126, G, 'court');
  L.start(2, G);
  L.setFlag(144, 15);
  LEVELS.push({
    data: L, name: 'NIVEL 2', title: 'LA CORTE, 1486-1492', sub: 'Convencer a los Reyes Católicos',
    theme: {
      skyA: '#f2955c', skyB: '#f9dfa8', deco: 'castle',
      groundTop: '#aab2c0', ground: '#7d8494', groundDark: '#565c6a',
      brickA: '#b0503c', brickB: '#6e2f22', cloud: '#ffe3bd', grass: '#c3cad6'
    },
    facts: [
      'Colón estaba convencido de que se podía llegar a Asia navegando hacia el OESTE.',
      'Primero ofreció su proyecto al rey Juan II de Portugal, pero allí no confiaron en sus cálculos.',
      'En 1486 presentó su plan a los Reyes Católicos: Isabel de Castilla y Fernando de Aragón.',
      'Tuvo que esperar años y aguantar muchos "no", pero nunca abandonó su idea.',
      'El 17 de abril de 1492 se firmaron las Capitulaciones de Santa Fe, que autorizaban el viaje.',
      'Los Reyes le entregaron tres naves: la Niña, la Pinta y la Santa María. ¡Zarpó de Palos el 3 de agosto de 1492!'
    ],
    quiz: [{
      q: '¿Qué reyes apoyaron el proyecto de Colón?',
      answers: [
        { t: 'Los Reyes Católicos: Isabel y Fernando', right: true },
        { t: 'Carlos V y Juana la Loca', right: false },
        { t: 'Felipe II y Ana de Austria', right: false }
      ]
    }]
  });
})();

/* --------- NIVEL 3: El gran viaje --------- */
(function () {
  const L = levelBuilder(170, 18);
  const DECK = 14; // cubierta
  L.water(0, 169, 16);
  // seis "barcos" (cubiertas de madera)
  const ships = [[0, 24], [28, 46], [50, 72], [76, 98], [102, 124], [128, 169]];
  for (const [a, b] of ships) for (let x = a; x <= b; x++) { L.grid[DECK][x] = CODES.GROUND; L.grid[DECK + 1][x] = CODES.GROUND; }
  // barco 1
  L.fill(10, 13, 1, 1, CODES.BRICK); L.fill(11, 12, 1, 2, CODES.BRICK);
  L.fill(16, 11, 1, 1, CODES.QCOIN); L.fill(18, 11, 1, 1, CODES.QSCROLL);
  // mástil barco 2
  L.fill(34, 9, 1, 5, CODES.BRICK); L.fill(31, 9, 7, 1, CODES.BRICK);
  L.fill(42, 12, 3, 1, CODES.BRICK); L.fill(43, 11, 1, 1, CODES.QCOIN);
  // mástil barco 3
  L.fill(56, 9, 1, 5, CODES.BRICK); L.fill(53, 9, 7, 1, CODES.BRICK);
  L.fill(64, 12, 2, 1, CODES.BRICK); L.fill(65, 11, 1, 1, CODES.QSCROLL);
  L.fill(69, 13, 2, 1, CODES.BRICK);
  // mástil barco 4
  L.fill(84, 9, 1, 5, CODES.BRICK); L.fill(81, 9, 7, 1, CODES.BRICK);
  L.fill(92, 12, 3, 1, CODES.BRICK);
  // mástil barco 5
  L.fill(110, 9, 1, 5, CODES.BRICK); L.fill(107, 9, 7, 1, CODES.BRICK);
  L.fill(118, 12, 4, 1, CODES.BRICK); L.fill(119, 11, 1, 1, CODES.QCOIN);
  // barco final
  L.fill(134, 12, 2, 1, CODES.BRICK); L.fill(140, 11, 1, 1, CODES.QCOIN);
  L.fill(150, 9, 1, 5, CODES.BRICK); L.fill(147, 9, 7, 1, CODES.BRICK);
  // monedas
  L.coinRow(5, 11, 4); L.coinArc(24, 11); L.coinRow(31, 5, 7); L.coinArc(46, 11);
  L.coinRow(53, 5, 7); L.coinRow(66, 10, 4); L.coinArc(72, 11); L.coinRow(81, 5, 7);
  L.coinArc(98, 11); L.coinRow(107, 5, 7); L.coinRow(120, 10, 4); L.coinArc(124, 11);
  L.coinRow(136, 10, 5); L.coinRow(147, 5, 7); L.coinRow(155, 11, 6);
  // páginas flotantes
  L.scroll(36, 5); L.scroll(58, 10); L.scroll(86, 5); L.scroll(145, 10);
  // enemigos: nubes de tormenta sobre los huecos + una rata en el primer barco
  L.enemy(26, 10, 'cloud'); L.enemy(48, 10, 'cloud'); L.enemy(74, 10, 'cloud');
  L.enemy(100, 10, 'cloud'); L.enemy(126, 10, 'cloud'); L.enemy(8, DECK, 'rat');
  L.enemy(60, DECK, 'rat'); L.enemy(112, DECK, 'rat');
  L.start(2, DECK);
  L.setFlag(163, DECK);
  LEVELS.push({
    data: L, name: 'NIVEL 3', title: '¡A TODA VELA! 1492', sub: 'El gran viaje a través del Atlántico',
    theme: {
      skyA: '#5fb4f0', skyB: '#d5ecff', deco: 'sea',
      groundTop: '#c08a4e', ground: '#8a5a2c', groundDark: '#5f3c1a',
      brickA: '#8a5a2c', brickB: '#4e3013', cloud: '#eef8ff', grass: null
    },
    facts: [
      'La Niña y la Pinta eran carabelas ligeras; la Santa María, la nave capitana, era una nao más grande.',
      'Los hermanos Pinzón fueron clave: Martín Alonso capitaneaba la Pinta y Vicente Yáñez la Niña.',
      'La flota hizo escala en Canarias para reparar el timón de la Pinta antes de cruzar el océano.',
      'Tras semanas sin ver tierra, la tripulación se impacientó, pero Colón nunca se rindió.',
      'El 12 de octubre de 1492, Rodrigo de Triana gritó «¡TIERRA!» desde la Pinta.',
      'Llegaron a la isla Guanahani (Bahamas), que Colón bautizó como San Salvador. Colón hizo cuatro viajes a América y murió en Valladolid en 1506.'
    ],
    quiz: [
      {
        q: '¿En qué fecha llegó Colón a América?',
        answers: [
          { t: 'El 12 de octubre de 1492', right: true },
          { t: 'El 3 de agosto de 1492', right: false },
          { t: 'El 12 de octubre de 1502', right: false }
        ]
      },
      {
        q: '¿Cómo se llamaban las tres naves de la expedición?',
        answers: [
          { t: 'La Niña, la Pinta y la Santa María', right: true },
          { t: 'La Victoria, la Trinidad y la Concepción', right: false },
          { t: 'El Rayo, el Trueno y la Tormenta', right: false }
        ]
      }
    ]
  });
})();

/* ============================ ESTADO ============================ */
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const Game = {
  state: 'MENU', // MENU | INTRO | PLAY | FACT | QUIZ | PAUSE | CLEAR | OVER | WIN
  levelIdx: 0, level: null,
  grid: null, camX: 0, frame: 0,
  score: 0, coins: 0, scrolls: 0, hearts: 3,
  factsShown: 0,
  enemies: [], particles: [], popups: [], bounces: new Map(), coinFx: [],
  flagSlide: false, clearT: 0, shake: 0,
  player: {
    x: 0, y: 0, w: 10, h: 14, vx: 0, vy: 0,
    face: 1, ground: false, coyote: 0, iframes: 0, anim: 0, animT: 0, dead: false
  }
};

const keys = { left: false, right: false, jump: false, jumpBuf: 0 };

/* -------- tiles -------- */
function tileAt(px, py) {
  const g = Game.grid, L = Game.level.data;
  const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
  if (tx < 0 || tx >= L.w) return CODES.GROUND;
  if (ty < 0 || ty >= L.h) return CODES.EMPTY;
  return g[ty][tx];
}
const isSolid = (px, py) => SOLID.has(tileAt(px, py));

/* -------- carga de nivel -------- */
function loadLevel(idx, keepStats) {
  Game.levelIdx = idx;
  Game.level = LEVELS[idx];
  Game.grid = Game.level.data.grid.map(r => r.slice());
  const L = Game.level.data;
  Game.player.x = L.playerStart.x; Game.player.y = L.playerStart.y;
  Game.player.vx = 0; Game.player.vy = 0; Game.player.face = 1;
  Game.player.iframes = 0; Game.player.dead = false;
  if (!keepStats) { Game.hearts = 3; }
  Game.scrolls = 0; Game.factsShown = 0;
  Game.camX = 0; Game.particles = []; Game.popups = [];
  Game.bounces.clear(); Game.coinFx = [];
  Game.flagSlide = false; Game.clearT = 0;
  L.coins.forEach(c => c.got = false);
  L.scrolls.forEach(s => s.got = false);
  // bloques ? restaurados
  for (let y = 0; y < L.h; y++) for (let x = 0; x < L.w; x++) {
    const b = LEVELS[idx].data.grid[y][x];
    if (Game.grid[y][x] === CODES.USED && (b === CODES.QCOIN || b === CODES.QSCROLL)) Game.grid[y][x] = b;
  }
  Game.enemies = L.enemies.map(e => spawnEnemy(e));
  updateHUD();
}
function spawnEnemy(e) {
  const t = {
    rat: { w: 14, h: 9, sp: 0.55, fly: false, spr: SPR_RAT },
    court: { w: 12, h: 14, sp: 0.85, fly: false, spr: SPR_COURT },
    cloud: { w: 14, h: 8, sp: 0.7, fly: true, spr: SPR_CLOUD }
  }[e.type];
  let yy = e.fly ? e.yTile * TILE : e.yTile * TILE - t.h;
  // anti-atasco: si aparece dentro de un muro, subir hasta quedar libre
  for (let i = 0; i < 8; i++) {
    const inside = isSolid(e.x + 1, yy + 1) || isSolid(e.x + t.w - 1, yy + 1) ||
      isSolid(e.x + 1, yy + t.h - 1) || isSolid(e.x + t.w - 1, yy + t.h - 1);
    if (!inside) break;
    yy -= TILE;
  }
  return {
    x: e.x, y: yy, baseY: yy,
    w: t.w, h: t.h, vx: -t.sp, vy: 0, sp: t.sp, fly: t.fly,
    spr: t.spr, type: e.type, alive: true, deadT: 0, ph: Math.random() * 6.28
  };
}

/* ============================ FÍSICA ============================ */
const GRAV = 0.42, MAXFALL = 9, RUN_ACC = 0.35, RUN_MAX = 2.55, JUMP_V = -9.1, FRICT = 0.78;

function moveAndCollide(e, isPlayer) {
  // eje X
  e.x += e.vx;
  const dir = e.vx > 0 ? 1 : -1;
  if (e.vx !== 0) {
    const ex = dir > 0 ? e.x + e.w : e.x;
    for (let yy = e.y + 1; yy < e.y + e.h - 1; yy += 4) {
      if (isSolid(ex, yy)) {
        e.x = dir > 0 ? Math.floor(ex / TILE) * TILE - e.w - 0.01 : (Math.floor(ex / TILE) + 1) * TILE + 0.01;
        if (isPlayer) e.vx = 0; else { e.vx = -e.vx; }
        break;
      }
    }
  }
  // eje Y
  e.y += e.vy;
  e.ground = false;
  if (e.vy >= 0) {
    const fy = e.y + e.h;
    for (let xx = e.x + 1; xx < e.x + e.w - 1; xx += 4) {
      if (isSolid(xx, fy)) {
        e.y = Math.floor(fy / TILE) * TILE - e.h - 0.01;
        e.vy = 0; e.ground = true;
        break;
      }
    }
  } else {
    const hy = e.y;
    for (let xx = e.x + 1; xx < e.x + e.w - 1; xx += 4) {
      const tx = Math.floor(xx / TILE), ty = Math.floor(hy / TILE);
      if (isSolid(xx, hy)) {
        const code = Game.grid[ty][tx];
        if (isPlayer && (code === CODES.QCOIN || code === CODES.QSCROLL)) hitBlock(tx, ty, code);
        else if (isPlayer) AudioSys.sfx('bump');
        e.y = (ty + 1) * TILE + 0.01;
        e.vy = 0;
        break;
      }
    }
  }
}

function hitBlock(tx, ty, code) {
  Game.grid[ty][tx] = CODES.USED;
  Game.bounces.set(ty * Game.level.data.w + tx, 0);
  if (code === CODES.QCOIN) {
    Game.coins++; addScore(100, tx * TILE + 8, ty * TILE - 4);
    Game.coinFx.push({ x: tx * TILE + 4, y: ty * TILE - 4, vy: -4, t: 0 });
    AudioSys.sfx('coin');
  } else {
    AudioSys.sfx('scroll');
    collectScroll(tx * TILE + 2, ty * TILE - 14);
  }
  updateHUD();
}

function addScore(n, x, y) {
  Game.score += n;
  Game.popups.push({ x, y, t: 0, text: '+' + n });
  document.getElementById('hud-score').textContent = Game.score;
}

/* ============================ JUGADOR ============================ */
function updatePlayer() {
  const p = Game.player;
  if (p.dead) {
    p.vy = Math.min(p.vy + GRAV, MAXFALL);
    p.y += p.vy;
    return;
  }
  // entrada: control aéreo con freno para que no sea tan deslizante
  const acc = p.ground ? RUN_ACC : RUN_ACC * 0.7;
  if (keys.left) { p.vx -= acc * (p.vx > 0 ? 1.8 : 1); p.face = -1; }
  else if (keys.right) { p.vx += acc * (p.vx < 0 ? 1.8 : 1); p.face = 1; }
  else if (p.ground) p.vx *= FRICT;
  else p.vx *= 0.9; // sin tecla en el aire: frena poco a poco
  p.vx = clamp(p.vx, -RUN_MAX, RUN_MAX);
  if (Math.abs(p.vx) < 0.05) p.vx = 0;

  if (keys.jumpBuf > 0) keys.jumpBuf--;
  if (p.ground) p.coyote = 7; else if (p.coyote > 0) p.coyote--;
  if (keys.jumpBuf > 0 && p.coyote > 0) {
    p.vy = JUMP_V; p.ground = false; p.coyote = 0; keys.jumpBuf = 0;
    AudioSys.sfx('jump');
  }
  if (!keys.jump && p.vy < -3) p.vy = -3;

  p.vy = Math.min(p.vy + GRAV, MAXFALL);
  const wasAir = !p.ground;
  moveAndCollide(p, true);
  p.x = clamp(p.x, 0, Game.level.data.w * TILE - p.w);

  // animación
  p.animT++;
  if (!p.ground) p.anim = 3;
  else if (Math.abs(p.vx) > 0.3) { if (p.animT % 10 === 0) p.anim = (p.anim + 1) % 3; }
  else { p.anim = 0; }
  if (wasAir && p.ground) p.animT = 0;

  if (p.iframes > 0) p.iframes--;
  if (Game.shake > 0) Game.shake--;

  // agua / caída
  const feetTile = tileAt(p.x + p.w / 2, p.y + p.h + 1);
  if (feetTile === CODES.WATER) { splashDeath(); return; }
  if (p.y > Game.level.data.h * TILE + 40) { onFallDeath(); return; }

  // monedas
  for (const c of Game.level.data.coins) {
    if (!c.got && overlap(p.x, p.y, p.w, p.h, c.x, c.y, 8, 8)) {
      c.got = true; Game.coins++; addScore(100, c.x, c.y); AudioSys.sfx('coin'); updateHUD();
    }
  }
  // páginas
  for (const s of Game.level.data.scrolls) {
    if (!s.got && overlap(p.x, p.y, p.w, p.h, s.x, s.y + Math.sin(Game.frame * 0.06) * 2, 12, 12)) {
      s.got = true; AudioSys.sfx('scroll'); collectScroll(s.x, s.y);
    }
  }
  // bandera
  const f = Game.level.data.flag;
  if (!Game.flagSlide && overlap(p.x, p.y, p.w, p.h, f.x - 3, f.top, 10, f.base - f.top)) {
    startClear();
  }
}
function overlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function splashDeath() {
  AudioSys.sfx('splash');
  Game.hearts--; updateHUD();
  Game.shake = 12;
  if (Game.hearts <= 0) { gameOver(); return; }
  respawn();
}
function onFallDeath() {
  if (Game.player.dead) return;
  AudioSys.sfx('death');
  Game.hearts--; updateHUD();
  if (Game.hearts <= 0) { gameOver(); return; }
  respawn();
}
function respawn() {
  const p = Game.player, L = Game.level.data;
  p.x = L.playerStart.x; p.y = L.playerStart.y;
  p.vx = 0; p.vy = 0; p.dead = false;
  p.iframes = 140;
}
function hurt(byX) {
  const p = Game.player;
  if (p.iframes > 0) return;
  Game.hearts--; updateHUD();
  AudioSys.sfx('hurt');
  Game.shake = 14;
  if (Game.hearts <= 0) {
    p.dead = true; p.vy = -8; p.vx = 0;
    AudioSys.sfx('death');
    setTimeout(() => { if (Game.player.dead) gameOver(); }, 1400);
    return;
  }
  p.iframes = 110;
  p.vy = -5;
  p.vx = (p.x + p.w / 2 < byX) ? -3 : 3;
}
function gameOver() {
  Game.player.dead = true;
  Game.state = 'OVER';
  setTimeout(() => { if (Game.state === 'OVER') show('over'); }, 600);
}

/* -------- páginas / hechos -------- */
function collectScroll(x, y) {
  Game.scrolls++;
  addScore(250, x, y);
  updateHUD();
  const facts = Game.level.facts;
  const i = Game.factsShown;
  if (i < facts.length) {
    Game.factsShown++;
    factsReadGlobal.add(Game.levelIdx + ':' + i);
    openFact(facts[i]);
  }
}
function openFact(text) {
  Game.state = 'FACT';
  document.getElementById('fact-text').textContent = text;
  show('fact');
}

/* -------- fin de nivel -------- */
function startClear() {
  Game.flagSlide = true;
  Game.state = 'CLEAR';
  Game.clearT = 0;
  AudioSys.sfx('flag');
  for (let i = 0; i < 46; i++) {
    Game.particles.push({
      x: Game.level.data.flag.x + 4, y: Game.level.data.flag.top + 6,
      vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 4 - 1,
      col: ['#ffd23e', '#e0455a', '#3fae4a', '#5aa8e8', '#f5efe0'][i % 5], t: 0
    });
  }
}

/* -------- enemigos -------- */
function updateEnemies() {
  const p = Game.player;
  for (const e of Game.enemies) {
    if (!e.alive) { e.deadT++; continue; }
    if (e.x < Game.camX - 200 || e.x > Game.camX + VIEW_W + 200) continue;
    e.ph += 0.05;
    if (e.fly) {
      e.x += e.vx;
      e.y = e.baseY + Math.sin(e.ph) * 5;
      const edge = e.vx > 0 ? e.x + e.w + 2 : e.x - 2;
      if (isSolid(edge, e.y + e.h / 2)) e.vx = -e.vx;
      // las nubes giran al llegar al final de una zona sin agua debajo? cambian por tiempo
      if (Math.random() < 0.004) e.vx = -e.vx;
    } else {
      e.vy = Math.min(e.vy + GRAV, 8);
      const prevVx = e.vx;
      moveAndCollide(e, false);
      if (e.vx === 0) e.vx = -prevVx || e.sp;
      if (Math.abs(e.vx) < 0.01) e.vx = e.sp * (Math.random() < 0.5 ? -1 : 1);
      // girar en bordes
      if (e.ground) {
        const aheadX = e.vx > 0 ? e.x + e.w + 2 : e.x - 2;
        if (!isSolid(aheadX, e.y + e.h + 3)) e.vx = -e.vx;
      }
      if (e.y > Game.level.data.h * TILE + 60) e.alive = false;
    }
    // colisión con jugador
    if (!p.dead && p.iframes <= 0 &&
      overlap(p.x, p.y, p.w, p.h, e.x + 1, e.y + 1, e.w - 2, e.h - 2)) {
      const stomp = p.vy > 0 && (p.y + p.h) - e.y < 9;
      if (stomp) {
        e.alive = false; e.deadT = 0;
        p.vy = -7;
        addScore(200, e.x + e.w / 2, e.y);
        AudioSys.sfx('stomp');
        for (let i = 0; i < 8; i++) Game.particles.push({
          x: e.x + e.w / 2, y: e.y + e.h / 2,
          vx: (Math.random() - 0.5) * 3, vy: -Math.random() * 3,
          col: '#ffffff', t: 0
        });
      } else {
        hurt(e.x + e.w / 2);
      }
    }
  }
  Game.enemies = Game.enemies.filter(e => e.alive || e.deadT < 30);
}

/* ============================ CÁMARA Y FONDO ============================ */
function updateCamera() {
  const p = Game.player;
  const target = p.x + p.w / 2 - VIEW_W / 2;
  Game.camX += (target - Game.camX) * 0.12;
  Game.camX = clamp(Game.camX, 0, Game.level.data.w * TILE - VIEW_W);
}

let BG_CLOUD = null;

function drawBackground() {
  const th = Game.level.theme;
  const grd = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grd.addColorStop(0, th.skyA); grd.addColorStop(1, th.skyB);
  ctx.fillStyle = grd; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const cam = Math.floor(Game.camX);
  const GROUND_Y = 240; // línea del nivel del suelo en pantalla

  // sol pixelado
  ctx.fillStyle = th.deco === 'castle' ? '#ffdf70' : '#fff4c4';
  ctx.fillRect(40, 26, 24, 24); ctx.fillRect(44, 22, 16, 32);
  ctx.fillStyle = 'rgba(255,244,196,0.35)';
  ctx.fillRect(34, 20, 36, 36);

  // pájaros
  ctx.fillStyle = 'rgba(35,48,74,0.8)';
  for (let i = 0; i < 3; i++) {
    const bx = Math.floor(((Game.frame * 0.35 + i * 190) % (VIEW_W + 60)) - 30);
    const by = Math.floor(26 + i * 24 + Math.sin(Game.frame * 0.02 + i) * 4);
    const flap = (Game.frame >> 4) % 2;
    ctx.fillRect(bx, by + (flap ? 0 : 2), 3, 1);
    ctx.fillRect(bx + 2, by + (flap ? 2 : 1), 2, 1);
    ctx.fillRect(bx + 4, by + (flap ? 0 : 2), 3, 1);
  }

  // nubes con paralaje (tintadas según el nivel)
  ctx.save();
  ctx.globalAlpha = 0.92;
  for (let i = 0; i < 9; i++) {
    const cx = ((i * 197 + 60) - cam * 0.25) % (VIEW_W + 140);
    const x = ((cx + VIEW_W + 140) % (VIEW_W + 140)) - 70;
    ctx.drawImage(BG_CLOUD || SPR_CLOUD_BG, Math.floor(x), 18 + (i * 37) % 60);
  }
  ctx.restore();

  // decoración por tema (paralaje 0.5), anclada al nivel del suelo
  const px = Math.floor(cam * 0.5);
  if (th.deco === 'genoa') {
    ctx.fillStyle = '#8fa5d8';
    for (let i = 0; i < 8; i++) {
      const x = ((i * 160 + 30) - px) % (VIEW_W + 200);
      const bx = ((x + VIEW_W + 200) % (VIEW_W + 200)) - 100;
      const hw = 34 + (i * 13) % 22, hh = 44 + (i * 29) % 30;
      ctx.fillRect(bx, GROUND_Y - hh, hw, hh); // la casa parte del suelo
      ctx.beginPath(); // tejado triangular
      ctx.moveTo(bx - 4, GROUND_Y - hh);
      ctx.lineTo(bx + hw / 2, GROUND_Y - hh - 16);
      ctx.lineTo(bx + hw + 4, GROUND_Y - hh);
      ctx.fill();
      // ventanitas
      ctx.fillStyle = '#6a7db8';
      ctx.fillRect(bx + 6, GROUND_Y - hh + 10, 5, 6);
      ctx.fillRect(bx + hw - 11, GROUND_Y - hh + 10, 5, 6);
      ctx.fillRect(bx + hw / 2 - 3, GROUND_Y - 10, 6, 10); // puerta
      ctx.fillStyle = '#8fa5d8';
    }
    // cúpula de la catedral, apoyada en el suelo
    ctx.fillStyle = '#7d92c4';
    const dx = 230 - Math.floor(px * 0.35) % 240;
    ctx.fillRect(dx, GROUND_Y - 56, 26, 56);
    ctx.fillRect(dx + 4, GROUND_Y - 64, 18, 8);
    ctx.fillRect(dx + 11, GROUND_Y - 72, 4, 8);
  } else if (th.deco === 'castle') {
    ctx.fillStyle = '#a3636b';
    const bx = 300 - px;
    ctx.fillRect(bx, GROUND_Y - 80, 150, 80);            // cuerpo principal
    ctx.fillRect(bx + 10, GROUND_Y - 110, 26, 110);      // torre izquierda
    ctx.fillRect(bx + 112, GROUND_Y - 110, 26, 110);     // torre derecha
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(bx + 10 + i * 6, GROUND_Y - 116, 4, 6);
      ctx.fillRect(bx + 112 + i * 6, GROUND_Y - 116, 4, 6);
    }
    for (let i = 0; i < 9; i++) ctx.fillRect(bx + 6 + i * 17, GROUND_Y - 88, 8, 8);
    ctx.fillStyle = '#7c4450'; // ventanas
    for (let i = 0; i < 14; i++) ctx.fillRect(bx + 8 + (i * 23) % 134, GROUND_Y - 70 + (i * 31) % 52, 5, 7);
    ctx.fillStyle = '#5e3640'; // puerta del castillo
    ctx.fillRect(bx + 66, GROUND_Y - 26, 18, 26);
  } else if (th.deco === 'sea') {
    // mar con horizonte visible
    const sg = ctx.createLinearGradient(0, 178, 0, VIEW_H);
    sg.addColorStop(0, 'rgba(70,150,220,0.0)');
    sg.addColorStop(1, 'rgba(40,110,190,0.85)');
    ctx.fillStyle = sg; ctx.fillRect(0, 178, VIEW_W, VIEW_H - 178);
    ctx.fillStyle = 'rgba(215,240,255,0.5)';
    ctx.fillRect(0, 203, VIEW_W, 1); // línea de horizonte
    // olitas lejanas
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i < 12; i++) {
      const wx = ((i * 97 + 40) - Math.floor(cam * 0.35)) % (VIEW_W + 40);
      const wxx = ((wx + VIEW_W + 40) % (VIEW_W + 40)) - 20;
      ctx.fillRect(wxx, 214 + (i * 29) % 52, 10, 1);
    }
    // carabela lejana flotando sobre la línea del agua
    const sx = 420 - px;
    ctx.fillStyle = '#6e4a26';
    ctx.fillRect(sx, 195, 52, 8);
    ctx.fillRect(sx + 6, 189, 40, 7);
    ctx.fillRect(sx + 20, 152, 4, 43);
    ctx.fillRect(sx + 36, 166, 4, 29);
    ctx.fillStyle = '#f5efe0';
    ctx.fillRect(sx + 13, 156, 16, 22);
    ctx.fillRect(sx + 29, 170, 12, 15);
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(sx + 20, 146, 6, 5);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(0, 0, VIEW_W, 1);
}

/* ============================ RENDER ============================ */
let SPR_GROUND = null, SPR_BRICK = null, SPR_DECK = woodSprite();
function buildTileSprites() {
  const th = Game.level.theme;
  SPR_GROUND = groundSprite(th.groundTop, th.ground, th.groundDark);
  SPR_BRICK = th.deco === 'sea' ? SPR_DECK : brickSprite(th.brickA, th.brickB);
  BG_CLOUD = tintSprite(SPR_CLOUD_BG, th.cloud || '#ffffff');
  // en el nivel del mar: detectar tramos de cubierta para dibujar los cascos
  Game.shipRuns = [];
  if (th.deco === 'sea') {
    const row = Game.grid[14];
    let s = -1;
    for (let x = 0; x < row.length; x++) {
      const solid = SOLID.has(row[x]);
      if (solid && s < 0) s = x;
      if (!solid && s >= 0) { Game.shipRuns.push({ x0: s, x1: x - 1 }); s = -1; }
    }
    if (s >= 0) Game.shipRuns.push({ x0: s, x1: row.length - 1 });
  }
}

const POLE_CANVAS = (() => { const c = document.createElement('canvas'); c.width = 2; c.height = 16; const x = c.getContext('2d'); x.drawImage(SPR_POLE, 0, 0, 2, 2, 0, 0, 2, 16); return c; })();

function drawSpriteFlip(spr, x, y, flip) {
  x = Math.round(x - Game.camX); y = Math.round(y);
  if (!flip) { ctx.drawImage(spr, x, y + Math.round(spr.height - spr.height)); return; }
  ctx.save();
  ctx.translate(x + spr.width, y);
  ctx.scale(-1, 1);
  ctx.drawImage(spr, 0, 0);
  ctx.restore();
}

function render() {
  const th = Game.level.theme, L = Game.level.data, cam = Math.floor(Game.camX);
  ctx.save();
  if (Game.shake > 0) ctx.translate((Math.random() - 0.5) * Game.shake * 0.4, (Math.random() - 0.5) * Game.shake * 0.4);
  drawBackground();

  // tiles visibles
  const x0 = Math.floor(cam / TILE), x1 = Math.min(L.w - 1, x0 + VIEW_W / TILE + 1);
  for (let ty = 0; ty < L.h; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const code = Game.grid[ty][tx];
      if (code === 0) continue;
      let spr = null;
      if (code === CODES.GROUND) spr = (Game.level.theme.deco === 'sea') ? SPR_DECK : SPR_GROUND;
      else if (code === CODES.BRICK) spr = SPR_BRICK;
      else if (code === CODES.QCOIN) spr = SPR_QBLOCK;
      else if (code === CODES.QSCROLL) spr = SPR_XBLOCK;
      else if (code === CODES.USED) spr = SPR_USED;
      else if (code === CODES.WATER) spr = WATER_FRAMES[(Game.frame >> 5) & 1];
      if (!spr) continue;
      let oy = 0;
      const bk = Game.bounces.get(ty * L.w + tx);
      if (bk !== undefined) oy = -Math.round(Math.sin((bk / 14) * Math.PI) * 4);
      ctx.drawImage(spr, tx * TILE - cam, ty * TILE + oy);
      // hierba / brillo decorativo en la parte superior del suelo
      if (code === CODES.GROUND && th.grass && ty > 0 && Game.grid[ty - 1][tx] === 0) {
        ctx.fillStyle = th.grass;
        const h1 = 2 + ((tx * 13 + ty * 7) % 3);
        const h2 = 2 + ((tx * 7 + ty * 5) % 2);
        ctx.fillRect(tx * TILE + 3 - cam, ty * TILE - h1 + oy, 1, h1);
        ctx.fillRect(tx * TILE + 10 - cam, ty * TILE - h2 + oy, 1, h2);
      }
    }
  }
  // cascos de los barcos (nivel del mar)
  if (Game.shipRuns && Game.shipRuns.length) {
    for (const r of Game.shipRuns) {
      const x = r.x0 * TILE - cam, w = (r.x1 - r.x0 + 1) * TILE;
      if (x + w < 0 || x > VIEW_W) continue;
      ctx.fillStyle = '#4e3013';
      ctx.fillRect(x, 240, w, 14);
      ctx.fillRect(x + 3, 254, w - 6, 3);
      ctx.fillStyle = '#3a220d';
      ctx.fillRect(x + 2, 254, w - 4, 2);
      ctx.fillStyle = '#20140a'; // ojos de buey
      for (let hx = x + 12; hx < x + w - 10; hx += 28) ctx.fillRect(hx, 246, 4, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; // espuma sobre el agua
      ctx.fillRect(x - 2, 257, w + 4, 1);
    }
  }

  // bandera ondeando (dibujada en franjas con desfase)
  const f = L.flag;
  for (let y = f.top; y < f.base; y += 16) ctx.drawImage(POLE_CANVAS, f.x - cam, y);
  ctx.drawImage(SPR_BALL, f.x - 3 - cam, f.top - 4);
  const flagY = Game.flagSlide ? Math.min(f.base - 16, f.top + Game.clearT * 1.5) : f.top + 4;
  const wave = Game.frame * 0.12;
  for (let i = 0; i < 3; i++) {
    ctx.drawImage(SPR_FLAG, i * 4, 0, 4, SPR_FLAG.height,
      Math.round(f.x + 2 - cam + i * 4),
      Math.round(flagY + Math.round(Math.sin(wave + i * 0.9) * 1)), 4, SPR_FLAG.height);
  }

  // monedas
  for (const c of L.coins) {
    if (c.got) continue;
    const w = Math.max(2, Math.round(Math.abs(Math.cos(Game.frame * 0.08 + c.x)) * 8));
    ctx.drawImage(SPR_COIN, Math.round(c.x - cam + (8 - w) / 2), Math.round(c.y), w, 8);
  }
  // monedas que saltan de los bloques
  for (const fx of Game.coinFx) ctx.drawImage(SPR_COIN, Math.round(fx.x - cam), Math.round(fx.y));
  // páginas
  for (const s of L.scrolls) {
    if (s.got) continue;
    ctx.drawImage(SPR_SCROLL, Math.round(s.x - cam), Math.round(s.y + Math.sin(Game.frame * 0.06 + s.x) * 2));
  }
  // enemigos
  for (const e of Game.enemies) {
    if (!e.alive) {
      ctx.globalAlpha = 0.6;
      ctx.drawImage(e.spr, Math.round(e.x - cam), Math.round(e.y + 4));
      ctx.globalAlpha = 1;
      continue;
    }
    drawSpriteFlip(e.spr, e.x, e.y, e.vx > 0);
  }
  // jugador
  const p = Game.player;
  if (!(p.iframes > 0 && (Game.frame >> 2) % 2 === 0)) {
    const spr = [SPR_PLAYER_IDLE, SPR_PLAYER_RUN1, SPR_PLAYER_RUN2, SPR_PLAYER_JUMP][p.anim];
    drawSpriteFlip(spr, p.x - 3, p.y - 2, p.face < 0);
  }
  // partículas
  for (const pt of Game.particles) {
    ctx.fillStyle = pt.col;
    ctx.fillRect(Math.round(pt.x - cam), Math.round(pt.y), 3, 3);
  }
  // textos flotantes
  ctx.font = 'bold 8px monospace';
  ctx.textAlign = 'center';
  for (const t of Game.popups) {
    const a = 1 - t.t / 45;
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = '#000'; ctx.fillText(t.text, Math.round(t.x - cam) + 1, Math.round(t.y) + 1);
    ctx.fillStyle = '#ffd23e'; ctx.fillText(t.text, Math.round(t.x - cam), Math.round(t.y));
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/* ============================ BUCLE ============================ */
function step() {
  Game.frame++;
  for (const [k, v] of Game.bounces) { if (v >= 14) Game.bounces.delete(k); else Game.bounces.set(k, v + 1); }
  for (const fx of Game.coinFx) { fx.t++; fx.vy += 0.5; fx.y += fx.vy; }
  Game.coinFx = Game.coinFx.filter(f => f.t < 26);
  for (const t of Game.popups) t.t++;
  Game.popups = Game.popups.filter(t => t.t < 45);
  for (const pt of Game.particles) { pt.t++; pt.vy += 0.15; pt.x += pt.vx; pt.y += pt.vy; }
  Game.particles = Game.particles.filter(pt => pt.y < VIEW_H + 20 && pt.t < 300);

  if (Game.state === 'PLAY') {
    updatePlayer();
    updateEnemies();
    updateCamera();
  } else if (Game.state === 'CLEAR') {
    Game.clearT++;
    updateCamera();
    const p = Game.player;
    // pequeño paseo de celebración
    p.vx = 0.8; p.ground = true;
    moveAndCollide(p, false);
    if (Math.abs(p.vx) > 0.3 && Game.clearT % 10 === 0) p.anim = (p.anim + 1) % 3;
    if (Game.clearT === 80) openQuiz();
  }
  render();
}

let last = 0, acc = 0;
function loop(t) {
  requestAnimationFrame(loop);
  if (!last) last = t;
  acc += Math.min(100, t - last); last = t;
  while (acc >= 1000 / 60) { step(); acc -= 1000 / 60; }
}

/* ============================ UI / DOM ============================ */
const overlays = ['menu', 'intro', 'fact', 'quiz', 'pause', 'over', 'win'];
function show(id) { overlays.forEach(o => document.getElementById(o).classList.toggle('hidden', o !== id)); }
function hideAll() { overlays.forEach(o => document.getElementById(o).classList.add('hidden')); }

function updateHUD() {
  document.getElementById('hud-score').textContent = Game.score;
  document.getElementById('hud-coins').textContent = '× ' + Game.coins;
  document.getElementById('hud-scrolls').textContent = '× ' + Game.scrolls;
  document.getElementById('hud-level').textContent =
    Game.level ? Game.level.name.toUpperCase() : '';
  const hc = document.getElementById('hud-hearts');
  hc.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const img = document.createElement('img');
    img.src = i < Game.hearts ? URL_HEART : URL_HEART_OFF;
    hc.appendChild(img);
  }
}

function showIntro() {
  document.getElementById('intro-num').textContent = Game.level.name;
  document.getElementById('intro-title').textContent = Game.level.title;
  document.getElementById('intro-sub').textContent = Game.level.sub;
  show('intro');
  Game.state = 'INTRO';
  setTimeout(() => { if (Game.state === 'INTRO') { hideAll(); Game.state = 'PLAY'; } }, 2300);
}

function startLevel(idx, fresh) {
  loadLevel(idx, !fresh);
  buildTileSprites();
  updateHUD();
  if (fresh) showIntro(); else { hideAll(); Game.state = 'PLAY'; }
}

/* -------- quiz -------- */
let quizQueue = [], quizRight = 0;
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function openQuiz() {
  Game.state = 'QUIZ';
  quizQueue = shuffle(Game.level.quiz);
  quizRight = 0;
  document.getElementById('quiz-h3').textContent =
    '🚩 RETO DE ' + Game.level.name + ' — ¡Responde para continuar el viaje!';
  showQuizQuestion();
  show('quiz');
}
function showQuizQuestion() {
  const cur = quizQueue[0];
  document.getElementById('quiz-q').textContent = cur.q;
  document.getElementById('quiz-feedback').textContent = '';
  const box = document.getElementById('quiz-answers');
  box.innerHTML = '';
  shuffle(cur.answers).forEach(ans => {
    const b = document.createElement('button');
    b.className = 'btn'; b.textContent = ans.t;
    b.onclick = () => answerQuiz(b, ans);
    box.appendChild(b);
  });
}
function answerQuiz(btn, ans) {
  const fb = document.getElementById('quiz-feedback');
  if (ans.right) {
    btn.classList.add('right');
    AudioSys.sfx('right');
    addScore(500, Game.player.x, Game.player.y - 10);
    fb.textContent = '¡Correcto! +500 puntos';
    Array.from(document.getElementById('quiz-answers').children).forEach(b => b.disabled = true);
    setTimeout(() => {
      quizQueue.shift();
      if (quizQueue.length) showQuizQuestion();
      else nextLevel();
    }, 900);
  } else {
    btn.classList.add('wrong');
    btn.disabled = true;
    AudioSys.sfx('wrong');
    fb.textContent = '¡Uy! Esa no es… prueba otra vez.';
  }
}
function nextLevel() {
  hideAll();
  const next = Game.levelIdx + 1;
  if (next >= LEVELS.length) { winGame(); return; }
  startLevel(next, true);
}
function winGame() {
  Game.state = 'WIN';
  AudioSys.sfx('win');
  document.getElementById('win-score').textContent = Game.score;
  const hi = Math.max(Game.score, +(store.get('colonHigh') || 0));
  store.set('colonHigh', hi);
  document.getElementById('win-record').textContent =
    Game.score >= hi ? '¡NUEVO RÉCORD! 🏆' : 'Récord: ' + hi;
  const box = document.getElementById('win-facts');
  box.innerHTML = '<p style="text-align:center;color:#6b4a1f;font-weight:bold;">📖 LO QUE APRENDISTE 📖</p>';
  LEVELS.forEach((lv, i) => {
    const h = document.createElement('p');
    h.innerHTML = '<b>' + lv.title + '</b>';
    h.style.color = '#8a2a1c';
    box.appendChild(h);
    lv.facts.forEach(f => { const p = document.createElement('p'); p.textContent = f; box.appendChild(p); });
  });
  show('win');
}

/* -------- pausa / bitácora -------- */
const factsReadGlobal = new Set();
function togglePause() {
  if (Game.state === 'PLAY') {
    Game.state = 'PAUSE';
    const box = document.getElementById('pause-facts');
    box.innerHTML = '';
    let any = false;
    LEVELS.forEach((lv, i) => {
      lv.facts.forEach((f, j) => {
        if (factsReadGlobal.has(i + ':' + j)) {
          any = true;
          const p = document.createElement('p');
          p.textContent = f;
          box.appendChild(p);
        }
      });
    });
    if (!any) box.innerHTML = '<p>Aún no has encontrado páginas de la bitácora. ¡Golpea los bloques ✦ y recoge los pergaminos!</p>';
    show('pause');
  } else if (Game.state === 'PAUSE') {
    hideAll(); Game.state = 'PLAY';
  }
}

/* ============================ ENTRADA ============================ */
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump'
};
window.addEventListener('keydown', e => {
  if (e.code in KEYMAP) {
    e.preventDefault();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  if (e.code === 'KeyM') { AudioSys.toggle(); return; }
  if (e.code === 'KeyP' || e.code === 'Escape') { togglePause(); return; }
  const k = KEYMAP[e.code];
  if (!k) {
    if (Game.state === 'INTRO') { hideAll(); Game.state = 'PLAY'; }
    return;
  }
  if (k === 'jump' && !keys.jump) keys.jumpBuf = 7;
  keys[k] = true;
  if (Game.state === 'INTRO') { hideAll(); Game.state = 'PLAY'; }
});
window.addEventListener('keyup', e => {
  const k = KEYMAP[e.code];
  if (k) keys[k] = false;
});
window.addEventListener('blur', () => { keys.left = keys.right = keys.jump = false; });

/* -------- táctil -------- */
function bindTouch(id, key) {
  const el = document.getElementById(id);
  const on = e => {
    e.preventDefault();
    if (key === 'jump' && !keys.jump) keys.jumpBuf = 7;
    keys[key] = true;
    if (Game.state === 'INTRO') { hideAll(); Game.state = 'PLAY'; }
  };
  const off = e => { e.preventDefault(); keys[key] = false; };
  el.addEventListener('touchstart', on, { passive: false });
  el.addEventListener('touchend', off, { passive: false });
  el.addEventListener('touchcancel', off, { passive: false });
  el.addEventListener('mousedown', on);
  el.addEventListener('mouseup', off);
  el.addEventListener('mouseleave', off);
}
bindTouch('t-left', 'left'); bindTouch('t-right', 'right'); bindTouch('t-jump', 'jump');

/* -------- botones -------- */
function pressStart() {
  AudioSys.init(); AudioSys.sfx('click'); AudioSys.startMusic();
  Game.score = 0; Game.coins = 0;
  factsReadGlobal.clear();
  hideAll();
  startLevel(0, true);
}
document.getElementById('btn-start').onclick = pressStart;
document.getElementById('btn-again').onclick = pressStart;
document.getElementById('btn-fact-ok').onclick = () => { AudioSys.sfx('click'); hideAll(); Game.state = 'PLAY'; };
document.getElementById('btn-resume').onclick = () => { AudioSys.sfx('click'); togglePause(); };
document.getElementById('btn-retry').onclick = () => {
  AudioSys.sfx('click'); hideAll();
  startLevel(Game.levelIdx, true);
};
document.getElementById('btn-music').onclick = () => { AudioSys.init(); AudioSys.toggle(); };

/* ============================ ARRANQUE ============================ */
const URL_HEART = spriteURL(SPR_HEART, 2);
const URL_HEART_OFF = spriteURL(SPR_HEART_OFF, 2);
document.getElementById('hud-coin-img').src = spriteURL(SPR_COIN, 2);
document.getElementById('hud-scroll-img').src = spriteURL(SPR_SCROLL, 2);

// dibuja el primer nivel detrás del menú
loadLevel(0, false);
buildTileSprites();
const hi0 = store.get('colonHigh');
document.getElementById('menu-high').textContent = hi0 ? '🏆 Récord: ' + hi0 : '';
updateHUD();
requestAnimationFrame(loop);
