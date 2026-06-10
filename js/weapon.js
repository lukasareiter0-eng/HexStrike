// weapon.js — Simple rifle implementation with pooling and reload
import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';

class Weapon{
  constructor(scene, camera, world, audio, effects){
    this.scene = scene;
    this.camera = camera;
    this.world = world;
    this.audio = audio;
    this.effects = effects;

    this.magazine = 30;
    this.maxMagazine = 30;
    this.reserve = 120;
    this.fireRate = 0.12; // seconds
    this.timeSinceFire = 0;
    this.reloading = false;
    this.reloadTime = 1.2;

    this.bulletSpeed = 60;
    // recoil state for simple camera kick
    this.recoil = 0;

    // pool for bullets (simple array of objects used by world)
    this.world.initBulletPool(64);

    // mouse bindings
    this._bindEvents();
    // listen for ammo gifts from powerups
    window.addEventListener('giveAmmo', (e)=>{ const a = e.detail && e.detail.amount ? e.detail.amount : 30; this.reserve += a; });
  }

  _bindEvents(){
    document.addEventListener('mousedown', (e)=>{ if(e.button===0) this._firing=true; });
    document.addEventListener('mouseup', (e)=>{ if(e.button===0) this._firing=false; });
    // listen for ammo gifts from powerups
    window.addEventListener('giveAmmo', (e)=>{ const a = e.detail && e.detail.amount ? e.detail.amount : 30; this.reserve += a; });
  }
    document.addEventListener('keydown', (e)=>{ if(e.code==='KeyR') this.reload(); });
  // assign a 3D model (GLTF scene) to be used as first-person weapon
  setModel(model){
    if(this.modelGroup) this.scene.remove(this.modelGroup);
    this.modelGroup = new THREE.Group();
    // small transform so model sits in view
    this.modelGroup.add(model);
    model.position.set(0.6, -0.6, -1.2);
    model.rotation.set(0, Math.PI, 0);
    model.scale.set(1.0,1.0,1.0);
    // attach to camera by updating each frame in update
    this.scene.add(this.modelGroup);
  }
  }

  shoot(){
    if(this.reloading) return;
    if(this.magazine <= 0){ this.reload(); return; }
    // get bullet from pool
    const pos = new THREE.Vector3();
    this.camera.getWorldPosition(pos);
    const dir = new THREE.Vector3(0,0,-1).applyQuaternion(this.camera.quaternion).normalize();
    this.world.spawnBullet(pos, dir, this.bulletSpeed, 1.0);
    this.magazine -= 1;
    this.effects.muzzleFlash(pos, dir);
    this.effects.muzzleParticles(pos, dir);
    this.audio.playGunshot();
    // apply recoil
    this.recoil += 0.06;
    // screen flash
    // update modelGroup to follow camera
    if(this.modelGroup){
      const camPos = new THREE.Vector3(); this.camera.getWorldPosition(camPos);
      const camQuat = this.camera.quaternion.clone();
      this.modelGroup.position.copy(camPos);
      // offset in camera space
      this.modelGroup.quaternion.copy(camQuat);
      this.modelGroup.translateX(0.5);
      this.modelGroup.translateY(-0.5);
      this.modelGroup.translateZ(-1.0);
    }
    this.effects.screenFlash();
  }

  reload(){
    if(this.reloading) return;
    if(this.magazine === this.maxMagazine || this.reserve <= 0) return;
    this.reloading = true;
    this.audio.playReload();
    setTimeout(()=>{
      const need = this.maxMagazine - this.magazine;
      const take = Math.min(need, this.reserve);
      this.magazine += take;
      this.reserve -= take;
      this.reloading = false;
    }, this.reloadTime*1000);
  }

  update(dt){
    this.timeSinceFire += dt;
    if(this._firing && this.timeSinceFire >= this.fireRate){
      this.shoot();
      this.timeSinceFire = 0;
    }
    // apply recoil decay and temporary camera kick
    if(this.recoil > 0){
      // create a small upward camera rotation
      const kick = Math.min(this.recoil, 0.12);
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-kick,0,0,'XYZ'));
      this.camera.quaternion.multiply(q);
      // decay
      this.recoil = Math.max(0, this.recoil - dt * 4.0);
    }
  }
}

export { Weapon };
