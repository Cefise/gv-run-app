/* ============================================================
   GV RUN — Camada de UI · Etapas 1 + 2
   E1: tab bar moderna + calendário de treinos + stats na Home
   E2: aba Dor com gráfico de evolução semanal (por cores)
   ------------------------------------------------------------
   Carregar DEPOIS de gv-clinic.js, antes de </body>:
   <script src="gv-ui.js"></script>
   ============================================================ */
(function () {

  /* ---------------- CSS ---------------- */
  const css = `
  nav{box-shadow:0 -10px 30px rgba(0,0,0,.35)}
  nav button{position:relative;transition:color .15s}
  nav button .ic svg{width:22px;height:22px;display:block;margin:0 auto 3px}
  nav button.on::after{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);
    width:26px;height:3px;border-radius:0 0 4px 4px;background:var(--sky)}
  .gv-cal{display:grid;grid-template-columns:26px repeat(7,1fr);gap:6px;align-items:center;margin-top:10px}
  .gv-cal .hd{font-size:10px;font-weight:800;color:var(--mut);text-align:center;letter-spacing:1px}
  .gv-cal .wk{font-size:10px;font-weight:800;color:var(--mut);text-align:center}
  .gv-cal .dot{width:100%;aspect-ratio:1;max-width:26px;margin:0 auto;border-radius:50%;
    border:1.5px solid var(--line);display:flex;align-items:center;justify-content:center;
    font-size:11px;color:#fff;background:transparent}
  .gv-cal .dot.done{background:var(--green);border-color:var(--green)}
  .gv-cal .dot.today{border-color:var(--sky);box-shadow:0 0 0 2px rgba(87,160,255,.35)}
  .gv-cal .dot.future{opacity:.28}
  .gv-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px}
  .gv-stat{background:rgba(87,160,255,.06);border:1px solid var(--line);border-radius:14px;
    padding:12px 8px;text-align:center}
  .gv-stat .k{font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--mut)}
  .gv-stat .v{font-size:24px;font-weight:800;color:var(--txt);margin-top:2px}
  .gv-stat .v small{font-size:12px;color:var(--mut);font-weight:700}
  /* aba Dor — gráfico */
  .gv-painhead{display:flex;gap:10px;margin:8px 0 12px}
  .gv-pill{flex:1;border:1px solid var(--line);border-radius:12px;padding:8px 10px;text-align:center}
  .gv-pill .k{font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--mut)}
  .gv-pill .v{font-size:15px;font-weight:800;margin-top:2px}
  .gv-counts{display:flex;gap:14px;justify-content:center;color:var(--mut);font-size:13px;margin-top:10px}
  .gv-trend{margin-top:12px;font-size:13.5px;line-height:1.5;border-radius:12px;padding:10px 12px;
    background:rgba(87,160,255,.07);border:1px solid var(--line)}
  `;
  const st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------------- ícones da tab bar ---------------- */
  const ICONS = {
    nHome:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/></svg>',
    nPain:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="20" rx="3"/><circle cx="12" cy="6.2" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="17.8" r="1.4" fill="currentColor" stroke="none"/></svg>',
    nReport: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5"/><path d="M4 19h16"/><path d="M7 15l4-5 3 3 5-7"/></svg>',
    nProfile:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 5-5.5 8-5.5s6.5 1.5 8 5.5"/></svg>'
  };
  Object.keys(ICONS).forEach(id => {
    const b = document.getElementById(id);
    if (b) { const ic = b.querySelector(".ic"); if (ic) ic.innerHTML = ICONS[id]; }
  });

  /* ---------------- helpers ---------------- */
  const iso = (d) => d.toISOString().slice(0, 10);
  function sessionDates() {
    const set = new Set();
    ((window.S && S.sessions) || []).forEach(s => set.add(s.d));
    return set;
  }
  function sundayOf(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    d.setDate(d.getDate() - d.getDay());
    return d;
  }
  // semana do programa (1..8) de uma data
  function weekOfDate(ds) {
    const days = Math.floor((new Date(ds + "T12:00:00") - new Date(S.start + "T12:00:00")) / 864e5);
    return Math.min(8, Math.max(1, Math.floor(days / 7) + 1));
  }

  /* ================= ETAPA 1 — HOME ================= */
  function injectWidgets() {
    const home = document.getElementById("vHome");
    if (!home || document.getElementById("gvWidgets")) return;
    const box = document.createElement("div");
    box.id = "gvWidgets";
    box.innerHTML = `
      <div class="card" style="margin-top:14px">
        <span class="tag">Calendário de treinos</span>
        <div class="gv-cal" id="gvCal"></div>
      </div>
      <div class="gv-stats">
        <div class="gv-stat"><div class="k">Treinos concluídos</div><div class="v" id="gvStatDone">0</div></div>
        <div class="gv-stat"><div class="k">Sequência atual</div><div class="v" id="gvStatStreak">0<small> dias</small></div></div>
        <div class="gv-stat"><div class="k">Aderência</div><div class="v" id="gvStatAdh">0<small>%</small></div></div>
      </div>`;
    home.appendChild(box);
  }

  function updateWidgets() {
    if (!window.S || !S.start) return;
    injectWidgets();
    const cal = document.getElementById("gvCal");
    if (!cal) return;

    const done = sessionDates();
    const t = today();
    const base = sundayOf(S.start);
    const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

    let html = `<div></div>` + DAYS.map(d => `<div class="hd">${d}</div>`).join("");
    for (let w = 0; w < 8; w++) {
      html += `<div class="wk">${w + 1}</div>`;
      for (let d = 0; d < 7; d++) {
        const cell = new Date(base);
        cell.setDate(base.getDate() + w * 7 + d);
        const ds = iso(cell);
        const isDone = done.has(ds);
        const isToday = ds === t;
        const isFuture = ds > t;
        const cls = ["dot", isDone ? "done" : "", isToday ? "today" : "", (isFuture && !isDone) ? "future" : ""].join(" ").trim();
        html += `<div class="${cls}">${isDone ? "✓" : ""}</div>`;
      }
    }
    cal.innerHTML = html;

    const total = ((S.sessions) || []).length;
    let streak = 0;
    const cursor = new Date(t + "T12:00:00");
    if (!done.has(t)) cursor.setDate(cursor.getDate() - 1);
    while (done.has(iso(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
    const daysElapsed = Math.max(1, Math.round((new Date(t) - new Date(S.start)) / 864e5) + 1);
    const expected = Math.max(1, (daysElapsed / 7) * 3);
    const adh = Math.min(100, Math.round((total / expected) * 100));

    const el = (id) => document.getElementById(id);
    if (el("gvStatDone")) el("gvStatDone").textContent = total;
    if (el("gvStatStreak")) el("gvStatStreak").innerHTML = streak + "<small> dias</small>";
    if (el("gvStatAdh")) el("gvStatAdh").innerHTML = adh + "<small>%</small>";
  }

  const _prevHome = window.renderHome;
  window.renderHome = function () {
    if (typeof _prevHome === "function") _prevHome();
    try { updateWidgets(); } catch (e) { console.error("gv-ui:", e); }
  };

  /* ================= ETAPA 2 — ABA DOR ================= */
  const SCORE = { g: 0, y: 1, r: 2 };
  const scoreColor = (s) => s < 0.5 ? "var(--green)" : s < 1.5 ? "var(--amber)" : "var(--red)";
  const scoreName  = (s) => s < 0.5 ? "Verde" : s < 1.5 ? "Amarelo" : "Vermelho";

  function injectPainChart() {
    const hist = document.getElementById("painHistory");
    if (!hist || document.getElementById("gvPainChart")) return;
    const card = document.createElement("div");
    card.id = "gvPainChart";
    card.innerHTML = `
      <h2 class="sec" style="margin-top:18px">Evolução da dor</h2>
      <div class="card">
        <div class="gv-painhead">
          <div class="gv-pill"><div class="k">Início</div><div class="v" id="gvPainFirst">—</div></div>
          <div class="gv-pill"><div class="k">Atual</div><div class="v" id="gvPainNow">—</div></div>
        </div>
        <div id="gvPainSvg"></div>
        <div class="gv-counts" id="gvPainCounts"></div>
        <div class="gv-trend" id="gvPainTrend" style="display:none"></div>
      </div>`;
    // entra antes do título "Histórico" (irmão anterior do card de histórico)
    const before = hist.previousElementSibling && hist.previousElementSibling.tagName === "H2"
      ? hist.previousElementSibling : hist;
    hist.parentNode.insertBefore(card, before);
  }

  function updatePainChart() {
    if (!window.S || !S.start) return;
    injectPainChart();
    const svgBox = document.getElementById("gvPainSvg");
    if (!svgBox) return;

    const pain = (S.pain || []);
    // média semanal (0=verde, 1=amarelo, 2=vermelho)
    const weeks = Array.from({ length: 8 }, () => []);
    pain.forEach(p => { weeks[weekOfDate(p.d) - 1].push(SCORE[p.c] ?? 0); });
    const avg = weeks.map(a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

    // geometria
    const W = 320, H = 150, L = 34, R = 8, T = 10, B = 22;
    const plotW = W - L - R, plotH = H - T - B;
    const X = (i) => L + (plotW / 7) * i;
    const Y = (s) => T + ((2 - s) / 2) * plotH;

    // bandas de cor (verde embaixo, amarelo no meio, vermelho no topo)
    let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;display:block">`;
    svg += `<rect x="${L}" y="${Y(2)}" width="${plotW}" height="${Y(1.34) - Y(2)}" fill="rgba(214,69,69,.12)"/>`;
    svg += `<rect x="${L}" y="${Y(1.34)}" width="${plotW}" height="${Y(0.67) - Y(1.34)}" fill="rgba(227,160,8,.10)"/>`;
    svg += `<rect x="${L}" y="${Y(0.67)}" width="${plotW}" height="${Y(0) - Y(0.67)}" fill="rgba(47,163,107,.12)"/>`;
    // marcadores do eixo Y
    [["🔴", 1.8], ["🟡", 1], ["🟢", 0.2]].forEach(([em, s]) => {
      svg += `<text x="${L - 8}" y="${Y(s) + 4}" font-size="11" text-anchor="end">${em}</text>`;
    });
    // linha (quebra nos vazios)
    let path = "", pen = false;
    avg.forEach((s, i) => {
      if (s === null) { pen = false; return; }
      path += (pen ? "L" : "M") + X(i).toFixed(1) + " " + Y(s).toFixed(1) + " ";
      pen = true;
    });
    if (path) svg += `<path d="${path}" fill="none" stroke="var(--sky)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    // pontos
    avg.forEach((s, i) => {
      if (s === null) return;
      svg += `<circle cx="${X(i)}" cy="${Y(s)}" r="4.5" fill="${scoreColor(s)}" stroke="#0d1c38" stroke-width="1.5"/>`;
    });
    // rótulos do eixo X
    for (let i = 0; i < 8; i++) {
      svg += `<text x="${X(i)}" y="${H - 6}" font-size="10" font-weight="700" fill="var(--mut)" text-anchor="middle">S${i + 1}</text>`;
    }
    svg += `</svg>`;
    svgBox.innerHTML = svg;

    // pílulas início/atual
    const filled = avg.map((s, i) => ({ s, i })).filter(o => o.s !== null);
    const el = (id) => document.getElementById(id);
    if (filled.length) {
      const f = filled[0], l = filled[filled.length - 1];
      el("gvPainFirst").innerHTML = `<span style="color:${scoreColor(f.s)}">${scoreName(f.s)}</span> <small style="color:var(--mut)">· sem. ${f.i + 1}</small>`;
      el("gvPainNow").innerHTML   = `<span style="color:${scoreColor(l.s)}">${scoreName(l.s)}</span> <small style="color:var(--mut)">· sem. ${l.i + 1}</small>`;
    } else {
      el("gvPainFirst").textContent = "—";
      el("gvPainNow").textContent = "—";
    }

    // contagem por cor
    const cnt = { g: 0, y: 0, r: 0 };
    pain.forEach(p => { if (cnt[p.c] !== undefined) cnt[p.c]++; });
    el("gvPainCounts").innerHTML =
      `<span>🟢 ${cnt.g}</span><span>🟡 ${cnt.y}</span><span>🔴 ${cnt.r}</span><span style="opacity:.7">· ${pain.length} registro(s)</span>`;

    // tendência (só com 2+ semanas de dados)
    const trend = el("gvPainTrend");
    if (filled.length >= 2) {
      const diff = filled[filled.length - 1].s - filled[0].s;
      let msg;
      if (diff <= -0.3) msg = "📉 <b>Tendência de melhora</b> — seus registros de dor estão melhores do que no início do programa. Continue no ritmo.";
      else if (diff < 0.3) msg = "➡️ <b>Estável</b> — seus registros seguem no mesmo padrão. Continue acompanhando a cada treino.";
      else msg = "⚠️ <b>Atenção</b> — seus registros de dor pioraram em relação ao início. Respeite o semáforo e o protocolo, e fale com a gente se persistir.";
      trend.innerHTML = msg;
      trend.style.display = "block";
    } else {
      trend.style.display = "none";
    }
  }

  const _prevPain = window.renderPain;
  window.renderPain = function (justLogged) {
    if (typeof _prevPain === "function") _prevPain(justLogged);
    try { updatePainChart(); } catch (e) { console.error("gv-ui pain:", e); }
  };

  /* ---------------- primeira pintura ---------------- */
  try { updateWidgets(); } catch (e) {}
  try { updatePainChart(); } catch (e) {}

})();
