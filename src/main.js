import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';

let scene, camera, renderer;
let controls = {forward:false,back:false,left:false,right:false};
let velocity = new THREE.Vector3();
let bullets = [];

init();
animate();

function init(){
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222233);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  camera.position.set(0,1.6,5);

  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // ground
  const groundMat = new THREE.MeshStandardMaterial({color:0x334455});
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200,200), groundMat);
  ground.rotation.x = -Math.PI/2;
  ground.receiveShadow = true;
  scene.add(ground);

  // simple player indicator
  const playerGeo = new THREE.BoxGeometry(0.5,0.5,0.5);
  const playerMat = new THREE.MeshStandardMaterial({color:0x44aa88});
  const player = new THREE.Mesh(playerGeo, playerMat);
  player.position.set(0,0.25,0);
  player.name = 'player';
  scene.add(player);

  // some targets
  for(let i=0;i<10;i++){
    const t = new THREE.Mesh(new THREE.SphereGeometry(0.3,12,12), new THREE.MeshStandardMaterial({color:0xaa4444}));
    t.position.set((Math.random()-0.5)*20,0.3,(Math.random()-0.5)*20 - 10);
    t.userData.health = 3;
    scene.add(t);
  }

  // lights
  const hemi = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.8);
  scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(5,10,7);
  scene.add(dir);

  // events
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mousedown', onMouseDown);

  // pointer lock for better control
  renderer.domElement.addEventListener('click', ()=>{ renderer.domElement.requestPointerLock(); });
}

let yaw = 0, pitch = 0;
function onMouseMove(e){
  if(document.pointerLockElement !== renderer.domElement) return;
  const sensitivity = 0.002;
  yaw -= e.movementX * sensitivity;
  pitch -= e.movementY * sensitivity;
  pitch = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, pitch));
  camera.quaternion.setFromEuler(new THREE.Euler(pitch, yaw, 0, 'YXZ'));
}

function onMouseDown(){ shoot(); }

function shoot(){
  const bulletGeo = new THREE.SphereGeometry(0.05,8,8);
  const bulletMat = new THREE.MeshBasicMaterial({color:0xffff66});
  const bullet = new THREE.Mesh(bulletGeo, bulletMat);
  const pos = new THREE.Vector3();
  camera.getWorldPosition(pos);
  bullet.position.copy(pos);
  const dir = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).normalize();
  bullet.userData.velocity = dir.multiplyScalar(30);
  bullet.userData.life = 2.0;
  scene.add(bullet);
  bullets.push(bullet);
}

function onKeyDown(e){
  if(e.code==='KeyW') controls.forward=true;
  if(e.code==='KeyS') controls.back=true;
  if(e.code==='KeyA') controls.left=true;
  if(e.code==='KeyD') controls.right=true;
}
function onKeyUp(e){
  if(e.code==='KeyW') controls.forward=false;
  if(e.code==='KeyS') controls.back=false;
  if(e.code==='KeyA') controls.left=false;
  if(e.code==='KeyD') controls.right=false;
}

function updatePlayer(dt){
  const speed = 5;
  const dir = new THREE.Vector3();
  if(controls.forward) dir.z -= 1;
  if(controls.back) dir.z += 1;
  if(controls.left) dir.x -= 1;
  if(controls.right) dir.x += 1;
  dir.normalize();
  // move in camera's XZ plane
  const move = new THREE.Vector3(dir.x,0,dir.z).applyQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(0,yaw,0)));
  velocity.copy(move.multiplyScalar(speed * dt));
  camera.position.add(velocity);
}

function animate(){
  const t0 = performance.now();
  let last = t0;
  function loop(){
    const now = performance.now();
    const dt = Math.min(0.05, (now-last)/1000);
    last = now;

    updatePlayer(dt);

    // update bullets
    for(let i=bullets.length-1;i>=0;i--){
      const b = bullets[i];
      b.position.addScaledVector(b.userData.velocity, dt);
      b.userData.life -= dt;
      // collision simple: distance to spheres
      scene.traverse((obj)=>{
        if(obj.userData && obj.userData.health && obj !== b){
          const d = obj.position.distanceTo(b.position);
          if(d < 0.4){
            obj.userData.health -= 1;
            if(obj.userData.health <= 0) scene.remove(obj);
            scene.remove(b);
            bullets.splice(i,1);
          }
        }
      });
      if(b.userData.life <= 0){ scene.remove(b); bullets.splice(i,1); }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function onWindowResize(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}