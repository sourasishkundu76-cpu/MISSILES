import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TargetEntity, CameraPreset, MissionStage, ScenarioType } from '../types/simulator';
import { aresAudio } from '../audio/aresAudio';

interface ThreeCanvasProps {
  scenario: ScenarioType;
  targets: TargetEntity[];
  activeTargetIndex: number;
  currentStage: MissionStage;
  cameraPreset: CameraPreset;
  onTelemetryUpdate: (azimuth: number, echoTime: number, calcDist: number) => void;
  onTargetScreenCoordsUpdate: (coords: { id: number; x: number; y: number; visible: boolean }[]) => void;
  onMissileImpact: (targetId: number) => void;
  isFiring: boolean;
  onResetFiring: () => void;
  visionMode: string;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  scenario,
  targets,
  activeTargetIndex,
  currentStage,
  cameraPreset,
  onTelemetryUpdate,
  onTargetScreenCoordsUpdate,
  onMissileImpact,
  isFiring,
  onResetFiring,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // References to keep state synced inside Three.js animate loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const currentCamTarget = useRef<THREE.Vector3>(new THREE.Vector3(20, 6, -30));

  const turntableRef = useRef<THREE.Group | null>(null);
  const gimbalRef = useRef<THREE.Group | null>(null);
  const heroMissileRef = useRef<THREE.Group | null>(null);
  const radarConeRef = useRef<THREE.Mesh | null>(null);
  const targetMeshesRef = useRef<Map<number, THREE.Group>>(new Map());

  const activeMissileRef = useRef<{
    mesh: THREE.Group;
    start: THREE.Vector3;
    target: THREE.Vector3;
    progress: number;
    speed: number;
    targetId: number;
  } | null>(null);

  const particlesRef = useRef<{
    mesh: THREE.Mesh;
    life: number;
    maxLife: number;
    vel: THREE.Vector3;
    isShockwave?: boolean;
    isDebris?: boolean;
  }[]>([]);

  const sweepAngleRef = useRef<number>(90);
  const sweepDirRef = useRef<number>(1);
  const targetsPropRef = useRef(targets);
  targetsPropRef.current = targets;
  const activeIdxRef = useRef(activeTargetIndex);
  activeIdxRef.current = activeTargetIndex;
  const stageRef = useRef(currentStage);
  stageRef.current = currentStage;
  const isFiringRef = useRef(isFiring);
  isFiringRef.current = isFiring;

  // Camera presets
  const CAM_PRESETS: Record<CameraPreset, { pos: THREE.Vector3; target: THREE.Vector3 }> = {
    command: { pos: new THREE.Vector3(-42, 24, 44), target: new THREE.Vector3(22, 6, -35) },
    launcher: { pos: new THREE.Vector3(-14, 15, 20), target: new THREE.Vector3(25, 4, -40) },
    tower: { pos: new THREE.Vector3(-12, 34, 18), target: new THREE.Vector3(40, 2, -55) },
    tactical: { pos: new THREE.Vector3(-8, 62, 58), target: new THREE.Vector3(25, 0, -35) },
  };

  // Switch camera when preset changes
  useEffect(() => {
    if (!cameraRef.current) return;
    const preset = CAM_PRESETS[cameraPreset];
    if (!preset) return;

    const startPos = cameraRef.current.position.clone();
    const endPos = preset.pos;
    const startTgt = currentCamTarget.current.clone();
    const endTgt = preset.target;
    const duration = 1000;
    const startTime = performance.now();

    const animateCam = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      const ease = 0.5 - Math.cos(progress * Math.PI) / 2;

      cameraRef.current?.position.lerpVectors(startPos, endPos, ease);
      currentCamTarget.current.lerpVectors(startTgt, endTgt, ease);

      if (progress < 1.0) {
        requestAnimationFrame(animateCam);
      }
    };
    requestAnimationFrame(animateCam);
  }, [cameraPreset]);

  // Trigger Missile Launch when isFiring becomes true
  useEffect(() => {
    if (!isFiring || activeMissileRef.current || !heroMissileRef.current || !sceneRef.current) return;
    const activeTgt = targetsPropRef.current[activeIdxRef.current];
    if (!activeTgt || !activeTgt.alive) {
      onResetFiring();
      return;
    }

    const targetMesh = targetMeshesRef.current.get(activeTgt.id);
    if (!targetMesh) {
      onResetFiring();
      return;
    }

    aresAudio.playMissileLaunch();

    // Hide rail-mounted missile
    heroMissileRef.current.visible = false;

    // Get world transform
    const startPos = new THREE.Vector3();
    const startQuat = new THREE.Quaternion();
    heroMissileRef.current.getWorldPosition(startPos);
    heroMissileRef.current.getWorldQuaternion(startQuat);

    // Create flying missile
    const flightMissile = heroMissileRef.current.clone();
    flightMissile.position.copy(startPos);
    flightMissile.quaternion.copy(startQuat);
    flightMissile.visible = true;

    // Rocket exhaust flame light
    const flame = new THREE.PointLight(0xff6600, 5, 25);
    flightMissile.add(flame);
    sceneRef.current.add(flightMissile);

    const targetPos = targetMesh.position.clone().add(new THREE.Vector3(0, 1.2, 0));

    activeMissileRef.current = {
      mesh: flightMissile,
      start: startPos.clone(),
      target: targetPos,
      progress: 0,
      speed: 1.15,
      targetId: activeTgt.id,
    };
  }, [isFiring, onResetFiring]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);
    scene.fog = new THREE.FogExp2(0x061122, 0.0055);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1200);
    camera.position.copy(CAM_PRESETS.command.pos);
    camera.lookAt(currentCamTarget.current);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0x18263a, 1.4);
    scene.add(ambientLight);

    const sunMoonLight = new THREE.DirectionalLight(0xffa272, 1.7);
    sunMoonLight.position.set(-70, 55, -35);
    sunMoonLight.castShadow = true;
    sunMoonLight.shadow.mapSize.width = 2048;
    sunMoonLight.shadow.mapSize.height = 2048;
    sunMoonLight.shadow.camera.near = 1;
    sunMoonLight.shadow.camera.far = 400;
    sunMoonLight.shadow.camera.left = -150;
    sunMoonLight.shadow.camera.right = 150;
    sunMoonLight.shadow.camera.top = 150;
    sunMoonLight.shadow.camera.bottom = -150;
    scene.add(sunMoonLight);

    // Cyan base spotlight
    const aresSpot = new THREE.SpotLight(0x00f0ff, 3.8, 90, Math.PI / 3, 0.35);
    aresSpot.position.set(-30, 28, 32);
    aresSpot.target.position.set(-20, 6, 16);
    scene.add(aresSpot);
    scene.add(aresSpot.target);

    // Red warning lights along fortified border wall
    for (let x = -80; x <= 80; x += 20) {
      const pLight = new THREE.PointLight(0xff2222, 1.2, 16);
      pLight.position.set(x, 8.2, 0);
      scene.add(pLight);
    }

    // 5. Build Environment (Terrain, Border, Airfield/Outpost)
    buildEnvironment(scene);

    // 6. Build ARES Launcher Base
    buildAresPlatform(scene);

    // 7. Build Target Entities based on current scenario
    buildTargets(scene, scenario);

    // 8. Build 3D Radar Cone
    buildRadarSweepCone(scene);

    // 9. Resize Listener
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 10. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Camera lookAt
      camera.lookAt(currentCamTarget.current);

      // Radar Sweep Oscillation: 15° to 165°
      if (stageRef.current <= 2) {
        sweepAngleRef.current += sweepDirRef.current * 32 * delta;
        if (sweepAngleRef.current >= 165) {
          sweepAngleRef.current = 165;
          sweepDirRef.current = -1;
          aresAudio.playRadarSweepTone(750);
        } else if (sweepAngleRef.current <= 15) {
          sweepAngleRef.current = 15;
          sweepDirRef.current = 1;
          aresAudio.playRadarSweepTone(880);
        }
      }

      // Rotate 3D Radar Cone
      const coneRadian = THREE.MathUtils.degToRad(sweepAngleRef.current - 90);
      if (radarConeRef.current) {
        radarConeRef.current.rotation.y = coneRadian;
      }

      // Calculate echo time and distance telemetry
      const activeTgt = targetsPropRef.current[activeIdxRef.current];
      const currentEcho = sweepAngleRef.current * 5.4 + 180;
      const currentDist = activeTgt ? activeTgt.dist : 95.0;
      onTelemetryUpdate(sweepAngleRef.current, currentEcho, currentDist);

      // Turret mechanical slew & pitch alignment
      if (turntableRef.current && gimbalRef.current && activeTgt) {
        const targetMesh = targetMeshesRef.current.get(activeTgt.id);
        if (targetMesh && activeTgt.alive) {
          const turretPos = new THREE.Vector3(-20, 0, 16);
          const tgtPos = targetMesh.position.clone();
          const diff = tgtPos.sub(turretPos);

          const targetYaw = Math.atan2(diff.x, -diff.z) + Math.PI;
          const hDist = Math.hypot(diff.x, diff.z);
          const targetPitch = Math.atan2(diff.y + 1.2, hDist);

          if (stageRef.current >= 4) {
            // Actively locked
            turntableRef.current.rotation.y = THREE.MathUtils.lerp(turntableRef.current.rotation.y, targetYaw, 0.08);
            gimbalRef.current.rotation.x = THREE.MathUtils.lerp(gimbalRef.current.rotation.x, targetPitch + 0.14, 0.08);
          } else {
            // Idle sweep oscillation
            turntableRef.current.rotation.y = THREE.MathUtils.lerp(turntableRef.current.rotation.y, coneRadian * 0.35, 0.04);
          }
        }
      }

      // Update Screen Coordinates for HUD targeting brackets
      const screenCoords: { id: number; x: number; y: number; visible: boolean }[] = [];
      const halfW = (container.clientWidth || window.innerWidth) / 2;
      const halfH = (container.clientHeight || window.innerHeight) / 2;

      targetsPropRef.current.forEach((t) => {
        const tMesh = targetMeshesRef.current.get(t.id);
        if (!tMesh || !t.alive) {
          screenCoords.push({ id: t.id, x: -999, y: -999, visible: false });
          return;
        }

        const worldPos = tMesh.position.clone().add(new THREE.Vector3(0, 2.5, 0));
        worldPos.project(camera);

        if (worldPos.z > 1 || worldPos.z < -1) {
          screenCoords.push({ id: t.id, x: -999, y: -999, visible: false });
        } else {
          const x = worldPos.x * halfW + halfW;
          const y = -worldPos.y * halfH + halfH;
          screenCoords.push({ id: t.id, x, y, visible: true });
        }
      });
      onTargetScreenCoordsUpdate(screenCoords);

      // Active missile in flight update
      if (activeMissileRef.current) {
        const m = activeMissileRef.current;
        m.progress += delta * m.speed;
        const t = m.progress;

        if (t >= 1.0) {
          // Kinetic Impact!
          const targetMesh = targetMeshesRef.current.get(m.targetId);
          if (targetMesh) {
            createExplosion(scene, targetMesh.position);
            // Char target black
            targetMesh.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const meshChild = child as THREE.Mesh;
                if (meshChild.material && (meshChild.material as THREE.MeshStandardMaterial).color) {
                  (meshChild.material as THREE.MeshStandardMaterial).color.setHex(0x111111);
                }
              }
            });
          }

          aresAudio.playDetonation();
          onMissileImpact(m.targetId);

          scene.remove(m.mesh);
          activeMissileRef.current = null;

          // Reset hero missile visibility after delay
          setTimeout(() => {
            if (heroMissileRef.current) {
              heroMissileRef.current.visible = true;
            }
            onResetFiring();
          }, 2600);
        } else {
          const curPos = new THREE.Vector3().lerpVectors(m.start, m.target, t);
          curPos.y += Math.sin(t * Math.PI) * 14;
          m.mesh.position.copy(curPos);

          const nextPos = new THREE.Vector3().lerpVectors(m.start, m.target, Math.min(1.0, t + 0.04));
          nextPos.y += Math.sin((t + 0.04) * Math.PI) * 14;
          m.mesh.lookAt(nextPos);

          // Spawn smoke particle
          spawnSmokeParticle(scene, curPos);
        }
      }

      // Update particle system
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life -= delta;

        if (p.isShockwave) {
          p.mesh.scale.multiplyScalar(1 + delta * 8);
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = p.life / p.maxLife;
        } else if (p.isDebris) {
          p.mesh.position.addScaledVector(p.vel, delta);
          p.vel.y -= 30 * delta; // Gravity
          p.mesh.rotation.x += 4 * delta;
        } else {
          // Smoke puff
          p.mesh.position.addScaledVector(p.vel, delta);
          p.mesh.scale.multiplyScalar(1 + delta * 2.2);
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = (p.life / p.maxLife) * 0.75;
        }

        if (p.life <= 0) {
          scene.remove(p.mesh);
          particlesRef.current.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      targetMeshesRef.current.clear();
      particlesRef.current.forEach((p) => scene.remove(p.mesh));
      particlesRef.current = [];
    };
  }, [scenario]);

  // Helper functions for 3D construction
  const spawnSmokeParticle = (scene: THREE.Scene, pos: THREE.Vector3) => {
    const geo = new THREE.SphereGeometry(0.35 + Math.random() * 0.35, 6, 6);
    const mat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.4 ? 0xff5511 : 0x777777,
      transparent: true,
      opacity: 0.85,
    });
    const pMesh = new THREE.Mesh(geo, mat);
    pMesh.position.copy(pos).add(new THREE.Vector3((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5));
    scene.add(pMesh);
    particlesRef.current.push({ mesh: pMesh, life: 0.6, maxLife: 0.6, vel: new THREE.Vector3(0, 0.3, 0) });
  };

  const createExplosion = (scene: THREE.Scene, pos: THREE.Vector3) => {
    const flash = new THREE.PointLight(0xff9922, 12, 60);
    flash.position.copy(pos).add(new THREE.Vector3(0, 2, 0));
    scene.add(flash);
    setTimeout(() => scene.remove(flash), 400);

    const ringGeo = new THREE.RingGeometry(1, 3, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xff3300, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const shockwave = new THREE.Mesh(ringGeo, ringMat);
    shockwave.position.copy(pos).add(new THREE.Vector3(0, 0.2, 0));
    scene.add(shockwave);
    particlesRef.current.push({ mesh: shockwave, life: 0.8, maxLife: 0.8, vel: new THREE.Vector3(0, 0, 0), isShockwave: true });

    for (let i = 0; i < 45; i++) {
      const dGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      const dMat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0xff2200 : 0xffaa00 });
      const deb = new THREE.Mesh(dGeo, dMat);
      deb.position.copy(pos).add(new THREE.Vector3(0, 1.2, 0));
      const vel = new THREE.Vector3((Math.random() - 0.5) * 28, Math.random() * 22 + 4, (Math.random() - 0.5) * 28);
      scene.add(deb);
      particlesRef.current.push({ mesh: deb, life: 1.4, maxLife: 1.4, vel, isDebris: true });
    }
  };

  const buildEnvironment = (scene: THREE.Scene) => {
    // Terrain
    const groundGeo = new THREE.PlaneGeometry(420, 420, 32, 32);
    groundGeo.rotateX(-Math.PI / 2);
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      let y = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 0.8;
      if (z < -120 || x < -90 || x > 140) {
        y += Math.sin(x * 0.02) * 5.0 + Math.cos(z * 0.03) * 4.0;
      }
      pos.setY(i, y);
    }
    groundGeo.computeVertexNormals();

    const groundMesh = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ color: 0x141b24, roughness: 0.95 }));
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Distant mountain ranges
    const mGeo = new THREE.ConeGeometry(55, 75, 5);
    const mMat = new THREE.MeshStandardMaterial({ color: 0x0a101b, roughness: 1.0 });
    for (let m = 0; m < 8; m++) {
      const mMesh = new THREE.Mesh(mGeo, mMat);
      const angle = (m / 8) * Math.PI - 0.2;
      const rad = 180 + (m % 3) * 20;
      mMesh.position.set(Math.cos(angle) * rad, 25, -Math.sin(angle) * rad - 50);
      mMesh.scale.set(1 + (m % 2) * 0.5, 0.7 + (m % 3) * 0.4, 1);
      scene.add(mMesh);
    }

    // Border barrier wall along Z = 0
    const borderGroup = new THREE.Group();
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x363e4b, roughness: 0.85, metalness: 0.2 });
    for (let x = -110; x <= 110; x += 6.1) {
      const block = new THREE.Mesh(new THREE.BoxGeometry(6, 7.5, 1.4), wallMat);
      block.position.set(x, 3.75, 0);
      block.castShadow = true;
      block.receiveShadow = true;
      borderGroup.add(block);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 4), new THREE.MeshStandardMaterial({ color: 0x8892a0, metalness: 0.8 }));
      post.position.set(x, 8.4, 0);
      post.rotation.z = 0.25;
      borderGroup.add(post);
    }

    // Razor barbed wire lines
    const wireGeo = new THREE.CylinderGeometry(0.04, 0.04, 225, 6);
    wireGeo.rotateZ(Math.PI / 2);
    const wire1 = new THREE.Mesh(wireGeo, wallMat);
    wire1.position.set(0, 8.8, 0.2);
    const wire2 = wire1.clone();
    wire2.position.set(0, 9.4, -0.2);
    borderGroup.add(wire1);
    borderGroup.add(wire2);

    // Watchtowers
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x222a36, roughness: 0.7 });
    [-50, 50].forEach((tx) => {
      const tw = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.8, 20, 6), towerMat);
      tw.position.set(tx, 10, 3);
      tw.castShadow = true;
      borderGroup.add(tw);

      const cab = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 5), towerMat);
      cab.position.set(tx, 21, 3);
      borderGroup.add(cab);

      const spot = new THREE.SpotLight(0xfff5dd, 2.5, 75, Math.PI / 6, 0.5);
      spot.position.set(tx, 20, 3);
      spot.target.position.set(tx * 0.6, 0, -45);
      scene.add(spot);
      scene.add(spot.target);
    });

    scene.add(borderGroup);

    // Military signage
    createBorderSign(scene, "ARES DEFENSE TERRITORY", new THREE.Vector3(-18, 5.5, 1.4), '#00f0ff');
    createBorderSign(scene, "INTERNATIONAL BOUNDARY", new THREE.Vector3(8, 5.5, 1.4), '#ffaa00');
    createBorderSign(scene, "OPPONENT COUNTRY // AIRFIELD", new THREE.Vector3(38, 5.5, 1.4), '#ff3344');

    // Concrete Tarmac / Military Runway in enemy sector
    const runwayGroup = new THREE.Group();
    runwayGroup.position.set(30, 0.08, -75);

    const apron = new THREE.Mesh(new THREE.PlaneGeometry(160, 110), new THREE.MeshStandardMaterial({ color: 0x242a33, roughness: 0.82 }));
    apron.rotateX(-Math.PI / 2);
    apron.receiveShadow = true;
    runwayGroup.add(apron);

    // Runway strip
    const runway = new THREE.Mesh(new THREE.PlaneGeometry(28, 220), new THREE.MeshStandardMaterial({ color: 0x1c212a, roughness: 0.78 }));
    runway.rotateX(-Math.PI / 2);
    runway.position.set(28, 0.02, 5);
    runway.rotation.y = -0.15;
    runway.receiveShadow = true;
    runwayGroup.add(runway);

    // Hangar 01
    const hangarGeo = new THREE.CylinderGeometry(14, 14, 38, 20, 1, false, 0, Math.PI);
    hangarGeo.rotateZ(Math.PI / 2);
    const hangar = new THREE.Mesh(hangarGeo, new THREE.MeshStandardMaterial({ color: 0x2e3745, roughness: 0.6, metalness: 0.5 }));
    hangar.position.set(-48, 0, -22);
    hangar.castShadow = true;
    hangar.receiveShadow = true;
    runwayGroup.add(hangar);

    // ATC Tower
    const atc = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.8, 26, 8), new THREE.MeshStandardMaterial({ color: 0x3d4756 }));
    atc.position.set(50, 13, 20);
    atc.castShadow = true;
    runwayGroup.add(atc);

    // ATC Glass
    const atcGlass = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 4.2, 5, 8), new THREE.MeshStandardMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.6 }));
    atcGlass.position.set(50, 27, 20);
    runwayGroup.add(atcGlass);

    // Radome
    const radome = new THREE.Mesh(new THREE.SphereGeometry(2.5, 16, 16), new THREE.MeshStandardMaterial({ color: 0xeeeeee }));
    radome.position.set(50, 31, 20);
    runwayGroup.add(radome);

    // Fuel tanks
    for (let f = 0; f < 2; f++) {
      const ftank = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 7, 16), new THREE.MeshStandardMaterial({ color: 0x5a6575, metalness: 0.4 }));
      ftank.position.set(-60, 3.5, 20 + f * 12);
      ftank.castShadow = true;
      runwayGroup.add(ftank);
    }

    scene.add(runwayGroup);
  };

  const createBorderSign = (scene: THREE.Scene, text: string, pos: THREE.Vector3, color: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 110;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#060f1b';
    ctx.fillRect(0, 0, 512, 110);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, 504, 102);
    ctx.font = 'bold 30px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 55);

    const tex = new THREE.CanvasTexture(canvas);
    const signMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(8, 1.7), signMat);
    signMesh.position.copy(pos);
    scene.add(signMesh);
  };

  const buildAresPlatform = (scene: THREE.Scene) => {
    const aresGroup = new THREE.Group();
    aresGroup.position.set(-20, 0, 16);

    // Bunker base
    const bunker = new THREE.Mesh(new THREE.BoxGeometry(16, 6, 16), new THREE.MeshStandardMaterial({ color: 0x242d38, roughness: 0.7, metalness: 0.3 }));
    bunker.position.y = 3;
    bunker.castShadow = true;
    bunker.receiveShadow = true;
    aresGroup.add(bunker);

    // Glowing cyan server panels
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 1.8), new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    screen.position.set(3, 4.5, 8.52);
    aresGroup.add(screen);

    // Indian Flagpole on base (as pictured in Image 1)
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 9, 8), new THREE.MeshStandardMaterial({ color: 0xdde2e8, metalness: 0.8 }));
    pole.position.set(-6.5, 7.5, -6.5);
    aresGroup.add(pole);

    // Flag fabric canvas texture
    const flagCanvas = document.createElement('canvas');
    flagCanvas.width = 180;
    flagCanvas.height = 120;
    const fctx = flagCanvas.getContext('2d');
    if (fctx) {
      fctx.fillStyle = '#FF9933'; fctx.fillRect(0, 0, 180, 40);
      fctx.fillStyle = '#FFFFFF'; fctx.fillRect(0, 40, 180, 40);
      fctx.fillStyle = '#128807'; fctx.fillRect(0, 80, 180, 40);
      fctx.strokeStyle = '#000088'; fctx.lineWidth = 3;
      fctx.beginPath(); fctx.arc(90, 60, 14, 0, Math.PI * 2); fctx.stroke();
    }
    const flagTex = new THREE.CanvasTexture(flagCanvas);
    const flagMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.1), new THREE.MeshStandardMaterial({ map: flagTex, roughness: 0.5, side: THREE.DoubleSide }));
    flagMesh.position.set(-5.0, 10.5, -6.5);
    aresGroup.add(flagMesh);

    // Turntable ring
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.5, 1.5, 32), new THREE.MeshStandardMaterial({ color: 0x333d4b, metalness: 0.8, roughness: 0.3 }));
    ring.position.y = 6.75;
    ring.castShadow = true;
    aresGroup.add(ring);

    // Rotating turntable
    const turntable = new THREE.Group();
    turntable.position.y = 7.5;
    aresGroup.add(turntable);
    turntableRef.current = turntable;

    // Gimbal arms
    const podMat = new THREE.MeshStandardMaterial({ color: 0x485566, metalness: 0.7, roughness: 0.35 });
    const armL = new THREE.Mesh(new THREE.BoxGeometry(1.6, 4.5, 3.2), podMat);
    armL.position.set(-2.8, 2.2, 0);
    armL.castShadow = true;
    turntable.add(armL);

    const armR = armL.clone();
    armR.position.set(2.8, 2.2, 0);
    turntable.add(armR);

    // Elevation gimbal
    const gimbal = new THREE.Group();
    gimbal.position.set(0, 3.5, 0);
    gimbal.rotation.x = -0.32;
    turntable.add(gimbal);
    gimbalRef.current = gimbal;

    // Rail carriage
    const rail = new THREE.Mesh(new THREE.BoxGeometry(3.8, 1.6, 8.5), podMat);
    rail.castShadow = true;
    gimbal.add(rail);

    // HC-SR04 ultrasonic sensor eye transducers
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.9, roughness: 0.2 });
    const eyeGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.9, 16);
    eyeGeo.rotateX(Math.PI / 2);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-1.1, 1.5, 2.2);
    const eyeR = eyeL.clone();
    eyeR.position.set(1.1, 1.5, 2.2);
    gimbal.add(eyeL);
    gimbal.add(eyeR);

    // Cyan glowing emitter rings
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const glow1 = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.65, 16), ringMat);
    glow1.position.set(-1.1, 1.5, 2.68);
    const glow2 = glow1.clone();
    glow2.position.set(1.1, 1.5, 2.68);
    gimbal.add(glow1);
    gimbal.add(glow2);

    // Hero Guided Surface-to-Air Missile
    const heroMissile = new THREE.Group();
    heroMissile.position.set(0, 1.8, -0.5);

    const mBody = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 9, 20), new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.3, metalness: 0.4 }));
    mBody.rotation.x = Math.PI / 2;
    mBody.castShadow = true;
    heroMissile.add(mBody);

    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.7, 20), new THREE.MeshStandardMaterial({ color: 0xee2222, roughness: 0.4 }));
    band.rotation.x = Math.PI / 2;
    band.position.z = 2.2;
    heroMissile.add(band);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.42, 2.2, 20), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.5 }));
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = 5.6;
    nose.castShadow = true;
    heroMissile.add(nose);

    const finMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8 });
    for (let f = 0; f < 4; f++) {
      const rearFin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, 1.4), finMat);
      rearFin.rotation.z = (f * Math.PI) / 2;
      rearFin.position.z = -3.8;
      heroMissile.add(rearFin);

      const canard = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.7, 0.8), finMat);
      canard.rotation.z = (f * Math.PI) / 2 + Math.PI / 4;
      canard.position.z = 3.2;
      heroMissile.add(canard);
    }

    gimbal.add(heroMissile);
    heroMissileRef.current = heroMissile;

    scene.add(aresGroup);
  };

  const buildTargets = (scene: THREE.Scene, scen: ScenarioType) => {
    targetMeshesRef.current.clear();

    if (scen === 'AIRBASE_GROUNDED') {
      // 1. SU-57 Stealth Fighter (Target 1)
      const su57 = createSu57Jet();
      su57.position.set(22, 0, -68);
      su57.rotation.y = -0.45;
      scene.add(su57);
      targetMeshesRef.current.set(1, su57);

      // 2. MiG-35 Strike Fighter (Target 2)
      const mig35 = createMig35Jet();
      mig35.position.set(-15, 0, -85);
      mig35.rotation.y = 0.85;
      scene.add(mig35);
      targetMeshesRef.current.set(2, mig35);

      // 3. TU-22M Heavy Bomber (Target 3)
      const tu22 = createTu22Bomber();
      tu22.position.set(58, 0, -98);
      tu22.rotation.y = -0.22;
      scene.add(tu22);
      targetMeshesRef.current.set(3, tu22);
    } else {
      // GROUND_ARMOR / Convoy (Image 1 & 2 layout)
      // 1. Military Truck (Target 1)
      const truck = createMilitaryTruck();
      truck.position.set(20, 0, -56);
      scene.add(truck);
      targetMeshesRef.current.set(1, truck);

      // 2. Main Battle Tank (Target 2)
      const tank = createMainBattleTank();
      tank.position.set(45, 0, -32);
      tank.rotation.y = -0.4;
      scene.add(tank);
      targetMeshesRef.current.set(2, tank);

      // 3. Patrol Squad / Armored Recon (Target 3)
      const patrol = createPatrolSquad();
      patrol.position.set(75, 0, -18);
      scene.add(patrol);
      targetMeshesRef.current.set(3, patrol);
    }
  };

  // 3D Model Builders for Ground Targets
  const createMilitaryTruck = () => {
    const group = new THREE.Group();
    const cab = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.2, 3), new THREE.MeshStandardMaterial({ color: 0x4d5645, roughness: 0.7 }));
    cab.position.set(0, 2.2, 2.2);
    cab.castShadow = true;
    const bed = new THREE.Mesh(new THREE.BoxGeometry(3.2, 3.4, 5.5), new THREE.MeshStandardMaterial({ color: 0x3d4435, roughness: 0.8 }));
    bed.position.set(0, 2.4, -2.0);
    bed.castShadow = true;
    group.add(cab);
    group.add(bed);

    // Wheels
    const wMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const wGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.4, 12);
    wGeo.rotateZ(Math.PI / 2);
    [[-1.6, 2], [1.6, 2], [-1.6, -1], [1.6, -1], [-1.6, -3], [1.6, -3]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(wGeo, wMat);
      w.position.set(wx, 0.65, wz);
      w.castShadow = true;
      group.add(w);
    });
    return group;
  };

  const createMainBattleTank = () => {
    const group = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.8, 7.5), new THREE.MeshStandardMaterial({ color: 0x5a5442, roughness: 0.6 }));
    hull.position.y = 1.2;
    hull.castShadow = true;
    const turret = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.4, 4), new THREE.MeshStandardMaterial({ color: 0x484232 }));
    turret.position.set(0, 2.6, -0.3);
    turret.castShadow = true;
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 6.5, 12), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 2.6, 4.2);
    barrel.castShadow = true;

    // Treads
    const treadMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    [-2.2, 2.2].forEach((tx) => {
      const tread = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 7.8), treadMat);
      tread.position.set(tx, 0.6, 0);
      group.add(tread);
    });

    group.add(hull);
    group.add(turret);
    group.add(barrel);
    return group;
  };

  const createPatrolSquad = () => {
    const group = new THREE.Group();
    const apc = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 5.2), new THREE.MeshStandardMaterial({ color: 0x3f4841, roughness: 0.7 }));
    apc.position.y = 1.6;
    apc.castShadow = true;
    group.add(apc);

    // Wheels
    const wGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.35, 12);
    wGeo.rotateZ(Math.PI / 2);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    [[-1.6, 1.5], [1.6, 1.5], [-1.6, -1.5], [1.6, -1.5]].forEach(([wx, wz]) => {
      const w = new THREE.Mesh(wGeo, wMat);
      w.position.set(wx, 0.55, wz);
      group.add(w);
    });
    return group;
  };

  const createSu57Jet = () => {
    const group = new THREE.Group();
    const camoMat = new THREE.MeshStandardMaterial({ color: 0x364352, roughness: 0.5, metalness: 0.35 });
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.1, metalness: 0.9, transparent: true, opacity: 0.75 });

    // Fuselage
    const suBody = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.1, 14), camoMat);
    suBody.position.y = 1.6;
    suBody.castShadow = true;
    group.add(suBody);

    const suNose = new THREE.Mesh(new THREE.ConeGeometry(1.6, 5.5, 4), camoMat);
    suNose.rotation.x = -Math.PI / 2;
    suNose.rotation.y = Math.PI / 4;
    suNose.position.set(0, 1.5, 9.2);
    suNose.castShadow = true;
    group.add(suNose);

    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.95, 4.2, 8), canopyMat);
    canopy.rotation.x = Math.PI / 2;
    canopy.position.set(0, 2.3, 4.2);
    group.add(canopy);

    // Delta Wings
    const wingGeo = new THREE.BoxGeometry(14, 0.25, 6);
    const wings = new THREE.Mesh(wingGeo, camoMat);
    wings.position.set(0, 1.6, 0);
    wings.castShadow = true;
    group.add(wings);

    // Landing gear touching tarmac
    addLandingGear(group, 0, 5.2, 1.5);
    addLandingGear(group, -2.0, -1.8, 1.5);
    addLandingGear(group, 2.0, -1.8, 1.5);

    return group;
  };

  const createMig35Jet = () => {
    const group = new THREE.Group();
    const migMat = new THREE.MeshStandardMaterial({ color: 0x485863, roughness: 0.5, metalness: 0.3 });
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, transparent: true, opacity: 0.8 });

    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.3, 12, 12), migMat);
    body.rotation.x = Math.PI / 2;
    body.position.y = 1.45;
    body.castShadow = true;
    group.add(body);

    const radome = new THREE.Mesh(new THREE.ConeGeometry(0.85, 3.8, 12), new THREE.MeshStandardMaterial({ color: 0x20262e }));
    radome.rotation.x = -Math.PI / 2;
    radome.position.set(0, 1.45, 7.8);
    group.add(radome);

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), canopyMat);
    canopy.scale.set(0.9, 1.1, 2.5);
    canopy.position.set(0, 2.1, 2.8);
    group.add(canopy);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(11, 0.22, 5.2), migMat);
    wings.position.set(0, 1.45, 0.5);
    wings.castShadow = true;
    group.add(wings);

    addLandingGear(group, 0, 4.0, 1.4);
    addLandingGear(group, -1.6, -1.2, 1.4);
    addLandingGear(group, 1.6, -1.2, 1.4);

    return group;
  };

  const createTu22Bomber = () => {
    const group = new THREE.Group();
    const bMat = new THREE.MeshStandardMaterial({ color: 0x6e7884, roughness: 0.55, metalness: 0.25 });

    const fuse = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.1, 24, 16), bMat);
    fuse.rotation.x = Math.PI / 2;
    fuse.position.y = 2.4;
    fuse.castShadow = true;
    group.add(fuse);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(1.6, 7.5, 16), new THREE.MeshStandardMaterial({ color: 0xdde2e8 }));
    nose.rotation.x = -Math.PI / 2;
    nose.position.set(0, 2.4, 15.6);
    group.add(nose);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(26, 0.45, 5.5), bMat);
    wings.position.set(0, 2.5, -2);
    wings.castShadow = true;
    group.add(wings);

    addLandingGear(group, 0, 10.5, 2.3);
    addLandingGear(group, -3.2, -2.8, 2.3);
    addLandingGear(group, 3.2, -2.8, 2.3);

    return group;
  };

  const addLandingGear = (group: THREE.Group, x: number, z: number, h: number) => {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, h, 8), new THREE.MeshStandardMaterial({ color: 0x8892a0, metalness: 0.9 }));
    strut.position.set(x, h / 2, z);
    group.add(strut);

    const wGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.22, 16);
    wGeo.rotateZ(Math.PI / 2);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const wL = new THREE.Mesh(wGeo, wMat);
    wL.position.set(x - 0.2, 0.35, z);
    const wR = new THREE.Mesh(wGeo, wMat);
    wR.position.set(x + 0.2, 0.35, z);
    group.add(wL);
    group.add(wR);
  };

  const buildRadarSweepCone = (scene: THREE.Scene) => {
    const coneRadius = 75;
    const coneAngle = Math.PI / 3.6;
    const coneGeo = new THREE.ConeGeometry(coneRadius, 115, 32, 1, true, -coneAngle / 2, coneAngle);
    coneGeo.rotateX(Math.PI / 2);

    const coneMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.16,
      wireframe: true,
      side: THREE.DoubleSide,
    });

    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    coneMesh.position.set(-20, 10.5, 16);
    scene.add(coneMesh);
    radarConeRef.current = coneMesh;

    // Ground ripple sweep
    const groundRadarGeo = new THREE.CircleGeometry(110, 32, 0, Math.PI);
    groundRadarGeo.rotateX(-Math.PI / 2);
    const groundRadarMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const groundPulse = new THREE.Mesh(groundRadarGeo, groundRadarMat);
    groundPulse.position.set(-20, 0.5, 16);
    scene.add(groundPulse);
  };

  return <div ref={containerRef} className="absolute inset-0 w-full h-full" />;
};
