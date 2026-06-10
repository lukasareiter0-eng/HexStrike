// player.js — Handles FPS movement, physics and camera control
import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';

class Player{
  constructor(camera, world){
    this.camera = camera;
    this.world = world;
    this.position = new THREE.Vector3(0,1.6,5);
    this.velocity = new THREE.Vector3();
    this.onGround = false;
    this.speed = 6;
    this.sprintMultiplier = 1.7;
    this.jumpSpeed = 6;
    this.pointerLocked = false;
    this.yaw = 0; this.pitch = 0;
    this.input = {forward:false,back:false,left:false,right:false,jump:false,sprint:false};
    this.health = 100;

    // camera initial
    this.camera.position.copy(this.position);

    this._bindEvents();
  }

  _bindEvents(){
    document.addEventListener('keydown', (e)=>this._onKey(e, true));
    document.addEventListener('keyup', (e)=>this._onKey(e, false));
    document.addEventListener('mousemove', (e)=>this._onMouse(e));
  }

  setPointerLocked(locked){ this.pointerLocked = locked; }

  _onKey(e, down){
    if(e.code==='KeyW') this.input.forward = down;
    if(e.code==='KeyS') this.input.back = down;
    if(e.code==='KeyA') this.input.left = down;
    if(e.code==='KeyD') this.input.right = down;
    if(e.code==='Space') this.input.jump = down && this.onGround;
    if(e.code==='ShiftLeft') this.input.sprint = down;
  }

  _onMouse(e){
    if(!this.pointerLocked) return;
    const sensitivity = 0.0022;
    this.yaw -= e.movementX * sensitivity;
    this.pitch -= e.movementY * sensitivity;
    this.pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.pitch));
    this.camera.quaternion.setFromEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
  }

  applyGravity(dt){
    const GRAV = -18.0;
    this.velocity.y += GRAV * dt;
  }

  simpleCollision(pos){
    // prevent falling through ground at y=0.1
    if(pos.y < 1.6){ pos.y = 1.6; this.velocity.y = 0; this.onGround = true; }
  }

  update(dt){
    // movement
    const dir = new THREE.Vector3();
    if(this.input.forward) dir.z -= 1;
    if(this.input.back) dir.z += 1;
    if(this.input.left) dir.x -= 1;
    if(this.input.right) dir.x += 1;
    dir.normalize();

    const speed = this.speed * (this.input.sprint ? this.sprintMultiplier : 1);
    const move = new THREE.Vector3(dir.x,0,dir.z).applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,this.yaw,0)));
    move.multiplyScalar(speed * dt);

    // jump
    if(this.input.jump && this.onGround){ this.velocity.y = this.jumpSpeed; this.onGround = false; }

    // apply gravity
    this.applyGravity(dt);

    // integrate
    this.position.add(move);
    this.position.addScaledVector(this.velocity, dt);

    // simple world collisions
    this.simpleCollision(this.position);

    // update camera
    this.camera.position.copy(this.position);
  }
}

export { Player };
