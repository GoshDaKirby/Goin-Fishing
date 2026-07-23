import * as THREE from 'three';

function M(color) {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(color), flatShading: true });
}

function cone(group, mat, r, h, x, y, z, rz, rx, sx, sy, sz) {
  const g = new THREE.ConeGeometry(Math.max(0.01, r), Math.max(0.01, h), 6);
  if (rz) g.rotateZ(rz);
  if (rx) g.rotateX(rx);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  if (sx || sy || sz) m.scale.set(sx || 1, sy || 1, sz || 1);
  group.add(m);
  return m;
}

function sphere(group, mat, r, x, y, z) {
  const g = new THREE.SphereGeometry(Math.max(0.01, r), 6, 5);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  group.add(m);
  return m;
}

function box(group, mat, w, h, d, x, y, z) {
  const g = new THREE.BoxGeometry(Math.max(0.01, w), Math.max(0.01, h), Math.max(0.01, d));
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  group.add(m);
  return m;
}

function cyl(group, mat, rt, rb, h, x, y, z, rz, rx) {
  const g = new THREE.CylinderGeometry(Math.max(0.01, rt), Math.max(0.01, rb), Math.max(0.01, h), 6);
  const m = new THREE.Mesh(g, mat);
  m.position.set(x, y, z);
  if (rz) m.rotation.z = rz;
  if (rx) m.rotation.x = rx;
  group.add(m);
  return m;
}

const HALF_PI = Math.PI / 2;

// ── Shore ──

function sardine(c, s) {
  const g = new THREE.Group(), m = M(c);
  cone(g, m, s*0.2, s*1.4, 0, 0, 0, -HALF_PI, 0, 1, 0.4, 1);
  cone(g, m, s*0.15, s*0.4, -s*0.8, 0, 0, HALF_PI, 0, 1, 0.7, 0.2);
  cone(g, m, s*0.08, s*0.2, 0, s*0.12, 0, 0, 0, 0.3, 1, 1);
  g.userData.material = m; return g;
}

function mackerel(c, s) {
  const g = new THREE.Group(), m = M(c);
  cone(g, m, s*0.25, s*1.3, 0, 0, 0, -HALF_PI, 0, 1, 0.55, 1);
  cone(g, m, s*0.18, s*0.45, -s*0.75, 0, 0, HALF_PI, 0, 1, 0.8, 0.25);
  cone(g, m, s*0.1, s*0.25, 0, s*0.2, 0, 0, 0, 0.3, 1, 1);
  g.userData.material = m; return g;
}

function flounder(c, s) {
  const g = new THREE.Group(), m = M(c);
  sphere(g, m, s*0.5, 0, 0, 0).scale.set(0.7, 0.15, 1.2);
  cone(g, m, s*0.1, s*0.2, -s*0.5, 0, 0, HALF_PI, 0, 1, 0.5, 0.1);
  sphere(g, M(0x1a1a1a), s*0.05, s*0.15, s*0.05, s*0.25);
  sphere(g, M(0x1a1a1a), s*0.05, s*0.15, s*0.05, -s*0.25);
  g.userData.material = m; return g;
}

function clownfish(c, s) {
  const g = new THREE.Group(), m = M(c);
  sphere(g, m, s*0.3, 0, 0, 0).scale.set(1.2, 0.9, 0.8);
  cone(g, m, s*0.12, s*0.2, -s*0.4, 0, 0, HALF_PI, 0, 1.3, 0.4, 0.5);
  cone(g, m, s*0.06, s*0.15, s*0.05, s*0.2, 0, 0, 0, 0.3, 1, 1);
  cone(g, m, s*0.05, s*0.12, s*0.1, -s*0.02, s*0.15, HALF_PI, 0, 1, 0.5, 0.3);
  cone(g, m, s*0.05, s*0.12, s*0.1, -s*0.02, -s*0.15, HALF_PI, 0, 1, 0.5, 0.3);
  g.userData.material = m; return g;
}

function seabass(c, s) {
  const g = new THREE.Group(), m = M(c);
  cone(g, m, s*0.26, s*1.2, 0, 0, 0, -HALF_PI, 0, 1, 0.65, 1);
  cone(g, m, s*0.13, s*0.28, -s*0.7, 0, 0, HALF_PI, 0, 1, 0.7, 0.2);
  cone(g, m, s*0.1, s*0.25, s*0.2, s*0.22, 0, 0, 0, 0.3, 1, 1);
  cone(g, m, s*0.07, s*0.2, s*0.2, -s*0.02, s*0.18, HALF_PI, 0, 1, 0.5, 0.3);
  cone(g, m, s*0.07, s*0.2, s*0.2, -s*0.02, -s*0.18, HALF_PI, 0, 1, 0.5, 0.3);
  g.userData.material = m; return g;
}

function pufferfish(c, s) {
  const g = new THREE.Group(), m = M(c);
  sphere(g, m, s*0.45, 0, 0, 0);
  cone(g, m, s*0.08, s*0.12, s*0.5, 0, 0, -HALF_PI, 0, 1, 1, 1);
  cone(g, m, s*0.1, s*0.2, -s*0.5, 0, 0, HALF_PI, 0, 1, 0.6, 0.15);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const sp = cone(g, m, s*0.02, s*0.1, 0, 0, 0, 0, 0);
    sp.position.set(Math.cos(a) * s * 0.4, Math.sin(a) * s * 0.4, 0);
    sp.rotation.z = a - HALF_PI;
  }
  g.userData.material = m; return g;
}

function octopus(c, s) {
  const g = new THREE.Group(), m = M(c);
  sphere(g, m, s*0.4, 0, s*0.15, 0);
  sphere(g, M(0x1a1a1a), s*0.06, s*0.2, s*0.3, s*0.12);
  sphere(g, M(0x1a1a1a), s*0.06, -s*0.2, s*0.3, s*0.12);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const t = cyl(g, m, s*0.03, s*0.06, s*0.7, Math.cos(a)*s*0.2, -s*0.2, Math.sin(a)*s*0.2, 0, 0);
    t.rotation.x = 0.5;
    t.rotation.y = a;
  }
  g.userData.material = m; return g;
}

// ── Rocks ──

function rockfish(c, s) {
  const g = new THREE.Group(), m = M(c);
  cone(g, m, s*0.3, s*1.0, 0, 0, 0, -HALF_PI, 0, 1, 0.85, 1);
  sphere(g, m, s*0.22, s*0.55, 0, 0).scale.set(1, 1, 1.1);
  for (let i = 0; i < 5; i++)
    cone(g, m, s*0.03, s*0.2, s*0.3 - i*s*0.12, s*0.2, 0, 0, 0, 0.5, 1, 1);
  cone(g, m, s*0.12, s*0.25, -s*0.55, 0, 0, HALF_PI, 0, 1, 0.7, 0.2);
  cone(g, m, s*0.08, s*0.2, s*0.15, -s*0.02, s*0.2, HALF_PI, 0, 1, 0.5, 0.3);
  cone(g, m, s*0.08, s*0.2, s*0.15, -s*0.02, -s*0.2, HALF_PI, 0, 1, 0.5, 0.3);
  g.userData.material = m; return g;
}

function snapper(c, s) {
  const g = new THREE.Group(), m = M(c);
  cone(g, m, s*0.25, s*1.1, 0, 0, 0, -HALF_PI, 0, 1, 0.6, 1);
  cone(g, m, s*0.12, s*0.25, -s*0.65, 0, 0, HALF_PI, 0, 1, 0.7, 0.2);
  cone(g, m, s*0.08, s*0.2, s*0.2, s*0.2, 0, 0, 0, 0.3, 1, 1);
  cone(g, m, s*0.06, s*0.18, s*0.2, -s*0.02, s*0.18, HALF_PI, 0, 1, 0.5, 0.3);
  cone(g, m, s*0.06, s*0.18, s*0.2, -s*0.02, -s*0.18, HALF_PI, 0, 1, 0.5, 0.3);
  g.userData.material = m; return g;
}

function grouper(c, s) {
  const g = new THREE.Group(), m = M(c);
  sphere(g, m, s*0.4, 0, 0, 0).scale.set(1.3, 0.9, 0.85);
  cone(g, m, s*0.15, s*0.2, s*0.45, -s*0.05, 0, -HALF_PI, 0, 1.2, 0.7, 1);
  box(g, m, s*0.5, s*0.15, s*0.03, 0, s*0.3, 0);
  cone(g, m, s*0.12, s*0.25, -s*0.5, 0, 0, HALF_PI, 0, 1, 0.7, 0.2);
  cone(g, m, s*0.08, s*0.2, s*0.15, -s*0.02, s*0.2, HALF_PI, 0, 1, 0.5, 0.3);
  cone(g, m, s*0.08, s*0.2, s*0.15, -s*0.02, -s*0.2, HALF_PI, 0, 1, 0.5, 0.3);
  g.userData.material = m; return g;
}

function morayeel(c, s) {
  const g = new THREE.Group(), m = M(c);
  cyl(g, m, s*0.12, s*0.05, s*2.2, 0, 0, 0, HALF_PI, 0).scale.set(1, 1, 0.5);
  sphere(g, m, s*0.14, s*1.0, 0, 0);
  cone(g, m, s*0.05, s*0.15, s*1.15, 0, 0, -HALF_PI, 0, 1, 0.5, 1);
  cone(g, m, s*0.06, s*0.1, -s*1.1, 0, 0, HALF_PI, 0, 1, 0.5, 0.2);
  box(g, m, s*1.5, s*0.04, s*0.08, -s*0.2, s*0.08, 0);
  cone(g, m, s*0.04, s*0.12, s*0.6, -s*0.02, s*0.12, HALF_PI, 0, 1, 0.5, 0.3);
  cone(g, m, s*0.04, s*0.12, s*0.6, -s*0.02, -s*0.12, HALF_PI, 0, 1, 0.5, 0.3);
  g.userData.material = m; return g;
}

function lionfish(c, s) {
  const g = new THREE.Group(), m = M(c);
  sphere(g, m, s*0.35, 0, 0, 0).scale.set(1, 0.8, 0.7);
  cone(g, m, s*0.1, s*0.2, s*0.4, 0, 0, -HALF_PI, 0, 1, 0.5, 1);
  cone(g, m, s*0.12, s*0.3, -s*0.4, 0, 0, HALF_PI, 0, 1, 0.7, 0.2);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const sp = cone(g, m, s*0.015, s*0.4, 0, 0, 0, 0, 0);
    sp.position.set(Math.cos(a) * s * 0.28, Math.sin(a) * s * 0.28, 0);
    sp.rotation.z = a - HALF_PI;
  }
  g.userData.material = m; return g;
}

function lobster(c, s) {
  const g = new THREE.Group(), m = M(c);
  cyl(g, m, s*0.14, s*0.08, s*0.6, s*0.05, 0, 0, HALF_PI, 0);
  sphere(g, m, s*0.16, s*0.35, 0, 0);
  box(g, m, s*0.35, s*0.08, s*0.06, s*0.45, s*0.03, s*0.1);
  sphere(g, m, s*0.1, s*0.6, s*0.03, s*0.1);
  box(g, m, s*0.35, s*0.08, s*0.06, s*0.45, s*0.03, -s*0.1);
  sphere(g, m, s*0.1, s*0.6, s*0.03, -s*0.1);
  cone(g, m, s*0.18, s*0.12, -s*0.35, 0, 0, HALF_PI, 0, 1.5, 0.3, 1);
  for (let i = 0; i < 3; i++) {
    cyl(g, m, s*0.02, s*0.01, s*0.2, s*0.1 - i*s*0.1, -s*0.1, s*0.08, 0, 0.3);
    cyl(g, m, s*0.02, s*0.01, s*0.2, s*0.1 - i*s*0.1, -s*0.1, -s*0.08, 0, -0.3);
  }
  g.userData.material = m; return g;
}

function seaturtle(c, s) {
  const g = new THREE.Group(), m = M(c);
  sphere(g, m, s*0.45, 0, s*0.1, 0).scale.set(1, 0.5, 1.2);
  sphere(g, m, s*0.13, s*0.5, s*0.05, 0);
  box(g, m, s*0.3, s*0.05, s*0.15, s*0.2, 0, s*0.35);
  box(g, m, s*0.3, s*0.05, s*0.15, s*0.2, 0, -s*0.35);
  box(g, m, s*0.25, s*0.05, s*0.12, -s*0.2, 0, s*0.3);
  box(g, m, s*0.25, s*0.05, s*0.12, -s*0.2, 0, -s*0.3);
  cone(g, m, s*0.08, s*0.15, -s*0.45, 0, 0, HALF_PI, 0, 1, 0.5, 0.5);
  g.userData.material = m; return g;
}

// ── Deep Water ──

function tuna(c, s) {
  const g = new THREE.Group(), m = M(c);
  cone(g, m, s*0.28, s*1.4, 0, 0, 0, -HALF_PI, 0, 1, 0.6, 1);
  for (let i = 0; i < 4; i++)
    cone(g, m, s*0.04, s*0.1, s*0.3 - i*s*0.1, s*0.2, 0, 0, 0, 0.5, 1, 1);
  cone(g, m, s*0.15, s*0.3, -s*0.75, 0, 0, HALF_PI, 0, 1, 0.7, 0.2);
  cone(g, m, s*0.1, s*0.25, s*0.25, s*0.22, 0, 0, 0, 0.3, 1, 1);
  cone(g, m, s*0.08, s*0.25, s*0.3, -s*0.02, s*0.2, HALF_PI, 0, 1, 0.5, 0.3);
  cone(g, m, s*0.08, s*0.25, s*0.3, -s*0.02, -s*0.2, HALF_PI, 0, 1, 0.5, 0.3);
  g.userData.material = m; return g;
}

function swordfish(c, s) {
  const g = new THREE.Group(), m = M(c);
  cone(g, m, s*0.25, s*1.2, 0, 0, 0, -HALF_PI, 0, 1, 0.6, 1);
  cyl(g, m, s*0.02, s*0.08, s*0.6, s*0.8, 0, 0, HALF_PI, 0);
  cone(g, m, s*0.12, s*0.3, s*0.15, s*0.25, 0, 0, 0, 0.3, 1, 1);
  cone(g, m, s*0.15, s*0.3, -s*0.7, 0, 0, HALF_PI, 0, 1, 0.7, 0.2);
  g.userData.material = m; return g;
}

function marlin(c, s) {
  const g = new THREE.Group(), m = M(c);
  cone(g, m, s*0.25, s*1.3, 0, 0, 0, -HALF_PI, 0, 1, 0.6, 1);
  cyl(g, m, s*0.02, s*0.08, s*0.7, s*0.85, 0, 0, HALF_PI, 0);
  box(g, m, s*0.5, s*0.35, s*0.02, s*0.1, s*0.25, 0);
  cone(g, m, s*0.15, s*0.3, -s*0.75, 0, 0, HALF_PI, 0, 1, 0.7, 0.2);
  cone(g, m, s*0.08, s*0.2, s*0.2, -s*0.02, s*0.2, HALF_PI, 0, 1, 0.5, 0.3);
  cone(g, m, s*0.08, s*0.2, s*0.2, -s*0.02, -s*0.2, HALF_PI, 0, 1, 0.5, 0.3);
  g.userData.material = m; return g;
}

function sunfish(c, s) {
  const g = new THREE.Group(), m = M(c);
  sphere(g, m, s*0.5, 0, 0, 0).scale.set(0.7, 1.3, 0.25);
  box(g, m, s*0.3, s*0.25, s*0.03, -s*0.1, s*0.55, 0);
  box(g, m, s*0.3, s*0.25, s*0.03, -s*0.1, -s*0.55, 0);
  box(g, m, s*0.1, s*0.15, s*0.02, -s*0.5, 0, 0);
  sphere(g, M(0x1a1a1a), s*0.05, s*0.25, s*0.1, s*0.15);
  g.userData.material = m; return g;
}

function shark(c, s) {
  const g = new THREE.Group(), m = M(c);
  cone(g, m, s*0.3, s*1.5, 0, 0, 0, -HALF_PI, 0, 1, 0.65, 1);
  cone(g, m, s*0.12, s*0.25, s*0.8, 0, 0, -HALF_PI, 0, 1, 1, 1);
  cone(g, m, s*0.15, s*0.4, 0, s*0.3, 0, 0, 0, 1, 0.3, 1);
  cone(g, m, s*0.15, s*0.35, -s*0.8, s*0.1, 0, HALF_PI - 0.5, 0, 1, 0.5, 0.3);
  cone(g, m, s*0.12, s*0.3, -s*0.8, -s*0.1, 0, HALF_PI + 0.5, 0, 1, 0.5, 0.3);
  cone(g, m, s*0.1, s*0.3, s*0.1, -s*0.05, s*0.2, HALF_PI, 0, 1, 0.4, 0.3);
  cone(g, m, s*0.1, s*0.3, s*0.1, -s*0.05, -s*0.2, HALF_PI, 0, 1, 0.4, 0.3);
  g.userData.material = m; return g;
}

function manta(c, s) {
  const g = new THREE.Group(), m = M(c);
  sphere(g, m, s*0.5, 0, 0, 0).scale.set(1.2, 0.1, 1.5);
  cone(g, m, s*0.1, s*0.25, s*0.5, 0, s*0.03, s*0.1, -HALF_PI + 0.5, 0, 1, 1, 1);
  cone(g, m, s*0.1, s*0.25, s*0.5, 0, s*0.03, -s*0.1, -HALF_PI - 0.5, 0, 1, 1, 1);
  cyl(g, m, s*0.03, s*0.01, s*1.2, -s*0.7, 0, 0, HALF_PI, 0);
  g.userData.material = m; return g;
}

function whale(c, s) {
  const g = new THREE.Group(), m = M(c);
  sphere(g, m, s*0.5, 0, 0, 0).scale.set(1.5, 0.7, 0.8);
  sphere(g, m, s*0.3, s*0.6, -s*0.05, 0);
  cone(g, m, s*0.2, s*0.3, -s*0.8, 0, 0, HALF_PI, 0, 2, 0.15, 1);
  cone(g, m, s*0.08, s*0.25, s*0.2, -s*0.05, s*0.3, HALF_PI, 0, 1, 0.5, 0.3);
  cone(g, m, s*0.08, s*0.25, s*0.2, -s*0.05, -s*0.3, HALF_PI, 0, 1, 0.5, 0.3);
  g.userData.material = m; return g;
}

function anglerfish(c, s) {
  const g = new THREE.Group(), m = M(c);
  const lureMat = M(0xffdd44);
  sphere(g, m, s*0.4, 0, 0, 0).scale.set(1, 0.8, 0.9);
  cone(g, m, s*0.2, s*0.3, s*0.35, -s*0.05, 0, -HALF_PI, 0, 1.5, 0.8, 1);
  cyl(g, lureMat, s*0.01, s*0.01, s*0.3, s*0.25, s*0.25, 0, 0, 0.3);
  sphere(g, lureMat, s*0.06, s*0.3, s*0.38, 0);
  cone(g, m, s*0.12, s*0.25, -s*0.45, 0, 0, HALF_PI, 0, 1, 0.7, 0.2);
  for (let i = 0; i < 4; i++) {
    cone(g, M(0xffffff), s*0.012, s*0.05, s*0.3 + i*s*0.06, -s*0.05, s*0.08, Math.PI, 0, 1, 1, 1);
    cone(g, M(0xffffff), s*0.012, s*0.05, s*0.3 + i*s*0.06, -s*0.05, -s*0.08, Math.PI, 0, 1, 1, 1);
  }
  g.userData.material = m; return g;
}

function giantsquid(c, s) {
  const g = new THREE.Group(), m = M(c);
  cone(g, m, s*0.25, s*0.9, s*0.2, 0, 0, -HALF_PI, 0, 1, 1, 1);
  sphere(g, M(0xffffff), s*0.08, s*0.55, s*0.1, s*0.15);
  sphere(g, M(0xffffff), s*0.08, s*0.55, s*0.1, -s*0.15);
  sphere(g, M(0x1a1a1a), s*0.04, s*0.58, s*0.12, s*0.15);
  sphere(g, M(0x1a1a1a), s*0.04, s*0.58, s*0.12, -s*0.15);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const t = cyl(g, m, s*0.02, s*0.04, s*1.0, -s*0.2, Math.sin(a)*s*0.05, Math.cos(a)*s*0.1, HALF_PI, 0);
    t.rotation.x = 0.3;
    t.rotation.y = a * 0.5;
  }
  cyl(g, m, s*0.025, s*0.01, s*1.6, -s*0.3, 0, s*0.08, HALF_PI, 0);
  cyl(g, m, s*0.025, s*0.01, s*1.6, -s*0.3, 0, -s*0.08, HALF_PI, 0);
  cone(g, m, s*0.1, s*0.15, s*0.1, 0, 0, -HALF_PI, 0, 0.3, 1, 2);
  g.userData.material = m; return g;
}

function coelacanth(c, s) {
  const g = new THREE.Group(), m = M(c);
  cone(g, m, s*0.3, s*1.2, 0, 0, 0, -HALF_PI, 0, 1, 0.75, 1);
  cone(g, m, s*0.08, s*0.15, s*0.35, -s*0.15, s*0.25, HALF_PI, 0, 1, 0.5, 0.3);
  cone(g, m, s*0.08, s*0.15, s*0.35, -s*0.15, -s*0.25, HALF_PI, 0, 1, 0.5, 0.3);
  cone(g, m, s*0.08, s*0.2, -s*0.2, s*0.2, 0, 0, 0, 0.5, 1, 1);
  cone(g, m, s*0.15, s*0.3, -s*0.7, s*0.1, 0, HALF_PI - 0.4, 0, 1, 0.5, 0.3);
  cone(g, m, s*0.12, s*0.25, -s*0.7, -s*0.1, 0, HALF_PI + 0.4, 0, 1, 0.5, 0.3);
  cone(g, m, s*0.08, s*0.2, -s*0.75, 0, 0, HALF_PI, 0, 1, 0.5, 0.2);
  g.userData.material = m; return g;
}

function megamouth(c, s) {
  const g = new THREE.Group(), m = M(c);
  cone(g, m, s*0.3, s*1.4, 0, 0, 0, -HALF_PI, 0, 1, 0.7, 1);
  sphere(g, m, s*0.3, s*0.7, 0, 0).scale.set(1, 0.9, 1.3);
  cone(g, m, s*0.12, s*0.3, s*0.1, s*0.25, 0, 0, 0, 0.3, 1, 1);
  cone(g, m, s*0.15, s*0.3, -s*0.75, s*0.08, 0, HALF_PI - 0.4, 0, 1, 0.5, 0.3);
  cone(g, m, s*0.12, s*0.25, -s*0.75, -s*0.08, 0, HALF_PI + 0.4, 0, 1, 0.5, 0.3);
  g.userData.material = m; return g;
}

function oarfish(c, s) {
  const g = new THREE.Group(), m = M(c);
  const finMat = M(0xff3333);
  cyl(g, m, s*0.08, s*0.03, s*3.5, 0, 0, 0, HALF_PI, 0).scale.set(1, 1, 0.4);
  sphere(g, m, s*0.1, s*1.8, 0, 0);
  box(g, finMat, s*3.0, s*0.25, s*0.02, 0, s*0.12, 0);
  cone(g, m, s*0.04, s*0.12, s*1.7, 0, s*0.1, HALF_PI, 0, 1, 0.5, 0.3);
  cone(g, m, s*0.04, s*0.12, s*1.7, 0, -s*0.1, HALF_PI, 0, 1, 0.5, 0.3);
  g.userData.material = m; return g;
}

const builders = {
  sardine, mackerel, flounder, clownfish, seabass, pufferfish, octopus,
  rockfish, snapper, grouper, morayeel, lionfish, lobster, seaturtle,
  tuna, swordfish, marlin, sunfish, shark, manta, whale, anglerfish,
  giantsquid, coelacanth, megamouth, oarfish,
};

export function createSpeciesMesh(species, color, size) {
  const builder = builders[species];
  return builder ? builder(color, size) : null;
}