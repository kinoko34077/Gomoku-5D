import * as THREE from 'three';
import { getDisplayedStackCountForPlayer, getPhaseStoneStyle } from '../phasePalette';
import type { Board, Coordinate } from '../types';
import type { VisualTuning } from '../visualTuning';

const countTextureCache = new Map<string, THREE.CanvasTexture>();

type BoardCell = Board[number][number][number];

interface StonePalette {
  baseColor: THREE.Color;
  emissive: THREE.Color;
  emissiveIntensity: number;
  textColor: string;
  outlineColor: string;
  rimColor: THREE.Color;
}

function getDisplayedStackCount(cell: BoardCell) {
  return getDisplayedStackCountForPlayer(cell.lastPlayer, cell.streak);
}

function getStonePalette(cell: BoardCell, inSlice: boolean, tuning: VisualTuning): StonePalette {
  const player = cell.lastPlayer ?? 'white';
  const palette = getPhaseStoneStyle(cell.phase, player, getDisplayedStackCount(cell), inSlice, {
    phaseSaturationBoost: tuning.phaseSaturationBoost,
    whitePhaseLightness: tuning.whitePhaseLightness,
    blackPhaseLightness: tuning.blackPhaseLightness,
    phaseGlow: tuning.phaseGlow,
  });

  return {
    baseColor: new THREE.Color(palette.fill),
    emissive: new THREE.Color(palette.emissive),
    emissiveIntensity: palette.emissiveIntensity,
    textColor: palette.text,
    outlineColor: palette.outline,
    rimColor: new THREE.Color(palette.rim),
  };
}

export function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach(item => item.dispose());
    return;
  }
  material.dispose();
}

export function disposeObject3D(object: THREE.Object3D) {
  object.traverse(child => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }
    if (mesh.material) {
      disposeMaterial(mesh.material);
    }
  });
}

export function get3DPosition(x: number, y: number, z: number, size: number, cellSpacing: number) {
  const offset = (size - 1) / 2;
  return new THREE.Vector3(
    (x - offset) * cellSpacing,
    (y - offset) * cellSpacing,
    (z - offset) * cellSpacing,
  );
}

export function createSliceBoardPlane(
  boardSize: number,
  axis: 'X' | 'Y' | 'Z' | 'none',
  index: number,
  cellSpacing: number,
  tuning: VisualTuning,
) {
  if (axis === 'none') return null;

  const size = (boardSize - 1) * cellSpacing + 1.2;
  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshBasicMaterial({
    color: 0xcfb07a,
    transparent: true,
    opacity: tuning.slicePlaneOpacity,
    side: THREE.DoubleSide,
  });
  const plane = new THREE.Mesh(geometry, material);

  if (axis === 'X') {
    plane.rotation.y = Math.PI / 2;
    plane.position.set((index - (boardSize - 1) / 2) * cellSpacing, 0, 0);
  } else if (axis === 'Y') {
    plane.rotation.x = Math.PI / 2;
    plane.position.set(0, (index - (boardSize - 1) / 2) * cellSpacing, 0);
  } else {
    plane.position.set(0, 0, (index - (boardSize - 1) / 2) * cellSpacing);
  }

  return plane;
}

export function createGridLines(
  points: number[],
  color: number,
  opacity: number,
  dashSize: number,
  gapSize: number,
) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const lines = new THREE.LineSegments(
    geometry,
    new THREE.LineDashedMaterial({
      color,
      transparent: true,
      opacity,
      dashSize,
      gapSize,
    }),
  );
  lines.computeLineDistances();
  return lines;
}

function createCountTexture(count: number, color: string, outlineColor: string) {
  const cacheKey = `${count}:${color}:${outlineColor}`;
  const cached = countTextureCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '900 42px Outfit, sans-serif';
  ctx.lineWidth = 8;
  ctx.strokeStyle = outlineColor;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeText(String(count), canvas.width / 2, canvas.height / 2);
  ctx.fillText(String(count), canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  countTextureCache.set(cacheKey, texture);
  return texture;
}

function createCountMarkers(count: number, color: string, outlineColor: string, inSlice: boolean, tuning: VisualTuning) {
  const texture = createCountTexture(count, color, outlineColor);
  if (!texture) return null;

  const group = new THREE.Group();
  const markerSize = Math.max(0.001, Math.abs(tuning.countMarkerScale));
  const markerOffset = tuning.countMarkerOffset;
  const markerGeometry = new THREE.PlaneGeometry(markerSize, markerSize);
  const directions = [
    { pos: [0, 0, markerOffset], rot: [0, 0, 0] },
    { pos: [0, 0, -markerOffset], rot: [0, Math.PI, 0] },
    { pos: [markerOffset, 0, 0], rot: [0, Math.PI / 2, 0] },
    { pos: [-markerOffset, 0, 0], rot: [0, -Math.PI / 2, 0] },
    { pos: [0, markerOffset, 0], rot: [-Math.PI / 2, 0, 0] },
    { pos: [0, -markerOffset, 0], rot: [Math.PI / 2, 0, 0] },
  ] as const;

  directions.forEach(({ pos, rot }) => {
    const marker = new THREE.Mesh(
      markerGeometry,
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        opacity: inSlice ? 0.92 : tuning.offSliceStoneOpacity,
      }),
    );
    marker.position.set(pos[0], pos[1], pos[2]);
    marker.rotation.set(rot[0], rot[1], rot[2]);
    group.add(marker);
  });

  return group;
}

export function createStoneMesh(
  cell: BoardCell,
  pos: THREE.Vector3,
  inSlice: boolean,
  baseGeometry: THREE.SphereGeometry,
  tuning: VisualTuning,
) {
  const palette = getStonePalette(cell, inSlice, tuning);
  const emissiveColor = palette.baseColor.clone().lerp(palette.emissive, 0.3);
  const material = new THREE.MeshStandardMaterial({
    color: palette.baseColor,
    emissive: emissiveColor,
    emissiveIntensity: cell.phase === 0 ? palette.emissiveIntensity : palette.emissiveIntensity * 0.8,
    roughness: cell.lastPlayer === 'white' ? 0.28 : 0.2,
    metalness: 0.08,
    transparent: true,
    opacity: inSlice ? 1 : tuning.offSliceStoneOpacity,
  });

  const stone = new THREE.Mesh(baseGeometry, material);
  stone.position.copy(pos);
  stone.scale.set(tuning.stoneScale, tuning.stoneScale, tuning.stoneScale);

  if (cell.phase > 0) {
    const tintShell = new THREE.Mesh(
      baseGeometry,
      new THREE.MeshBasicMaterial({
        color: palette.baseColor,
        transparent: true,
        opacity: inSlice ? 0.24 : Math.min(0.18, tuning.offSliceStoneOpacity * 0.5),
        depthWrite: false,
      }),
    );
    tintShell.scale.set(1.08, 1.08, 1.08);
    stone.add(tintShell);
  }

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.35, 0.042, 12, 40),
    new THREE.MeshBasicMaterial({
      color: palette.rimColor,
      transparent: true,
      opacity: inSlice ? 0.98 : tuning.offSliceStoneOpacity,
    }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.scale.set(1.22, 1.22, 1.22);
  rim.position.z = 0.03;
  stone.add(rim);

  const count = getDisplayedStackCount(cell);
  if (count >= 2) {
    const markers = createCountMarkers(count, palette.textColor, palette.outlineColor, inSlice, tuning);
    if (markers) {
      stone.add(markers);
    }
  }

  return stone;
}

export function getHoveredCoord(
  clientX: number,
  clientY: number,
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
  raycaster: THREE.Raycaster,
  mouse: THREE.Vector2,
  cellMeshes: Record<string, THREE.Object3D>,
  settings: { boardSize: number },
  sliceAxis: 'X' | 'Y' | 'Z' | 'none',
  sliceIndex: number,
): Coordinate | null {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const targets: THREE.Object3D[] = [];
  const coordMap: Record<string, Coordinate> = {};

  for (let x = 0; x < settings.boardSize; x++) {
    for (let y = 0; y < settings.boardSize; y++) {
      for (let z = 0; z < settings.boardSize; z++) {
        if (sliceAxis === 'X' && x !== sliceIndex) continue;
        if (sliceAxis === 'Y' && y !== sliceIndex) continue;
        if (sliceAxis === 'Z' && z !== sliceIndex) continue;

        const key = `${x},${y},${z}`;
        const target = cellMeshes[key];
        if (!target) continue;
        targets.push(target);
        coordMap[target.uuid] = [x, y, z];
      }
    }
  }

  const intersects = raycaster.intersectObjects(targets, true);
  if (intersects.length === 0) {
    return null;
  }

  let hitMesh: THREE.Object3D | null = intersects[0].object;
  let coords = coordMap[hitMesh.uuid] as Coordinate | undefined;
  while (!coords && hitMesh?.parent) {
    hitMesh = hitMesh.parent;
    coords = (hitMesh.userData.coord as Coordinate | undefined) ?? coordMap[hitMesh.uuid];
  }

  return coords ?? null;
}
