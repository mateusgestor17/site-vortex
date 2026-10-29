/* =========================================================
   Página ao vivo de um modelo demonstrativo
   modelo.html?m=<id>          → página normal
   modelo.html?m=<id>&shot=1   → sem animação de entrada (para capturas)
   modelo.html?m=<id>&demo=1   → rola sozinha (usada no hero da landing)
   ========================================================= */
(() => {
  const q = new URLSearchParams(location.search);
  const m = MODELOS.find((x) => x.id === q.get("m")) || MODELOS[0];
  const shot = q.has("shot");
  const demo = q.has("demo");
  const c = m.cores;
  const root = document.documentElement;
  Object.entries({ bg: c.bg, bg2: c.bg2, fg: c.fg, muted: c.muted, a: c.a, a2: c.a2, card: c.card }).forEach(([k, v]) => root.style.setProperty("--" + k, v));
  root.style.setProperty("--fd", `"${m.fonte.d}"`);
  root.style.setProperty("--fb", `"${m.fonte.b}"`);
  document.body.classList.add("l-" + m.layout, "m-" + m.id);
  if (shot) document.body.classList.add("is-shot");
  if (demo) document.body.classList.add("is-demo");
  document.title = `${m.nome} · Modelo demonstrativo · Vortex Company`;

  const ico = {
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12 4 4 10-10"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/></svg>',
  };

  const arts = {
    smile: () => `
      <div class="art art--smile">
        <div class="blob b1"></div><div class="blob b2"></div>
        <svg class="smile" viewBox="0 0 200 200"><circle cx="100" cy="100" r="86" class="ring"/><path d="M52 112c14 30 82 30 96 0" class="arc"/><circle cx="72" cy="80" r="9"/><circle cx="128" cy="80" r="9"/></svg>
        <div class="float f1"><span class="dot"></span>Agenda online aberta</div>
        <div class="float f2">${ico.check}<div><b>Avaliação completa</b><small>Plano de tratamento claro</small></div></div>
        <i class="spark s1"></i><i class="spark s2"></i><i class="spark s3"></i>
      </div>`,
    glass: () => `
      <div class="art art--glass">
        <div class="pane p1"></div><div class="pane p2"></div><div class="pane p3"></div><div class="pane p4"></div>
        <div class="shine"></div>
      </div>`,
    columns: () => `
      <div class="art art--columns">
        <div class="mono">ML</div>
        <div class="cols">${"<span></span>".repeat(7)}</div>
        <div class="seal">Desde a primeira consulta, ao seu lado.</div>
      </div>`,
    arch: () => `
      <div class="art art--arch">
        <div class="arch a1"></div><div class="arch a2"></div><div class="arch a3"></div>
        <div class="sun"></div>
      </div>`,
    blocks: () => `
      <div class="art art--blocks"><div class="iso">
        ${[[0, 0, 3], [1, 0, 5], [2, 0, 2], [0, 1, 4], [1, 1, 7], [2, 1, 3], [0, 2, 2], [1, 2, 4], [2, 2, 6]]
          .map(([x, y, h], i) => `<div class="cube" style="--x:${x};--y:${y};--h:${h};--i:${i}"><i class="t"></i><i class="l"></i><i class="fr"></i></div>`).join("")}</div>
        <div class="float f1"><span class="dot"></span>Cronograma em dia</div>
      </div>`,
    burger: () => `
      <div class="art art--burger">
        <div class="halo"></div>
        <div class="bg-stack">
          <i class="bun-top"></i><i class="lettuce"></i><i class="cheese"></i><i class="patty"></i><i class="cheese c2"></i><i class="patty"></i><i class="bun-bottom"></i>
        </div>
        <div class="float f1">🔥 Saindo da brasa</div>
        <div class="float f2"><b>Combo da casa</b><small>Burger + fritas + bebida</small></div>
      </div>`,
    pulse: () => `
      <div class="art art--pulse">
        <div class="rings"><i></i><i></i><i></i></div>
        <svg viewBox="0 0 400 120" class="line"><path d="M0 60h120l18-40 24 80 22-60 14 20h202"/></svg>
        <div class="big">PULSE</div>
      </div>`,
    house: () => `
      <div class="art art--house">
        <div class="sun"></div>
        <svg viewBox="0 0 400 240" class="sky"><path class="h1" d="M30 230V120l70-60 70 60v110"/><path class="h2" d="M150 230V90l90-70 90 70v140"/><path class="h3" d="M300 230v-80l45-35 45 35v80"/><path class="ground" d="M0 230h400"/><rect x="215" y="150" width="50" height="80" class="door"/><rect x="180" y="105" width="30" height="30" class="win"/><rect x="270" y="105" width="30" height="30" class="win"/></svg>
      </div>`,
  };

  const s = m.servicos;
  document.getElementById("app").innerHTML = `
    <header class="nav">
      <a class="brand" href="#"><span class="brand__mark"></span>${m.nome}</a>
      <nav><a href="#s">Serviços</a><a href="#sobre">Sobre</a><a href="#como">Como funciona</a><a href="#contato">Contato</a></nav>
      <a class="btn btn--sm" href="#contato">${m.cta}</a>
    </header>

    <section class="hero">
      <div class="hero__txt">
        <span class="eyebrow r">${m.eyebrow}</span>
        <h1 class="r">${m.titulo}</h1>
        <p class="r">${m.sub}</p>
        <div class="hero__btns r">
          <a class="btn" href="#contato">${m.cta} ${ico.arrow}</a>
          <a class="btn btn--ghost" href="#s">Conhecer serviços</a>
        </div>
        <ul class="hero__chips r">${m.passos.slice(0, 3).map((p) => `<li>${ico.check}${p}</li>`).join("")}</ul>
      </div>
      <div class="hero__art r">${arts[m.art]()}</div>
    </section>

    <div class="strip"><div class="strip__in">${Array(4).fill(s.map((x) => `<span>${x.t}</span><i>✦</i>`).join("")).join("")}</div></div>

    <section class="sec" id="s">
      <span class="eyebrow r">O que fazemos</span>
      <h2 class="r">Soluções pensadas para <em>você</em>.</h2>
      <div class="cards">${s.map((x, i) => `<article class="card r"><span class="card__n">0${i + 1}</span><h3>${x.t}</h3><p>${x.d}</p><span class="card__go">${ico.arrow}</span></article>`).join("")}</div>
    </section>

    <section class="sec sec--about" id="sobre">
      <h2 class="big r">${m.frase}</h2>
      <div class="about__grid">
        <div class="panel r"><div class="panel__glow"></div>${ico.star}<b>${m.nome}</b><p>${m.segmento} com atendimento próximo e processo claro em cada etapa.</p></div>
        <ul class="list r">${s.map((x) => `<li>${ico.check}<div><b>${x.t}</b><span>${x.d}</span></div></li>`).join("")}</ul>
      </div>
    </section>

    <section class="sec" id="como">
      <span class="eyebrow r">Como funciona</span>
      <h2 class="r">Simples, do começo <em>ao fim</em>.</h2>
      <ol class="steps">${m.passos.map((p, i) => `<li class="r"><span>0${i + 1}</span><b>${p}</b></li>`).join("")}</ol>
    </section>

    <section class="cta" id="contato">
      <div class="cta__glow"></div>
      <h2 class="r">${m.final}</h2>
      <a class="btn btn--lg r" href="#">${m.cta} ${ico.arrow}</a>
    </section>

    <footer class="foot"><span class="brand"><span class="brand__mark"></span>${m.nome}</span><small>${m.segmento} · empresa fictícia para demonstração</small></footer>
  `;

  // Revelar ao entrar na tela
  const els = document.querySelectorAll(".r");
  if (shot) els.forEach((e) => e.classList.add("in"));
  else {
    const io = new IntersectionObserver((ents) => ents.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))), { threshold: 0.12 });
    els.forEach((e, i) => { e.style.transitionDelay = (e.closest(".hero") ? i * 90 : 0) + "ms"; io.observe(e); });
  }

  // Modo demo: rola a página sozinha e avisa a landing quando termina
  if (demo) {
    document.documentElement.style.scrollBehavior = "auto";
    const max = () => document.documentElement.scrollHeight - innerHeight;
    let y = 0, t0 = null, phase = "wait";
    const step = (t) => {
      if (t0 === null) t0 = t;
      const dt = t - t0;
      if (phase === "wait" && dt > 1600) { phase = "down"; t0 = t; }
      else if (phase === "down") {
        y = Math.min(max(), y + 2.1);
        scrollTo(0, y);
        if (y >= max()) { phase = "end"; t0 = t; }
      } else if (phase === "end" && dt > 900) {
        parent !== window && parent.postMessage({ tipo: "modelo-fim", id: m.id }, "*");
        return;
      }
      requestAnimationFrame(step);
    };
    addEventListener("load", () => requestAnimationFrame(step));
  }

  document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    const el = document.querySelector(a.getAttribute("href").length > 1 ? a.getAttribute("href") : "body");
    el && el.scrollIntoView({ behavior: "smooth" });
  }));
})();
