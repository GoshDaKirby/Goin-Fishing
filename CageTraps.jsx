import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createFishGroup, disposeObject } from './FishMesh';

export default function AquariumScene({ fish, hasMuseum, museumTier }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const w = mount.clientWidth || window.innerWidth;
    const h = mount.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(hasMuseum ? 0x0a2a3a : 0x0d3d4a);
    scene.fog = new THREE.Fog(hasMuseum ? 0x0a2a3a : 0x0d3d4a, 20, 60);

    const camera = new THREE.PerspectiveCamera(55, w / h, 0.1, 200);
    camera.position.set(0, 3, 15);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x6699bb, 0.6);
    scene.add(ambient);
    const topLight = new THREE.DirectionalLight(0xaaccdd, 0.8);
    topLight.position.set(0, 20, 5);
    scene.add(topLight);
    const pointLight = new THREE.PointLight(0x88ccdd, 0.5, 30);
    pointLight.position.set(0, 5, 5);
    scene.add(pointLight);

    const disposables = [];

    // Sandy bottom
    const sandGeo = new THREE.PlaneGeometry(50, 30, 15, 10);
    sandGeo.rotateX(-Math.PI / 2);
    const sandMat = new THREE.MeshStandardMaterial({ color: hasMuseum ? 0x9a8866 : 0x8a7a5a, flatShading: true });
    const sand = new THREE.Mesh(sandGeo, sandMat);
    sand.position.y = -3;
    scene.add(sand);
    disposables.push(sandGeo, sandMat);

    // Sand bumps
    for (let i = 0; i < 8; i++) {
      const bg = new THREE.SphereGeometry(0.5 + Math.random() * 0.8, 5, 4);
      const bm = new THREE.MeshStandardMaterial({ color: 0x8a7a5a, flatShading: true });
      const bump = new THREE.Mesh(bg, bm);
      bump.position.set((Math.random() - 0.5) * 30, -3 + Math.random() * 0.2, (Math.random() - 0.5) * 18);
      bump.scale.y = 0.3;
      scene.add(bump);
      disposables.push(bg, bm);
    }

    // Rocks
    for (let i = 0; i < 5; i++) {
      const rg = new THREE.IcosahedronGeometry(0.8 + Math.random() * 1, 0);
      const rm = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, flatShading: true });
      const rock = new THREE.Mesh(rg, rm);
      rock.position.set((Math.random() - 0.5) * 28, -2.5, (Math.random() - 0.5) * 16);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      scene.add(rock);
      disposables.push(rg, rm);
    }

    // Plants
    for (let i = 0; i < 8; i++) {
      const pg = new THREE.ConeGeometry(0.3, 1.5 + Math.random(), 5);
      const pm = new THREE.MeshStandardMaterial({ color: 0x2a6a3a, flatShading: true });
      const plant = new THREE.Mesh(pg, pm);
      plant.position.set((Math.random() - 0.5) * 28, -2, (Math.random() - 0.5) * 16);
      plant.userData = { sway: Math.random() * Math.PI * 2 };
      scene.add(plant);
      disposables.push(pg, pm);
    }

    // Museum pillars
    if (hasMuseum) {
      for (let i = 0; i < 4; i++) {
        const px = i < 2 ? -12 : 12;
        const pz = i % 2 === 0 ? -8 : 8;
        const colGeo = new THREE.CylinderGeometry(0.6, 0.6, 8, 8);
        const colMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, flatShading: true });
        const col = new THREE.Mesh(colGeo, colMat);
        col.position.set(px, 1, pz);
        scene.add(col);
        disposables.push(colGeo, colMat);
      }
      // Glow for higher tiers
      if (museumTier >= 3) {
        const glowGeo = new THREE.SphereGeometry(0.8, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ color: 0xf5a623, transparent: true, opacity: 0.6 });
        for (let i = 0; i < 3; i++) {
          const glow = new THREE.Mesh(glowGeo, glowMat);
          glow.position.set((Math.random() - 0.5) * 15, 3 + Math.random() * 3, (Math.random() - 0.5) * 10);
          scene.add(glow);
          disposables.push(glowGeo.clone(), glowMat.clone());
        }
      }
    }

    // Fish from bank
    const fishMeshes = [];
    const maxFish = Math.min(fish.length, 30);
    for (let i = 0; i < maxFish; i++) {
      const f = fish[i];
      const fg = createFishGroup(f.color, f.size || 0.5, f.species);
      fg.position.set((Math.random() - 0.5) * 20, -1 + Math.random() * 3, (Math.random() - 0.5) * 12);
      fg.userData = {
        angle: (i / maxFish) * Math.PI * 2 + Math.random(),
        radius: 4 + Math.random() * 8,
        speed: 0.002 + Math.random() * 0.003,
        yBase: fg.position.y,
        yFreq: 1 + Math.random() * 2,
        yAmp: 0.15 + Math.random() * 0.2,
      };
      scene.add(fg);
      fishMeshes.push(fg);
    }

    // Bubbles
    const bubbles = [];
    for (let i = 0; i < 12; i++) {
      const bg = new THREE.SphereGeometry(0.08, 5, 5);
      const bm = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
      const bubble = new THREE.Mesh(bg, bm);
      bubble.position.set((Math.random() - 0.5) * 25, -3 + Math.random() * 6, (Math.random() - 0.5) * 15);
      bubble.userData = { speed: 0.01 + Math.random() * 0.02, startY: bubble.position.x };
      scene.add(bubble);
      bubbles.push(bubble);
      disposables.push(bg, bm);
    }

    let animationId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      fishMeshes.forEach(fg => {
        const d = fg.userData;
        d.angle += d.speed;
        fg.position.x = Math.cos(d.angle) * d.radius;
        fg.position.z = Math.sin(d.angle) * d.radius;
        fg.position.y = d.yBase + Math.sin(t * d.yFreq + d.angle * 2) * d.yAmp;
        fg.rotation.y = -d.angle + Math.PI / 2;
      });

      bubbles.forEach(b => {
        b.position.y += b.userData.speed;
        if (b.position.y > 4) {
          b.position.y = -3;
          b.position.x = (Math.random() - 0.5) * 25;
          b.position.z = (Math.random() - 0.5) * 15;
        }
      });

      camera.position.x = Math.sin(t * 0.08) * 1.5;
      camera.position.y = 3 + Math.sin(t * 0.05) * 0.5;
      camera.lookAt(0, 0, 0);

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
      fishMeshes.forEach(f => disposeObject(f));
      disposables.forEach(d => d.dispose());
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [fish, hasMuseum, museumTier]);

  return <div ref={mountRef} className="absolute inset-0" style={{ touchAction: 'none' }} />;
}