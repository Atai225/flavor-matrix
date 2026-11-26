import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { CATEGORIES, INGREDIENTS } from '../data/ingredients';
import type { Category, Ingredient } from '../data/types';
import { ingredientIntensity } from '../utils/mixologyMath';

export interface Scene3DProps {
  recipeIds: string[];
  selectedId: string | null;
  /** Время глотка, 0–45 сек */
  time: number;
  /** Узлы, подсвеченные кнопкой «Сбалансировать» */
  suggestedIds: string[];
  /** Режим 0%: алкогольные узлы приглушены */
  naMode: boolean;
  onSelect: (id: string | null) => void;
  onAdd: (id: string) => void;
}

interface NodeObj {
  ing: Ingredient;
  group: THREE.Group;
  mesh: THREE.Mesh<THREE.SphereGeometry, THREE.MeshStandardMaterial>;
  glow: THREE.Sprite;
  ring: THREE.Sprite;
  hit: THREE.Mesh;
  label: HTMLDivElement;
  labelState: string;
  cur: { op: number; glow: number; scale: number; ring: number };
}

interface LinkObj {
  a: string;
  b: string;
  synergy: number;
  type: 'classic' | 'experimental';
  line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  cur: number;
}

// ── Текстуры, нарисованные на canvas (без внешних файлов) ──
function makeGlowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.45)');
  grd.addColorStop(0.6, 'rgba(255,255,255,0.08)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeRingTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.strokeStyle = 'rgba(255,255,255,1)';
  g.lineWidth = 5;
  g.beginPath();
  g.arc(64, 64, 52, 0, Math.PI * 2);
  g.stroke();
  g.globalAlpha = 0.35;
  g.lineWidth = 2;
  g.setLineDash([6, 8]);
  g.beginPath();
  g.arc(64, 64, 60, 0, Math.PI * 2);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ── Раскладка: категории по эллипсу лицом к камере, ингредиенты — сферой внутри кластера ──
function clusterCenter(cat: Category): THREE.Vector3 {
  const ci = CATEGORIES.findIndex((c) => c.id === cat);
  const angle = Math.PI / 2 - (ci / CATEGORIES.length) * Math.PI * 2;
  return new THREE.Vector3(Math.cos(angle) * 21, Math.sin(angle) * 12.5, ci % 2 === 0 ? 3 : -3);
}

function computeLayout(): Map<string, THREE.Vector3> {
  const pos = new Map<string, THREE.Vector3>();
  const golden = Math.PI * (3 - Math.sqrt(5));
  CATEGORIES.forEach((cat) => {
    const center = clusterCenter(cat.id);
    const members = INGREDIENTS.filter((i) => i.category === cat.id);
    const n = members.length;
    const radius = 3.2 + n * 0.36;
    members.forEach((ing, k) => {
      const y = n === 1 ? 0 : 1 - (k / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * k;
      pos.set(ing.id, new THREE.Vector3(center.x + Math.cos(th) * r * radius, center.y + y * radius * 0.78, center.z + Math.sin(th) * r * radius));
    });
  });
  return pos;
}

export default function Scene3D(props: Scene3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    const container = containerRef.current!;
    const width = () => Math.max(1, container.clientWidth);
    const height = () => Math.max(1, container.clientHeight);

    // ── Рендереры ──
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width(), height());
    renderer.setClearColor(0x06070a, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(width(), height());
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.inset = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    labelRenderer.domElement.style.zIndex = '0'; // свой слой, чтобы подписи не перекрывали панели
    container.appendChild(labelRenderer.domElement);

    // ── Сцена и камера ──
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x06070a, 0.011);
    const camera = new THREE.PerspectiveCamera(50, width() / height(), 0.1, 400);
    // Подбираем дистанцию, чтобы весь граф (≈ ±27 × ±19 единиц) влез в кадр
    const fitDistance = () => {
      const aspect = width() / height();
      const t = Math.tan(THREE.MathUtils.degToRad(25));
      return aspect >= 1 ? 64 : Math.min(110, 27 / (t * aspect) + 6);
    };
    camera.position.set(0, 4, fitDistance());

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance = 12;
    controls.maxDistance = 95;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.35;
    controls.enablePan = true;
    let idleTimer: number | undefined;
    const onStart = () => {
      controls.autoRotate = false;
      window.clearTimeout(idleTimer);
    };
    const onEnd = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => (controls.autoRotate = true), 7000);
    };
    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.PointLight(0xf59e0b, 260, 0, 2);
    key.position.set(20, 25, 20);
    const fill = new THREE.PointLight(0x06b6d4, 220, 0, 2);
    fill.position.set(-25, -10, -15);
    scene.add(key, fill);

    // ── Общие ресурсы ──
    const glowTex = makeGlowTexture();
    const ringTex = makeRingTexture();
    const sphereGeo = new THREE.SphereGeometry(0.6, 28, 20);
    const hitGeo = new THREE.SphereGeometry(1.25, 10, 8);
    const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });

    const layout = computeLayout();

    // ── Кластеры: мягкое свечение + подпись категории ──
    const clusterLabels: HTMLDivElement[] = [];
    CATEGORIES.forEach((cat) => {
      const center = clusterCenter(cat.id);
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: glowTex, color: cat.color, transparent: true, opacity: 0.07, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      halo.scale.setScalar(16);
      halo.position.copy(center);
      scene.add(halo);
      const el = document.createElement('div');
      el.className = 'cluster-label';
      el.textContent = cat.name;
      el.style.color = cat.color;
      clusterLabels.push(el);
      const obj = new CSS2DObject(el);
      obj.position.copy(center).add(new THREE.Vector3(0, -(3.2 + INGREDIENTS.filter((i) => i.category === cat.id).length * 0.36) * 0.78 - 1.6, 0));
      scene.add(obj);
    });

    // ── Узлы ──
    const nodes: NodeObj[] = [];
    const nodeById = new Map<string, NodeObj>();
    const hitTargets: THREE.Object3D[] = [];
    for (const ing of INGREDIENTS) {
      const group = new THREE.Group();
      group.position.copy(layout.get(ing.id)!);
      const color = new THREE.Color(ing.color);
      const mesh = new THREE.Mesh(
        sphereGeo,
        new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.35, metalness: 0.15, transparent: true }),
      );
      const glow = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      glow.scale.setScalar(3.6);
      const ring = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: ringTex, color: 0xf59e0b, transparent: true, opacity: 0, depthWrite: false }),
      );
      ring.scale.setScalar(2.3);
      const hit = new THREE.Mesh(hitGeo, hitMat);
      hit.userData.id = ing.id;
      hitTargets.push(hit);

      const label = document.createElement('div');
      label.className = 'node-label';
      label.textContent = ing.name;
      const labelObj = new CSS2DObject(label);
      labelObj.position.set(0, 0.75, 0);

      group.add(glow, mesh, ring, hit, labelObj);
      scene.add(group);
      const node: NodeObj = { ing, group, mesh, glow, ring, hit, label, labelState: '', cur: { op: 0.9, glow: 0.4, scale: 1, ring: 0 } };
      nodes.push(node);
      nodeById.set(ing.id, node);
    }

    // ── Связи (изогнутые линии) ──
    const links: LinkObj[] = [];
    const seen = new Set<string>();
    for (const ing of INGREDIENTS) {
      for (const l of ing.links) {
        const keyId = [ing.id, l.targetId].sort().join('|');
        if (seen.has(keyId)) continue;
        seen.add(keyId);
        const pa = layout.get(ing.id)!;
        const pb = layout.get(l.targetId)!;
        const mid = pa.clone().add(pb).multiplyScalar(0.5);
        const sameCluster = ing.category === INGREDIENTS.find((x) => x.id === l.targetId)!.category;
        mid.multiplyScalar(sameCluster ? 1.08 : 0.62);
        mid.y += sameCluster ? 0.6 : 1.5;
        const curve = new THREE.QuadraticBezierCurve3(pa, mid, pb);
        const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(18));
        const mat = new THREE.LineBasicMaterial({
          color: l.type === 'classic' ? 0xffffff : 0xf59e0b,
          transparent: true,
          opacity: 0.1,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });
        const line = new THREE.Line(geo, mat);
        scene.add(line);
        links.push({ a: ing.id, b: l.targetId, synergy: l.synergy, type: l.type, line, cur: 0.1 });
      }
    }

    // ── Пыль / пузырьки ──
    const DUST = 650;
    const dustPos = new Float32Array(DUST * 3);
    const dustSpeed = new Float32Array(DUST);
    for (let i = 0; i < DUST; i++) {
      const r = 8 + Math.random() * 55;
      const th = Math.random() * Math.PI * 2;
      dustPos[i * 3] = Math.cos(th) * r;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      dustPos[i * 3 + 2] = Math.sin(th) * r;
      dustSpeed[i] = 0.25 + Math.random() * 0.8;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.16,
      map: glowTex,
      color: 0xa1a1aa,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    // ── Взаимодействие ──
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hoveredId: string | null = null;
    let downX = 0;
    let downY = 0;
    const pick = (e: PointerEvent | MouseEvent): string | null => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hitTargets, false);
      return hits.length ? (hits[0].object.userData.id as string) : null;
    };
    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    // Камера плавно едет к выбранному узлу, поэтому второй клик двойного клика
    // может уже «промахнуться» — запоминаем последний попавший узел.
    let lastPick: { id: string; at: number } | null = null;
    const onPointerUp = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 6) return;
      const id = pick(e);
      const now = performance.now();
      if (!id && lastPick && now - lastPick.at < 450) return;
      if (id) lastPick = { id, at: now };
      propsRef.current.onSelect(id);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (e.buttons) return;
      hoveredId = pick(e);
      renderer.domElement.style.cursor = hoveredId ? 'pointer' : 'grab';
    };
    const onDblClick = (e: MouseEvent) => {
      const id = pick(e) ?? (lastPick && performance.now() - lastPick.at < 600 ? lastPick.id : null);
      if (id) propsRef.current.onAdd(id);
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('dblclick', onDblClick);

    // ── Ресайз ──
    const resize = () => {
      camera.aspect = width() / height();
      camera.updateProjectionMatrix();
      renderer.setSize(width(), height());
      labelRenderer.setSize(width(), height());
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // ── Анимация ──
    let lastTime = performance.now();
    let elapsed = 0;
    // Смещаем «центр взгляда» вниз — граф поднимается над панелью таймлайна
    const HOME = new THREE.Vector3(0, window.innerWidth >= 1024 ? -3.5 : -1, 0);
    const focus = HOME.clone();
    const focusTarget = HOME.clone();
    let lastSelected: string | null = null;
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      elapsed += dt;
      const k = 1 - Math.exp(-dt * 7);
      const { recipeIds, selectedId, time, suggestedIds, naMode } = propsRef.current;
      const recipe = new Set(recipeIds);
      const suggested = new Set(suggestedIds);
      const selNode = selectedId ? nodeById.get(selectedId) : undefined;
      const linked = new Map<string, number>();
      if (selNode) for (const l of selNode.ing.links) linked.set(l.targetId, l.synergy);
      const hasRecipe = recipe.size > 0;
      const intensity = new Map<string, number>();

      // Узлы
      for (const n of nodes) {
        const id = n.ing.id;
        let op: number;
        let gl: number;
        let sc: number;
        let rg = 0;
        const inRecipe = recipe.has(id);
        const it = inRecipe ? ingredientIntensity(n.ing, time) : 0;
        intensity.set(id, it);
        if (selNode) {
          if (id === selectedId) { op = 1; gl = 1.3; sc = 1.45; }
          else if (linked.has(id)) { const s = linked.get(id)! / 100; op = 1; gl = 0.35 + s * 0.7; sc = 0.85 + s * 0.35; }
          else { op = 0.12; gl = 0.03; sc = 0.8; }
          if (inRecipe) rg = op > 0.5 ? 0.7 : 0.15;
        } else if (hasRecipe) {
          if (inRecipe) { op = 0.4 + 0.6 * it; gl = 0.12 + 1.4 * it; sc = 0.9 + 0.75 * it; rg = 0.35 + 0.6 * it; }
          else { op = 0.26; gl = 0.06; sc = 0.82; }
        } else {
          op = 0.9; gl = 0.42; sc = 1;
        }
        if (suggested.has(id)) {
          const pulse = 0.5 + 0.5 * Math.sin(elapsed * 4);
          op = Math.max(op, 1);
          gl = Math.max(gl, 0.7 + 0.5 * pulse);
          sc = Math.max(sc, 1.15 + 0.15 * pulse);
          rg = 1;
        }
        if (naMode && !inRecipe && id !== selectedId) {
          if (n.ing.abv > 0) { op *= 0.3; gl *= 0.25; sc *= 0.85; }
          else if (n.ing.naAlternative && !selNode) { gl = Math.max(gl, 0.6); rg = Math.max(rg, 0.35); }
        }
        if (id === hoveredId) { sc *= 1.15; op = Math.max(op, 0.85); }

        n.cur.op += (op - n.cur.op) * k;
        n.cur.glow += (gl - n.cur.glow) * k;
        n.cur.scale += (sc - n.cur.scale) * k;
        n.cur.ring += (rg - n.cur.ring) * k;
        n.mesh.material.opacity = n.cur.op;
        n.mesh.material.emissiveIntensity = 0.15 + n.cur.glow * 1.1;
        n.glow.material.opacity = Math.min(1, n.cur.glow * 0.5);
        n.glow.scale.setScalar(2.4 + n.cur.glow * 2.6);
        n.mesh.scale.setScalar(n.cur.scale);
        n.ring.material.opacity = n.cur.ring;
        n.ring.material.color.set(suggested.has(id) || (naMode && n.ing.naAlternative && !inRecipe) ? 0x10b981 : id === selectedId ? 0x06b6d4 : 0xf59e0b);
        n.ring.scale.setScalar(2.2 * n.cur.scale + (suggested.has(id) ? 0.3 * Math.sin(elapsed * 4) : 0));
        n.label.style.opacity = String(Math.max(0.1, Math.min(1, n.cur.op * (selNode && !linked.has(id) && id !== selectedId ? 0.9 : 1))));

        // Класс и текст подписи меняем только при изменении состояния
        const syn = selNode && linked.has(id) ? linked.get(id)! : 0;
        const state = `${inRecipe ? 'r' : ''}${id === selectedId ? 's' : ''}${suggested.has(id) ? 'g' : ''}${syn}`;
        if (state !== n.labelState) {
          n.labelState = state;
          n.label.className = `node-label${inRecipe ? ' in-recipe' : ''}${id === selectedId ? ' selected' : ''}${suggested.has(id) ? ' suggested' : ''}`;
          n.label.innerHTML = '';
          n.label.append(document.createTextNode(n.ing.name));
          if (syn) {
            const s = document.createElement('span');
            s.className = 'syn';
            s.textContent = `${syn}%`;
            n.label.append(s);
          }
        }
      }

      // Линии
      for (const l of links) {
        let target: number;
        if (selNode) {
          target = l.a === selectedId || l.b === selectedId ? 0.25 + 0.7 * (l.synergy / 100) : 0.015;
        } else if (hasRecipe) {
          const ra = recipe.has(l.a);
          const rb = recipe.has(l.b);
          if (ra && rb) target = 0.25 + 0.65 * ((intensity.get(l.a)! + intensity.get(l.b)!) / 2);
          else if ((ra && suggested.has(l.b)) || (rb && suggested.has(l.a))) target = 0.55 + 0.25 * Math.sin(elapsed * 4);
          else if (ra || rb) target = 0.06;
          else target = 0.025;
        } else {
          target = l.type === 'classic' ? 0.13 : 0.1;
        }
        l.cur += (target - l.cur) * k;
        l.line.material.opacity = l.cur;
      }

      // Пыль медленно поднимается, как пузырьки в бокале
      const arr = dustGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < DUST; i++) {
        arr[i * 3 + 1] += dustSpeed[i] * dt * 0.9;
        arr[i * 3] += Math.sin(elapsed * 0.4 + i) * dt * 0.05;
        if (arr[i * 3 + 1] > 30) arr[i * 3 + 1] = -30;
      }
      dustGeo.attributes.position.needsUpdate = true;
      dust.rotation.y += dt * 0.01;

      // Мягкий фокус камеры на выбранном узле
      if (selectedId !== lastSelected) {
        lastSelected = selectedId;
        if (selNode) {
          focusTarget.copy(selNode.group.position).multiplyScalar(0.5).add(HOME);
          controls.autoRotate = false;
        } else {
          focusTarget.copy(HOME);
        }
      }
      focus.lerp(focusTarget, 1 - Math.exp(-dt * 3));
      controls.target.copy(focus);
      controls.update();

      renderer.render(scene, camera);
      labelRenderer.render(scene, camera);
    };
    tick();

    // ── Очистка ресурсов ──
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      ro.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('dblclick', onDblClick);
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
      controls.dispose();

      const disposed = new Set<unknown>();
      scene.traverse((obj) => {
        const o = obj as THREE.Mesh | THREE.Sprite | THREE.Line | THREE.Points;
        if ('geometry' in o && o.geometry && !disposed.has(o.geometry)) {
          disposed.add(o.geometry);
          o.geometry.dispose();
        }
        const mats = 'material' in o && o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        for (const m of mats) {
          if (!disposed.has(m)) {
            disposed.add(m);
            m.dispose();
          }
        }
      });
      sphereGeo.dispose();
      hitGeo.dispose();
      hitMat.dispose();
      glowTex.dispose();
      ringTex.dispose();
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
      container.removeChild(renderer.domElement);
      container.removeChild(labelRenderer.domElement);
      clusterLabels.length = 0;
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 overflow-hidden" />;
}
