// enemy.js — Basic enemy manager with three types and simple pursuit AI
import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';

class EnemyManager{
  constructor(scene, world, player, audio, effects){
    this.scene = scene; this.world = world; this.player = player; this.audio = audio; this.effects = effects;
    this.enemies = [];
    this.maxEnemies = 20;
    this.spawnInterval = 2.0;
    this.spawnTimer = 0;
    this.enabled = false;

    // difficulty / waves
    this.timeElapsed = 0;
    this.wave = 1;

    this.kills = 0;
    // spawn weights example: soldier common, fast less, heavy rare
    this.spawnWeights = {soldier:60, fast:30, heavy:10};
  }

  startSpawning(){ this.enabled = true; }

  // create and register a new enemy
  spawn(type, pos){
    const e = {};
    e.type = type;
    if(type==='soldier'){ e.maxHealth=30; e.speed=3.2; e.radius=0.4; e.color=0x8f8f8f; e.damage=6; }
    if(type==='fast'){ e.maxHealth=18; e.speed=5.2; e.radius=0.35; e.color=0xffcc66; e.damage=4; }
    if(type==='heavy'){ e.maxHealth=70; e.speed=2.0; e.radius=0.6; e.color=0x884444; e.damage=12; }
    e.health = e.maxHealth;
    e.mesh = new THREE.Mesh(new THREE.BoxGeometry(e.radius*2,e.radius*2,e.radius*2), new THREE.MeshStandardMaterial({color:e.color}));
    e.mesh.castShadow = true;
    e.mesh.position.copy(pos);
    this.scene.add(e.mesh);
    e.respawnTime = 5.0;
    e.dead = false;
    e._attackCooldown = 0;
    this.enemies.push(e);
    return e;
  }

  // weighted random spawn
  spawnRandom(){
    if(this.enemies.length >= this.maxEnemies) return;
    const x = (Math.random()-0.5)*80; const z = (Math.random()-0.5)*80 - 30;
    // pick by weight
    const types = Object.keys(this.spawnWeights);
    const total = types.reduce((s,t)=>s+this.spawnWeights[t], 0);
    let r = Math.random()*total;
    let chosen = types[0];
    for(const t of types){ r -= this.spawnWeights[t]; if(r<=0){ chosen = t; break; } }
    this.spawn(chosen, new THREE.Vector3(x,1.6,z));
  }

  // increase difficulty gradually
  _updateDifficulty(dt){
    this.timeElapsed += dt;
    if(this.timeElapsed > this.wave * 30){ this.wave += 1; this.maxEnemies = Math.min(60, this.maxEnemies + 5); this.spawnInterval = Math.max(0.6, this.spawnInterval - 0.1); }
    // scale weights slightly by wave
    this.spawnWeights.fast = 30 + Math.floor(this.wave/2)*2;
    this.spawnWeights.heavy = 10 + Math.floor(this.wave/3);
  }

  update(dt){
    if(this.enabled){ this.spawnTimer += dt; if(this.spawnTimer >= this.spawnInterval){ this.spawnTimer = 0; this.spawnRandom(); }}
    this._updateDifficulty(dt);

    for(let i=this.enemies.length-1;i>=0;i--){
      const e = this.enemies[i];
      if(e.dead){ e.respawnTime -= dt; if(e.respawnTime <= 0){
          // respawn at new pos
          this.scene.remove(e.mesh);
          this.enemies.splice(i,1);
          // spawn replacement
          const x = (Math.random()-0.5)*80; const z = (Math.random()-0.5)*80 - 30;
          this.spawn(e.type, new THREE.Vector3(x,1.6,z));
        } continue; }

      // pursuit with simple obstacle avoidance (stay above ground)
      const toPlayer = new THREE.Vector3().subVectors(this.player.position, e.mesh.position);
      const dist = toPlayer.length();
      if(dist > 0.1){
        toPlayer.normalize();
        // small lateral jitter for less robotic movement
        toPlayer.x += (Math.sin(performance.now()*0.001 + i) * 0.02);
        toPlayer.z += (Math.cos(performance.now()*0.001 + i) * 0.02);
        e.mesh.position.addScaledVector(toPlayer, e.speed * dt);
      }

      // attack if close
      if(dist < 1.6){
        e._attackCooldown -= dt;
        if(e._attackCooldown <= 0){
          e._attackCooldown = 0.8; // attack cooldown
          this.player.health -= e.damage;
          this.effects.screenDamage();
          this.audio.playPlayerHit();
        }
      }

      // check bullet collisions via world (bullets pool)
      this.world.bullets.forEach((b)=>{
        if(!b.active) return;
        const d = b.pos.distanceTo(e.mesh.position);
        if(d < e.radius + 0.12){
          // hit
          e.health -= b.damage;
          b.active = false; // deactivate bullet
          if(b.mesh) b.mesh.visible = false;
          this.effects.hitEffect(b.pos);
          this.effects.bloodSplash(b.pos);
          this.audio.playEnemyHit();
          // notify UI / other systems
          window.dispatchEvent(new CustomEvent('enemyHit',{detail:{pos:b.pos.clone(), damage:b.damage, enemyType:e.type}}));
          if(e.health <= 0){
            e.dead = true;
            this.kills += 1;
            this.effects.explosion(e.mesh.position);
              this.audio.playEnemyDie();
              this.audio.playExplosion();
            // schedule removal and respawn
            e.respawnTime = 4.0;
            e.mesh.visible = false;
          }
        }
      });
    }
  }
}

export { EnemyManager };
