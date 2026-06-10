// effects.js — simple particle effects, muzzle flash and screen flashes
import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';

class Effects{
  constructor(scene){ this.scene = scene; this.pool = []; this._createScreenFlash(); this._initParticlePool(); }

  _createScreenFlash(){
    this.flashEl = document.createElement('div');
    this.flashEl.style.position = 'absolute'; this.flashEl.style.left = '0'; this.flashEl.style.top = '0';
    this.flashEl.style.right = '0'; this.flashEl.style.bottom = '0'; this.flashEl.style.pointerEvents='none';
    this.flashEl.style.background='white'; this.flashEl.style.opacity='0'; this.flashEl.style.transition='opacity 80ms linear';
    document.body.appendChild(this.flashEl);
    // hit marker element
    this.hitEl = document.createElement('div');
    this.hitEl.style.position = 'absolute'; this.hitEl.style.left = '50%'; this.hitEl.style.top = '50%';
    this.hitEl.style.transform = 'translate(-50%,-50%)'; this.hitEl.style.pointerEvents='none';
    this.hitEl.style.color = 'rgba(255,255,255,0.9)'; this.hitEl.style.fontSize = '28px';
    this.hitEl.style.textShadow = '0 0 10px rgba(255,100,50,0.8)'; this.hitEl.style.opacity = '0';
    this.hitEl.textContent = 'HIT';
    document.body.appendChild(this.hitEl);
  }

  muzzleFlash(pos, dir){
    // small ephemeral sphere
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.08,6,6), new THREE.MeshBasicMaterial({color:0xffdd66}));
    s.position.copy(pos).addScaledVector(dir, 0.7);
    this.scene.add(s);
    setTimeout(()=>{ this.scene.remove(s); }, 80);
  }

  showHitMarker(){
    this.hitEl.style.opacity = '1';
    this.hitEl.style.transform = 'translate(-50%,-50%) scale(1.2)';
    setTimeout(()=>{ this.hitEl.style.opacity = '0'; this.hitEl.style.transform = 'translate(-50%,-50%) scale(1.0)'; }, 120);
  }

  screenFlash(){
    this.flashEl.style.opacity = '0.25';
    setTimeout(()=>{ this.flashEl.style.opacity = '0'; }, 80);
  }

  hitEffect(pos){
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.08,6,6), new THREE.MeshBasicMaterial({color:0xffaa66}));
    p.position.copy(pos);
    this.scene.add(p);
    setTimeout(()=>{ this.scene.remove(p); }, 200);
  }

  explosion(pos){
    for(let i=0;i<8;i++){
      const geo = new THREE.SphereGeometry(0.06,6,6);
      const mat = new THREE.MeshBasicMaterial({color:0xff7755});
      const m = new THREE.Mesh(geo, mat);
      m.position.copy(pos);
      m.position.x += (Math.random()-0.5)*0.8; m.position.y += (Math.random()-0.5)*0.8; m.position.z += (Math.random()-0.5)*0.8;
      this.scene.add(m);
      setTimeout(()=>{ this.scene.remove(m); }, 500 + Math.random()*400);
    }
  }

  screenDamage(){
    this.flashEl.style.background = 'rgba(255,0,0,0.18)';
    this.flashEl.style.opacity = '0.35';
    setTimeout(()=>{ this.flashEl.style.opacity='0'; this.flashEl.style.background='white'; }, 200);
  }

  update(dt){ /* placeholder for future particle updates */ }

  _initParticlePool(){
    this.particles = [];
    this.maxParticles = 200;
    for(let i=0;i<this.maxParticles;i++){
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.05,6,6), new THREE.MeshBasicMaterial({color:0xffff88}));
      m.visible = false; m.frustumCulled = false; this.scene.add(m);
      this.particles.push({mesh:m, vel:new THREE.Vector3(), life:0});
    }
  }

  _spawnParticle(pos, vel, color, life=0.6, size=0.06){
    for(const p of this.particles){ if(!p.mesh.visible){ p.mesh.visible = true; p.mesh.position.copy(pos); p.mesh.material.color.set(color); p.vel.copy(vel); p.life = life; p.mesh.scale.set(size,size,size); return p; } }
    return null;
  }

  // muzzle particles: short fast particles along direction
  muzzleParticles(pos, dir){
    for(let i=0;i<6;i++){
      const v = dir.clone().multiplyScalar(20 + Math.random()*40).add(new THREE.Vector3((Math.random()-0.5)*2,(Math.random()-0.5)*2,(Math.random()-0.5)*2));
      this._spawnParticle(pos.clone().addScaledVector(dir, 0.6), v, 0xffcc66, 0.12, 0.04);
    }
  }

  // blood splatter particles
  bloodSplash(pos){
    for(let i=0;i<12;i++){
      const v = new THREE.Vector3((Math.random()-0.5)*4, Math.random()*4, (Math.random()-0.5)*4);
      this._spawnParticle(pos.clone(), v, 0xff4444, 0.6, 0.08);
    }
  }

  // Weather systems (simple particle emitters)
  startRain(intensity=1.0){
    if(this._rain) return;
    const count = Math.floor(2000 * Math.min(2, intensity));
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for(let i=0;i<count;i++){ positions[i*3] = (Math.random()-0.5)*200; positions[i*3+1] = Math.random()*80 + 10; positions[i*3+2] = (Math.random()-0.5)*200 - 20; }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({color:0x99ccff, size:0.6, transparent:true, opacity:0.6});
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
    this.scene.add(pts); this._rain = {pts, count};
  }
  stopRain(){ if(this._rain){ this.scene.remove(this._rain.pts); this._rain = null; } }

  startSnow(intensity=1.0){
    if(this._snow) return;
    const count = Math.floor(1200 * Math.min(2, intensity));
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for(let i=0;i<count;i++){ positions[i*3] = (Math.random()-0.5)*200; positions[i*3+1] = Math.random()*80 + 10; positions[i*3+2] = (Math.random()-0.5)*200 - 20; }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({color:0xffffff, size:1.2, transparent:true, opacity:0.85});
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
    this.scene.add(pts); this._snow = {pts, count};
  }
  stopSnow(){ if(this._snow){ this.scene.remove(this._snow.pts); this._snow = null; } }

  weatherUpdate(dt, state){
    // state: {rain:bool, snow:bool, intensity:0..1}
    if(state.rain){ this.startRain(state.intensity || 1.0); } else { this.stopRain(); }
    if(state.snow){ this.startSnow(state.intensity || 1.0); } else { this.stopSnow(); }
    // animate raindrops/snow
    if(this._rain){ const arr = this._rain.pts.geometry.attributes.position.array; for(let i=0;i<this._rain.count;i++){ let idx=i*3+1; arr[idx] -= 200 * dt * 0.6; if(arr[idx] < 0) arr[idx] = Math.random()*80 + 40; } this._rain.pts.geometry.attributes.position.needsUpdate = true; }
    if(this._snow){ const arr = this._snow.pts.geometry.attributes.position.array; for(let i=0;i<this._snow.count;i++){ let idx=i*3+1; arr[idx] -= 40 * dt * 0.6; if(arr[idx] < 0) arr[idx] = Math.random()*80 + 40; } this._snow.pts.geometry.attributes.position.needsUpdate = true; }
    // update particles pool
    for(const p of this.particles){ if(!p.mesh.visible) continue; p.life -= dt; if(p.life <= 0){ p.mesh.visible = false; continue; } p.vel.y -= 9.8 * dt * 0.6; p.mesh.position.addScaledVector(p.vel, dt); p.mesh.rotation.x += dt * 6; }
  }
}

export { Effects };
