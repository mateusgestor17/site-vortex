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
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);
  const safe = (fn) => { try { fn(); } catch (e) { console.error(e); } };

  /* ---------- Rolagem suave ---------- */
  let lenis = null;
  if (window.Lenis && hasGsap && !reduced) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
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
  const heroWords = splitWords($(".hero__title"));
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
  const MSG_ERR = { nome: "Digite seu nome para continuar.", cidade: "Informe a sua cidade.", empresa: "Informe o nome da empresa.", segmento: "Escolha ou escreva o seu segmento." };

  let origem = "pagina";
  function sendWhats(f) {
    const d = Object.fromEntries(["nome", "cidade", "empresa", "segmento"].map((k) => [k, f.elements[k].value.trim()]));
    const msg = [
      LP.saudacao || "Olá! Vim pelo site e quero um site premium.",
      "",
      `*Nome:* ${d.nome}`,
      `*Cidade:* ${d.cidade}`,
      `*Empresa:* ${d.empresa}`,
      `*Segmento:* ${d.segmento}`,
    ].join("\n");
    const url = `https://wa.me/${(LP.whatsapp || "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;
    // Mensuração: eventos para Google Tag Manager / GA4 / Meta Pixel, se instalados
    safe(() => {
      (window.dataLayer = window.dataLayer || []).push({ event: "lead_whatsapp", origem, segmento: d.segmento, cidade: d.cidade });
      window.gtag && gtag("event", "generate_lead", { origem, segmento: d.segmento });
      window.fbq && fbq("track", "Lead", { content_category: d.segmento });
    });
    const w = window.open(url, "_blank");
    if (w) w.opener = null; else location.href = url;
  }

  // Formulário completo (seção final)
  const inlineForm = $(".card-form");
  inlineForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const bad = ["nome", "cidade", "empresa", "segmento"].filter((k) => !checkField(inlineForm, k));
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
    if (m.dataset.modal === "live") setTimeout(() => ($("[data-live-frame]").src = "about:blank"), 400);
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  };
  $$(".modal").forEach((m) => $$("[data-close]", m).forEach((b) => b.addEventListener("click", () => closeModal(m))));
  addEventListener("keydown", (e) => { if (e.key === "Escape") $$(".modal.is-open").forEach(closeModal); });

  // Assistente passo a passo
  const wiz = $(".wiz");
  const steps = $$(".wiz__step", wiz);
  const err = $(".wiz__err", wiz);
  const names = ["nome", "cidade", "empresa", "segmento"];
  let cur = 0;
  const show = (i) => {
    cur = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach((s, k) => s.classList.toggle("is-on", k === cur));
    wiz.classList.toggle("is-first", cur === 0);
    wiz.classList.toggle("is-last", cur === steps.length - 1);
    $("[data-wiz-bar]").style.width = ((cur + 1) / steps.length) * 100 + "%";
    err.textContent = "";
    const inp = $("input", steps[cur]);
    if (!(names[cur] === "segmento" && !inp.classList.contains("is-on"))) setTimeout(() => inp.focus({ preventScroll: true }), 60);
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
    $$(".modal.is-open").forEach((m) => m.dataset.modal === "live" && closeModal(m));
    openModal("lead");
    // começa no primeiro campo vazio
    const first = names.findIndex((n) => wiz.elements[n].value.trim().length < 2);
    show(first === -1 ? steps.length - 1 : first);
  }));

  // Modelo ao vivo
  const liveFrame = $("[data-live-frame]");
  const openLive = (m) => {
    $("[data-live-url]").textContent = m.url;
    liveFrame.src = `modelo.html?m=${m.id}`;
    $$("[data-dev]").forEach((b) => b.classList.toggle("is-on", b.dataset.dev === "desk"));
    $(".live__screen").classList.remove("is-mob");
    openModal("live");
  };
  $$("[data-dev]").forEach((b) => b.addEventListener("click", () => {
    $$("[data-dev]").forEach((x) => x.classList.toggle("is-on", x === b));
    $(".live__screen").classList.toggle("is-mob", b.dataset.dev === "mob");
  }));

  /* ---------- Demonstração ao vivo no hero ---------- */
  safe(() => {
    const frame = $("[data-demo]");
    const screen = frame.parentElement;
    const nav = $("[data-demo-nav]");
    const urlEl = $("[data-demo-url]");
    const phone = $("[data-demo-phone]");
    const list = MODELOS.slice(0, 6);
    let idx = 0, timer = null;
    nav.innerHTML = list.map((m, i) => `<button aria-label="Ver ${m.segmento}" data-i="${i}"></button>`).join("");
    const fit = () => { frame.style.transform = `scale(${screen.clientWidth / 1280})`; };
    fit(); new ResizeObserver(fit).observe(screen);
    const go = (i) => {
      idx = (i + list.length) % list.length;
      const m = list[idx];
      screen.classList.add("is-swap");
      phone.style.opacity = 0;
      setTimeout(() => {
        frame.src = `modelo.html?m=${m.id}&demo=1`;
        urlEl.textContent = m.url;
        phone.src = `assets/modelos/${m.id}-m.webp`;
        phone.style.opacity = 1;
      }, 350);
      frame.onload = () => screen.classList.remove("is-swap");
      $$("button", nav).forEach((b, k) => { b.classList.remove("is-on"); if (k === idx) { void b.offsetWidth; b.classList.add("is-on"); } });
      clearTimeout(timer);
      timer = setTimeout(() => go(idx + 1), 16000); // segurança, caso o aviso de fim não chegue
    };
    addEventListener("message", (e) => { if (e.data && e.data.tipo === "modelo-fim") go(idx + 1); });
    nav.addEventListener("click", (e) => { const b = e.target.closest("button"); b && go(+b.dataset.i); });
    nav.style.setProperty("--dur", "12s");
    window.addEventListener("lp:start", () => go(0), { once: true });
  });

  /* ---------- Vitrine em anel 3D ---------- */
  safe(() => {
    const stage = $("[data-ring]");
    const track = $("[data-ring-track]");
    const n = MODELOS.length;
    const step = 360 / n;
    track.innerHTML = MODELOS.map((m, i) => `
      <div class="rcard" data-i="${i}" role="button" tabindex="0" aria-label="${m.segmento}: ${m.nome}">
        <div class="rcard__bar"><span class="dots"><i></i><i></i><i></i></span><span>${m.url}</span><span>Modelo</span></div>
        <img src="assets/modelos/${m.id}.webp" alt="Modelo de site para ${m.segmento.toLowerCase()}" loading="lazy" draggable="false">
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
    if (hasGsap && !reduced) {
      gsap.to(enter, { p: 1, ease: "none", scrollTrigger: { trigger: stage, start: "top 95%", end: "top 35%", scrub: 1 } });
    } else enter.p = 1;

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

  /* ---------- Inclinação 3D do aparelho do hero ---------- */
  safe(() => {
    const dev = $("[data-tilt]");
    if (!fine || reduced || !hasGsap) return;
    const rx = gsap.quickTo(dev, "rotationX", { duration: 1.2, ease: "power3" });
    const ry = gsap.quickTo(dev, "rotationY", { duration: 1.2, ease: "power3" });
    gsap.set(dev, { rotationX: 8, rotationY: -14 });
    addEventListener("pointermove", (e) => {
      if (scrollY > innerHeight) return;
      ry(-14 + (e.clientX / innerWidth - 0.5) * 16);
      rx(8 - (e.clientY / innerHeight - 0.5) * 10);
    });
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
  if (fine && !reduced && hasGsap) $$(".magnetic").forEach((b) => {
    const x = gsap.quickTo(b, "x", { duration: 0.6, ease: "power3" }), y = gsap.quickTo(b, "y", { duration: 0.6, ease: "power3" });
    b.addEventListener("pointermove", (e) => { const r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.25); y((e.clientY - r.top - r.height / 2) * 0.35); });
    b.addEventListener("pointerleave", () => { x(0); y(0); });
  });

  /* ---------- Animações de scroll ---------- */
  function scrollAnims() {
    if (!hasGsap || reduced) {
      $$("[data-r]").forEach((e) => e.classList.add("in"));
      $$(".pq").forEach((p) => p.classList.add("is-on"));
      stWords.forEach((w) => w.classList.add("is-on"));
      $("[data-new]").style.clipPath = "inset(0 0 0 0)"; $("[data-scan]").style.display = "none";
      return;
    }
    ScrollTrigger.batch("[data-r]", {
      start: "top 88%",
      once: true,
      onEnter: (els) => { els.forEach((e) => e.classList.add("in")); gsap.to(els, { opacity: 1, y: 0, duration: 1.1, ease: "power4.out", stagger: 0.09, overwrite: true }); },
    });

    // Hero: aparelho se aproxima ao rolar
    gsap.to(".hero__stage", { yPercent: -8, scale: 0.94, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__txt", { y: -80, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero", start: "30% top", end: "bottom top", scrub: true } });
    gsap.to(".marquee__in", { x: -300, ease: "none", scrollTrigger: { trigger: ".marquee", start: "top bottom", end: "bottom top", scrub: true } });

    // Problema: antes → depois
    const pqs = $$("[data-pq]");
    const nw = $("[data-new]"), scan = $("[data-scan]");
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

  /* ---------- Loader e entrada ---------- */
  const loader = $(".loader"), num = $(".loader__n");
  let started = false;
  const start = () => {
    if (started) return; started = true;
    loader.classList.add("is-done");
    document.body.classList.remove("is-loading");
    window.dispatchEvent(new Event("lp:start"));
    if (hasGsap && !reduced) {
      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.from(".nav", { y: -40, opacity: 0, duration: 1 }, 0)
        .from(".hero__tag", { y: 20, opacity: 0, duration: 0.9 }, 0.1)
        .from($$(".w > span", $(".hero__title")), { yPercent: 110, duration: 1.2, stagger: 0.045 }, 0.15)
        .from([".hero__sub", ".hero__actions", ".hero__note"], { y: 30, opacity: 0, duration: 1, stagger: 0.1 }, 0.55)
        .from(".hero__stage", { y: 80, opacity: 0, rotationX: 25, duration: 1.6 }, 0.3)
        .from(".chip", { scale: 0.6, opacity: 0, duration: 0.8, stagger: 0.12, ease: "back.out(2)" }, 1.1);
    }
    safe(scrollAnims);
  };
  let pct = 0;
  const t0 = performance.now();
  const count = () => {
    pct = Math.min(100, Math.round(((performance.now() - t0) / 1100) * 100));
    num.textContent = pct;
    if (pct < 100) requestAnimationFrame(count); else setTimeout(start, 120);
  };
  requestAnimationFrame(count);
  setTimeout(start, 4000);
})();
