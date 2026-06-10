// ui.js — Heads-up display and menus

class UI{
  constructor(player, weapon, enemies){
    this.player = player; this.weapon = weapon; this.enemies = enemies;
    this.fpsEl = document.getElementById('fps');
    this.timerEl = document.getElementById('timer');
    this.healthFill = document.getElementById('healthFill');
    this.ammoEl = document.getElementById('ammo');
    this.scoreEl = document.getElementById('score');
    this.killsEl = document.getElementById('kills');
    this.pauseOverlay = document.getElementById('pauseOverlay');
    this.gameOver = document.getElementById('gameOver');
    this.finalScore = document.getElementById('finalScore');

    this.elapsed = 0;
    this.paused = false;
    // listen for hit events to show hit marker
    window.addEventListener('enemyHit', (e)=>{ this._onEnemyHit(e.detail); });
  }

  _onEnemyHit(detail){
    // show hit marker and optional floating text
    if(this.enemies) this.enemies; // referenced for linter
    if(typeof window !== 'undefined' && window.effectsInstance){ window.effectsInstance.showHitMarker(); }
  }

  showPause(show){
    this.paused = show;
    if(show) this.pauseOverlay.classList.add('active'); else this.pauseOverlay.classList.remove('active');
  }

  update(dt, frame, audio){
    this.elapsed += dt;
    // fps simple
    const fps = Math.round(1/dt);
    this.fpsEl.textContent = `FPS: ${fps}`;
    // timer
    const minutes = Math.floor(this.elapsed/60); const seconds = Math.floor(this.elapsed%60).toString().padStart(2,'0');
    this.timerEl.textContent = `${minutes}:${seconds}`;
    // health
    const hp = Math.max(0, Math.round(this.player.health));
    const w = Math.max(0, Math.min(100, hp));
    this.healthFill.style.width = `${w}%`;
    // ammo
    this.ammoEl.textContent = `${this.weapon.magazine} / ${this.weapon.reserve}`;
    // score & kills
    this.killsEl.textContent = `Kills: ${this.enemies.kills}`;
    // show survival score if present
    if(window.survivalInstance){
      const s = window.survivalInstance.score || 0;
      this.scoreEl.textContent = `Score: ${s}`;
    }
    // game over
    if(this.player.health <= 0){ this.gameOver.classList.add('active'); this.finalScore.textContent = `Score: ${this.enemies.kills}`; }
  }
}

export { UI };
