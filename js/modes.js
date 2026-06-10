// modes.js — Game modes (Zombie Survival & placeholder Battle Royale elements)
import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';

class SurvivalMode{
  constructor(scene, world, enemies, player, ui){
    this.scene = scene; this.world = world; this.enemies = enemies; this.player = player; this.ui = ui;
    this.wave = 0; this.timeSinceWave = 0; this.waveActive = false; this.enemiesRemaining = 0;
    this.spawnPoints = this._generateSpawnPoints(40);
    this.shopPoints = this._generateShopPoints(4);
    this.score = 0;
    this.highscores = this._loadHighscores();
    this.powerups = [];
  }

  _generateSpawnPoints(n){
    const arr = [];
    for(let i=0;i<n;i++) arr.push(new THREE.Vector3((Math.random()-0.5)*140,1.6,(Math.random()-0.5)*140 - 20));
    return arr;
  }

  _generateShopPoints(n){
    const arr = [];
    for(let i=0;i<n;i++) arr.push(new THREE.Vector3((Math.random()-0.5)*40,1.6,(Math.random()-0.5)*40 - 10));
    return arr;
  }

  startWave(){
    this.wave += 1; this.waveActive = true;
    const count = Math.min(12 + this.wave * 3, 120);
    this.enemiesRemaining = count;
    for(let i=0;i<count;i++){
      const p = this.spawnPoints[Math.floor(Math.random()*this.spawnPoints.length)];
      // determine type by wave
      let type = 'soldier';
      if(Math.random() < Math.min(0.15 + this.wave*0.02, 0.45)) type = 'fast';
      if(Math.random() < Math.min(0.05 + this.wave*0.01, 0.2)) type = 'heavy';
      if(Math.random() < Math.min(0.01 + this.wave*0.005, 0.05)) type = 'boss';
      if(type==='boss'){
        // boss: spawn multiple heavy units clustered
        for(let b=0;b<3;b++) this.enemies.spawn('heavy', new THREE.Vector3(p.x + (Math.random()-0.5)*4, 1.6, p.z + (Math.random()-0.5)*4));
      } else {
        this.enemies.spawn(type, p.clone());
      }
    }
    // spawn power-up occasionally
    if(Math.random() < 0.4){ this._spawnPowerUp(); }
  }

  _spawnPowerUp(){
    const types = ['health','ammo','speed','shield'];
    const type = types[Math.floor(Math.random()*types.length)];
    const p = this.spawnPoints[Math.floor(Math.random()*this.spawnPoints.length)].clone();
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.6,0.6), new THREE.MeshStandardMaterial({color: type==='health'?0x66ff88: type==='ammo'?0x66ccff: type==='speed'?0xffcc66:0xff66aa}));
    mesh.position.copy(p); mesh.position.y = 1.0; mesh.userData.powerup = type; this.scene.add(mesh);
    this.powerups.push(mesh);
  }

  update(dt){
    if(!this.waveActive){ this.timeSinceWave += dt; if(this.timeSinceWave > 8){ this.timeSinceWave = 0; this.startWave(); } }
    // track kills -> score
    this.ui.killsEl && (this.ui.killsEl.textContent = `Kills: ${this.enemies.kills}`);
    // pickup detection
    for(let i=this.powerups.length-1;i>=0;i--){ const pu = this.powerups[i]; if(pu.position.distanceTo(this.player.position) < 2.0){ this._applyPowerUp(pu.userData.powerup); this.scene.remove(pu); this.powerups.splice(i,1); } }
    // survival end
    if(this.player.health <= 0){ this._onGameOver(); }
  }

  _applyPowerUp(type){
    if(type==='health'){ this.player.health = Math.min(100, this.player.health + 35); }
    if(type==='ammo'){ /* give ammo to player weapon */ window.dispatchEvent(new CustomEvent('giveAmmo',{detail:{amount:60}})); }
    if(type==='speed'){ this.player.speed *= 1.3; setTimeout(()=>{ this.player.speed /= 1.3; }, 8000); }
    if(type==='shield'){ /* simple shield: reduce damage for few seconds */ this.player._shield = true; setTimeout(()=>{ this.player._shield=false; }, 8000); }
    this.score += 10;
  }

  _onGameOver(){
    this.waveActive = false;
    const score = this.enemies.kills;
    this.highscores.push(score); this.highscores.sort((a,b)=>b-a); this.highscores = this.highscores.slice(0,10);
    localStorage.setItem('bw_highscores', JSON.stringify(this.highscores));
  }

  _loadHighscores(){
    try{ const s = JSON.parse(localStorage.getItem('bw_highscores') || '[]'); return s; }catch(e){ return []; }
  }
}

export { SurvivalMode };
