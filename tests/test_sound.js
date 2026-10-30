const assert = require("assert");

// Mock Web Audio API for headless verification
class MockAudioParam {
  constructor(val = 0) { this.value = val; }
  setValueAtTime(v, t) { this.value = v; }
  linearRampToValueAtTime(v, t) { this.value = v; }
  exponentialRampToValueAtTime(v, t) { this.value = v; }
}

class MockNode {
  constructor() { this.connected = []; }
  connect(target) { this.connected.push(target); }
}

class MockGainNode extends MockNode {
  constructor() { super(); this.gain = new MockAudioParam(1); }
}

class MockOscillatorNode extends MockNode {
  constructor() {
    super();
    this.frequency = new MockAudioParam(440);
    this.type = "sine";
    this.started = false;
    this.stopped = false;
  }
  start(t) { this.started = true; }
  stop(t) { this.stopped = true; }
}

class MockBiquadFilterNode extends MockNode {
  constructor() {
    super();
    this.frequency = new MockAudioParam(1000);
    this.type = "lowpass";
  }
}

class MockBufferSourceNode extends MockNode {
  constructor() {
    super();
    this.started = false;
    this.stopped = false;
  }
  start(t) { this.started = true; }
  stop(t) { this.stopped = true; }
}

class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.state = "running";
    this.destination = new MockNode();
    this.nodesCreated = { osc: 0, gain: 0, filter: 0, bufSrc: 0 };
  }
  createGain() { this.nodesCreated.gain++; return new MockGainNode(); }
  createOscillator() { this.nodesCreated.osc++; return new MockOscillatorNode(); }
  createBiquadFilter() { this.nodesCreated.filter++; return new MockBiquadFilterNode(); }
  createBuffer(channels, length, sampleRate) {
    return {
      getChannelData: (ch) => new Float32Array(length)
    };
  }
  createBufferSource() { this.nodesCreated.bufSrc++; return new MockBufferSourceNode(); }
  resume() { this.state = "running"; }
}

// Sound system under test
function createSoundSystem(mockCtx) {
  let ctx = mockCtx, master = null, muted = false;
  master = ctx.createGain();
  master.gain.value = 0.28;

  function tone(f1, dur, type = "sine", f2 = f1, delay = 0, vol = 1) {
    if (muted) return;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, t0);
    if (f2 !== f1) osc.frequency.exponentialRampToValueAtTime(Math.max(10, f2), t0 + dur);
    g.gain.setValueAtTime(0.001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + Math.min(0.02, dur * 0.15));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noise(dur, filterFreq = 1000, type = "bandpass", delay = 0, vol = 1) {
    if (muted) return;
    const t0 = ctx.currentTime + delay;
    const bufSize = Math.max(256, Math.floor(ctx.sampleRate * Math.min(dur, 0.5)));
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufSize * 0.3));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(filterFreq, t0);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  const sounds = {
    click: () => tone(700, 0.035, "sine", 300, 0, 0.35),
    start: () => {
      noise(0.08, 400, "bandpass", 0, 0.4);
      tone(180, 0.2, "sine", 80, 0, 0.5);
      [261, 329, 392, 523, 659, 784].forEach((f, i) => tone(f, 0.35, "triangle", f, 0.12 + i * 0.07, 0.4));
    },
    openQ: () => {
      tone(698, 0.18, "triangle", 698, 0, 0.4);
      tone(1046, 0.3, "sine", 1046, 0.08, 0.5);
    },
    tick: () => {
      noise(0.015, 1800, "bandpass", 0, 0.25);
      tone(900, 0.02, "triangle", 400, 0, 0.15);
    },
    timeUp: () => {
      tone(523, 0.15, "square", 523, 0, 0.3);
      tone(392, 0.28, "square", 392, 0.14, 0.35);
    },
    reveal: () => {
      [440, 554, 659, 880].forEach((f, i) => tone(f, 0.28, "sine", f, i * 0.07, 0.35));
    },
    correct: () => {
      [392, 523, 659, 784].forEach((f, i) => tone(f, 0.35, "triangle", f, i * 0.08, 0.4));
      tone(1046, 0.45, "sine", 1046, 0.32, 0.5);
    },
    bothCorrect: () => {
      [261, 329, 392, 523, 659, 784, 1046].forEach((f, i) => {
        tone(f, 0.42, "triangle", f, i * 0.06, 0.4);
        tone(f * 1.5, 0.35, "sine", f * 1.5, i * 0.06 + 0.02, 0.2);
      });
    },
    wrong: () => {
      tone(349, 0.22, "sine", 311, 0, 0.35);
      tone(293, 0.35, "sine", 246, 0.16, 0.4);
    },
    build: () => {
      [0, 0.38, 0.76].forEach((t, i) => {
        noise(0.06, 2400 + i * 300, "bandpass", t, 0.4);
        tone(320 + i * 40, 0.09, "triangle", 160, t, 0.35);
      });
    },
    upgrade: () => {
      [523, 587, 659, 784, 880, 1046].forEach((f, i) => tone(f, 0.3, "triangle", f, i * 0.05, 0.35));
      [523, 659, 784, 1046].forEach(f => tone(f, 0.6, "sine", f, 0.32, 0.3));
    },
    openWheel: () => {
      [330, 392, 493, 587].forEach((f, i) => tone(f, 0.25, "sine", f, i * 0.05, 0.3));
    },
    wheelTick: () => {
      noise(0.012, 3200, "highpass", 0, 0.18);
      tone(1200, 0.015, "triangle", 600, 0, 0.12);
    },
    wheelUp2: () => {
      tone(220, 0.4, "sawtooth", 1100, 0, 0.35);
      tone(880, 0.35, "triangle", 880, 0.38, 0.4);
      tone(1320, 0.5, "sine", 1320, 0.48, 0.5);
    },
    wheelUp1: () => {
      [440, 554, 659].forEach((f, i) => tone(f, 0.3, "triangle", f, i * 0.09, 0.4));
    },
    wheelShield: () => {
      tone(440, 0.8, "sine", 440, 0, 0.4);
      tone(880, 0.8, "sine", 880, 0.05, 0.3);
      tone(1320, 0.9, "triangle", 1320, 0.1, 0.25);
    },
    wheelRaid: () => {
      noise(0.4, 300, "lowpass", 0, 0.5);
      tone(180, 0.35, "sawtooth", 45, 0, 0.45);
    },
    wheelSteal: () => {
      tone(260, 0.28, "triangle", 900, 0, 0.4);
      tone(1046, 0.35, "sine", 1046, 0.22, 0.45);
    },
    wheelMiss: () => {
      [587, 523, 440, 392].forEach((f, i) => tone(f, 0.28, "sine", f, i * 0.1, 0.3));
    },
    wheelDown: () => {
      tone(370, 0.35, "sawtooth", 185, 0, 0.4);
      tone(185, 0.45, "sine", 92, 0.18, 0.45);
    },
    wheelAid: () => {
      [330, 392, 523].forEach((f, i) => tone(f, 0.28, "triangle", f, i * 0.08, 0.35));
      tone(659, 0.4, "sine", 659, 0.24, 0.4);
    },
    wheelShieldBlock: () => {
      noise(0.18, 1600, "bandpass", 0, 0.4);
      tone(600, 0.35, "triangle", 300, 0, 0.35);
      tone(900, 0.5, "sine", 900, 0.06, 0.3);
    },
    victory: () => {
      const mel = [523, 523, 523, 659, 784, 659, 784, 1046];
      const times = [0, 0.14, 0.28, 0.45, 0.65, 0.85, 1.05, 1.3];
      const durs = [0.12, 0.12, 0.14, 0.18, 0.18, 0.18, 0.22, 0.8];
      mel.forEach((f, i) => {
        tone(f, durs[i], "triangle", f, times[i], 0.45);
        tone(f * 0.5, durs[i], "sine", f * 0.5, times[i], 0.3);
      });
    }
  };

  return {
    play: (name) => {
      if (sounds[name]) sounds[name]();
    },
    toggle: () => {
      muted = !muted;
      master.gain.value = muted ? 0 : 0.28;
      return !muted;
    },
    isMuted: () => muted,
    sounds
  };
}

// Run unit checks
const mockCtx = new MockAudioContext();
const sys = createSoundSystem(mockCtx);

const expectedSounds = [
  "click", "start", "openQ", "tick", "timeUp", "reveal",
  "correct", "bothCorrect", "wrong", "build", "upgrade",
  "openWheel", "wheelTick", "wheelUp2", "wheelUp1",
  "wheelShield", "wheelRaid", "wheelSteal", "wheelMiss", "victory",
  "wheelDown", "wheelAid", "wheelShieldBlock"
];

// Check all sound keys exist
expectedSounds.forEach(name => {
  assert(typeof sys.sounds[name] === "function", `Sound "${name}" must be registered`);
  const prevOsc = mockCtx.nodesCreated.osc;
  const prevBuf = mockCtx.nodesCreated.bufSrc;
  sys.play(name);
  const created = (mockCtx.nodesCreated.osc - prevOsc) + (mockCtx.nodesCreated.bufSrc - prevBuf);
  assert(created > 0, `Sound "${name}" must create at least one audio generator node`);
});

// Check mute toggle
assert.strictEqual(sys.isMuted(), false);
sys.toggle();
assert.strictEqual(sys.isMuted(), true);
const oscBefore = mockCtx.nodesCreated.osc;
sys.play("click");
assert.strictEqual(mockCtx.nodesCreated.osc, oscBefore, "No nodes should be created when muted");
sys.toggle();
assert.strictEqual(sys.isMuted(), false);

console.log(`PASS: All ${expectedSounds.length} sound effects verified successfully with Web Audio API mock.`);
