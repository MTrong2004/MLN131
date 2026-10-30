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

const simEnv = new Function('document', 'window', 'location', code + '; return { startGame, pickWheelIndex, WHEEL, TIERS, getTeams: () => teams, applyTieBreaker };');
const env = simEnv(dom, win, loc);
env.startGame();
const currentTeams = env.getTeams();
const { pickWheelIndex, WHEEL, applyTieBreaker } = env;

let ties = 0, diff1 = 0, diff2plus = 0;
let team0Wins = 0, team1Wins = 0;
const MATCHES = 2000;

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

  // Kết thúc 6 câu: nếu hòa -> VÒNG QUAY ĐỊNH ĐOẠT
  if(currentTeams[0].level === currentTeams[1].level){
    const tbWinner = Math.random() < 0.5 ? 0 : 1;
    applyTieBreaker(tbWinner);
  }

  let finalGap = Math.abs(currentTeams[0].level - currentTeams[1].level);
  if(finalGap === 0) ties++;
  else if(finalGap === 1) diff1++;
  else diff2plus++;

  if(currentTeams[0].level > currentTeams[1].level) team0Wins++;
  else if(currentTeams[1].level > currentTeams[0].level) team1Wins++;
}

assert.strictEqual(ties, 0, "TUYỆT ĐỐI KHÔNG CÓ TRẬN HÒA (Phải có đúng 1 đội thắng)");
assert(team0Wins + team1Wins === MATCHES, "Tất cả các trận đều phải tìm ra 1 đội thắng duy nhất");
assert(diff1 / MATCHES > 0.70, `Tỉ lệ thắng sát nút (1 cấp) phải > 70%, thực tế đạt ${(diff1 / MATCHES * 100).toFixed(1)}%`);

console.log(`PASS: Mô phỏng ${MATCHES} trận đấu:`);
console.log(`- Tỉ lệ hòa (cả 2 đội cùng thắng): 0% (Đã triệt tiêu hoàn toàn)`);
console.log(`- Tỉ lệ có 1 đội thắng duy nhất: 100% (Đội 1: ${(team0Wins/MATCHES*100).toFixed(1)}%, Đội 2: ${(team1Wins/MATCHES*100).toFixed(1)}%)`);
console.log(`- Tỉ lệ thắng sát nút (chênh lệch đúng 1 cấp): ${(diff1/MATCHES*100).toFixed(1)}%`);
console.log(`- Tỉ lệ cách biệt 2 cấp trở lên: ${(diff2plus/MATCHES*100).toFixed(1)}%`);
