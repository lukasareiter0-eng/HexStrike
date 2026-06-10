// main.js — Entry point
import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';
import { Player } from './player.js';
import { World } from './world.js';
import { Weapon } from './weapon.js';
import { EnemyManager } from './enemy.js';
import { UI } from './ui.js';
import { AudioManager } from './audio.js';
import { Effects } from './effects.js';
import { SurvivalMode } from './modes.js';
import { Inventory } from './inventory.js';
import { AssetManager } from './assetManager.js';

// postprocessing imports (examples jsm via unpkg)
import { EffectComposer } from 'https://unpkg.com/three@0.154.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.154.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.154.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { SSAOPass } from 'https://unpkg.com/three@0.154.0/examples/jsm/postprocessing/SSAOPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.154.0/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'https://unpkg.com/three@0.154.0/examples/jsm/shaders/FXAAShader.js';

// Global singletons
let renderer, scene, camera, clock;
let player, world, weapon, enemies, ui, audio, effects;
let lastTime = 0;
let composer;
let pmremGenerator;
let directionalLight;
let timeOfDay = 0; // 0-24 hours mapped to 0..1

// survival mode manager
let survival;

init();

function init(){
  // renderer
  renderer = new THREE.WebGLRenderer({canvas: document.getElementById('glCanvas'), antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  // HDR / tone mapping for more realistic lighting
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  // softer shadows
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // scene & camera
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);

  clock = new THREE.Clock();

  // managers
  world = new World(scene);
  audio = new AudioManager();
  effects = new Effects(scene);
  // asset manager for loading models & textures
  const assets = new AssetManager();
  player = new Player(camera, world);
  weapon = new Weapon(scene, camera, world, audio, effects);
  enemies = new EnemyManager(scene, world, player, audio, effects);
  ui = new UI(player, weapon, enemies);
  survival = new SurvivalMode(scene, world, enemies, player, ui);
  window.survivalInstance = survival;
  // inventory
  const inventory = new Inventory();
  window.inventoryInstance = inventory;

  // asynchronously load weapon model and assign
  assets.loadGLTF('assets/models/weapon_rifle.glb').then((gltf)=>{
    if(weapon && gltf && gltf.scene){ weapon.setModel(gltf.scene); }
  });
  // expose effects for UI/event handlers
  window.effectsInstance = effects;

  // lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
  scene.add(hemi);
  directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5,20,10);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(2048,2048);
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 200;
  scene.add(directionalLight);

  // sky (large sphere) used for simple environment and PMREM generation
  const skyGeo = new THREE.SphereGeometry(300, 32, 15);
  const skyMat = new THREE.MeshBasicMaterial({color:0x79b4ff, side:THREE.BackSide});
  const sky = new THREE.Mesh(skyGeo, skyMat);
  scene.add(sky);

  // PMREM generator for environment reflections (PBR)
  pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const envMap = pmremGenerator.fromScene(sky).texture;
  scene.environment = envMap;

  // composer & postprocessing (bloom, ssao, fxaa)
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const ssao = new SSAOPass(scene, camera, window.innerWidth, window.innerHeight);
  ssao.kernelRadius = 16;
  composer.addPass(ssao);
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.6, 0.4, 0.85);
  composer.addPass(bloom);
  const fxaa = new ShaderPass(FXAAShader);
  fxaa.material.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
  composer.addPass(fxaa);

  // fog
  scene.fog = new THREE.FogExp2(0x9fbfe8, 0.0007);

  // UI bindings
  bindUI();

  // resize
  window.addEventListener('resize', onResize);

  lastTime = performance.now();
  animate();
}

function updateDayNight(dt){
  // simple cycle: increment timeOfDay (0..1)
  timeOfDay += dt * 0.02; // speed multiplier
  if(timeOfDay > 1) timeOfDay -= 1;
  // sun angle: 0..1 -> -PI..PI
  const angle = timeOfDay * Math.PI * 2;
  directionalLight.position.set(Math.cos(angle) * 30, Math.sin(angle) * 30, 10);
  // intensity and color
  const intensity = Math.max(0.15, Math.sin(angle) * 0.9);
  directionalLight.intensity = intensity;
  const dayColor = new THREE.Color(0xffffff);
  const nightColor = new THREE.Color(0x223355);
  directionalLight.color = dayColor.clone().lerp(nightColor, 1 - Math.max(0, Math.sin(angle)));
  // sky color
  const skyColor = new THREE.Color(0x87ceeb).lerp(new THREE.Color(0x071025), 1 - Math.max(0, Math.sin(angle)));
  scene.background.copy(skyColor);
  // fog density vary with time
  scene.fog.density = 0.0006 + (1 - Math.max(0, Math.sin(angle))) * 0.001;
}

// simple weather controller
let weatherState = {rain:false, snow:false, intensity:0};
let weatherTimer = 0;
function updateWeather(dt){
  weatherTimer -= dt;
  if(weatherTimer <= 0){
    weatherTimer = 40 + Math.random()*80;
    // random weather change
    const r = Math.random();
    if(r < 0.4){ weatherState = {rain:true, snow:false, intensity: 0.6 + Math.random()*0.8}; }
    else if(r < 0.6){ weatherState = {rain:false, snow:true, intensity: 0.6 + Math.random()*0.8}; }
    else { weatherState = {rain:false, snow:false, intensity:0}; }
  }
  effects.weatherUpdate(dt, weatherState);
}

function bindUI(){
  document.getElementById('btnStart').addEventListener('click', ()=>{
    document.querySelector('#startMenu').classList.remove('active');
    lockPointer();
    enemies.startSpawning();
    audio.playMusic();
  });
  document.getElementById('btnResume').addEventListener('click', resumeGame);
  document.getElementById('btnRestart').addEventListener('click', restartGame);
  document.getElementById('btnRestart2').addEventListener('click', restartGame);

  // pointer lock handling
  const canvas = renderer.domElement;
  canvas.addEventListener('click', ()=>{ canvas.requestPointerLock(); });
  document.addEventListener('pointerlockchange', ()=>{
    const locked = document.pointerLockElement === canvas;
    player.setPointerLocked(locked);
    ui.showPause(!locked);
  });

  // inputs for firing/reloading are handled in weapon and player modules
}

function lockPointer(){
  renderer.domElement.requestPointerLock();
}

function resumeGame(){
  lockPointer();
}

function restartGame(){
  // simple reset: reload page
  location.reload();
}

function onResize(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(){
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min(0.05, (now - lastTime)/1000);
  lastTime = now;

  // update systems
  player.update(dt);
  weapon.update(dt);
  enemies.update(dt);
  world.update(dt);
  effects.update(dt);
  survival.update(dt);
  ui.update(dt, renderer.info.render.frame, audio);
  updateDayNight(dt);
  updateWeather(dt);

  // render
  composer.render();
}

export { scene, camera, renderer };
