import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Board, Coordinate, WinInfo, GameSettings } from '../types';
import type { Threat } from '../gameLogic';
import type { VisualTuning } from '../visualTuning';
import {
  createGridLines,
  createSliceBoardPlane,
  createStoneMesh,
  disposeObject3D,
  get3DPosition,
  getHoveredCoord,
} from './gameBoardHelpers';

interface GameBoardProps {
  board: Board;
  settings: GameSettings;
  cursor: Coordinate;
  onCursorChange: (cursor: Coordinate) => void;
  onSliceChange: (axis: 'X' | 'Y' | 'Z', index: number) => void;
  onCellClick: (x: number, y: number, z: number) => void;
  sliceAxis: 'X' | 'Y' | 'Z' | 'none';
  sliceIndex: number;
  winInfo: WinInfo | null;
  threats: Threat[];
  showGridAssist: boolean;
  visualTuning: VisualTuning;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  settings,
  cursor,
  onCursorChange,
  onSliceChange,
  onCellClick,
  sliceAxis,
  sliceIndex,
  winInfo,
  threats,
  showGridAssist,
  visualTuning,
}) => {
  const outerGridColor = 0xe2e8f0;
  const sliceGridColor = 0x3f2c18;
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const renderNowRef = useRef<(() => void) | null>(null);

  // Keep interaction variables in refs to avoid recreation
  const propsRef = useRef({
    board,
    settings,
    cursor,
    sliceAxis,
    sliceIndex,
    winInfo,
    threats,
    showGridAssist,
    visualTuning,
    onCellClick,
    onCursorChange,
    onSliceChange,
  });

  useEffect(() => {
    boardEpochRef.current += 1;
    propsRef.current = {
      board,
      settings,
      cursor,
      sliceAxis,
      sliceIndex,
      winInfo,
      threats,
      showGridAssist,
      visualTuning,
      onCellClick,
      onCursorChange,
      onSliceChange,
    };
  }, [board, settings, cursor, sliceAxis, sliceIndex, winInfo, threats, showGridAssist, visualTuning, onCellClick, onCursorChange, onSliceChange]);

  const cellSpacing = 1.9;

  // Track 3D meshes so we can update them in the animation loop
  const cellMeshesRef = useRef<{ [key: string]: THREE.Object3D }>({});
  const gridLinesRef = useRef<THREE.Object3D[]>([]);
  const cursorMeshRef = useRef<THREE.Object3D | null>(null);
  const hoveredCellRef = useRef<Coordinate | null>(null);
  const hoverIndicatorRef = useRef<THREE.Mesh | null>(null);
  const winLineRef = useRef<THREE.Line | THREE.Mesh | null>(null);
  const threatPulseRef = useRef<{ mesh: THREE.Mesh; type: string }[]>([]);
  const isCursorDragRef = useRef(false);
  const hasDraggedCursorRef = useRef(false);
  const pressCoordRef = useRef<Coordinate | null>(null);
  const boardEpochRef = useRef(0);
  const redrawEpochRef = useRef(0);
  const lastFrameAtRef = useRef(performance.now());
  const dragModeRef = useRef<'cursor' | 'rotate' | 'slice_x' | 'slice_yz' | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; sliceIndex: number; axis: 'X' | 'Y' | 'Z' | 'none' } | null>(null);
  const touchGestureRef = useRef<{
    midpointX: number;
    midpointY: number;
    angle: number;
    axis: 'Y' | 'Z';
  } | null>(null);
  const [renderIssue, setRenderIssue] = useState<string | null>(null);
  const [renderMetrics, setRenderMetrics] = useState({
    redrawMs: 0,
    textures: 0,
    geometries: 0,
    boardEpoch: 0,
    redrawEpoch: 0,
    stalledMs: 0,
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRenderMetrics(prev => ({
        ...prev,
        boardEpoch: boardEpochRef.current,
        redrawEpoch: redrawEpochRef.current,
        stalledMs: performance.now() - lastFrameAtRef.current,
      }));
    }, 400);

    return () => window.clearInterval(timer);
  }, []);

  const clearBoardVisuals = (scene: THREE.Scene) => {
    Object.values(cellMeshesRef.current).forEach(mesh => {
      scene.remove(mesh);
      disposeObject3D(mesh);
    });
    cellMeshesRef.current = {};

    gridLinesRef.current.forEach(line => {
      scene.remove(line);
      disposeObject3D(line);
    });
    gridLinesRef.current = [];

    threatPulseRef.current.forEach(threat => {
      scene.remove(threat.mesh);
      disposeObject3D(threat.mesh);
    });
    threatPulseRef.current = [];

    if (winLineRef.current) {
      scene.remove(winLineRef.current);
      disposeObject3D(winLineRef.current);
      winLineRef.current = null;
    }
  };

  const clampIndex = (value: number, size: number) => Math.max(0, Math.min(size - 1, value));

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. SCENE SETUP
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    const sceneBg = new THREE.Color(
      propsRef.current.visualTuning.backgroundGray / 255,
      propsRef.current.visualTuning.backgroundGray / 255,
      (propsRef.current.visualTuning.backgroundGray + 6) / 255,
    );
    scene.background = sceneBg;
    // Add atmospheric space fog
    scene.fog = new THREE.FogExp2(sceneBg, 0.02);

    // 2. CAMERA SETUP
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    cameraRef.current = camera;
    
    // Position camera to look down at the 3D board
    const size = propsRef.current.settings.boardSize;
    const distance = size * cellSpacing * 1.5;
    camera.position.set(distance, distance * 0.84, distance);

    // 3. RENDERER SETUP
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.1));
    renderer.shadowMap.enabled = true;
    renderer.domElement.style.touchAction = 'none';
    mountRef.current.appendChild(renderer.domElement);

    // 4. LIGHTS
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.52);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(20, 40, 20);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x3a86ff, 0.6); // Cool blue fill light
    dirLight2.position.set(-20, -20, -20);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xff007f, 0.5, 30); // Vibrant neon light in center
    scene.add(pointLight);

    // 5. ORBIT CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 100;
    controls.minDistance = size * cellSpacing * 0.4;
    controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
    controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;
    controls.enableRotate = true;
    controls.enablePan = false;
    controls.enableZoom = true;
    // Set target to center of grid
    controls.target.set(0, 0, 0);
    controls.update();

    const renderNow = () => {
      renderer.render(scene, camera);
    };
    renderNowRef.current = renderNow;

    const syncZoomModifierState = (event?: KeyboardEvent) => {
      const hasModifier = !!(event?.shiftKey || event?.altKey || event?.ctrlKey || event?.metaKey);
      controls.enableZoom = !hasModifier;
    };

    const baseGeom = new THREE.SphereGeometry(0.54, 18, 18);
    const emptyGeom = new THREE.SphereGeometry(0.12, 8, 8);
    // 6. GRID AND CELLS CREATION
    const createBoardVisuals = () => {
      const redrawStart = performance.now();
      try {
        clearBoardVisuals(scene);

      const boardSize = propsRef.current.settings.boardSize;

      const points: number[] = [];
      const slicePoints: number[] = [];

      // Helper to check if a connection is within the current slice
      const isConnectionInSlice = (
        x1: number, y1: number, z1: number,
        x2: number, y2: number, z2: number
      ) => {
        const axis = propsRef.current.sliceAxis;
        const idx = propsRef.current.sliceIndex;
        if (axis === 'none') return false;
        if (axis === 'X') return x1 === idx && x2 === idx;
        if (axis === 'Y') return y1 === idx && y2 === idx;
        if (axis === 'Z') return z1 === idx && z2 === idx;
        return false;
      };

      // Generate lines along X
      for (let y = 0; y < boardSize; y++) {
        for (let z = 0; z < boardSize; z++) {
          for (let x = 0; x < boardSize - 1; x++) {
            const p1 = get3DPosition(x, y, z, boardSize, cellSpacing);
            const p2 = get3DPosition(x + 1, y, z, boardSize, cellSpacing);
            if (isConnectionInSlice(x, y, z, x + 1, y, z)) {
              slicePoints.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            } else {
              points.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            }
          }
        }
      }

      // Generate lines along Y
      for (let x = 0; x < boardSize; x++) {
        for (let z = 0; z < boardSize; z++) {
          for (let y = 0; y < boardSize - 1; y++) {
            const p1 = get3DPosition(x, y, z, boardSize, cellSpacing);
            const p2 = get3DPosition(x, y + 1, z, boardSize, cellSpacing);
            if (isConnectionInSlice(x, y, z, x, y + 1, z)) {
              slicePoints.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            } else {
              points.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            }
          }
        }
      }

      // Generate lines along Z
      for (let x = 0; x < boardSize; x++) {
        for (let y = 0; y < boardSize; y++) {
          for (let z = 0; z < boardSize - 1; z++) {
            const p1 = get3DPosition(x, y, z, boardSize, cellSpacing);
            const p2 = get3DPosition(x, y, z + 1, boardSize, cellSpacing);
            if (isConnectionInSlice(x, y, z, x, y, z + 1)) {
              slicePoints.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            } else {
              points.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            }
          }
        }
      }

      if (propsRef.current.showGridAssist && points.length > 0) {
        const gridLines = createGridLines(
          points,
          outerGridColor,
          propsRef.current.visualTuning.outerGridOpacity,
          propsRef.current.visualTuning.outerDashSize,
          propsRef.current.visualTuning.outerGapSize,
        );
        scene.add(gridLines);
        gridLinesRef.current.push(gridLines);
      }

      if (propsRef.current.showGridAssist && slicePoints.length > 0) {
        const sliceGridLines = createGridLines(slicePoints, sliceGridColor, propsRef.current.visualTuning.sliceGridOpacity, 0.2, 0.12);
        scene.add(sliceGridLines);
        gridLinesRef.current.push(sliceGridLines);
      }

      if (propsRef.current.showGridAssist) {
        const slicePlane = createSliceBoardPlane(
          boardSize,
          propsRef.current.sliceAxis,
          propsRef.current.sliceIndex,
          cellSpacing,
          propsRef.current.visualTuning,
        );
        if (slicePlane) {
          scene.add(slicePlane);
          gridLinesRef.current.push(slicePlane);
        }
      }

      // Create cell representations (spheres / particles)

      for (let x = 0; x < boardSize; x++) {
        for (let y = 0; y < boardSize; y++) {
          for (let z = 0; z < boardSize; z++) {
            const cell = propsRef.current.board[x][y][z];
            const pos = get3DPosition(x, y, z, boardSize, cellSpacing);

            // Determine if this cell is inside the active slice
            let inSlice = true;
            const axis = propsRef.current.sliceAxis;
            const idx = propsRef.current.sliceIndex;
            if (axis === 'X' && x !== idx) inSlice = false;
            if (axis === 'Y' && y !== idx) inSlice = false;
            if (axis === 'Z' && z !== idx) inSlice = false;

            const emptyOpacity = inSlice ? 0.32 : propsRef.current.visualTuning.offSliceEmptyOpacity;

            let mesh: THREE.Object3D;

            if (cell.lastPlayer === null) {
              if (!propsRef.current.showGridAssist) {
                continue;
              }
              // Empty Cell: Render as small dim particle
              const mat = new THREE.MeshBasicMaterial({
                color: inSlice ? 0x475569 : 0xe2e8f0,
                transparent: true,
                opacity: emptyOpacity,
              });
              mesh = new THREE.Mesh(emptyGeom, mat);
              mesh.position.copy(pos);
              scene.add(mesh);
            } else {
              mesh = createStoneMesh(cell, pos, inSlice, baseGeom, propsRef.current.visualTuning);
              scene.add(mesh);
            }

            // Store references for raycasting and state update checks
            const key = `${x},${y},${z}`;
            mesh.userData.coord = [x, y, z] as Coordinate;
            cellMeshesRef.current[key] = mesh;
          }
        }
      }

      // Draw winning line if game is over
      if (propsRef.current.winInfo) {
        const info = propsRef.current.winInfo;
        if (info.cells.length >= 5) {
          const points = info.cells.map(c => get3DPosition(c[0], c[1], c[2], boardSize, cellSpacing));
          
          // Generate a smooth glowing tube along the winning points
          const curve = new THREE.CatmullRomCurve3(points);
          const tubeGeom = new THREE.TubeGeometry(curve, 32, 0.15, 8, false);
          
          const glowColor = new THREE.Color(info.winner === 'white' ? 0xffffff : 0x111111);
          const tubeMat = new THREE.MeshBasicMaterial({
            color: glowColor,
            transparent: true,
            opacity: 0.95,
          });
          
          const tube = new THREE.Mesh(tubeGeom, tubeMat);
          scene.add(tube);
          winLineRef.current = tube;

          // Animate the winning stones by scaling them up
          info.cells.forEach(c => {
            const key = `${c[0]},${c[1]},${c[2]}`;
            const m = cellMeshesRef.current[key];
            if (m) {
              m.scale.set(1.3, 1.3, 1.3);
            }
          });
        }
      }

        // Render threats/warnings as pulsing wireframes
        propsRef.current.threats.forEach(threat => {
          const pulseColor = threat.type === 'streak_pressure' ? 0xef4444 : 0xf59e0b;
          const pulseSize = threat.type === 'streak_pressure' ? 0.65 : 0.6;
          
          threat.cells.forEach(c => {
            const axis = propsRef.current.sliceAxis;
            const idx = propsRef.current.sliceIndex;
            let inSlice = true;
            if (axis === 'X' && c[0] !== idx) inSlice = false;
            if (axis === 'Y' && c[1] !== idx) inSlice = false;
            if (axis === 'Z' && c[2] !== idx) inSlice = false;
            
            if (!inSlice) return;

            const pos = get3DPosition(c[0], c[1], c[2], boardSize, cellSpacing);
            const warnGeom = new THREE.BoxGeometry(pulseSize, pulseSize, pulseSize);
            const warnMat = new THREE.MeshBasicMaterial({
              color: pulseColor,
              wireframe: true,
              transparent: true,
              opacity: 0.7,
            });
            const warnMesh = new THREE.Mesh(warnGeom, warnMat);
            warnMesh.position.copy(pos);
            scene.add(warnMesh);
            threatPulseRef.current.push({ mesh: warnMesh, type: threat.type });
          });
        });

        setRenderIssue(null);
        redrawEpochRef.current = boardEpochRef.current;
        setRenderMetrics({
          redrawMs: performance.now() - redrawStart,
          textures: renderer.info.memory.textures,
          geometries: renderer.info.memory.geometries,
          boardEpoch: boardEpochRef.current,
          redrawEpoch: redrawEpochRef.current,
          stalledMs: performance.now() - lastFrameAtRef.current,
        });
      } catch (error) {
        console.error('GameBoard initial redraw failed', error);
        setRenderIssue(error instanceof Error ? error.message : String(error));
      }
    };

    createBoardVisuals();

    // 7. KEYBOARD CURSOR INDICATOR
    const cursorGeom = new THREE.BoxGeometry(1.55, 1.55, 1.55);
    const cursorMat = new THREE.MeshBasicMaterial({
      color: 0x10b981, // Emerald green cursor
      wireframe: true,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
    });
    const cursorMesh = new THREE.Mesh(cursorGeom, cursorMat);
    cursorMesh.renderOrder = 20;
    scene.add(cursorMesh);
    cursorMeshRef.current = cursorMesh;

    // 8. HOVER INDICATOR
    const hoverGeom = new THREE.BoxGeometry(0.7, 0.7, 0.7);
    const hoverMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 0.0,
    });
    const hoverIndicator = new THREE.Mesh(hoverGeom, hoverMat);
    scene.add(hoverIndicator);
    hoverIndicatorRef.current = hoverIndicator;

    // 9. RAYCASTING INTERACTION
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const pickCoordAtClientPosition = (clientX: number, clientY: number): Coordinate | null =>
      getHoveredCoord(
        clientX,
        clientY,
        renderer,
        camera,
        raycaster,
        mouse,
        cellMeshesRef.current,
        propsRef.current.settings,
        propsRef.current.sliceAxis,
        propsRef.current.sliceIndex,
      );

    const handleMouseMove = (event: MouseEvent) => {
      if (!renderer.domElement) return;

      if (dragModeRef.current === 'slice_x' && dragStartRef.current) {
        const deltaX = event.clientX - dragStartRef.current.x;
        if (Math.abs(deltaX) > 3) {
          hasDraggedCursorRef.current = true;
        }
        const nextIndex = clampIndex(
          dragStartRef.current.sliceIndex + Math.round(deltaX / 22),
          propsRef.current.settings.boardSize,
        );
        propsRef.current.onSliceChange('X', nextIndex);
        return;
      }

      if (dragModeRef.current === 'slice_yz' && dragStartRef.current) {
        const deltaX = event.clientX - dragStartRef.current.x;
        const deltaY = event.clientY - dragStartRef.current.y;
        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
          hasDraggedCursorRef.current = true;
        }
        if (Math.abs(deltaY) >= Math.abs(deltaX)) {
          const nextIndex = clampIndex(
            dragStartRef.current.sliceIndex + Math.round(-deltaY / 22),
            propsRef.current.settings.boardSize,
          );
          propsRef.current.onSliceChange('Y', nextIndex);
        } else {
          const nextIndex = clampIndex(
            dragStartRef.current.sliceIndex + Math.round(deltaX / 22),
            propsRef.current.settings.boardSize,
          );
          propsRef.current.onSliceChange('Z', nextIndex);
        }
        return;
      }

      if (dragModeRef.current === 'rotate') {
        if (dragStartRef.current) {
          const deltaX = event.clientX - dragStartRef.current.x;
          const deltaY = event.clientY - dragStartRef.current.y;
          if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
            hasDraggedCursorRef.current = true;
          }
        }
        return;
      }

      const coords = pickCoordAtClientPosition(event.clientX, event.clientY);
      const boardSize = propsRef.current.settings.boardSize;

      if (coords) {
        hoveredCellRef.current = coords;
        if (isCursorDragRef.current) {
          const [hx, hy, hz] = coords;
          propsRef.current.onCursorChange([hx, hy, hz]);
          hasDraggedCursorRef.current = true;
        }
        hoverIndicator.position.copy(get3DPosition(coords[0], coords[1], coords[2], boardSize, cellSpacing));
        hoverIndicator.material.opacity = 0.55;
        document.body.style.cursor = 'pointer';
        renderNow();
      } else {
        hoveredCellRef.current = null;
        hoverIndicator.material.opacity = 0;
        document.body.style.cursor = 'default';
        renderNow();
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;

      hasDraggedCursorRef.current = false;
      pressCoordRef.current = pickCoordAtClientPosition(event.clientX, event.clientY);
      dragStartRef.current = {
        x: event.clientX,
        y: event.clientY,
        sliceIndex: propsRef.current.sliceIndex,
        axis: propsRef.current.sliceAxis,
      };

      if (event.shiftKey) {
        hasDraggedCursorRef.current = true;
        dragModeRef.current = 'slice_x';
        controls.enabled = false;
        return;
      }

      if (event.altKey) {
        hasDraggedCursorRef.current = true;
        dragModeRef.current = 'slice_yz';
        controls.enabled = false;
        return;
      }

      dragModeRef.current = 'rotate';
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const activeMode = dragModeRef.current;
      isCursorDragRef.current = false;
      dragModeRef.current = null;
      const dragStart = dragStartRef.current;
      dragStartRef.current = null;
      controls.enabled = true;

      if (activeMode === 'rotate' && dragStart && pressCoordRef.current) {
        const deltaX = event.clientX - dragStart.x;
        const deltaY = event.clientY - dragStart.y;
        if (Math.abs(deltaX) <= 3 && Math.abs(deltaY) <= 3) {
          const [x, y, z] = pressCoordRef.current;
          propsRef.current.onCellClick(x, y, z);
          hasDraggedCursorRef.current = true;
        }
      }

      pressCoordRef.current = null;
      renderNow();
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    // Custom wheel listener to change Z slice layer
    const handleMouseWheel = (event: WheelEvent) => {
      if (!(event.shiftKey || event.altKey || event.ctrlKey || event.metaKey)) {
        return;
      }

      event.preventDefault();
      const boardSize = propsRef.current.settings.boardSize;
      const delta = event.deltaY < 0 ? 1 : -1;
      const [cx, cy, cz] = propsRef.current.cursor;

      if (event.shiftKey) {
        propsRef.current.onCursorChange([clampIndex(cx + delta, boardSize), cy, cz]);
        return;
      }
      if (event.altKey) {
        propsRef.current.onCursorChange([cx, clampIndex(cy + delta, boardSize), cz]);
        return;
      }

      propsRef.current.onCursorChange([cx, cy, clampIndex(cz + delta, boardSize)]);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 2) {
        touchGestureRef.current = null;
        controls.enabled = true;
        return;
      }

      const [t1, t2] = Array.from(event.touches);
      const midpointX = (t1.clientX + t2.clientX) / 2;
      const midpointY = (t1.clientY + t2.clientY) / 2;
      const angle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
      touchGestureRef.current = {
        midpointX,
        midpointY,
        angle,
        axis: Math.abs(t2.clientX - t1.clientX) > Math.abs(t2.clientY - t1.clientY) ? 'Z' : 'Y',
      };
      controls.enabled = false;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 2 || !touchGestureRef.current || !cameraRef.current || !controlsRef.current) {
        return;
      }

      event.preventDefault();
      const [t1, t2] = Array.from(event.touches);
      const midpointX = (t1.clientX + t2.clientX) / 2;
      const midpointY = (t1.clientY + t2.clientY) / 2;
      const angle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
      const size = propsRef.current.settings.boardSize;
      const deltaX = midpointX - touchGestureRef.current.midpointX;
      const deltaY = midpointY - touchGestureRef.current.midpointY;
      const angleDelta = angle - touchGestureRef.current.angle;

      if (Math.abs(deltaX) > 24 || Math.abs(deltaY) > 24) {
        const dominantAxis = Math.abs(deltaX) > Math.abs(deltaY) ? 'Z' : 'Y';
        const baseIndex = dominantAxis === propsRef.current.sliceAxis ? propsRef.current.sliceIndex : Math.floor(size / 2);
        const nextIndex = dominantAxis === 'Z'
          ? clampIndex(baseIndex + (deltaX > 0 ? 1 : -1), size)
          : clampIndex(baseIndex + (deltaY > 0 ? -1 : 1), size);
        touchGestureRef.current.midpointX = midpointX;
        touchGestureRef.current.midpointY = midpointY;
        propsRef.current.onSliceChange(dominantAxis, nextIndex);
      }

      if (Math.abs(angleDelta) > 0.04) {
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        const forward = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
        camera.up.applyAxisAngle(forward, angleDelta);
        touchGestureRef.current.angle = angle;
      }
    };

    const handleTouchEnd = () => {
      touchGestureRef.current = null;
      controls.enabled = true;
      renderNow();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      syncZoomModifierState(event);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      syncZoomModifierState(event);
    };

    const handleWindowBlur = () => {
      controls.enableZoom = true;
    };

    controls.addEventListener('change', renderNow);

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('contextmenu', handleContextMenu);
    renderer.domElement.addEventListener('wheel', handleMouseWheel, { passive: false });
    renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    // 10. ANIMATION LOOP
    let animationFrameId = 0;
    const animationStartedAt = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = (performance.now() - animationStartedAt) / 1000;
      lastFrameAtRef.current = performance.now();

      // Controls update
      controls.update();

      // Keyboard Cursor smooth interpolation (lerp)
      if (cursorMeshRef.current) {
        const targetPos = get3DPosition(
          propsRef.current.cursor[0],
          propsRef.current.cursor[1],
          propsRef.current.cursor[2],
          propsRef.current.settings.boardSize,
          cellSpacing,
        );
        cursorMeshRef.current.position.lerp(targetPos, 0.2);
        cursorMeshRef.current.position.y += 0.03;
        
        // Rotate cursor box slowly
        cursorMeshRef.current.rotation.x = elapsedTime * 0.8;
        cursorMeshRef.current.rotation.y = elapsedTime * 0.4;
      }

      // Animate threat warnings (pulsing scale)
      threatPulseRef.current.forEach(t => {
        const scaleVal = 1.0 + Math.sin(elapsedTime * 6) * 0.12;
        t.mesh.scale.set(scaleVal, scaleVal, scaleVal);
        t.mesh.rotation.y = elapsedTime * 1.5;
      });

      // Slowly rotate the winning path tube if completed
      if (winLineRef.current) {
        const scaleVal = 1.0 + Math.sin(elapsedTime * 4) * 0.04;
        winLineRef.current.scale.set(scaleVal, scaleVal, scaleVal);
      }

      renderer.render(scene, camera);
    };

    animate();

    const loopWatchdog = window.setInterval(() => {
      if (performance.now() - lastFrameAtRef.current > 300) {
        cancelAnimationFrame(animationFrameId);
        animate();
      }
    }, 250);

    // 11. HANDLE WINDOW RESIZE
    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Watch for state changes to redraw scene objects
    // In React, it's easier to recreate the visuals when dependencies change.
    // We can expose the redraw function to react render updates.
    // cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      controls.removeEventListener('change', renderNow);
      if (renderer.domElement) {
        renderer.domElement.removeEventListener('mousemove', handleMouseMove);
        renderer.domElement.removeEventListener('mousedown', handleMouseDown);
        renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
        renderer.domElement.removeEventListener('wheel', handleMouseWheel);
        renderer.domElement.removeEventListener('touchstart', handleTouchStart);
        renderer.domElement.removeEventListener('touchmove', handleTouchMove);
        renderer.domElement.removeEventListener('touchend', handleTouchEnd);
      }
      cancelAnimationFrame(animationFrameId);
      window.clearInterval(loopWatchdog);
      clearBoardVisuals(scene);
      
      // Dispose geometries & materials
      baseGeom.dispose();
      emptyGeom.dispose();
      cursorGeom.dispose();
      hoverGeom.dispose();
      cursorMat.dispose();
      hoverMat.dispose();

      if (rendererRef.current && mountRef.current) {
        if (rendererRef.current.domElement.parentNode === mountRef.current) {
          mountRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      renderNowRef.current = null;
      renderer.dispose();
    };
  }, []);

  // Sync React prop updates to the Three.js scene dynamically
  useEffect(() => {
    // Redraw cells when board or slice properties change
    if (sceneRef.current) {
      const scene = sceneRef.current;
      const tunedBg = new THREE.Color(
        visualTuning.backgroundGray / 255,
        visualTuning.backgroundGray / 255,
        (visualTuning.backgroundGray + 6) / 255,
      );
      scene.background = tunedBg;
      scene.fog = new THREE.FogExp2(tunedBg, 0.02);
      const boardSize = board.length;

      clearBoardVisuals(scene);

      // Draw Grid Lines
      const points: number[] = [];
      const slicePoints: number[] = [];

      const isConnectionInSlice = (
        x1: number, y1: number, z1: number,
        x2: number, y2: number, z2: number
      ) => {
        if (sliceAxis === 'none') return false;
        if (sliceAxis === 'X') return x1 === sliceIndex && x2 === sliceIndex;
        if (sliceAxis === 'Y') return y1 === sliceIndex && y2 === sliceIndex;
        if (sliceAxis === 'Z') return z1 === sliceIndex && z2 === sliceIndex;
        return false;
      };

      // Generate grid coordinate lines
      for (let y = 0; y < boardSize; y++) {
        for (let z = 0; z < boardSize; z++) {
          for (let x = 0; x < boardSize - 1; x++) {
            const p1 = get3DPosition(x, y, z, boardSize, cellSpacing);
            const p2 = get3DPosition(x + 1, y, z, boardSize, cellSpacing);
            if (isConnectionInSlice(x, y, z, x + 1, y, z)) {
              slicePoints.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            } else {
              points.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            }
          }
        }
      }

      for (let x = 0; x < boardSize; x++) {
        for (let z = 0; z < boardSize; z++) {
          for (let y = 0; y < boardSize - 1; y++) {
            const p1 = get3DPosition(x, y, z, boardSize, cellSpacing);
            const p2 = get3DPosition(x, y + 1, z, boardSize, cellSpacing);
            if (isConnectionInSlice(x, y, z, x, y + 1, z)) {
              slicePoints.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            } else {
              points.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            }
          }
        }
      }

      for (let x = 0; x < boardSize; x++) {
        for (let y = 0; y < boardSize; y++) {
          for (let z = 0; z < boardSize - 1; z++) {
            const p1 = get3DPosition(x, y, z, boardSize, cellSpacing);
            const p2 = get3DPosition(x, y, z + 1, boardSize, cellSpacing);
            if (isConnectionInSlice(x, y, z, x, y, z + 1)) {
              slicePoints.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            } else {
              points.push(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z);
            }
          }
        }
      }

      if (showGridAssist && points.length > 0) {
        const gridLines = createGridLines(
          points,
          outerGridColor,
          visualTuning.outerGridOpacity,
          visualTuning.outerDashSize,
          visualTuning.outerGapSize,
        );
        scene.add(gridLines);
        gridLinesRef.current.push(gridLines);
      }

      if (showGridAssist && slicePoints.length > 0) {
        const sliceGridLines = createGridLines(slicePoints, sliceGridColor, visualTuning.sliceGridOpacity, 0.2, 0.12);
        scene.add(sliceGridLines);
        gridLinesRef.current.push(sliceGridLines);
      }

      if (showGridAssist) {
        const slicePlane = createSliceBoardPlane(boardSize, sliceAxis, sliceIndex, cellSpacing, visualTuning);
        if (slicePlane) {
          scene.add(slicePlane);
          gridLinesRef.current.push(slicePlane);
        }
      }

      // Draw Cells
      const redrawStart = performance.now();
      try {
      const baseGeom = new THREE.SphereGeometry(0.54, 18, 18);
      const emptyGeom = new THREE.SphereGeometry(0.12, 8, 8);

      for (let x = 0; x < boardSize; x++) {
        for (let y = 0; y < boardSize; y++) {
          for (let z = 0; z < boardSize; z++) {
            const cell = board[x]?.[y]?.[z];
            if (!cell) continue; // safety guard: board size mismatch during transition
            const pos = get3DPosition(x, y, z, boardSize, cellSpacing);

            // Determine if in active slice
            let inSlice = true;
            if (sliceAxis === 'X' && x !== sliceIndex) inSlice = false;
            if (sliceAxis === 'Y' && y !== sliceIndex) inSlice = false;
            if (sliceAxis === 'Z' && z !== sliceIndex) inSlice = false;

            const emptyOpacity = inSlice ? 0.32 : visualTuning.offSliceEmptyOpacity;

            let mesh: THREE.Object3D;

            if (cell.lastPlayer === null) {
              if (!showGridAssist) {
                continue;
              }
              const mat = new THREE.MeshBasicMaterial({
                color: inSlice ? 0x475569 : 0xe2e8f0,
                transparent: true,
                opacity: emptyOpacity,
              });
              mesh = new THREE.Mesh(emptyGeom, mat);
              mesh.position.copy(pos);
              scene.add(mesh);
            } else {
              mesh = createStoneMesh(cell, pos, inSlice, baseGeom, visualTuning);
              scene.add(mesh);
            }

            const key = `${x},${y},${z}`;
            mesh.userData.coord = [x, y, z] as Coordinate;
            cellMeshesRef.current[key] = mesh;
          }
        }
      }

      // Draw winning line
      if (winInfo && winInfo.cells.length >= 5) {
        const points = winInfo.cells.map(c => get3DPosition(c[0], c[1], c[2], boardSize, cellSpacing));
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeom = new THREE.TubeGeometry(curve, 32, 0.16, 8, false);
        
        const glowColor = new THREE.Color(winInfo.winner === 'white' ? 0xffffff : 0x22c55e); // Green glow for black, white for white
        const tubeMat = new THREE.MeshBasicMaterial({
          color: glowColor,
          transparent: true,
          opacity: 0.95,
        });
        
        const tube = new THREE.Mesh(tubeGeom, tubeMat);
        scene.add(tube);
        winLineRef.current = tube;

        winInfo.cells.forEach(c => {
          const key = `${c[0]},${c[1]},${c[2]}`;
          const m = cellMeshesRef.current[key];
          if (m) {
            m.scale.set(1.3, 1.3, 1.3);
          }
        });
      }

      // Render threats
      threats.forEach(threat => {
        const pulseColor = threat.type === 'streak_pressure' ? 0xef4444 : 0xf59e0b;
        const pulseSize = threat.type === 'streak_pressure' ? 0.65 : 0.6;
        
        threat.cells.forEach(c => {
          const axis = sliceAxis;
          const idx = sliceIndex;
          let inSlice = true;
          if (axis === 'X' && c[0] !== idx) inSlice = false;
          if (axis === 'Y' && c[1] !== idx) inSlice = false;
          if (axis === 'Z' && c[2] !== idx) inSlice = false;
          
          if (!inSlice) return;

          const pos = get3DPosition(c[0], c[1], c[2], boardSize, cellSpacing);
          const warnGeom = new THREE.BoxGeometry(pulseSize, pulseSize, pulseSize);
          const warnMat = new THREE.MeshBasicMaterial({
            color: pulseColor,
            wireframe: true,
            transparent: true,
            opacity: 0.75,
          });
          const warnMesh = new THREE.Mesh(warnGeom, warnMat);
          warnMesh.position.copy(pos);
          scene.add(warnMesh);
          threatPulseRef.current.push({ mesh: warnMesh, type: threat.type });
        });
      });

      setRenderIssue(null);
      redrawEpochRef.current = boardEpochRef.current;
      if (rendererRef.current) {
        setRenderMetrics({
          redrawMs: performance.now() - redrawStart,
          textures: rendererRef.current.info.memory.textures,
          geometries: rendererRef.current.info.memory.geometries,
          boardEpoch: boardEpochRef.current,
          redrawEpoch: redrawEpochRef.current,
          stalledMs: performance.now() - lastFrameAtRef.current,
        });
      }
      } catch (error) {
        console.error('GameBoard update redraw failed', error);
        setRenderIssue(error instanceof Error ? error.message : String(error));
      }

      renderNowRef.current?.();
    }
  }, [board, sliceAxis, sliceIndex, winInfo, threats, showGridAssist, visualTuning]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* 3D Canvas Target */}
      <div ref={mountRef} className="w-full h-full" />
      
      {/* Controls Overlay */}
      <div className="hidden">
        <span className="flex items-center space-x-1.5">
          <span className="w-3 h-3 border border-emerald-500 inline-block rounded-sm"></span>
          <span>通常ドラッグ: 回転</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-500/20 border border-blue-500 inline-block"></span>
          <span>Shift+ドラッグ: X切出し</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500/20 border border-amber-500 inline-block"></span>
          <span>Alt+ドラッグ: Y/Z切出し</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-violet-500/20 border border-violet-500 inline-block"></span>
          <span>ホイール: ズーム / Shift Alt CtrlでXYZ</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-3.5 h-3.5 rounded-full bg-slate-500/20 border border-slate-400 inline-block"></span>
          <span>G: グリッド表示切替</span>
        </span>
      </div>

      {(renderIssue || renderMetrics.redrawMs > 40 || renderMetrics.boardEpoch !== renderMetrics.redrawEpoch || renderMetrics.stalledMs > 800) && (
        <div className="absolute left-4 bottom-24 z-40 rounded-xl border border-red-400/40 bg-black/70 px-3 py-2 text-[11px] text-white pointer-events-none">
          {renderIssue ? (
            <div>render error: {renderIssue}</div>
          ) : (
            <>
              <div>redraw: {renderMetrics.redrawMs.toFixed(1)} ms</div>
              <div>tex: {renderMetrics.textures} geo: {renderMetrics.geometries}</div>
              <div>board/redraw: {renderMetrics.boardEpoch}/{renderMetrics.redrawEpoch}</div>
              <div>frame stall: {renderMetrics.stalledMs.toFixed(0)} ms</div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
