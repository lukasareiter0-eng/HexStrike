// assetManager.js — simple loader wrapper for Textures and GLTF models
import * as THREE from 'https://unpkg.com/three@0.154.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.154.0/examples/jsm/loaders/GLTFLoader.js';

class AssetManager{
  constructor(){
    this.texLoader = new THREE.TextureLoader();
    this.gltfLoader = new GLTFLoader();
    this.cache = {textures:{}, models:{}};
  }

  loadTexture(url){
    return new Promise((resolve)=>{
      if(!url){ resolve(null); return; }
      if(this.cache.textures[url]) resolve(this.cache.textures[url]);
      this.texLoader.load(url, (tex)=>{ this.cache.textures[url]=tex; resolve(tex); }, undefined, ()=>{ resolve(null); });
    });
  }

  loadGLTF(url){
    return new Promise((resolve)=>{
      if(!url){ resolve(this._makePlaceholderModel()); return; }
      if(this.cache.models[url]) resolve(this.cache.models[url]);
      this.gltfLoader.load(url, (gltf)=>{ this.cache.models[url]=gltf; resolve(gltf); }, undefined, (err)=>{ console.warn('gltf load err',err); resolve(this._makePlaceholderModel()); });
    });
  }

  _makePlaceholderModel(){
    // create a simple rifle-like placeholder
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.6,0.12,0.12), new THREE.MeshStandardMaterial({color:0x222222})); b.position.set(0,0,0);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.18,0.3), new THREE.MeshStandardMaterial({color:0x333333})); stock.position.set(-0.35,0,0);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.9,8), new THREE.MeshStandardMaterial({color:0x111111})); barrel.rotation.z = Math.PI/2; barrel.position.set(0.5,0,0);
    g.add(b); g.add(stock); g.add(barrel);
    return {scene: g};
  }
}

export { AssetManager };
