// Cena 3D (Three.js r128): painel holográfico com a tela do dashboard, moldura, barras, grade, anel e partículas.
// Movimento reduzido de propósito. Renderiza só quando algo muda e para quando a aba fica oculta.
// Sem WebGL ou sem Three.js: mostra a tela 2D como imagem estática (modo fallback).
import { clamp, readTokens } from './util.js';

const COLOR_KEYS = ['accent', 'accent-2', 'accent-3', 'fg', 'muted', 'panel', 'line', 'scan'];

export function createScene({ canvas, screen }) {
  const st = { paused: false, sp: 0, opacity: 1, mx: 0, my: 0, dirty: true, running: false, hidden: document.hidden };
  let C = readTokens(COLOR_KEYS);
  let mode = 'none'; // 'webgl' | 'fallback'
  let renderer, scene, camera, rig, tex, frameMat, backMat, barMat, edgeMat, ringMat, ptsMat, grid, ring, pts, ptsPos;
  const bars = [];
  const pose = { x: 0, y: -.95, ry: -.25, rx: .1, s: 1 };
  let fbBox = null;

  screen.onUpdate = () => {
    if (tex) tex.needsUpdate = true;
    wake();
  };
  screen.setColors(C);

  /* ---------- WebGL ---------- */
  const hex = (k) => new THREE.Color(C[k]);
  function makeGrid() {
    if (grid) { rig.remove(grid); grid.geometry.dispose(); grid.material.dispose(); }
    grid = new THREE.GridHelper(9, 18, hex('accent-2'), hex('accent'));
    grid.position.y = -1.5; grid.material.transparent = true; grid.material.opacity = .4; rig.add(grid);
  }
  function applyColors() {
    C = readTokens(COLOR_KEYS);
    screen.setColors(C);
    if (mode !== 'webgl') return;
    frameMat.color = hex('accent-2'); backMat.color = hex('accent'); barMat.color = hex('accent');
    edgeMat.color = hex('accent-2'); ringMat.color = hex('accent-3'); ptsMat.color = hex('accent-2');
    makeGrid(); wake();
  }

  function webglAvailable() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  function initWebGL() {
    if (!window.THREE || !webglAvailable()) return false;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch (e) { renderer = null; return false; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, 1, .1, 60); camera.position.set(0, .3, 7.2);
    rig = new THREE.Group(); scene.add(rig);
    tex = new THREE.CanvasTexture(screen.canvas); tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    rig.add(new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.475), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false })));
    backMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(4.9, 2.9), backMat); back.position.z = -.25; rig.add(back);
    frameMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: .9 });
    rig.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(4.5, 2.575, .06)), frameMat));
    const barGeo = new THREE.BoxGeometry(1, 1, 1); barGeo.translate(0, .5, 0);
    const edgeGeo = new THREE.EdgesGeometry(barGeo);
    barMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: .78 });
    edgeMat = new THREE.LineBasicMaterial({ color: 0x22d3ee });
    const bg = new THREE.Group(); bg.position.set(0, -1.45, .75); rig.add(bg);
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(barGeo, barMat); m.position.x = (i - 6.5) * .28; m.scale.set(.16, .4, .16);
      m.add(new THREE.LineSegments(edgeGeo, edgeMat)); bg.add(m); bars.push(m);
    }
    ringMat = new THREE.MeshBasicMaterial({ color: 0x8ab4ff, transparent: true, opacity: .5 });
    ring = new THREE.Mesh(new THREE.TorusGeometry(3.05, .012, 8, 160), ringMat); ring.position.z = -.4; ring.rotation.x = 1.15; rig.add(ring);
    const NP = window.innerWidth < 700 ? 150 : 300;
    ptsPos = new Float32Array(NP * 3);
    for (let j = 0; j < NP; j++) { ptsPos[j * 3] = (Math.random() - .5) * 18; ptsPos[j * 3 + 1] = (Math.random() - .5) * 10; ptsPos[j * 3 + 2] = (Math.random() - .5) * 9; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(ptsPos, 3));
    ptsMat = new THREE.PointsMaterial({ color: 0x22d3ee, size: .05, transparent: true, opacity: .85, depthWrite: false });
    pts = new THREE.Points(pg, ptsMat); scene.add(pts);
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); toFallback(); });
    mode = 'webgl';
    makeGrid(); applyColors(); resize();
    return true;
  }

  // Pose do painel: hero (centro-baixo) → projetos (esquerda no desktop, topo no celular).
  function target(pe) {
    const asp = camera.aspect, halfW = 2.62 * asp, fit = Math.min(1, .92 * halfW * 2 / 4.9);
    let h, p;
    if (asp < .9) { h = { x: 0, y: -1.05, s: fit, ry: -.12, rx: .08 }; p = { x: 0, y: 1.3, s: fit * .85, ry: .12, rx: .05 }; }
    else { h = { x: 0, y: -.95, s: fit, ry: -.25, rx: .1 }; p = { x: -.46 * halfW, y: -.1, s: Math.min(.85, halfW * .8 / 4.4), ry: .38, rx: .05 }; }
    const o = {};
    for (const k in h) o[k] = h[k] + (p[k] - h[k]) * pe;
    return o;
  }

  function frame(now) {
    st.running = false;
    if (st.hidden || mode !== 'webgl') return;
    const time = now / 1000, sp = st.sp, pe = sp * sp * (3 - 2 * sp), tg = target(pe), k = st.paused ? 1 : .1;
    let moved = false;
    for (const key in tg) {
      const d = tg[key] - pose[key];
      if (Math.abs(d) > 1e-4) { pose[key] += d * k; moved = true; }
    }
    if (!st.paused) {
      camera.position.x += ((st.mx * .25) - camera.position.x) * .04;
      camera.position.y += ((.3 + st.my * .15) - camera.position.y) * .04;
      for (let i = 0; i < bars.length; i++) bars[i].scale.y = .14 + .3 * (.55 + .45 * Math.sin(time * .8 + i * .62));
      ring.rotation.z = time * .05;
      for (let j = 1; j < ptsPos.length; j += 3) { ptsPos[j] += .0015; if (ptsPos[j] > 5) ptsPos[j] = -5; }
      pts.geometry.attributes.position.needsUpdate = true;
      st.dirty = true;
    }
    if (moved) st.dirty = true;
    if (st.dirty) {
      camera.lookAt(0, -.2, 0);
      const bob = st.paused ? 0 : Math.sin(time * .6) * .025;
      rig.position.set(pose.x, pose.y + bob, 0); rig.scale.setScalar(pose.s);
      rig.rotation.set(pose.rx, pose.ry + (st.paused ? 0 : st.mx * .05), 0);
      renderer.render(scene, camera);
      st.dirty = false;
    }
    // continua animando se não está pausado ou se a pose ainda está chegando no alvo
    if (!st.paused || moved) wake();
  }

  function wake() {
    st.dirty = true;
    if (mode === 'fallback') { layoutFallback(); return; }
    if (mode !== 'webgl' || st.running || st.hidden) return;
    st.running = true;
    requestAnimationFrame(frame);
  }

  /* ---------- fallback 2D ---------- */
  let fbEl = null;
  function toFallback() {
    if (mode === 'fallback') return;
    mode = 'fallback';
    canvas.hidden = true;
    fbEl = document.createElement('div');
    fbEl.className = 'scene-fallback';
    fbEl.setAttribute('aria-hidden', 'true');
    fbEl.appendChild(screen.canvas);
    canvas.after(fbEl);
    document.documentElement.classList.add('no-webgl');
    layoutFallback();
  }
  function layoutFallback() {
    if (!fbEl) return;
    const vw = window.innerWidth, vh = window.innerHeight, sp = st.sp, pe = sp * sp * (3 - 2 * sp);
    const mobile = vw < 861;
    const hw = Math.min(vw - 32, 760), hx = (vw - hw) / 2, hy = vh * .62;
    let pw, px, py;
    if (mobile) { pw = Math.min(vw - 32, 520); px = (vw - pw) / 2; py = 76; }
    else { pw = Math.min(vw * .42, 560); px = Math.max(16, (vw - Math.min(vw, 1180)) / 2 + 16); py = vh / 2 - pw * 9 / 32; }
    const w = hw + (pw - hw) * pe, x = hx + (px - hx) * pe, y = hy + (py - hy) * pe;
    fbEl.style.width = w + 'px';
    fbEl.style.transform = `translate(${x}px,${y}px)`;
    fbEl.style.opacity = String(st.opacity);
  }

  function resize() {
    if (mode === 'webgl') {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    wake();
  }

  /* ---------- eventos ---------- */
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (ev) => {
    st.mx = ev.clientX / window.innerWidth * 2 - 1; st.my = -(ev.clientY / window.innerHeight * 2 - 1);
    if (!st.paused) wake();
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { st.hidden = document.hidden; if (!st.hidden) wake(); });

  return {
    // Chamado quando three.min.js terminou de carregar (ou falhou).
    start() { if (!initWebGL()) toFallback(); wake(); },
    fallback: toFallback,
    get mode() { return mode; },
    setPaused(p) { st.paused = p; screen.setPaused(p); wake(); },
    setScroll(sp, opacity) {
      st.sp = clamp(sp, 0, 1); st.opacity = opacity;
      canvas.style.opacity = String(opacity);
      wake();
    },
    applyColors,
  };
}
