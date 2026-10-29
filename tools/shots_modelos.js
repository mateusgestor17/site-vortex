// Gera as capturas dos modelos (anel 3D e celular do hero).
// Uso: node tools/shots_modelos.js http://localhost:8081 public/assets/modelos
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "/opt/node-tools/node_modules/playwright");
const fs = require("fs");
const { execSync } = require("child_process");
(async () => {
  const [, , base, out] = process.argv;
  const src = fs.readFileSync("public/assets/js/modelos.js", "utf8");
  const ids = [...src.matchAll(/id: "([^"]+)"/g)].map((x) => x[1]);
  const b = await chromium.launch();
  const webp = (png, dst, q) => { execSync(`ffmpeg -loglevel error -y -i ${png} -c:v libwebp -quality ${q} ${dst}`); fs.unlinkSync(png); };
  for (const [w, h, suf] of [[1280, 800, ""], [390, 844, "-m"]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: suf ? 2 : 1 });
    p.on("pageerror", (e) => console.log("ERRO:", e.message));
    for (const id of ids) {
      await p.goto(`${base}/modelo.html?m=${id}&shot=1`, { waitUntil: "networkidle" });
      await p.addStyleTag({ content: ".demo-badge{display:none} .nav{position:relative}" });
      await p.waitForTimeout(2600);
      const png = `${out}/${id}${suf}.png`;
      if (suf) await p.screenshot({ path: png, clip: { x: 0, y: 0, width: 390, height: 2200 }, fullPage: true });
      else await p.screenshot({ path: png });
      webp(png, `${out}/${id}${suf}.webp`, 80);
      console.log("ok", id + suf);
    }
    await p.close();
  }
  await b.close();
})();
