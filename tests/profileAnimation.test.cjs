const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const source = readFileSync(path.join(__dirname, '../src/components/ProfileAnimationCanvas.tsx'), 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 }
});

// Run the real animation effect against a deterministic canvas/scheduler, without
// browser automation or extra dependencies. Record the effective cleared pixels.
function mountAnimation(mode = 'lightning', ratio = 1.25, width = 636, height = 548) {
  const clears = [];
  const strokes = [];
  const fills = [];
  const frames = new Map();
  let frameId = 0;
  let cleanup;
  let resize;
  let disconnected = false;
  const states = [];
  let state = { transform: [1, 0, 0, 1, 0, 0], strokeStyle: '', fillStyle: '', globalAlpha: 1, shadowBlur: 0 };
  const context = {
    setTransform: (...transform) => { state.transform = transform; },
    clearRect: (x, y, w, h) => clears.push({
      x: x * state.transform[0] + state.transform[4],
      y: y * state.transform[3] + state.transform[5],
      width: w * state.transform[0], height: h * state.transform[3]
    }),
    beginPath() {}, moveTo() {}, lineTo() {}, quadraticCurveTo() {}, closePath() {},
    stroke: () => strokes.push({ ...state }),
    strokeRect: () => strokes.push({ ...state }),
    fill: () => fills.push({ ...state }),
    save: () => states.push({ ...state, transform: [...state.transform] }),
    restore: () => { state = states.pop(); }
  };
  for (const property of ['strokeStyle', 'fillStyle', 'globalAlpha', 'shadowBlur', 'shadowColor', 'lineWidth', 'lineCap', 'lineJoin', 'globalCompositeOperation']) {
    Object.defineProperty(context, property, {
      get: () => state[property], set: value => { state[property] = value; }
    });
  }
  const rectangle = { width, height, top: 0 };
  const canvas = { width: 300, height: 150, getContext: () => context, getBoundingClientRect: () => rectangle };
  const browser = {
    devicePixelRatio: ratio,
    matchMedia: () => ({ matches: false }),
    requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame: id => frames.delete(id)
  };
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: name => {
      if (name === 'react') return { useRef: () => ({ current: canvas }), useEffect: callback => { cleanup = callback(); } };
      if (name === 'react/jsx-runtime') return { jsx: () => null };
      throw new Error(`Unexpected import: ${name}`);
    },
    window: browser,
    performance: { now: () => 0 },
    requestAnimationFrame: browser.requestAnimationFrame,
    document: { querySelector: () => ({ getBoundingClientRect: () => ({ bottom: 60 }) }) },
    ResizeObserver: class {
      constructor(callback) { resize = callback; }
      observe() {}
      disconnect() { disconnected = true; }
    },
    Math: Object.assign(Object.create(Math), { random: () => 0.4 })
  });
  exports.ProfileAnimationCanvas({ mode });
  return {
    canvas, context, browser, clears, strokes, fills, rectangle,
    resize: () => resize(),
    unmount: () => cleanup(),
    isDisconnected: () => disconnected,
    pendingFrames: () => frames.size,
    frame(time) {
      const [id, callback] = frames.entries().next().value;
      frames.delete(id);
      callback(time);
    }
  };
}

function assertFullClear(animation) {
  const clear = animation.clears.at(-1);
  assert.equal(clear.x, 0);
  assert.equal(clear.y, 0);
  assert.equal(clear.width, animation.canvas.width);
  assert.equal(clear.height, animation.canvas.height);
}

test('lightning clears the entire bitmap, even after the context scale resets', () => {
  const animation = mountAnimation();
  animation.frame(500);
  animation.context.setTransform(1, 0, 0, 1, 0, 0);
  animation.frame(550);
  assertFullClear(animation);
  assert.ok(animation.strokes.some(stroke => stroke.strokeStyle === '#ff0000' && stroke.shadowBlur === 30));
  assert.ok(animation.strokes.some(stroke => stroke.strokeStyle === '#fff1f1'));
  assert.equal(animation.strokes.at(-1).transform[0], animation.canvas.width / animation.rectangle.width);
  assert.equal(animation.pendingFrames(), 1);
});

test('fractional dimensions and pixel ratios do not leave an uncleared edge', () => {
  for (const ratio of [0.8, 1, 1.25, 1.5, 2, 3]) {
    const animation = mountAnimation('lightning', ratio, 637.3, 548.7);
    animation.frame(500);
    assertFullClear(animation);
    const scale = animation.strokes.at(-1).transform;
    assert.equal(scale[0], animation.canvas.width / 637.3);
    assert.equal(scale[3], animation.canvas.height / 548.7);
    assert.equal(animation.canvas.width, Math.round(637.3 * Math.min(ratio, 2)));
  }
});

test('pixel-density changes resync the bitmap even without a resize notification', () => {
  const animation = mountAnimation('lightning', 1);
  animation.frame(500);
  animation.browser.devicePixelRatio = 1.5;
  animation.frame(550);
  assert.equal(animation.canvas.width, Math.round(636 * 1.5));
  assert.equal(animation.canvas.height, Math.round(548 * 1.5));
  assertFullClear(animation);
});

test('resizing and toggling off clear the whole bitmap and stop the old animation', () => {
  const animation = mountAnimation();
  animation.frame(500);
  animation.rectangle.width = 400.5;
  animation.rectangle.height = 720.3;
  animation.resize();
  animation.frame(550);
  assertFullClear(animation);
  animation.context.setTransform(0.5, 0, 0, 0.5, 0, 0);
  animation.unmount();
  assertFullClear(animation);
  assert.equal(animation.pendingFrames(), 0);
  assert.equal(animation.isDisconnected(), true);
});

test('blue fire still draws its particles using the same full-frame clearing', () => {
  const animation = mountAnimation('blue-fire');
  animation.frame(500);
  assertFullClear(animation);
  assert.ok(animation.fills.length > 0);
  assert.ok(animation.strokes.some(stroke => stroke.strokeStyle.startsWith('rgba(38, 174, 255')));
  assert.equal(animation.pendingFrames(), 1);
});
