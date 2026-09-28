
#dv-bible-game-widget-container {
  display: none;
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100dvh;
  z-index: 99999;
  background: linear-gradient(160deg, #fff3d6 0%, #ffffff 55%);
  font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  flex-direction: column;
  overflow: hidden;
}
#dv-bible-game-widget-container.dv-bible-game-widget-active { 
  display: flex; 
}
#dv-bible-game-widget-container * { 
  box-sizing: border-box; 
  -webkit-tap-highlight-color: transparent; 
}
.dv-bible-game-widget-chrome { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  padding: 16px 18px; 
  flex-shrink: 0; 
}
.dv-bible-game-widget-title { 
  font-weight: 600; 
  font-size: 0.85rem; 
  color: #1877F2;
  display: flex; 
  align-items: center; 
  gap: 8px; 
}
.dv-bible-game-widget-controls { 
  display: flex; 
  gap: 10px; 
}
.dv-bible-game-widget-ctrl-btn { 
  width: 48px; 
  height: 48px; 
  border-radius: 50%; 
  border: none; 
  background: rgba(0,0,0,0.08); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  color: #1c1e21; 
  flex-shrink: 0; 
  cursor: pointer; 
}
.dv-bible-game-widget-ctrl-btn.dv-bible-game-widget-on { 
  background: #1877F2; 
  color: #fff; 
}
.dv-bible-game-widget-pause-overlay { 
  display: none; 
  position: absolute; 
  inset: 0; 
  background: rgba(15,15,25,0.75); 
  z-index: 100000; 
  align-items: center; 
  justify-content: center; 
  flex-direction: column; 
  gap: 18px; 
  color: #fff; 
  text-align: center; 
}
.dv-bible-game-widget-pause-overlay.dv-bible-game-widget-show { 
  display: flex; 
}
.dv-bible-game-widget-big-label { 
  font-size: 1.6rem; 
  font-weight: 800; 
}
.dv-bible-game-widget-body-content { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: flex-start; 
  padding: 24px 16px; 
  transition: filter .2s; 
}
#dv-bible-game-widget-container.dv-bible-game-widget-paused .dv-bible-game-widget-body-content { 
  filter: blur(8px); 
  pointer-events: none; 
}
.dv-bible-game-widget-grid { 
  display: grid; 
  grid-template-columns: repeat(3, 1fr); 
  gap: 10px; 
  width: 100%; 
  max-width: 340px; 
  perspective: 800px; 
}
.dv-bible-game-widget-tile { 
  aspect-ratio: 1; 
  border-radius: 14px; 
  background: linear-gradient(160deg, #ffd166, #f5a623); 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-size: 2rem; 
  font-weight: 800; 
  color: #5c3a00; 
  box-shadow: 0 6px 0 #b9780f, 0 10px 16px rgba(0,0,0,0.25); 
  transform: translateY(0); 
  transition: transform .08s, box-shadow .08s; 
  cursor: pointer; 
  user-select: none; 
}
.dv-bible-game-widget-tile:active { 
  transform: translateY(4px); 
  box-shadow: 0 2px 0 #b9780f, 0 4px 8px rgba(0,0,0,0.2); 
}
.dv-bible-game-widget-tile.dv-bible-game-widget-blank { 
  visibility: hidden; 
}
.dv-bible-game-widget-tile.dv-bible-game-widget-solved-glow { 
  background: linear-gradient(160deg, #ffe08a, #ffcc4d); 
  box-shadow: 0 6px 0 #b9780f, 0 0 24px rgba(255,204,77,0.9); 
}
.dv-bible-game-widget-tbtn { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  padding: 10px 20px; 
  border-radius: 999px; 
  border: none; 
  font-size: 1rem; 
  font-weight: 700; 
  cursor: pointer; 
}
.dv-bible-game-widget-tbtn-primary { 
  background: #1877F2; 
  color: #fff; 
}
/* ── CONFETTI ── */
.dv-bible-game-widget-confetti {
  position: fixed; 
  z-index: 100001; 
  pointer-events: none;
  border-radius: 3px; 
  animation: dv-bible-game-widget-fall linear forwards;
}
@keyframes dv-bible-game-widget-fall {
  0%   { transform: translateY(-30px) rotate(0deg); opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(105vh) rotate(900deg); opacity: 0; }
}
</style>
<div id="dv-bible-game-widget-container">
  <div class="dv-bible-game-widget-chrome">
    <div class="dv-bible-game-widget-title">© Rev. Don Victor, PhD</div>
    <div class="dv-bible-game-widget-controls">
      <button class="dv-bible-game-widget-ctrl-btn dv-bible-game-widget-on" id="dv-bible-game-widget-btn-sound" aria-label="Toggle Sound">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.5 8.5a5 5 0 0 1 0 7"></path></svg>
      </button>
      <button class="dv-bible-game-widget-ctrl-btn" id="dv-bible-game-widget-btn-pause" aria-label="Pause">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
      </button>
      <button class="dv-bible-game-widget-ctrl-btn" id="dv-bible-game-widget-btn-exit" aria-label="Exit">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    </div>
  </div>
  <div class="dv-bible-game-widget-body-content">
    <div style="text-align:center;color:#1c1e21;font-size:1.3rem; font-weight:400;font-style:italic;margin-bottom:18px;">Slide to Spell JESUS! | 3D Game</div>
    <div class="dv-bible-game-widget-grid" id="dv-bible-game-widget-grid-el"></div>
  </div>
  <div class="dv-bible-game-widget-pause-overlay" id="dv-bible-game-widget-pause-overlay">
    <div class="dv-bible-game-widget-big-label">Paused</div>
    <button class="dv-bible-game-widget-tbtn dv-bible-game-widget-tbtn-primary" id="dv-bible-game-widget-btn-resume">Resume</button>
  </div>
</div>

<script>
(function(){
  'use strict';

  function dvBibleGameWidgetGetEl(id){ 
    return document.getElementById(id); 
  }

  var DV_BIBLE_GAME_STATE = { 
    soundOn: true, 
    tiles: null, 
    paused: false 
  };

  /* ══ AUDIO ENGINE ══ */
  let dvBibleGameWidgetAudioCtx = null;

  function dvBibleGameWidgetGetCtx(){
    if(!dvBibleGameWidgetAudioCtx){
      dvBibleGameWidgetAudioCtx = new(window.AudioContext||window.webkitAudioContext)();
    }
    if(dvBibleGameWidgetAudioCtx.state === 'suspended'){
      dvBibleGameWidgetAudioCtx.resume();
    }
    return dvBibleGameWidgetAudioCtx;
  }

  function dvBibleGameWidgetPlayFlip(){
    if(!DV_BIBLE_GAME_STATE.soundOn) return;
    const ctx = dvBibleGameWidgetGetCtx();
    const b = ctx.createBuffer(1, ctx.sampleRate * 0.07, ctx.sampleRate);
    const d = b.getChannelData(0);
    for(let i=0; i<d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 1.8);
    }
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = b; 
    s.connect(g); 
    g.connect(ctx.destination); 
    g.gain.value = 0.7; 
    s.start();
  }

  function dvBibleGameWidgetPlayVictory(){
    if(!DV_BIBLE_GAME_STATE.soundOn) return;
    const ctx = dvBibleGameWidgetGetCtx();
    [523, 659, 784, 1047, 1319, 1047, 1319, 1568].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); 
      g.connect(ctx.destination); 
      o.type = 'square'; 
      o.frequency.value = f;
      const t = ctx.currentTime + i * 0.13;
      g.gain.setValueAtTime(0, t); 
      g.gain.linearRampToValueAtTime(0.42, t + 0.01); 
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
      o.start(t); 
      o.stop(t + 0.28);
    });
  }

  /* ══ CONFETTI ENGINE ══ */
  function dvBibleGameWidgetLaunchConfetti(){
    const cols = ['#ffd700','#c0c0c0','#4a0e4e','#1877F2','#ff6b6b','#51cf66','#ff922b'];
    for(let i = 0; i < 90; i++){
      const p = document.createElement('div');
      p.className = 'dv-bible-game-widget-confetti';
      const dur = 1.6 + Math.random() * 1.6, sz = 8 + Math.random() * 10;
      p.style.cssText = `left:${Math.random() * 100}vw;top:-30px;background:${cols[i % cols.length]};width:${sz}px;height:${sz * (0.6 + Math.random() * 0.8)}px;border-radius:${Math.random() > 0.4 ? '50%' : '3px'};animation-duration:${dur}s;animation-delay:${Math.random() * 0.8}s;`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), (dur + 0.9) * 1000);
    }
  }
  var DV_BIBLE_GAME_SOLVED = ['J','E','S','U','S','\u271D','\u271D','\u271D',null];

  function dvBibleGameIdxToRC(i){ 
    return [Math.floor(i / 3), i % 3]; 
  }

  function dvBibleGameIsAdjacent(a, b){ 
    var ra = dvBibleGameIdxToRC(a), rb = dvBibleGameIdxToRC(b); 
    return Math.abs(ra[0] - rb[0]) + Math.abs(ra[1] - rb[1]) === 1; 
  }

  function dvBibleGameNewRound(){
    var arr = DV_BIBLE_GAME_SOLVED.slice(); 
    var blank = arr.indexOf(null);
    for(var m = 0; m < 120; m++){
      var neighbors = []; 
      for(var i = 0; i < 9; i++) {
        if(dvBibleGameIsAdjacent(i, blank)) neighbors.push(i);
      }
      var pick = neighbors[Math.floor(Math.random() * neighbors.length)];
      arr[blank] = arr[pick]; 
      arr[pick] = null; 
      blank = pick;
    }
    DV_BIBLE_GAME_STATE.tiles = arr; 
    dvBibleGameRender();
  }

  function dvBibleGameRender(glow){
    var grid = dvBibleGameWidgetGetEl('dv-bible-game-widget-grid-el'); 
    grid.innerHTML = '';
    DV_BIBLE_GAME_STATE.tiles.forEach(function(val, i){
      var el = document.createElement('div');
      el.className = 'dv-bible-game-widget-tile' + (val === null ? ' dv-bible-game-widget-blank' : '') + (glow ? ' dv-bible-game-widget-solved-glow' : '');
      el.textContent = val || '';
      el.addEventListener('click', function(){ 
        dvBibleGameTapTile(i); 
      });
      grid.appendChild(el);
    });
  }

  function dvBibleGameTapTile(i){
    if(DV_BIBLE_GAME_STATE.paused) return;
    var blank = DV_BIBLE_GAME_STATE.tiles.indexOf(null);
    if(!dvBibleGameIsAdjacent(i, blank) || DV_BIBLE_GAME_STATE.tiles[i] === null) return;

    dvBibleGameWidgetPlayFlip();

    DV_BIBLE_GAME_STATE.tiles[blank] = DV_BIBLE_GAME_STATE.tiles[i]; 
    DV_BIBLE_GAME_STATE.tiles[i] = null;
    dvBibleGameRender();

    if(DV_BIBLE_GAME_STATE.tiles.join('') === DV_BIBLE_GAME_SOLVED.join('')){
      dvBibleGameWidgetPlayVictory();
      dvBibleGameWidgetLaunchConfetti();
      dvBibleGameRender(true);
      setTimeout(function(){ 
        if(!DV_BIBLE_GAME_STATE.paused) dvBibleGameNewRound(); 
      }, 1700);
    }
  }

  dvBibleGameWidgetGetEl('dv-bible-game-widget-btn-sound').addEventListener('click', function(){ 
    DV_BIBLE_GAME_STATE.soundOn = !DV_BIBLE_GAME_STATE.soundOn; 
    this.classList.toggle('dv-bible-game-widget-on', DV_BIBLE_GAME_STATE.soundOn); 
  });

  var dvBibleGameWidgetContainer = dvBibleGameWidgetGetEl('dv-bible-game-widget-container');
  var dvBibleGameWidgetOverlay = dvBibleGameWidgetGetEl('dv-bible-game-widget-pause-overlay');

  dvBibleGameWidgetGetEl('dv-bible-game-widget-btn-pause').addEventListener('click', function(){ 
    DV_BIBLE_GAME_STATE.paused = true; 
    dvBibleGameWidgetContainer.classList.add('dv-bible-game-widget-paused'); 
    dvBibleGameWidgetOverlay.classList.add('dv-bible-game-widget-show'); 
  });

  dvBibleGameWidgetGetEl('dv-bible-game-widget-btn-resume').addEventListener('click', function(){ 
    DV_BIBLE_GAME_STATE.paused = false; 
    dvBibleGameWidgetContainer.classList.remove('dv-bible-game-widget-paused'); 
    dvBibleGameWidgetOverlay.classList.remove('dv-bible-game-widget-show'); 
  });

  dvBibleGameWidgetGetEl('dv-bible-game-widget-btn-exit').addEventListener('click', function(){ 
    DV_BIBLE_GAME_STATE.paused = false; 
    dvBibleGameWidgetContainer.classList.remove('dv-bible-game-widget-paused'); 
    dvBibleGameWidgetOverlay.classList.remove('dv-bible-game-widget-show'); 
    dvBibleGameWidgetContainer.classList.remove('dv-bible-game-widget-active'); 
  });

  var dvBibleGameTrigger = dvBibleGameWidgetGetEl('dv-bible-game-widget-trigger');
  if(dvBibleGameTrigger){
    dvBibleGameTrigger.addEventListener('click', function(){ 
      dvBibleGameWidgetContainer.classList.add('dv-bible-game-widget-active'); 
      dvBibleGameNewRound(); 
    });
  }
})();
