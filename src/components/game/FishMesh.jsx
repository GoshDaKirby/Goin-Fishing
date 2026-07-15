import * as THREE from 'three';
import { createSpeciesMesh } from './SpeciesMeshes';

export function createFishGroup(color, size = 0.5, species = null) {
  if (species) {
    const custom = createSpeciesMesh(species, color, size);
    if (custom) return custom;
  }
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), flatShading: true });

  const bodyGeo = new THREE.ConeGeometry(Math.max(0.05, size * 0.35), Math.max(0.1, size * 1.2), 6);
  bodyGeo.rotateZ(-Math.PI / 2);
  bodyGeo.scale(1, 0.6, 1);
  const body = new THREE.Mesh(bodyGeo, mat);
  group.add(body);

  const tailGeo = new THREE.ConeGeometry(Math.max(0.04, size * 0.25), Math.max(0.08, size * 0.5), 4);
  tailGeo.rotateZ(Math.PI / 2);
  const tail = new THREE.Mesh(tailGeo, mat);
  tail.position.x = -size * 0.75;
  tail.scale.set(1, 0.8, 0.3);
  group.add(tail);

  const finGeo = new THREE.ConeGeometry(Math.max(0.03, size * 0.15), Math.max(0.05, size * 0.3), 4);
  finGeo.rotateX(Math.PI / 2);
  const fin = new THREE.Mesh(finGeo, mat);
  fin.position.set(0, size * 0.3, 0);
  fin.scale.set(0.3, 1, 1);
  group.add(fin);

  group.userData.material = mat;
  return group;
}

export function createCharacterGroup(shirtColor = 0x3a7a9a) {
  const group = new THREE.Group();
  const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, flatShading: true });
  const skinMat = new THREE.MeshStandardMaterial({ color: 0xe8b890, flatShading: true });
  const pantsMat = new THREE.MeshStandardMaterial({ color: 0x3a4a5a, flatShading: true });
  const hatMat = new THREE.MeshStandardMaterial({ color: 0x8b6b3a, flatShading: true });
  const rodMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, flatShading: true });

  const bodyGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.7, 6);
  const body = new THREE.Mesh(bodyGeo, shirtMat);
  body.position.y = 0.55;
  group.add(body);

  const headGeo = new THREE.SphereGeometry(0.18, 6, 6);
  const head = new THREE.Mesh(headGeo, skinMat);
  head.position.y = 1.05;
  group.add(head);

  const hatGeo = new THREE.ConeGeometry(0.24, 0.18, 8);
  const hat = new THREE.Mesh(hatGeo, hatMat);
  hat.position.y = 1.28;
  group.add(hat);

  const brimGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.04, 8);
  const brim = new THREE.Mesh(brimGeo, hatMat);
  brim.position.y = 1.18;
  group.add(brim);

  const armGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 4);
  const rightArm = new THREE.Mesh(armGeo, shirtMat);
  rightArm.position.set(0.28, 0.6, 0);
  rightArm.rotation.z = -0.4;
  group.add(rightArm);

  const legGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.4, 4);
  const leftLeg = new THREE.Mesh(legGeo, pantsMat);
  leftLeg.position.set(-0.1, 0.15, 0);
  group.add(leftLeg);
  const rightLeg = new THREE.Mesh(legGeo, pantsMat);
  rightLeg.position.set(0.1, 0.15, 0);
  group.add(rightLeg);

  const rodGeo = new THREE.CylinderGeometry(0.015, 0.02, 1.2, 4);
  const rod = new THREE.Mesh(rodGeo, rodMat);
  rod.position.set(0.35, 0.7, 0.05);
  rod.rotation.z = -0.6;
  group.add(rod);

  return group;
}

export function disposeObject(obj) {
  obj.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
      else child.material.dispose();
    }
  });
}