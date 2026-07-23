import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ROWS = 5;
const COLS = 6;
const SPACING = 3.2;

export default function TreasureMuseumScene({ items }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth || window.innerWidth;
    const h = mount.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1420);
    scene.fog = new THREE.Fog(0x1a1420, 20, 60);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
    camera.position.set(0, 6, 16);
    camera.lookAt(0, 1.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xccaadd, 0.55);
    scene.add(ambient);
    const topLight = new THREE.DirectionalLight(0xffe8c0, 0.9);
    topLight.position.set(5, 20, 10);
    scene.add(topLight);

    const disposables = [];

    // Floor
    const floorGeo = new THREE.PlaneGeometry(40, 40);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2030, flatShading: true });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    scene.add(floor);
    disposables.push(floorGeo, floorMat);

    // Back wall
    const wallGeo = new THREE.PlaneGeometry(40, 14);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x241c2c, flatShading: true });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 7, -10);
    scene.add(wall);
    disposables.push(wallGeo, wallMat);

    // Ceiling accent lights
    for (let i = -1; i <= 1; i++) {
      const lg = new THREE.PointLight(0xffd9a0, 0.5, 14);
      lg.position.set(i * 8, 6, 0);
      scene.add(lg);
    }

    // Pedestals + items
    const spinning = [];
    const maxItems = Math.min(items.length, ROWS * COLS);
    const startX = -((COLS - 1) * SPACING) / 2;
    for (let i = 0; i < maxItems; i++) {
      const item = items[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = startX + col * SPACING;
      const z = 6 - row * SPACING;

      const pedGeo = new THREE.CylinderGeometry(0.5, 0.6, 1.2, 8);
      const pedMat = new THREE.MeshStandardMaterial({ color: 0xdad0c8, flatShading: true });
      const pedestal = new THREE.Mesh(pedGeo, pedMat);
      pedestal.position.set(x, 0.6, z);
      scene.add(pedestal);
      disposables.push(pedGeo, pedMat);

      const itemColor = new THREE.Color(item.color || '#cccccc');
      const isTreasure = item.kind === 'treasure';
      const itemGeo = isTreasure ? new THREE.OctahedronGeometry(0.35, 0) : new THREE.DodecahedronGeometry(0.32, 0);
      const itemMat = new THREE.MeshStandardMaterial({
        color: itemColor,
        flatShading: true,
        emissive: isTreasure ? itemColor : 0x000000,
        emissiveIntensity: isTreasure ? 0.25 : 0,
      });
      const itemMesh = new THREE.Mesh(itemGeo, itemMat);
      itemMesh.position.set(x, 1.55, z);
      scene.add(itemMesh);
      disposables.push(itemGeo, itemMat);
      spinning.push(itemMesh);

      if (isTreasure) {
        const glowGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: itemColor, transparent: true, opacity: 0.15 });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(x, 1.55, z);
        scene.add(glow);
        disposables.push(glowGeo, glowMat);
      }
    }

    let animationId;
    const clock = new THREE.Clock();
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      spinning.forEach((m, i) => { m.rotation.y = t * 0.6 + i; m.position.y = 1.55 + Math.sin(t * 1.2 + i) * 0.06; });
      camera.position.x = Math.sin(t * 0.06) * 3;
      camera.lookAt(0, 1.5, 0);
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
      disposables.forEach(d => d.dispose());
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [items]);

  return <div ref={mountRef} className="absolute inset-0" style={{ touchAction: 'none' }} />;
}
