const assert = require("assert");

const WHEEL = [
  {label:"TĂNG TỐC 🚀", sub:"nhảy 2 cấp ⬆️⬆️", color:"#d9531f", effect:"up2"},
  {label:"THỬ THÁCH ⚠️", sub:"tự lùi 1 cấp ⬇️", color:"#c0392b", effect:"down1"},
  {label:"TIẾN 1 CẤP", sub:"vững chắc ⬆️", color:"#d4ac0d", effect:"up1"},
  {label:"TẤN CÔNG ⚡", sub:"đội bạn lùi 1 cấp", color:"#8e24aa", effect:"raid"},
  {label:"KHIÊN HỘ 🛡️", sub:"bảo vệ vững vàng", color:"#2e7d32", effect:"shield"},
  {label:"BỨT PHÁ 🎯", sub:"vươn lên 1 cấp ⚔️", color:"#512da8", effect:"steal"},
  {label:"CHI VIỆN 🤝", sub:"đội bạn +1 cấp", color:"#d35400", effect:"aid"},
  {label:"HẸN LẦN SAU", sub:"giữ nguyên cấp 🌿", color:"#78909c", effect:"miss"}
];

let teams = [
  {name: "Đội 1", level: 0, shield: false},
  {name: "Đội 2", level: 0, shield: false}
];

// ponytail: rubber-banding điều tiết xác suất vòng quay theo chênh lệch cấp độ (diff), nâng cấp ELO động khi mở rộng nhiều đội
function pickWheelIndex(ti){
  if(!teams || !teams[ti]) return Math.floor(Math.random()*WHEEL.length);
  const me=teams[ti].level, foe=teams[1-ti].level, diff=me-foe;
  const weights=WHEEL.map(s=>{
    const ef=s.effect;
    if(diff<=-2){
      if(ef==="up2") return me<=3?30:0;
      if(ef==="steal") return 25;
      if(ef==="up1") return me<=4?25:0;
      if(ef==="raid") return 15;
      if(ef==="shield"||ef==="miss") return 5;
      return 0;
    }
    if(diff===-1){
      if(ef==="up1") return me<=4?25:0;
      if(ef==="steal") return 20;
      if(ef==="up2") return me<=3?15:0;
      if(ef==="raid") return 15;
      if(ef==="shield") return 12;
      if(ef==="miss") return 8;
      if(ef==="down1") return 3;
      if(ef==="aid") return 2;
    }
    if(diff===0){
      if(ef==="up1") return me<=4?18:0;
      if(ef==="shield") return 16;
      if(ef==="miss") return 14;
      if(ef==="raid") return 12;
      if(ef==="aid") return foe<=4?12:0;
      if(ef==="steal") return 10;
      if(ef==="down1") return me>=1?10:0;
      if(ef==="up2") return me<=3?8:0;
    }
    if(diff===1){
      if(ef==="aid") return foe<=4?25:10;
      if(ef==="down1") return me>=1?20:0;
      if(ef==="miss") return 20;
      if(ef==="shield") return 15;
      if(ef==="up1") return me<=4?10:0;
      if(ef==="raid") return 5;
      if(ef==="steal") return 3;
      if(ef==="up2") return me<=3?2:0;
    }
    // diff >= 2
    if(ef==="aid") return foe<=4?35:10;
    if(ef==="down1") return me>=1?30:0;
    if(ef==="miss") return 20;
    if(ef==="shield") return 10;
    if(ef==="up1") return me<=4?3:0;
    if(ef==="raid"||ef==="steal") return 1;
    return 0;
  });
  const total=weights.reduce((a,b)=>a+b,0);
  if(total<=0) return Math.floor(Math.random()*WHEEL.length);
  let rnd=Math.random()*total;
  for(let i=0;i<weights.length;i++){
    if(rnd<weights[i]) return i;
    rnd-=weights[i];
  }
  return 0;
}

function runSim(ti, count=5000){
  const counts = {};
  for(let i=0; i<count; i++){
    const idx = pickWheelIndex(ti);
    const ef = WHEEL[idx].effect;
    counts[ef] = (counts[ef] || 0) + 1;
  }
  return counts;
}

// TEST 1: Trailing by 2 levels (me=1, foe=3)
teams[0].level = 1; teams[1].level = 3;
let res = runSim(0);
let catchup = (res.up2||0) + (res.steal||0) + (res.up1||0) + (res.raid||0);
let harm = (res.down1||0) + (res.aid||0);
assert(catchup / 5000 > 0.85, "Trailing team should have >85% catchup chance");
assert(harm === 0, "Trailing team should have 0% self-harm when behind by 2");

// TEST 2: Leading by 2 levels (me=4, foe=2)
teams[0].level = 4; teams[1].level = 2;
res = runSim(0);
let closeGap = (res.down1||0) + (res.aid||0) + (res.miss||0) + (res.shield||0);
let blowOut = (res.up2||0) + (res.steal||0);
assert(closeGap / 5000 > 0.85, "Leading team should face >85% gap-closing or neutral events");
assert(blowOut / 5000 < 0.02, "Leading team should have <2% chance to blow out further");

// TEST 3: Tied (me=2, foe=2)
teams[0].level = 2; teams[1].level = 2;
res = runSim(0);
assert(res.up1 > 0 && res.shield > 0 && res.miss > 0, "Tied state should have well-distributed events");

// TEST 4: Max level team (me=5, foe=3)
teams[0].level = 5; teams[1].level = 3;
res = runSim(0);
assert(!res.up2 && !res.up1, "Team at level 5 cannot roll up1 or up2");

console.log("All rubberband mechanic tests passed!");
