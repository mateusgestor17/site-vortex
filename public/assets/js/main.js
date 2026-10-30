/* =========================================================
   Vortex Company · Landing de Sites Premium
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const isMob = () => innerWidth <= 700;
  const LP = window.LP || {};
  const MODELOS = window.MODELOS || [];
  const CATS = window.CATEGORIAS || {};
  if (reduced) document.documentElement.classList.add("reduced");
  const safe = (fn) => { try { fn(); } catch (e) { console.error(e); } };

  /* ---------- Rolagem suave ---------- */
  let lenis = null; // carregado sob demanda junto com as animações (ver loadFx)
  const scrollToEl = (el) => (lenis ? lenis.scrollTo(el, { offset: -20, duration: 1.4 }) : el.scrollIntoView({ behavior: "smooth" }));
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const el = id.length > 1 && $(id);
    if (el) { e.preventDefault(); scrollToEl(el); }
  }));

  /* ---------- Dividir títulos em palavras ---------- */
  const splitWords = (el) => {
    const out = [];
    [...el.childNodes].forEach((n) => {
      if (n.nodeType === 3) n.textContent.split(/(\s+)/).forEach((p) => out.push(/^\s+$/.test(p) ? p : p ? `<span class="w"><span>${p}</span></span>` : ""));
      else out.push(`<span class="w"><span>${n.outerHTML}</span></span>`);
    });
    el.innerHTML = out.join("");
    return $$(".w", el);
  };
  const stWords = splitWords($("[data-statement]"));

  /* ---------- Escassez (vagas do mês) ---------- */
  safe(() => {
    const mes = new Intl.DateTimeFormat("pt-BR", { month: "long" }).format(new Date());
    const v = LP.vagas || {};
    const tem = Number.isFinite(v.restantes) && Number.isFinite(v.total);
    const txt = tem ? `Agenda de ${mes}: restam <b>${v.restantes} ${v.restantes === 1 ? "vaga" : "vagas"}</b>` : `Agenda de ${mes} aberta para novos projetos`;
    $$("[data-vagas-txt]").forEach((e) => (e.innerHTML = txt));
    $("[data-vagas-mes]").textContent = `Agenda de ${mes}`;
    if (tem) {
      $("[data-vagas-seats]").innerHTML = Array.from({ length: v.total }, (_, i) => `<i class="${i < v.total - v.restantes ? "taken" : "free"}"></i>`).join("");
      $("[data-vagas-num]").textContent = v.restantes;
      $("[data-vagas-label]").textContent = v.restantes === 1 ? "vaga para novo projeto" : "vagas para novos projetos";
    } else {
      $("[data-vagas-seats]").remove();
      $(".vagas__n").innerHTML = "<strong>Aberta</strong>";
    }
  });
  $("[data-ano]").textContent = new Date().getFullYear();

  /* ---------- Formulário → WhatsApp ---------- */
  const segs = LP.segmentos || ["Outro"];
  $$("[data-seg]").forEach((box) => {
    box.innerHTML = segs.map((s) => `<button type="button" data-v="${s}">${s}</button>`).join("");
    const form = box.closest("form");
    const other = $(".seg__other", form);
    box.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      $$("button", box).forEach((x) => x.classList.toggle("is-on", x === b));
      box.classList.remove("is-err");
      if (b.dataset.v === "Outro") { other.value = ""; other.classList.add("is-on"); other.focus(); }
      else { other.value = b.dataset.v; other.classList.remove("is-on", "is-err"); }
      syncTo(form, "segmento", other.value, b.dataset.v);
    });
  });

  // Mantém os dois formulários (final e modal) com os mesmos dados
  const forms = $$(".lead-form");
  function syncTo(from, name, val, chip) {
    forms.forEach((f) => {
      if (f === from) return;
      const inp = f.elements[name]; if (inp) inp.value = val;
      if (name === "segmento") {
        const box = $("[data-seg]", f);
        const c = chip || (segs.includes(val) ? val : val ? "Outro" : "");
        $$("button", box).forEach((x) => x.classList.toggle("is-on", x.dataset.v === c));
        $(".seg__other", f).classList.toggle("is-on", c === "Outro");
      }
    });
  }
  forms.forEach((f) => f.addEventListener("input", (e) => {
    const t = e.target; if (!t.name) return;
    t.classList.remove("is-err");
    syncTo(f, t.name, t.value);
  }));

  const checkField = (f, name) => {
    const inp = f.elements[name];
    const ok = inp.value.trim().length >= 2;
    if (!ok) {
      if (name === "segmento" && !inp.classList.contains("is-on")) $("[data-seg]", f).classList.add("is-err");
      else { inp.classList.remove("is-err"); void inp.offsetWidth; inp.classList.add("is-err"); }
    }
    return ok;
  };
  const MSG_ERR = { nome: "Digite seu nome para continuar.", empresa: "Informe o nome da empresa.", segmento: "Escolha ou escreva o seu segmento." };

  let origem = "pagina";
  function sendWhats(f) {
    const d = Object.fromEntries(["nome", "empresa", "segmento"].map((k) => [k, f.elements[k].value.trim()]));
    const msg = [
      LP.saudacao || "Olá! Vim pelo site e quero um site premium.",
      "",
      `*Nome:* ${d.nome}`,
      `*Empresa:* ${d.empresa}`,
      `*Segmento:* ${d.segmento}`,
    ].join("\n");
    const url = `https://wa.me/${(LP.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
    // Mensuração: eventos para Google Tag Manager / GA4 / Meta Pixel, se instalados
    safe(() => {
      (window.dataLayer = window.dataLayer || []).push({ event: "lead_whatsapp", origem, segmento: d.segmento });
      window.gtag && gtag("event", "generate_lead", { origem, segmento: d.segmento });
      window.fbq && fbq("track", "Lead", { content_category: d.segmento });
      window.clarity && clarity("event", "lead_whatsapp");
    });
    // link real (funciona também em navegadores que bloqueiam window.open)
    const a = Object.assign(document.createElement("a"), { href: url, target: "_blank", rel: "noopener" });
    document.body.appendChild(a); a.click(); a.remove();
  }

  // Botões de WhatsApp: vão direto para a conversa e registram o clique
  const waBase = `https://wa.me/${(LP.whatsapp || "").replace(/\D/g, "")}`;
  $$("[data-wa]").forEach((a) => {
    a.href = `${waBase}?text=${encodeURIComponent(LP.mensagemDireta || "Olá, Vortex! Vim pelo site e quero saber mais sobre os sites premium.")}`;
    a.addEventListener("click", () => safe(() => {
      (window.dataLayer = window.dataLayer || []).push({ event: "clique_whatsapp", local: a.className.split(" ")[0] });
      window.gtag && gtag("event", "clique_whatsapp", { local: a.className.split(" ")[0] });
      window.fbq && fbq("track", "Contact");
    }));
  });
  $$("[data-ig]").forEach((a) => a.addEventListener("click", () => safe(() => (window.dataLayer = window.dataLayer || []).push({ event: "clique_instagram" }))));

  // Formulário completo (seção final)
  const inlineForm = $(".card-form");
  inlineForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const bad = ["nome", "empresa", "segmento"].filter((k) => !checkField(inlineForm, k));
    if (bad.length) { const el = inlineForm.elements[bad[0]]; el.classList.contains("seg__other") && !el.classList.contains("is-on") ? $("[data-seg]", inlineForm).scrollIntoView({ block: "center" }) : el.focus(); return; }
    origem = "formulario-final";
    sendWhats(inlineForm);
  });

  /* ---------- Modais ---------- */
  let lastFocus = null;
  const openModal = (name) => {
    const m = $(`[data-modal="${name}"]`);
    lastFocus = document.activeElement;
    m.classList.add("is-open"); m.setAttribute("aria-hidden", "false");
    lenis && lenis.stop();
    document.documentElement.style.overflow = "hidden";
    return m;
  };
  const closeModal = (m) => {
    m.classList.remove("is-open"); m.setAttribute("aria-hidden", "true");
    if (!$(".modal.is-open")) { lenis && lenis.start(); document.documentElement.style.overflow = ""; }
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  };
  $$(".modal").forEach((m) => $$("[data-close]", m).forEach((b) => b.addEventListener("click", () => closeModal(m))));
  addEventListener("keydown", (e) => { if (e.key === "Escape") $$(".modal.is-open").forEach(closeModal); });

  // Assistente passo a passo
  const wiz = $(".wiz");
  const steps = $$(".wiz__step", wiz);
  const err = $(".wiz__err", wiz);
  const names = ["nome", "empresa", "segmento"];
  let cur = 0;
  const show = (i) => {
    cur = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach((s, k) => s.classList.toggle("is-on", k === cur));
    wiz.classList.toggle("is-first", cur === 0);
    wiz.classList.toggle("is-last", cur === steps.length - 1);
    $("[data-wiz-bar]").style.width = ((cur + 1) / steps.length) * 100 + "%";
    err.textContent = "";
    const inp = $("input", steps[cur]);
    // foco imediato (dentro do clique, para o teclado abrir no celular)
    if (!(names[cur] === "segmento" && !inp.classList.contains("is-on"))) inp.focus({ preventScroll: true });
  };
  const next = () => {
    if (!checkField(wiz, names[cur])) {
      err.textContent = MSG_ERR[names[cur]];
      const inp = wiz.elements[names[cur]];
      if (inp.offsetParent) inp.focus({ preventScroll: true });
      return;
    }
    if (cur < steps.length - 1) show(cur + 1); else { sendWhats(wiz); }
  };
  $("[data-wiz-next]").addEventListener("click", next);
  $("[data-wiz-back]").addEventListener("click", () => show(cur - 1));
  wiz.addEventListener("submit", (e) => { e.preventDefault(); next(); });
  wiz.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.tagName === "INPUT") { e.preventDefault(); next(); } });

  $$("[data-lead]").forEach((b) => b.addEventListener("click", () => {
    origem = b.dataset.lead;
    $$(".modal.is-open").forEach((m) => m.dataset.modal === "zoom" && closeModal(m));
    openModal("lead");
    // começa no primeiro campo vazio
    const first = names.findIndex((n) => wiz.elements[n].value.trim().length < 2);
    show(first === -1 ? steps.length - 1 : first);
  }));

  // Modelo ampliado: mostra só a primeira dobra (computador + celular)
  const openLive = (m) => {
    $("[data-zoom-url]").textContent = m.url;
    $("[data-zoom-desk]").src = `assets/modelos/${m.id}.webp`;
    $("[data-zoom-desk]").alt = `Primeira dobra do modelo ${m.nome} no computador`;
    $("[data-zoom-mob]").src = `assets/modelos/${m.id}-m.webp`;
    $("[data-zoom-mob]").alt = `Primeira dobra do modelo ${m.nome} no celular`;
    $("[data-zoom-cat]").textContent = CATS[m.categoria] || "";
    $("[data-zoom-name]").textContent = `${m.nome} · ${m.segmento}`;
    openModal("zoom");
  };

  /* ---------- Modelos passando no hero (só a headline) ---------- */
  safe(() => {
    const screen = $("[data-demo-screen]");
    const phone = $("[data-demo-phone]");
    const nav = $("[data-demo-nav]");
    const urlEl = $("[data-demo-url]");
    const list = MODELOS;
    const DUR = 4200;
    // só a imagem da vez (e a próxima) é baixada; as demais ficam em data-*
    const dsk = (m) => `data-srcset="assets/modelos/${m.id}-900.webp 900w, assets/modelos/${m.id}.webp 1800w" sizes="(max-width: 700px) 92vw, 1240px"`;
    screen.innerHTML = list.map((m) => `<img ${dsk(m)} alt="Modelo de site para ${m.segmento.toLowerCase()}" decoding="async">`).join("");
    phone.innerHTML = list.map((m) => `<img data-srcset="assets/modelos/${m.id}-m360.webp 360w, assets/modelos/${m.id}-m.webp 780w" sizes="(max-width: 700px) 30vw, 236px" alt="" decoding="async">`).join("");
    const load = (im) => { if (im && im.dataset.srcset) { im.sizes = im.getAttribute("sizes"); im.srcset = im.dataset.srcset; delete im.dataset.srcset; } };
    nav.innerHTML = list.map((m, i) => `<button aria-label="Ver ${m.segmento}" data-i="${i}"></button>`).join("");
    nav.style.setProperty("--dur", DUR + "ms");
    const imgs = $$("img", screen), pimgs = $$("img", phone), dots = $$("button", nav);
    let idx = -1, timer = null;
    const go = (i) => {
      idx = (i + list.length) % list.length;
      [idx, (idx + 1) % list.length].forEach((k) => { load(imgs[k]); load(pimgs[k]); });
      imgs.forEach((im, k) => im.classList.toggle("is-on", k === idx));
      pimgs.forEach((im, k) => im.classList.toggle("is-on", k === idx));
      urlEl.textContent = list[idx].url;
      dots.forEach((b, k) => { b.classList.remove("is-on"); if (k === idx) { void b.offsetWidth; b.classList.add("is-on"); } });
      clearTimeout(timer);
      timer = setTimeout(() => go(idx + 1), DUR);
    };
    nav.addEventListener("click", (e) => { const b = e.target.closest("button"); b && go(+b.dataset.i); });
    // a vitrine do hero começa depois que o essencial da página carregou
    const begin = () => go(0);
    document.readyState === "complete" ? begin() : addEventListener("load", begin, { once: true });
  });

  /* ---------- Vitrine em anel 3D ---------- */
  let ring = null;
  safe(() => {
    const stage = $("[data-ring]");
    const track = $("[data-ring-track]");
    const n = MODELOS.length;
    const step = 360 / n;
    track.innerHTML = MODELOS.map((m, i) => `
      <div class="rcard" data-i="${i}" role="button" tabindex="0" aria-label="${m.segmento}: ${m.nome}">
        <div class="rcard__bar"><span class="dots"><i></i><i></i><i></i></span><span>${m.url}</span><span>Modelo</span></div>
        <img data-lazy data-srcset="assets/modelos/${m.id}-900.webp 900w, assets/modelos/${m.id}.webp 1800w" sizes="(max-width: 700px) 72vw, 480px" alt="Modelo de site para ${m.segmento.toLowerCase()}" decoding="async" draggable="false">
      </div>`).join("");
    const cards = $$(".rcard", track);
    let R = 600, rot = 0, target = 0, dragging = false, startX = 0, startRot = 0, moved = 0, lastX = 0, vel = 0, idleAt = 0, front = -1, inView = false, enter = { p: 0 };
    const layout = () => {
      const w = cards[0].offsetWidth || 480;
      R = Math.round((w / 2) / Math.tan(Math.PI / n) * 1.12);
      cards.forEach((c, i) => (c.style.transform = `rotateY(${i * step}deg) translateZ(${R}px)`));
    };
    layout(); addEventListener("resize", layout);

    const info = { cat: $("[data-ri-cat]"), name: $("[data-ri-name]"), seg: $("[data-ri-seg]") };
    const setFront = (i) => {
      if (i === front) return; front = i;
      const m = MODELOS[i];
      cards.forEach((c, k) => c.classList.toggle("is-front", k === i));
      info.cat.textContent = CATS[m.categoria] || "";
      info.name.textContent = m.nome;
      info.seg.textContent = `${m.segmento} · modelo demonstrativo`;
    };
    const goTo = (i) => {
      // menor caminho até o cartão i
      const want = -i * step;
      let d = ((want - target) % 360 + 540) % 360 - 180;
      target += d; idleAt = performance.now();
    };
    const tick = () => {
      requestAnimationFrame(tick);
      if (!inView && !dragging) return;
      const now = performance.now();
      if (!dragging) {
        if (Math.abs(vel) > 0.05) { target += vel; vel *= 0.92; if (Math.abs(vel) <= 0.05) target = Math.round(target / step) * step; }
        else if (now - idleAt > 3800 && !reduced) { target = Math.round(target / step) * step - step; idleAt = now; }
        rot += (target - rot) * 0.075;
      }
      const ent = 1 - enter.p;
      track.style.transform = `translateZ(${-R - ent * 900}px) rotateX(${-5 - ent * 20}deg) rotateY(${rot + ent * 160}deg)`;
      cards.forEach((c, i) => {
        const a = ((i * step + rot + ent * 160) % 360 + 540) % 360 - 180;
        const f = Math.cos((a * Math.PI) / 180);
        c.style.filter = `brightness(${(0.32 + 0.68 * Math.max(0, f)).toFixed(3)})`;
        c.style.zIndex = Math.round((f + 1) * 50);
      });
      const fi = ((Math.round(-rot / step) % n) + n) % n;
      setFront(fi);
    };
    requestAnimationFrame(tick);

    new IntersectionObserver((e) => (inView = e[0].isIntersecting), { rootMargin: "100px" }).observe(stage);
    enter.p = 1;
    ring = { enter, stage };

    stage.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".ring-arrow")) return;
      dragging = true; moved = 0; startX = lastX = e.clientX; startRot = rot; vel = 0;
      stage.classList.add("is-drag");
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      rot = target = startRot + dx * (isMob() ? 0.35 : 0.22);
      vel = (e.clientX - lastX) * 0.22; lastX = e.clientX;
    });
    const up = (e) => {
      if (!dragging) return;
      dragging = false; stage.classList.remove("is-drag"); idleAt = performance.now();
      if (moved < 6) {
        vel = 0;
        const el = document.elementsFromPoint(e.clientX, e.clientY).find((x) => x.classList && x.classList.contains("rcard"));
        if (el) { const i = +el.dataset.i; i === front ? openLive(MODELOS[i]) : goTo(i); }
        else target = Math.round(target / step) * step;
      } else if (Math.abs(vel) < 0.5) target = Math.round(target / step) * step;
    };
    stage.addEventListener("pointerup", up);
    stage.addEventListener("pointercancel", up);
    $("[data-ring-prev]").addEventListener("click", () => goTo(front - 1));
    $("[data-ring-next]").addEventListener("click", () => goTo(front + 1));
    stage.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") goTo(front - 1);
      if (e.key === "ArrowRight") goTo(front + 1);
      if (e.key === "Enter" && e.target.classList.contains("rcard")) openLive(MODELOS[+e.target.dataset.i]);
    });
    $("[data-ri-open]").addEventListener("click", () => openLive(MODELOS[front]));

    $$("[data-cat]").forEach((b) => b.addEventListener("click", () => {
      $$("[data-cat]").forEach((x) => x.classList.toggle("is-on", x === b));
      const c = b.dataset.cat;
      cards.forEach((card, i) => card.classList.toggle("is-dim", c !== "todos" && MODELOS[i].categoria !== c));
      if (c !== "todos") {
        const ids = MODELOS.map((m, i) => (m.categoria === c ? i : -1)).filter((i) => i >= 0);
        goTo(ids.includes(front) ? front : ids[0]);
      }
      idleAt = performance.now() + (c === "todos" ? 0 : 8000);
    }));
  });

  /* ---------- Cartões com luz e inclinação ---------- */
  if (fine && !reduced) $$("[data-tilt-card]").forEach((c) => {
    c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty("--mx", x * 100 + "%"); c.style.setProperty("--my", y * 100 + "%");
      c.style.transform = `perspective(1000px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 6}deg)`;
    });
    c.addEventListener("pointerleave", () => (c.style.transform = ""));
  });

  /* ---------- Botões magnéticos ---------- */
  const magnetic = () => fine && !reduced && $$(".magnetic").forEach((b) => {
    const x = gsap.quickTo(b, "x", { duration: 0.6, ease: "power3" }), y = gsap.quickTo(b, "y", { duration: 0.6, ease: "power3" });
    b.addEventListener("pointermove", (e) => { const r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.25); y((e.clientY - r.top - r.height / 2) * 0.35); });
    b.addEventListener("pointerleave", () => { x(0); y(0); });
  });

  /* ---------- Animações de scroll ---------- */
  // Imagens abaixo da dobra: só baixam quando chegam perto da tela
  safe(() => {
    const imgs = $$("img[data-lazy]");
    const put = (im) => { im.srcset = im.dataset.srcset; if (im.dataset.src) im.src = im.dataset.src; im.removeAttribute("data-lazy"); };
    if (!("IntersectionObserver" in window)) return imgs.forEach(put);
    // observa o bloco (anel ou comparação) e libera todas as imagens dele de uma vez
    const groups = new Map();
    imgs.forEach((im) => { const box = im.closest(".ring-stage, .compare") || im; groups.set(box, [...(groups.get(box) || []), im]); });
    const io = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { groups.get(e.target).forEach(put); io.unobserve(e.target); } }), { rootMargin: "400px 0px" });
    groups.forEach((_, box) => io.observe(box));
  });

  // Revelar ao entrar na tela (sem biblioteca)
  safe(() => {
    const els = $$("[data-r]");
    if (reduced || !("IntersectionObserver" in window)) return els.forEach((e) => e.classList.add("in"));
    const io = new IntersectionObserver((ents) => ents.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in"); io.unobserve(e.target);
    }), { rootMargin: "0px 0px -8% 0px" });
    els.forEach((e) => io.observe(e));
  });

  // Animações ligadas à rolagem (GSAP + ScrollTrigger + Lenis), carregadas na primeira interação
  function scrollAnims() {
    document.documentElement.classList.add("fx");
    if (ring && ring.stage.getBoundingClientRect().top > innerHeight * 0.95) {
      ring.enter.p = 0;
      gsap.to(ring.enter, { p: 1, ease: "none", scrollTrigger: { trigger: ring.stage, start: "top 95%", end: "top 35%", scrub: 1 } });
    }

    // Hero: aparelho se aproxima ao rolar
    gsap.fromTo(".device", { rotationX: 18, scale: 0.92 }, { rotationX: 0, scale: 1, ease: "none", scrollTrigger: { trigger: ".hero__stage", start: "top 95%", end: "top 25%", scrub: true } });
    gsap.to(".marquee__in", { x: -300, ease: "none", scrollTrigger: { trigger: ".marquee", start: "top bottom", end: "bottom top", scrub: true } });

    // Problema: antes → depois
    const pqs = $$("[data-pq]");
    const nw = $("[data-new]"), scan = $("[data-scan]"), frame3d = $(".compare__frame"), glitch = $(".glitch");
    const desk = !isMob() && innerWidth > 1080;
    ScrollTrigger.create({
      trigger: desk ? ".problema__pin" : ".compare",
      start: desk ? "center center" : "top 80%",
      end: desk ? "+=130%" : "bottom 25%",
      pin: desk,
      scrub: 0.6,
      onUpdate: (st) => {
        const p = st.progress;
        pqs.forEach((q, i) => q.classList.toggle("is-on", p > i * 0.26 + 0.04));
        const w = Math.min(1, Math.max(0, (p - 0.25) / 0.65));
        nw.style.clipPath = `inset(0 0 0 ${(1 - w) * 100}%)`;
        scan.style.left = (1 - w) * 100 + "%";
        scan.style.opacity = w > 0.99 || w < 0.01 ? 0 : 1;
        frame3d.style.transform = `rotateY(${(1 - p) * -16}deg) rotateX(${(1 - p) * 6}deg) scale(${0.94 + p * 0.06})`;
        glitch.style.opacity = w > 0.02 && w < 0.98 ? 0.6 + Math.random() * 0.4 : 0;
      },
    });
    ScrollTrigger.create({
      trigger: "[data-statement]", start: "top 85%", end: "bottom 45%", scrub: true,
      onUpdate: (st) => stWords.forEach((w, i) => w.classList.toggle("is-on", st.progress > i / stWords.length)),
    });
    gsap.to("[data-steps-line]", { scaleX: 1, ease: "none", scrollTrigger: { trigger: "[data-steps]", start: "top 75%", end: "bottom 55%", scrub: true } });
  }

  /* ---------- Nav, botão flutuante e barra no celular ---------- */
  safe(() => {
    const nav = $(".nav"), wa = $(".wa-float"), bar = $(".mbar"), final = $("#contato");
    let last = 0;
    const onScroll = () => {
      const y = scrollY;
      nav.classList.toggle("is-hidden", y > 400 && y > last && !$(".modal.is-open"));
      last = y;
      const fr = final.getBoundingClientRect();
      const nearForm = fr.top < innerHeight * 0.9 && fr.bottom > 0;
      const on = y > innerHeight * 0.8 && !nearForm;
      wa.classList.toggle("is-on", on);
      bar.classList.toggle("is-on", on);
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  });

  /* ---------- Carregamento sob demanda (desempenho) ----------
     A página abre só com o essencial. Na primeira interação (rolar, tocar,
     mover o mouse ou teclar) entram as animações de rolagem e a cena 3D. */
  // imagem estática do redemoinho: baixada depois que a página carregou
  addEventListener("load", () => safe(() => {
    const im = $(".vortex-poster");
    if (im && !document.documentElement.classList.contains("v3d")) im.src = innerWidth <= 700 ? im.dataset.srcM : im.dataset.srcD;
  }));
  const addScript = (src) => new Promise((ok, fail) => { const t = document.createElement("script"); t.src = src; t.onload = ok; t.onerror = fail; document.head.appendChild(t); });
  let fxStarted = false;
  const loadFx = () => {
    if (fxStarted) return; fxStarted = true;
    ["scroll", "wheel", "pointerdown", "pointermove", "touchstart", "keydown"].forEach((ev) => removeEventListener(ev, loadFx));
    if (reduced) return;
    // cena 3D (módulo com Three.js)
    safe(() => {
      const im = document.createElement("script");
      im.type = "importmap"; im.textContent = JSON.stringify({ imports: { three: new URL("assets/vendor/three.module.min.js", location.href).href } });
      document.head.appendChild(im);
      const m = document.createElement("script"); m.type = "module"; m.src = "assets/js/vortex3d.js?v=20261030a"; document.head.appendChild(m);
    });
    addScript("assets/vendor/gsap.min.js")
      .then(() => addScript("assets/vendor/ScrollTrigger.min.js"))
      .then(() => addScript("assets/vendor/lenis.min.js"))
      .then(() => {
        gsap.registerPlugin(ScrollTrigger);
        if (window.Lenis) {
          lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
          lenis.on("scroll", ScrollTrigger.update);
          gsap.ticker.add((t) => lenis.raf(t * 1000));
          gsap.ticker.lagSmoothing(0);
        }
        safe(scrollAnims);
        safe(magnetic);
        ScrollTrigger.refresh();
      })
      .catch((e) => console.error(e));
  };
  ["scroll", "wheel", "pointerdown", "pointermove", "touchstart", "keydown"].forEach((ev) => addEventListener(ev, loadFx, { passive: true }));
})();
