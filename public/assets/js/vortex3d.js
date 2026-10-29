/* =========================================================
   Cena 3D do fundo: o redemoinho de crescimento da Vortex
   (o símbolo da marca em partículas: funil girando, espiral
   subindo pela base e a seta de crescimento com um pulso de luz).
   Azul na estrutura, verde no crescimento.
   ========================================================= */
import * as THREE from "three";

const canvas = document.getElementById("vortex");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = innerWidth < 760;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
} catch (e) {
  canvas.remove();
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.5));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 0, 8);

// Tipos: 0 funil · 1 aro · 2 espiral · 3 seta · 4 poeira
const parts = mobile
  ? [[5200, 0], [1300, 1], [2600, 2], [1700, 3], [1400, 4]]
  : [[13000, 0], [3000, 1], [6000, 2], [3600, 3], [4000, 4]];
const N = parts.reduce((s, p) => s + p[0], 0);
const aT = new Float32Array(N), aP = new Float32Array(N), aA = new Float32Array(N), aR = new Float32Array(N);
let k = 0;
for (const [n, t] of parts) for (let i = 0; i < n; i++, k++) {
  aT[k] = t; aP[k] = Math.random(); aA[k] = Math.random() * Math.PI * 2; aR[k] = Math.random();
}
const geo = new THREE.BufferGeometry();
geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
geo.setAttribute("aT", new THREE.BufferAttribute(aT, 1));
geo.setAttribute("aP", new THREE.BufferAttribute(aP, 1));
geo.setAttribute("aA", new THREE.BufferAttribute(aA, 1));
geo.setAttribute("aR", new THREE.BufferAttribute(aR, 1));

const uni = {
  uTime: { value: 0 },
  uPx: { value: renderer.getPixelRatio() },
  uSize: { value: mobile ? 44 : 44 },
};

const mat = new THREE.ShaderMaterial({
  uniforms: uni,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */ `
    attribute float aT, aP, aA, aR;
    uniform float uTime, uPx, uSize;
    varying vec3 vCol;
    varying float vA;
    const float PI = 3.14159265;
    vec3 BLUE = vec3(0.0, 0.40, 1.0);
    vec3 SKY = vec3(0.35, 0.68, 1.0);
    vec3 GREEN = vec3(0.10, 0.95, 0.60);
    vec3 MINT = vec3(0.55, 1.0, 0.80);
    float h(float n) { return fract(sin(n * 91.345) * 47453.21); }
    // curva da seta (Bezier quadrática), subindo para a direita
    vec3 arrowPath(float s) {
      vec3 a = vec3(-0.35, -0.55, 0.95), b = vec3(0.75, -0.35, 0.75), c = vec3(1.55, 1.75, 0.25);
      return mix(mix(a, b, s), mix(b, c, s), s);
    }
    void main() {
      vec3 p; vec3 col; float a = 1.0; float size = 1.0;
      float j1 = h(aR * 13.1) - 0.5, j2 = h(aR * 7.7) - 0.5;
      if (aT < 0.5) {
        // funil: partículas sobem e giram mais rápido perto da ponta
        float t = fract(aP + uTime * 0.035);
        float y = -1.65 + t * 3.05;
        float r = 0.05 + 1.18 * pow(t, 1.35);
        float ang = aA + uTime * (0.35 + 1.4 * (1.0 - t));
        r += j1 * 0.05;
        p = vec3(cos(ang) * r, y + j2 * 0.03, sin(ang) * r);
        float shade = 0.55 + 0.45 * sin(ang * 1.0 + 1.2);   // luz lateral
        col = mix(BLUE, SKY, t * 0.7) * (0.6 + shade * 0.6);
        a = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.92, t) * 0.7;
        size = 0.7 + aR * 0.6;
      } else if (aT < 1.5) {
        // aro superior
        float ang = aA + uTime * 0.35;
        float r = 1.24 + j1 * 0.04;
        p = vec3(cos(ang) * r, 1.40 + j2 * 0.03, sin(ang) * r);
        col = SKY * 1.2;
        a = 0.85; size = 0.9 + aR * 0.5;
      } else if (aT < 2.5) {
        // espiral verde envolvendo a base, fluindo para cima
        float s = fract(aP - uTime * 0.07);
        float ang = s * PI * 2.0 * 2.3 + uTime * 1.2;
        float r = 0.98 - s * 0.5;
        vec3 q = vec3(cos(ang) * r, -0.25 - s * 1.0 + sin(ang) * 0.08, sin(ang) * r);
        q += vec3(j1, j2, h(aR * 3.3) - 0.5) * 0.06;
        float tz = 0.28;   // inclinação do anel
        p = vec3(q.x * cos(tz) - q.y * sin(tz), q.x * sin(tz) + q.y * cos(tz), q.z);
        col = mix(GREEN, MINT, aR * 0.5);
        a = (0.55 + 0.45 * smoothstep(-0.2, 0.6, sin(ang))) * smoothstep(0.0, 0.08, s) * smoothstep(1.0, 0.9, s);
        size = 0.8 + aR * 0.7;
      } else if (aT < 3.5) {
        // seta de crescimento com pulso de luz correndo até a ponta
        float s = aP;
        vec3 tip = arrowPath(1.0);
        if (aR < 0.82) {
          p = arrowPath(s);
        } else {
          float side = step(0.91, aR) * 2.0 - 1.0;
          vec3 d = side < 0.0 ? vec3(-0.46, -0.05, 0.08) : vec3(-0.05, -0.46, 0.05);
          p = tip + d * s;
          s = 1.0 - s * 0.15;
        }
        p += vec3(j1, j2, h(aR * 5.1) - 0.5) * 0.045;
        float pulse = smoothstep(0.18, 0.0, abs(fract(uTime * 0.32) - s));
        col = mix(GREEN, vec3(1.0), pulse * 0.6) * (1.0 + pulse * 1.6);
        a = 0.75 + pulse;
        size = 0.9 + aR * 0.5 + pulse * 1.2;
      } else {
        // poeira luminosa ao redor
        float ang = aA + uTime * 0.05;
        float r = 1.6 + aP * 3.2;
        p = vec3(cos(ang) * r, (h(aR * 17.0) - 0.5) * 4.6 + sin(uTime * 0.3 + aA * 3.0) * 0.12, sin(ang) * r * 0.6);
        col = mix(BLUE, GREEN, step(0.7, aR)) * 0.9;
        a = 0.28 + 0.3 * sin(uTime * 2.0 + aA * 10.0);
        size = 0.45 + aR * 0.5;
      }
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * size * uPx / -mv.z;
      vCol = col; vA = a;
    }`,
  fragmentShader: /* glsl */ `
    varying vec3 vCol;
    varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(vCol, a * a * vA);
    }`,
});

const group = new THREE.Group();
const pts = new THREE.Points(geo, mat);
pts.frustumCulled = false;
group.add(pts);
scene.add(group);

// Brilho atrás do símbolo
const glowTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(60,140,255,.55)"); gr.addColorStop(0.4, "rgba(0,102,255,.18)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();
const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
glow.scale.set(7, 7, 1);
group.add(glow);

const mouse = new THREE.Vector2(), mouseT = new THREE.Vector2();
addEventListener("pointermove", (e) => mouseT.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5));

let scrollT = 0, scrollV = 0;
const readScroll = () => {
  const hero = innerHeight * 1.2;
  scrollT = Math.min(1, scrollY / hero);
  const doc = document.documentElement.scrollHeight - innerHeight;
  const end = doc > 0 ? scrollY / doc : 0;
  const op = scrollY < hero ? 1 - scrollT * 0.8 : end > 0.86 ? 0.2 + (end - 0.86) * 4 : 0.2;
  canvas.style.opacity = (Math.min(1, op) * (mobile ? 0.45 : 1)).toFixed(3);
};
addEventListener("scroll", readScroll, { passive: true });
readScroll();

const place = () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
};
addEventListener("resize", place);

let visible = true;
document.addEventListener("visibilitychange", () => (visible = !document.hidden));
const clock = new THREE.Clock();
let t = 0;
function frame() {
  requestAnimationFrame(frame);
  if (!visible) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  t += dt * (reduced ? 0.15 : 1);
  scrollV += (scrollT - scrollV) * 0.07;
  mouse.lerp(mouseT, 0.05);
  uni.uTime.value = t;
  const wide = innerWidth / innerHeight;
  // computador: símbolo à direita do título; celular: centralizado atrás do título
  const baseX = mobile ? 0.2 : Math.min(3.1, 1.25 * wide + 0.6);
  group.position.set(baseX - scrollV * (mobile ? 0 : 1.2), (mobile ? 1.1 : 0.55) + scrollV * 2.2, 0);
  const s = (mobile ? 0.82 : 1) * (1 + scrollV * 0.35);
  group.scale.setScalar(s);
  group.rotation.set(0.12 + mouse.y * 0.25 + scrollV * 0.4, -0.35 + mouse.x * 0.5 + Math.sin(t * 0.25) * 0.08, 0);
  glow.material.opacity = 0.75 + Math.sin(t * 1.4) * 0.15;
  renderer.render(scene, camera);
}
frame();
requestAnimationFrame(() => document.documentElement.classList.add("v3d"));
