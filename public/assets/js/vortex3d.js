/* =========================================================
   Cena 3D do fundo: um vórtice de partículas (Three.js)
   As partículas giram em espiral e são "sugadas" para o centro.
   O scroll inclina a câmera e afunda o redemoinho.
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
renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.75));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);

const N = mobile ? 26000 : 60000;
const R = 9;
const geo = new THREE.BufferGeometry();
const aR = new Float32Array(N), aA = new Float32Array(N), aH = new Float32Array(N), aS = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const arm = i % 3;
  aR[i] = Math.random();
  aA[i] = (arm / 3) * Math.PI * 2 + (Math.random() - 0.5) * (0.5 + Math.random() * 0.9);
  aH[i] = (Math.random() - 0.5) * 2;
  aS[i] = Math.random();
}
geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N * 3), 3));
geo.setAttribute("aR", new THREE.BufferAttribute(aR, 1));
geo.setAttribute("aA", new THREE.BufferAttribute(aA, 1));
geo.setAttribute("aH", new THREE.BufferAttribute(aH, 1));
geo.setAttribute("aS", new THREE.BufferAttribute(aS, 1));

const uni = {
  uTime: { value: 0 },
  uScroll: { value: 0 },
  uPx: { value: renderer.getPixelRatio() },
  uSize: { value: mobile ? 26 : 30 },
  uMouse: { value: new THREE.Vector2() },
};

const mat = new THREE.ShaderMaterial({
  uniforms: uni,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */ `
    attribute float aR, aA, aH, aS;
    uniform float uTime, uScroll, uPx, uSize;
    uniform vec2 uMouse;
    varying vec3 vCol;
    varying float vA;
    void main() {
      float speed = 0.012 + aS * 0.02;
      float f = fract(aR - uTime * speed);            // 1 = borda, 0 = centro (fluxo para dentro)
      float r = 0.25 + f * ${R.toFixed(1)};
      float twist = 2.6 + uScroll * 2.0;
      float ang = aA + twist / (r * 0.35 + 0.4) + uTime * (0.05 + 0.25 / (r + 0.6));
      float funnel = -2.4 / (r * 0.7 + 0.35) * (0.55 + uScroll * 0.9);
      float thick = aH * (0.08 + 0.35 * exp(-r * 0.25)) * (1.0 - uScroll * 0.5);
      vec3 p = vec3(cos(ang) * r, funnel + thick + 1.2, sin(ang) * r);
      p.xz += uMouse * 0.25 * f;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = uSize * (0.35 + aS * 0.9) * uPx / -mv.z;
      vec3 cIn = vec3(0.96, 0.98, 1.0);
      vec3 cV = vec3(0.55, 0.36, 0.96);
      vec3 cC = vec3(0.13, 0.83, 0.93);
      vec3 cP = vec3(0.96, 0.45, 0.71);
      vec3 col = mix(cIn, cV, smoothstep(0.0, 0.18, f));
      col = mix(col, cC, smoothstep(0.25, 0.6, f) * step(0.5, fract(aS * 7.0)));
      col = mix(col, cP, smoothstep(0.55, 0.95, f) * step(0.75, fract(aS * 13.0)));
      vCol = col;
      vA = smoothstep(0.0, 0.06, f) * smoothstep(1.0, 0.8, f);
    }`,
  fragmentShader: /* glsl */ `
    varying vec3 vCol;
    varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(vCol, a * a * vA * 0.85);
    }`,
});
const pts = new THREE.Points(geo, mat);
pts.frustumCulled = false;
scene.add(pts);

// Brilho central
const glowTex = (() => {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(200,180,255,.9)"); gr.addColorStop(0.25, "rgba(139,92,246,.35)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
})();
const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
glow.scale.set(5, 5, 1);
glow.position.set(0, -2.2, 0);
scene.add(glow);

const mouse = new THREE.Vector2(), mouseT = new THREE.Vector2();
addEventListener("pointermove", (e) => { mouseT.set(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5); });

let scrollT = 0, scrollV = 0;
const readScroll = () => {
  const hero = innerHeight * 1.6;
  scrollT = Math.min(1, scrollY / hero);
  const doc = document.documentElement.scrollHeight - innerHeight;
  const end = doc > 0 ? scrollY / doc : 0;
  // some no meio da página e volta no CTA final
  const op = scrollY < hero ? 1 - scrollT * 0.55 : end > 0.82 ? 0.45 + (end - 0.82) * 3 : 0.45;
  canvas.style.opacity = Math.min(1, op).toFixed(3);
};
addEventListener("scroll", readScroll, { passive: true });
readScroll();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

let visible = true;
document.addEventListener("visibilitychange", () => (visible = !document.hidden));
const clock = new THREE.Clock();
let t = 0;
function frame() {
  requestAnimationFrame(frame);
  if (!visible) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  t += dt * (reduced ? 0.15 : 1);
  scrollV += (scrollT - scrollV) * 0.06;
  mouse.lerp(mouseT, 0.05);
  uni.uTime.value = t;
  uni.uScroll.value = scrollV;
  uni.uMouse.value.copy(mouse);
  const dist = (mobile ? 13 : 10.5) - scrollV * 2.5;
  const tilt = 0.55 + scrollV * 0.75;
  camera.position.set(mouse.x * 1.4 + (mobile ? 0 : -1.8 * (1 - scrollV)), Math.sin(tilt) * dist, Math.cos(tilt) * dist + mouse.y * 1.2);
  camera.lookAt(mobile ? 0 : -1.2 * (1 - scrollV), -0.8, 0);
  pts.rotation.y = t * 0.03;
  glow.material.opacity = 0.65 + Math.sin(t * 1.5) * 0.12;
  renderer.render(scene, camera);
}
frame();
window.dispatchEvent(new Event("vortex:ready"));
