import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createFishGroup, createCharacterGroup, disposeObject } from './FishMesh';

const SHORE_SPOTS = [
  [-1, 1.65, -5, Math.PI], [1, 1.65, -5, Math.PI],
  [0, 1.65, -6, Math.PI], [-1, 1.65, -3, Math.PI],
  [1, 1.65, -3, Math.PI],
];
const ROCK_SPOTS = [
  [-2, 1.0, -1, Math.PI], [2, 1.0, -1, Math.PI],
  [0, 1.0, -2, Math.PI], [-2, 1.0, 1, 0],
  [2, 1.0, 1, 0],
];
const BOAT_SPOTS = [
  [-2.5, 1.2, 3, Math.PI / 2], [2.5, 1.2, 3, -Math.PI / 2],
  [-2.5, 1.2, 6, Math.PI / 2], [2.5, 1.2, 6, -Math.PI / 2],
  [0, 1.2, 2, Math.PI],
];

const GROUND_Y = { shore: 1.65, rocks: 1.0, deep: 1.2 };
const WALK_BOUNDS = {
  shore: { minX: -1.7, maxX: 1.7, minZ: -7.7, maxZ: 11.7 }, // matches the dock footprint (4 wide x 20 long, centered at z=2)
  rocks: { minX: -5, maxX: 5, minZ: -4, maxZ: 4 },
  deep: { minX: -6, maxX: 6, minZ: 0.5, maxZ: 8 },
};
const OTHER_SHIRTS = [0x9a3a7a, 0x7a9a3a, 0x3a9a7a, 0x9a7a3a, 0x7a3a9a, 0x3a7a3a];
const MOVE_SPEED = 3.2;
const BROADCAST_INTERVAL = 350; // ms - deliberately conservative; client-side interpolation smooths the gaps

// Simple deterministic string hash -> picks a stable (not random-every-reload)
// spawn spot per player id, so players spread out across the available spots
// instead of clumping from pure randomness.
function hashToIndex(str, mod) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % mod;
}

function createNameLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(16, 8, 224, 48);
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.substring(0, 14), 128, 32);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.5, 0.4, 1);
  return { sprite, texture, material };
}

function createChatBubble(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 72;
  const ctx = canvas.getContext('2d');
  const trimmed = text.length > 42 ? text.slice(0, 39) + '...' : text;
  ctx.font = '22px sans-serif';
  const metrics = ctx.measureText(trimmed);
  const boxW = Math.min(300, Math.max(60, metrics.width + 28));
  const boxX = (canvas.width - boxW) / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.roundRect(boxX, 6, boxW, 44, 12);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 8, 50);
  ctx.lineTo(canvas.width / 2 + 8, 50);
  ctx.lineTo(canvas.width / 2, 64);
  ctx.closePath();
  ctx.fill();
  ctx.font = '22px sans-serif';
  ctx.fillStyle = '#1a1a1a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(trimmed, canvas.width / 2, 28);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.8, 0.4, 1);
  return { sprite, texture, material };
}

export default function OceanScene({ location, castPhase, otherPlayers, onCharacterPlaced, nickname, headColor, bodyColor, hatColor, myId, chatBubbles }) {
  const mountRef = useRef(null);
  const spotRef = useRef(null);
  const otherPlayersRef = useRef([]);
  otherPlayersRef.current = otherPlayers || [];
  const onCharacterPlacedRef = useRef(onCharacterPlaced);
  onCharacterPlacedRef.current = onCharacterPlaced;
  const chatBubblesRef = useRef({});
  chatBubblesRef.current = chatBubbles || {};
  // castPhase only drives the bobber/line (handled by a separate effect below)
  // so it's tracked in a ref rather than being a dependency of the main scene
  // setup effect - rebuilding the whole scene on every cast would otherwise
  // snap the player's walked-to position back to their spawn point every
  // time they cast a line.
  const castPhaseRef = useRef(castPhase);
  castPhaseRef.current = castPhase;
  const sceneForBobberRef = useRef(null);
  const groundYForBobberRef = useRef(0);
  const spotForBobberRef = useRef(null);
  const bobberStateRef = useRef(null);
  const characterRef = useRef(null);
  const headColorRef = useRef(headColor);
  headColorRef.current = headColor;
  const bodyColorRef = useRef(bodyColor);
  bodyColorRef.current = bodyColor;
  const hatColorRef = useRef(hatColor);
  hatColorRef.current = hatColor;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth || window.innerWidth;
    const h = mount.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const skyColors = { shore: 0x87ceeb, rocks: 0x7ab8c8, deep: 0x5a8aaa };
    scene.background = new THREE.Color(skyColors[location] || 0x87ceeb);
    scene.fog = new THREE.Fog(skyColors[location] || 0x87ceeb, 30, 120);

    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 500);
    const camPositions = { shore: [4, 14, 3], rocks: [3, 15, 2], deep: [3, 13, 8] };
    const camLook = { shore: [0, 0, -3], rocks: [0, 0, 0], deep: [0, 0, 4] };
    camera.position.set(...(camPositions[location] || camPositions.shore));
    camera.lookAt(new THREE.Vector3(...(camLook[location] || camLook.shore)));

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const sun = new THREE.DirectionalLight(0xfff5e0, 1.3);
    sun.position.set(25, 35, 15);
    scene.add(sun);
    const ambient = new THREE.AmbientLight(0x99bbcc, 0.7);
    scene.add(ambient);

    const disposables = [];

    const waterGeo = new THREE.PlaneGeometry(200, 200, 25, 25);
    waterGeo.rotateX(-Math.PI / 2);
    const waterColors = { shore: 0x3a9aaa, rocks: 0x2a7a8a, deep: 0x1a5a7a };
    const waterMat = new THREE.MeshStandardMaterial({
      color: waterColors[location] || 0x3a9aaa,
      flatShading: true, transparent: true, opacity: 0.85,
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    scene.add(water);
    disposables.push(waterGeo, waterMat);
    const waterOriginal = waterGeo.attributes.position.array.slice();

    const sunGeo = new THREE.SphereGeometry(3, 8, 8);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xf5e6a0 });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.position.set(35, 28, -45);
    scene.add(sunMesh);
    disposables.push(sunGeo, sunMat);

    const clouds = [];
    for (let i = 0; i < 5; i++) {
      const cg = new THREE.SphereGeometry(2 + Math.random() * 1.5, 5, 4);
      const cm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 });
      const cloud = new THREE.Mesh(cg, cm);
      cloud.position.set((Math.random() - 0.5) * 80, 16 + Math.random() * 10, -25 - Math.random() * 40);
      cloud.scale.set(1.5 + Math.random(), 0.4, 1);
      scene.add(cloud);
      clouds.push({ mesh: cloud, speed: 0.3 + Math.random() * 0.3 });
      disposables.push(cg, cm);
    }

    if (location === 'shore') {
      const beachGeo = new THREE.PlaneGeometry(80, 20, 10, 5);
      beachGeo.rotateX(-Math.PI / 2);
      const beachMat = new THREE.MeshStandardMaterial({ color: 0xc9a87c, flatShading: true });
      const beach = new THREE.Mesh(beachGeo, beachMat);
      beach.position.set(0, 0.2, 12);
      scene.add(beach);
      disposables.push(beachGeo, beachMat);

      const dockGeo = new THREE.BoxGeometry(4, 0.3, 20);
      const dockMat = new THREE.MeshStandardMaterial({ color: 0x8b6b3a, flatShading: true });
      const dock = new THREE.Mesh(dockGeo, dockMat);
      dock.position.set(0, 1.5, 2);
      scene.add(dock);
      disposables.push(dockGeo, dockMat);

      for (let z = -7; z <= 9; z += 4) {
        for (const x of [-2, 2]) {
          const pg = new THREE.BoxGeometry(0.25, 3, 0.25);
          const pm = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, flatShading: true });
          const post = new THREE.Mesh(pg, pm);
          post.position.set(x, 0.5, z);
          scene.add(post);
          disposables.push(pg, pm);
        }
      }
    } else if (location === 'rocks') {
      const platGeo = new THREE.BoxGeometry(8, 1, 6);
      const platMat = new THREE.MeshStandardMaterial({ color: 0x6a6a6a, flatShading: true });
      const platform = new THREE.Mesh(platGeo, platMat);
      platform.position.set(0, 0.5, 0);
      scene.add(platform);
      disposables.push(platGeo, platMat);

      for (let i = 0; i < 6; i++) {
        const rs = 1.5 + Math.random() * 2;
        const rg = new THREE.IcosahedronGeometry(rs, 0);
        const rm = new THREE.MeshStandardMaterial({ color: 0x5a5a5a, flatShading: true });
        const rock = new THREE.Mesh(rg, rm);
        const angle = (i / 6) * Math.PI * 2;
        rock.position.set(Math.cos(angle) * 14, -0.5 + Math.random(), Math.sin(angle) * 10);
        rock.rotation.set(Math.random() * 2, Math.random() * 2, Math.random() * 2);
        rock.scale.y = 0.6;
        scene.add(rock);
        disposables.push(rg, rm);
      }
    } else if (location === 'deep') {
      const deckGeo = new THREE.BoxGeometry(10, 0.4, 7);
      const deckMat = new THREE.MeshStandardMaterial({ color: 0x8b6b3a, flatShading: true });
      const deck = new THREE.Mesh(deckGeo, deckMat);
      deck.position.set(0, 1, 4);
      scene.add(deck);
      disposables.push(deckGeo, deckMat);

      const cabGeo = new THREE.BoxGeometry(4, 2.5, 3);
      const cabMat = new THREE.MeshStandardMaterial({ color: 0x4a7a8a, flatShading: true });
      const cab = new THREE.Mesh(cabGeo, cabMat);
      cab.position.set(-3, 2.8, 6);
      scene.add(cab);
      disposables.push(cabGeo, cabMat);

      for (let z = 1; z <= 7; z += 3) {
        for (const x of [-5, 5]) {
          const rg = new THREE.BoxGeometry(0.15, 0.8, 0.15);
          const rm = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, flatShading: true });
          const rail = new THREE.Mesh(rg, rm);
          rail.position.set(x, 1.6, z);
          scene.add(rail);
          disposables.push(rg, rm);
        }
      }
    }

    // Local character - deterministic spot per device id so concurrent
    // players tend to spread across the available spots instead of all
    // rolling independent random picks (and colliding).
    const spots = location === 'shore' ? SHORE_SPOTS : location === 'rocks' ? ROCK_SPOTS : BOAT_SPOTS;
    if (!spotRef.current || spotRef.current.loc !== location) {
      const idx = myId ? hashToIndex(`${myId}:${location}`, spots.length) : Math.floor(Math.random() * spots.length);
      spotRef.current = { loc: location, spot: spots[idx] };
    }
    const spot = spotRef.current.spot;
    const character = createCharacterGroup(
      bodyColorRef.current ? parseInt(bodyColorRef.current.replace('#', ''), 16) : undefined,
      headColorRef.current ? parseInt(headColorRef.current.replace('#', ''), 16) : undefined,
      hatColorRef.current ? parseInt(hatColorRef.current.replace('#', ''), 16) : undefined,
    );
    character.position.set(spot[0], spot[1], spot[2]);
    character.rotation.y = spot[3];
    scene.add(character);
    characterRef.current = character;

    const groundY = GROUND_Y[location] || 1.65;
    const bounds = WALK_BOUNDS[location] || WALK_BOUNDS.shore;

    // Own nametag, visible to the local player too (mirrors what other
    // players see above your head).
    const ownLabel = createNameLabel(nickname || 'You');
    ownLabel.sprite.position.set(spot[0], groundY + 1.7, spot[2]);
    scene.add(ownLabel.sprite);

    if (onCharacterPlacedRef.current) {
      onCharacterPlacedRef.current(spot[0], spot[2], spot[3]);
    }

    // --- Movement: click/tap-to-walk (mouse or touch) + arrow keys / WASD ---
    const localPos = { x: spot[0], z: spot[2] };
    let localRot = spot[3];
    let moveTarget = null;
    const keys = {};
    const raycaster = new THREE.Raycaster();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -groundY);
    const ndc = new THREE.Vector2();
    const hitPoint = new THREE.Vector3();

    const setTargetFromClient = (clientX, clientY) => {
      const rect = renderer.domElement.getBoundingClientRect();
      ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(groundPlane, hitPoint)) {
        moveTarget = {
          x: Math.min(bounds.maxX, Math.max(bounds.minX, hitPoint.x)),
          z: Math.min(bounds.maxZ, Math.max(bounds.minZ, hitPoint.z)),
        };
      }
    };
    const handlePointerDown = (e) => {
      // Ignore multi-touch (pinch) gestures.
      if (e.touches && e.touches.length > 1) return;
      const point = e.touches ? e.touches[0] : e;
      setTargetFromClient(point.clientX, point.clientY);
    };
    const handleKeyDown = (e) => { keys[e.key] = true; };
    const handleKeyUp = (e) => { keys[e.key] = false; };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Bobber/line creation is handled by a separate effect (keyed on
    // castPhase) further down, using the refs populated just below, so
    // starting/ending a cast doesn't require rebuilding this whole scene.
    sceneForBobberRef.current = scene;
    groundYForBobberRef.current = groundY;
    spotForBobberRef.current = spot;

    // Decorative fish
    const decoFish = [];
    const fishColors = [0x8899aa, 0x5a8ca8, 0xa8c5d6, 0xc44545, 0xe8772e];
    for (let i = 0; i < 6; i++) {
      const fg = createFishGroup(fishColors[i % fishColors.length], 0.4 + Math.random() * 0.3);
      fg.position.set((Math.random() - 0.5) * 25, -1.5 - Math.random() * 2, (Math.random() - 0.5) * 20 - 5);
      fg.userData = {
        angle: Math.random() * Math.PI * 2,
        radius: 6 + Math.random() * 12,
        speed: 0.003 + Math.random() * 0.004,
        yBase: fg.position.y,
      };
      scene.add(fg);
      decoFish.push(fg);
    }

    // Multiplayer characters
    const otherChars = new Map();
    // Chat bubbles above heads: 'local' key for the local player, otherwise player id.
    const bubbles = new Map();

    function syncBubble(id, position) {
      const data = chatBubblesRef.current[id];
      const now = Date.now();
      const existing = bubbles.get(id);
      if (data && data.expiresAt > now) {
        if (!existing || existing.text !== data.text) {
          if (existing) {
            scene.remove(existing.sprite);
            existing.texture.dispose();
            existing.material.dispose();
          }
          const bubble = createChatBubble(data.text);
          scene.add(bubble.sprite);
          bubbles.set(id, { ...bubble, text: data.text });
        }
        const b = bubbles.get(id);
        b.sprite.position.set(position.x, position.y + 0.55, position.z);
      } else if (existing) {
        scene.remove(existing.sprite);
        existing.texture.dispose();
        existing.material.dispose();
        bubbles.delete(id);
      }
    }

    let animationId;
    const clock = new THREE.Clock();
    let lastFrameTime = clock.getElapsedTime();
    let sinceLastBroadcast = 0;
    let wasMoving = false;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const dt = Math.min(0.1, t - lastFrameTime);
      lastFrameTime = t;

      const positions = waterGeo.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        const x = waterOriginal[i];
        const z = waterOriginal[i + 2];
        positions[i + 1] = Math.sin(x * 0.25 + t * 0.8) * 0.3 + Math.cos(z * 0.2 + t * 0.6) * 0.2;
      }
      waterGeo.attributes.position.needsUpdate = true;
      waterGeo.computeVertexNormals();

      decoFish.forEach(fish => {
        const d = fish.userData;
        d.angle += d.speed;
        fish.position.x = Math.cos(d.angle) * d.radius;
        fish.position.z = Math.sin(d.angle) * d.radius;
        fish.position.y = d.yBase + Math.sin(t * 2 + d.angle * 3) * 0.15;
        fish.rotation.y = -d.angle + Math.PI / 2;
      });

      clouds.forEach(c => {
        c.mesh.position.x += c.speed * 0.01;
        if (c.mesh.position.x > 50) c.mesh.position.x = -50;
      });

      const activeBobber = bobberStateRef.current?.bobber;
      if (activeBobber) {
        if (castPhaseRef.current === 'biting') {
          activeBobber.position.y = Math.sin(t * 14) * 0.22;
        } else {
          activeBobber.position.y = Math.sin(t * 3) * 0.12 + Math.sin(t * 0.5) * 0.08;
        }
      }

      // --- Local movement ---
      let dx = 0, dz = 0;
      const left = keys['ArrowLeft'] || keys['a'] || keys['A'];
      const right = keys['ArrowRight'] || keys['d'] || keys['D'];
      const up = keys['ArrowUp'] || keys['w'] || keys['W'];
      const down = keys['ArrowDown'] || keys['s'] || keys['S'];
      if (left || right || up || down) {
        moveTarget = null;
        if (left) dx -= 1;
        if (right) dx += 1;
        if (up) dz -= 1;
        if (down) dz += 1;
      } else if (moveTarget) {
        const tx = moveTarget.x - localPos.x;
        const tz = moveTarget.z - localPos.z;
        const dist = Math.hypot(tx, tz);
        if (dist > 0.12) { dx = tx; dz = tz; } else { moveTarget = null; }
      }
      if (dx !== 0 || dz !== 0) {
        const mag = Math.hypot(dx, dz) || 1;
        localPos.x += (dx / mag) * MOVE_SPEED * dt;
        localPos.z += (dz / mag) * MOVE_SPEED * dt;
        localPos.x = Math.min(bounds.maxX, Math.max(bounds.minX, localPos.x));
        localPos.z = Math.min(bounds.maxZ, Math.max(bounds.minZ, localPos.z));
        localRot = Math.atan2(dx, dz);
        character.position.set(localPos.x, groundY, localPos.z);
        character.rotation.y = localRot;
        wasMoving = true;

        sinceLastBroadcast += dt * 1000;
        if (sinceLastBroadcast >= BROADCAST_INTERVAL && onCharacterPlacedRef.current) {
          sinceLastBroadcast = 0;
          onCharacterPlacedRef.current(localPos.x, localPos.z, localRot);
        }
      } else if (wasMoving) {
        // Just stopped - send one last precise update so remote players'
        // interpolation settles exactly where we actually stopped.
        wasMoving = false;
        sinceLastBroadcast = 0;
        if (onCharacterPlacedRef.current) onCharacterPlacedRef.current(localPos.x, localPos.z, localRot);
      }
      character.rotation.z = Math.sin(t * 0.8) * 0.03;
      ownLabel.sprite.position.set(localPos.x, groundY + 1.7, localPos.z);
      syncBubble('local', { x: localPos.x, y: groundY + 1.7, z: localPos.z });

      // Update multiplayer characters
      const currentIds = new Set();
      const list = otherPlayersRef.current;
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        currentIds.add(p.id);
        if (!otherChars.has(p.id)) {
          const shirtColor = p.body_color ? parseInt(p.body_color.replace('#', ''), 16) : OTHER_SHIRTS[otherChars.size % OTHER_SHIRTS.length];
          const skinColor = p.head_color ? parseInt(p.head_color.replace('#', ''), 16) : undefined;
          const hatColorVal = p.hat_color ? parseInt(p.hat_color.replace('#', ''), 16) : undefined;
          const char = createCharacterGroup(shirtColor, skinColor, hatColorVal);
          scene.add(char);
          const label = createNameLabel(p.player_name || 'Player');
          scene.add(label.sprite);
          otherChars.set(p.id, { group: char, sprite: label.sprite, texture: label.texture, material: label.material, firstUpdate: true, targetX: 0, targetZ: 0, targetRot: 0 });
        }
        const entry = otherChars.get(p.id);
        if (p.body_color && entry.lastBodyColor !== p.body_color) {
          entry.group.userData.shirtMat?.color.set(p.body_color);
          entry.lastBodyColor = p.body_color;
        }
        if (p.head_color && entry.lastHeadColor !== p.head_color) {
          entry.group.userData.skinMat?.color.set(p.head_color);
          entry.lastHeadColor = p.head_color;
        }
        if (p.hat_color && entry.lastHatColor !== p.hat_color) {
          entry.group.userData.hatMat?.color.set(p.hat_color);
          entry.lastHatColor = p.hat_color;
        }
        const px = p.character_x || 0;
        const pz = p.character_z || 0;
        entry.targetX = px;
        entry.targetZ = pz;
        entry.targetRot = p.character_rot || 0;
        if (entry.firstUpdate) {
          entry.group.position.set(px, groundY, pz);
          entry.group.rotation.y = entry.targetRot;
          entry.firstUpdate = false;
        }
        // Smoothly interpolate toward the latest known position every frame,
        // rather than only moving when a new update arrives - this is what
        // makes other players look like they're actually walking instead of
        // teleporting between position updates.
        const lerpFactor = Math.min(1, 4 * dt);
        entry.group.position.x += (entry.targetX - entry.group.position.x) * lerpFactor;
        entry.group.position.z += (entry.targetZ - entry.group.position.z) * lerpFactor;
        entry.group.rotation.y = entry.targetRot;
        entry.group.rotation.z = Math.sin(t * 0.8 + entry.group.position.x) * 0.03;
        entry.sprite.position.set(entry.group.position.x, groundY + 1.7, entry.group.position.z);
        syncBubble(p.id, { x: entry.group.position.x, y: groundY + 1.7, z: entry.group.position.z });
      }
      for (const [id, entry] of otherChars) {
        if (!currentIds.has(id)) {
          scene.remove(entry.group);
          scene.remove(entry.sprite);
          disposeObject(entry.group);
          entry.texture.dispose();
          entry.material.dispose();
          otherChars.delete(id);
          const b = bubbles.get(id);
          if (b) { scene.remove(b.sprite); b.texture.dispose(); b.material.dispose(); bubbles.delete(id); }
        }
      }

      const camPos = camPositions[location] || camPositions.shore;
      camera.position.x = camPos[0] + Math.sin(t * 0.12) * 0.8;
      camera.position.z = camPos[2] + Math.cos(t * 0.1) * 0.5;
      camera.lookAt(new THREE.Vector3(...(camLook[location] || camLook.shore)));

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const nw = mountRef.current.clientWidth;
      const nh = mountRef.current.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      disposeObject(character);
      characterRef.current = null;
      scene.remove(ownLabel.sprite);
      ownLabel.texture.dispose();
      ownLabel.material.dispose();
      decoFish.forEach(f => disposeObject(f));
      for (const [, entry] of otherChars) {
        scene.remove(entry.group);
        scene.remove(entry.sprite);
        disposeObject(entry.group);
        entry.texture.dispose();
        entry.material.dispose();
      }
      otherChars.clear();
      for (const [, b] of bubbles) {
        scene.remove(b.sprite);
        b.texture.dispose();
        b.material.dispose();
      }
      bubbles.clear();
      disposables.forEach(d => d.dispose());
      if (bobberStateRef.current) {
        scene.remove(bobberStateRef.current.bobber, bobberStateRef.current.line);
        bobberStateRef.current.geo?.dispose();
        bobberStateRef.current.mats?.forEach(m => m.dispose());
        bobberStateRef.current = null;
      }
      sceneForBobberRef.current = null;
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [location, myId]);

  // Bobber/line: created when a cast goes out, removed when it comes back in.
  // Kept separate from the main scene setup effect above so casting doesn't
  // tear down (and reset the position of) the player's character.
  useEffect(() => {
    const scene = sceneForBobberRef.current;
    const spot = spotForBobberRef.current;
    if (!scene || !spot) return;

    if (castPhase === 'waiting' || castPhase === 'biting') {
      const bobX = spot[0] + Math.sin(spot[3]) * 2.5;
      const bobZ = spot[2] + Math.cos(spot[3]) * 2.5;
      const rodTipX = spot[0] + Math.sin(spot[3]) * 0.6;
      const rodTipZ = spot[2] + Math.cos(spot[3]) * 0.6;

      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(rodTipX, spot[1] + 0.8, rodTipZ),
        new THREE.Vector3(bobX, 0, bobZ),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      const bg = new THREE.SphereGeometry(0.1, 6, 6);
      const bm = new THREE.MeshStandardMaterial({ color: 0xff4444, flatShading: true });
      const bobber = new THREE.Mesh(bg, bm);
      bobber.position.set(bobX, 0, bobZ);
      scene.add(bobber);

      bobberStateRef.current = { bobber, line, geo: lineGeo, mats: [lineMat, bg, bm] };
    }

    return () => {
      const state = bobberStateRef.current;
      if (state) {
        scene.remove(state.bobber);
        scene.remove(state.line);
        state.geo?.dispose();
        state.mats?.forEach(m => m.dispose?.());
        bobberStateRef.current = null;
      }
    };
  }, [castPhase]);

  // Live color updates for the local character, without touching position/
  // movement state or rebuilding the scene.
  useEffect(() => {
    const char = characterRef.current;
    if (!char) return;
    if (bodyColor && char.userData.shirtMat) char.userData.shirtMat.color.set(bodyColor);
    if (headColor && char.userData.skinMat) char.userData.skinMat.color.set(headColor);
    if (hatColor && char.userData.hatMat) char.userData.hatMat.color.set(hatColor);
  }, [headColor, bodyColor, hatColor]);

  return <div ref={mountRef} className="absolute inset-0" style={{ touchAction: 'none' }} />;
}
