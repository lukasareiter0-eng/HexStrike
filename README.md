# Blue Whale — 3D Shooter Prototype

Minimal Web-based 3D shooter prototype using Three.js.

Quick start

1. Open `index.html` in a modern browser (works via file:// with some browsers, recommended to use a local server).

2. Start a simple HTTP server (recommended):

```bash
# Python 3
python -m http.server 8000
# or using npm
npx serve . -s
```

3. Open `http://localhost:8000` and click the canvas to lock pointer.

Controls

- WASD: Bewegung
- Maus: Blick
- Linksklick: Schießen

Next steps

- Add enemies AI, scoring, health and UI
- Add better assets and models (GLTF)
- Implement weapon types and powerups

Notes on assets and testing

- The project includes placeholder procedural textures and a simple GLTF placeholder model. To use real PBR assets, place your files in `/assets/textures` and `/assets/models` and update the paths in `js/assetManager.js` or the loader call in `js/main.js` (e.g. `assets.loadGLTF('assets/models/weapon_rifle.glb')`).
- For best results run via a local HTTP server (browsers block some features for file://). Use:

```bash
python -m http.server 8000
# or
npx serve . -s
```

- Open `http://localhost:8000`, click the canvas to enable Pointer Lock and start the game.

- If models/textures fail to load the code will fallback to simple placeholder geometry so you can still test gameplay.