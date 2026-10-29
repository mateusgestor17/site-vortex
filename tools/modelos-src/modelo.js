/* Primeira dobra (headline) de um modelo, usada só para gerar as capturas: modelo.html?m=<id> */
(() => {
  const q = new URLSearchParams(location.search);
  const m = MODELOS.find((x) => x.id === q.get("m")) || MODELOS[0];
  const r = document.documentElement.style;
  Object.entries(m.cores).forEach(([k, v]) => r.setProperty("--" + k, v));
  r.setProperty("--fd", `"${m.fonte.d}"`);
  r.setProperty("--fb", `"${m.fonte.b}"`);
  r.setProperty("--pos", m.pos);
  r.setProperty("--posM", m.posM || m.pos);
  document.body.className = `t-${m.tema} m-${m.id}`;
  const arrow = '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const check = '<svg viewBox="0 0 24 24"><path d="m5 12 4 4 10-10"/></svg>';
  document.getElementById("app").innerHTML = `
    <section class="hero">
      <div class="bg" style="background-image:url(img/${m.img}.jpg)"></div>
      <div class="ov"></div>
      <header class="nav">
        <span class="brand"><i></i>${m.nome}</span>
        <nav><span>Início</span><span>Serviços</span><span>Sobre</span><span>Contato</span></nav>
        <span class="btn btn--sm">${m.cta}</span>
      </header>
      <div class="txt">
        <span class="eyebrow">${m.eyebrow}</span>
        <h1>${m.titulo}</h1>
        <p>${m.sub}</p>
        <div class="btns"><span class="btn">${m.cta} ${arrow}</span><span class="btn btn--ghost">Conhecer serviços</span></div>
        <ul>${m.passos.map((p) => `<li>${check}${p}</li>`).join("")}</ul>
      </div>
      <div class="card">${check}<div><b>${m.card.t}</b><small>${m.card.d}</small></div></div>
    </section>`;
})();
