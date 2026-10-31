const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = fs.existsSync('index.html') ? 'index.html' : path.join(__dirname, '../index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const scriptMatch = html.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/i);
const code = scriptMatch[1];

// Mock elements
const elements = {};
function getOrCreateEl(id) {
  if (!elements[id]) {
    elements[id] = {
      id,
      value: 'Đội',
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {}
      },
      querySelector: () => null,
      querySelectorAll: () => [],
      textContent: '',
      innerHTML: '',
      appendChild: () => {},
      getBoundingClientRect: () => ({ left: 100, top: 100, width: 200, height: 100 })
    };
  }
  return elements[id];
}

const dom = {
  getElementById: (id) => getOrCreateEl(id),
  createElement: () => getOrCreateEl('dynamic'),
  documentElement: { requestFullscreen: () => Promise.resolve() }
};
const win = { AudioContext: null, webkitAudioContext: null, localStorage: { getItem: () => null } };
const loc = { hash: '' };

const simEnv = new Function(
  'document',
  'window',
  'location',
  code + '; return { startGame, openWheel, applyWheel, renderWheelHouseCard, renderWheelShieldCard, WHEEL, TIERS, getTeams: () => teams, setWheelTeam: (ti) => { wheelTeam = ti; } };'
);

const env = simEnv(dom, win, loc);
env.startGame();
const teams = env.getTeams();
const box = dom.getElementById('wheel-anim-box');
const res = dom.getElementById('spin-res');

// 1. Check renderWheelHouseCard for upgrade
teams[0].level = 0;
env.renderWheelHouseCard(0, 0, 1, '✨ THỬ NGHIỆM LÊN CẤP');
assert(box.innerHTML.includes('wac-card up'), 'Card must have "wac-card up" class');
assert(box.innerHTML.includes('lvlup'), 'To-tier must have "lvlup" class');
assert(box.innerHTML.includes('+1 CẤP'), 'Badge should show +1 CẤP');
assert(box.innerHTML.includes(env.TIERS[0].name), 'Should display starting tier name');
assert(box.innerHTML.includes(env.TIERS[1].name), 'Should display next tier name');

// 2. Check renderWheelHouseCard for downgrade
teams[0].level = 2;
env.renderWheelHouseCard(0, 2, 1, '⚡ THỬ NGHIỆM LÙI CẤP', true);
assert(box.innerHTML.includes('wac-card down'), 'Card must have "wac-card down" class');
assert(box.innerHTML.includes('lvldown'), 'To-tier must have "lvldown" class');
assert(box.innerHTML.includes('-1 CẤP'), 'Badge should show -1 CẤP');

// 3. Test applyWheel: up2 (TĂNG TỐC, +2 cấp) gradual animation
teams[0].level = 0;
teams[0].shield = false;
env.setWheelTeam(0);
env.applyWheel(0); // effect "up2"

// Step 1: level should immediately be 1
assert.strictEqual(teams[0].level, 1, 'Step 1 of up2 should elevate to level 1 immediately');
assert(box.innerHTML.includes('BẬC 1/2'), 'Box should show Step 1 indicator');
assert(box.innerHTML.includes('lvlup'), 'Box should show lvlup animation');

// Step 2: after timeout, level should become 2
setTimeout(() => {
  assert.strictEqual(teams[0].level, 2, 'Step 2 of up2 should elevate to level 2 after timeout');
  assert(box.innerHTML.includes('BẬC 2/2'), 'Box should show Step 2 indicator');
  assert(res.innerHTML.includes('hoàn tất nhảy vọt 2 cấp'), 'Spin-res should confirm +2 completion');
  console.log('PASS: up2 gradual step-by-step upgrade animation verified.');

  // 4. Test applyWheel: down1 (THỬ THÁCH, -1 cấp)
  teams[0].level = 2;
  teams[0].shield = false;
  env.setWheelTeam(0);
  env.applyWheel(1); // effect "down1"
  assert.strictEqual(teams[0].level, 1, 'down1 should decrease level by 1');
  assert(box.innerHTML.includes('lvldown'), 'down1 should trigger lvldown animation');
  assert(box.innerHTML.includes('-1 CẤP'), 'down1 should show -1 CẤP badge');
  console.log('PASS: down1 downgrade animation verified.');

  // 5. Test down1 with shield
  teams[0].level = 2;
  teams[0].shield = true;
  env.setWheelTeam(0);
  env.applyWheel(1); // effect "down1" with shield
  assert.strictEqual(teams[0].level, 2, 'Shield must block downgrade');
  assert.strictEqual(teams[0].shield, false, 'Shield must be consumed');
  assert(res.innerHTML.includes('Khiên bảo hộ đã kích hoạt'), 'Must announce shield block');
  console.log('PASS: Shield protection against downgrade verified.');

  console.log('ALL WHEEL ANIMATION TESTS PASSED!');
}, 1400);
