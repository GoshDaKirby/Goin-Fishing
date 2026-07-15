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
const OTHER_SHIRTS = [0x9a3a7a, 0x7a9a3a, 0x3a9a7a, 0x9a7a3a, 0x7a3a9a, 0x3a7a3a];

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

export default function OceanScene({ location, castPhase, otherPlayers, onCharacterPlaced }) {
  const mountRef = useRef(null);
  const spotRef = useRef(null);
  const otherPlayersRef = useRef([]);
  otherPlayersRef.current = otherPlayers || [];
  const onCharacterPlacedRef = useRef(onCharacterPlaced);
  onCharacterPlacedRef.current = onCharacterPlaced;

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

    // Local character
    if (!spotRef.current || spotRef.current.loc !== location) {
      const spots = location === 'shore' ? SHORE_SPOTS : location === 'rocks' ? ROCK_SPOTS : BOAT_SPOTS;
      spotRef.current = { loc: location, spot: spots[Math.floor(Math.random() * spots.length)] };
    }
    const spot = spotRef.current.spot;
    const character = createCharacterGroup();
    character.position.set(spot[0], spot[1], spot[2]);
    character.rotation.y = spot[3];
    scene.add(character);

    if (onCharacterPlacedRef.current) {
      onCharacterPlacedRef.current(spot[0], spot[2], spot[3]);
    }

    let bobber = null;
    let lineGeo = null;
    let line = null;
    if (castPhase === 'waiting' || castPhase === 'biting') {
      const bobX = spot[0] + Math.sin(spot[3]) * 2.5;
      const bobZ = spot[2] + Math.cos(spot[3]) * 2.5;
      const rodTipX = spot[0] + Math.sin(spot[3]) * 0.6;
      const rodTipZ = spot[2] + Math.cos(spot[3]) * 0.6;

      lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(rodTipX, spot[1] + 0.8, rodTipZ),
        new THREE.Vector3(bobX, 0, bobZ),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
      line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);
      disposables.push(lineMat);

      const bg = new THREE.SphereGeometry(0.1, 6, 6);
      const bm = new THREE.MeshStandardMaterial({ color: 0xff4444, flatShading: true });
      bobber = new THREE.Mesh(bg, bm);
      bobber.position.set(bobX, 0, bobZ);
      scene.add(bobber);
      disposables.push(bg, bm);
    }

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
    const groundY = GROUND_Y[location] || 1.65;
    const otherChars = new Map();

    let animationId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

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

      if (bobber) {
        if (castPhase === 'biting') {
          bobber.position.y = Math.sin(t * 14) * 0.22;
        } else {
          bobber.position.y = Math.sin(t * 3) * 0.12 + Math.sin(t * 0.5) * 0.08;
        }
      }

      character.rotation.z = Math.sin(t * 0.8) * 0.03;

      // Update multiplayer characters
      const currentIds = new Set();
      const list = otherPlayersRef.current;
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        currentIds.add(p.id);
        if (!otherChars.has(p.id)) {
          const char = createCharacterGroup(OTHER_SHIRTS[otherChars.size % OTHER_SHIRTS.length]);
          scene.add(char);
          const label = createNameLabel(p.player_name || 'Player');
          scene.add(label.sprite);
          otherChars.set(p.id, { group: char, sprite: label.sprite, texture: label.texture, material: label.material });
        }
        const entry = otherChars.get(p.id);
        const px = p.character_x || 0;
        const pz = p.character_z || 0;
        entry.group.position.set(px, groundY, pz);
        entry.group.rotation.y = p.character_rot || 0;
        entry.group.rotation.z = Math.sin(t * 0.8 + px) * 0.03;
        entry.sprite.position.set(px, groundY + 1.7, pz);
      }
      for (const [id, entry] of otherChars) {
        if (!currentIds.has(id)) {
          scene.remove(entry.group);
          scene.remove(entry.sprite);
          disposeObject(entry.group);
          entry.texture.dispose();
          entry.material.dispose();
          otherChars.delete(id);
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
      disposeObject(character);
      decoFish.forEach(f => disposeObject(f));
      for (const [, entry] of otherChars) {
        scene.remove(entry.group);
        scene.remove(entry.sprite);
        disposeObject(entry.group);
        entry.texture.dispose();
        entry.material.dispose();
      }
      otherChars.clear();
      if (lineGeo) lineGeo.dispose();
      disposables.forEach(d => d.dispose());
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [location, castPhase]);

  return <div ref={mountRef} className="absolute inset-0" style={{ touchAction: 'none' }} />;
}