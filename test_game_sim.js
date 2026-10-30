const fs = require('fs');
const assert = require('assert');

const html = fs.readFileSync('index.html', 'utf8');
const scriptMatch = html.match(/<script[\s\S]*?>([\s\S]*?)<\/script>/i);
const code = scriptMatch[1];

const fakeEl = { value: 'Đội', style: {}, classList: { add(){}, remove(){}, toggle(){} }, querySelector: () => null, querySelectorAll: () => [], textContent: '', innerHTML: '', appendChild(){} };
const dom = {
  getElementById: () => fakeEl,
  createElement: () => fakeEl,
  documentElement: { requestFullscreen: () => Promise.resolve() }
};
const win = { AudioContext: null, webkitAudioContext: null, localStorage: { getItem: () => null } };
const loc = { hash: '' };

const simEnv = new Function('document', 'window', 'location', code + '; return { startGame, pickWheelIndex, WHEEL, TIERS, getTeams: () => teams };');
const env = simEnv(dom, win, loc);
env.startGame();
const currentTeams = env.getTeams();
const { pickWheelIndex, WHEEL } = env;

let totalGap = 0, ties = 0, diff1 = 0, diff2plus = 0;
const MATCHES = 1000;

for(let m = 0; m < MATCHES; m++){
  currentTeams[0].level = 0; currentTeams[0].shield = false;
  currentTeams[1].level = 0; currentTeams[1].shield = false;
  
  for(let q = 0; q < 6; q++){
    let r = Math.random();
    let winner = r < 0.4 ? 0 : r < 0.8 ? 1 : r < 0.95 ? 2 : 3;
    let spinners = [];
    if(winner === 0 || winner === 1){
      currentTeams[winner].level = Math.min(5, currentTeams[winner].level + 1);
      spinners.push(winner);
    } else if(winner === 2){
      currentTeams[0].level = Math.min(5, currentTeams[0].level + 1);
      currentTeams[1].level = Math.min(5, currentTeams[1].level + 1);
      spinners.push(0, 1);
    }
    
    for(let ti of spinners){
      let idx = pickWheelIndex(ti);
      let ef = WHEEL[idx].effect;
      let foe = 1 - ti;
      if(ef === 'up2') currentTeams[ti].level = Math.min(5, currentTeams[ti].level + 2);
      else if(ef === 'up1') currentTeams[ti].level = Math.min(5, currentTeams[ti].level + 1);
      else if(ef === 'shield') currentTeams[ti].shield = true;
      else if(ef === 'raid'){
        if(currentTeams[foe].shield) currentTeams[foe].shield = false;
        else currentTeams[foe].level = Math.max(0, currentTeams[foe].level - 1);
      } else if(ef === 'steal'){
        if(currentTeams[foe].shield) currentTeams[foe].shield = false;
        else currentTeams[foe].level = Math.max(0, currentTeams[foe].level - 1);
        currentTeams[ti].level = Math.min(5, currentTeams[ti].level + 1);
      } else if(ef === 'down1'){
        if(currentTeams[ti].shield) currentTeams[ti].shield = false;
        else currentTeams[ti].level = Math.max(0, currentTeams[ti].level - 1);
      } else if(ef === 'aid'){
        currentTeams[foe].level = Math.min(5, currentTeams[foe].level + 1);
      }
    }
  }
  let finalGap = Math.abs(currentTeams[0].level - currentTeams[1].level);
  totalGap += finalGap;
  if(finalGap === 0) ties++;
  else if(finalGap === 1) diff1++;
  else diff2plus++;
}

const avgGap = totalGap / MATCHES;
const closeRate = (ties + diff1) / MATCHES;

assert(avgGap < 1.2, `Average gap should be under 1.2 levels, got ${avgGap}`);
assert(closeRate > 0.70, `Close rate should be > 70%, got ${closeRate}`);

console.log(`PASS: Simulated ${MATCHES} matches. Avg gap: ${avgGap.toFixed(2)} levels, Close matches: ${(closeRate * 100).toFixed(1)}%`);
