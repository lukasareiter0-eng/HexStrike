// world.js — creates terrain, obstacles, and handles bullets pooling
import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';

class World{
  constructor(scene){
    this.scene = scene;
    this.bullets = [];

    this._createEnvironment();
  }

  _createEnvironment(){
    // ground with PBR-like material using placeholder textures
    const loader = new THREE.TextureLoader();
    const groundColor = loader.load(this._makeSolidTexture('#3a4b5a'));
    const groundNormal = loader.load(this._makeSolidTexture('#8080ff'));
    const groundMat = new THREE.MeshStandardMaterial({map: groundColor, normalMap: groundNormal, roughness:0.9, metalness:0.0});
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400,400), groundMat);
    ground.rotation.x = -Math.PI/2;
    ground.receiveShadow = true;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // buildings / obstacles with PBR variations
    for(let i=0;i<40;i++){
      const w = 2 + Math.random()*8; const h = 2 + Math.random()*10; const d = 2 + Math.random()*8;
      const color = new THREE.Color().setHSL(0.58 + Math.random()*0.05, 0.2 + Math.random()*0.2, 0.15 + Math.random()*0.2);
      const mat = new THREE.MeshStandardMaterial({color: color, roughness: 0.6 + Math.random()*0.4, metalness: 0.0});
      const b = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat);
      b.position.set((Math.random()-0.5)*120, h/2, (Math.random()-0.5)*120 - 20);
      b.receiveShadow = true; b.castShadow = true;
      this.scene.add(b);
    }
  }

  // helper to create a 2x2 dataURL solid color texture for placeholders
  _makeSolidCanvas(color){
    const c = document.createElement('canvas'); c.width = 2; c.height = 2;
    const ctx = c.getContext('2d'); ctx.fillStyle = color; ctx.fillRect(0,0,2,2);
    return c;
  }
  _makeSolidTexture(color){
    const c = this._makeSolidCanvas(color);
    return c.toDataURL();
  }

  initBulletPool(count){
    for(let i=0;i<count;i++){
      this.bullets.push({active:false,pos:new THREE.Vector3(),dir:new THREE.Vector3(),speed:0,life:0,mesh:null,damage:10});
    }
  }

  spawnBullet(position, direction, speed, life){
    // find inactive
    const b = this.bullets.find(x=>!x.active);
    if(b){
      b.active = true; b.pos.copy(position); b.dir.copy(direction); b.speed = speed; b.life = life; b.damage = 10;
      if(!b.mesh){
        const geo = new THREE.SphereGeometry(0.06,6,6); const mat = new THREE.MeshBasicMaterial({color:0xffff88});
        b.mesh = new THREE.Mesh(geo, mat);
        this.scene.add(b.mesh);
      }
      b.mesh.visible = true; b.mesh.position.copy(b.pos);
    }
  }

  update(dt){
    // update bullets
    this.bullets.forEach(b=>{
      if(!b.active) return;
      b.pos.addScaledVector(b.dir, b.speed * dt);
      b.life -= dt;
      if(b.mesh){ b.mesh.position.copy(b.pos); }
      if(b.life <= 0){ b.active = false; if(b.mesh) b.mesh.visible = false; }
    });
  }
}

export { World };
