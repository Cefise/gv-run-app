/* ============================================================
   GV RUN — Camada de UI · Etapa 1
   Tab bar com ícones modernos + tela Hoje com calendário de
   treinos e estatísticas (concluídos, sequência, aderência).
   ------------------------------------------------------------
   Carregar DEPOIS de gv-clinic.js, antes de </body>:
   <script src="gv-ui.js"></script>
   Nada do app é substituído — só adicionado por cima.
   ============================================================ */
(function () {

  /* ---------------- CSS ---------------- */
  const css = `
  /* nav modernizada */
  nav{box-shadow:0 -10px 30px rgba(0,0,0,.35)}
  nav button{position:relative;transition:color .15s}
  nav button .ic svg{width:22px;height:22px;display:block;margin:0 auto 3px}
  nav button.on::after{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);
    width:26px;height:3px;border-radius:0 0 4px 4px;background:var(--sky)}
  /* widgets da Home */
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
  `;
  const st = document.createElement("style");
  st.textContent = css;
  document.head.appendChild(st);

  /* ---------------- ícones da tab bar (SVG) ---------------- */
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

  /* ---------------- helpers de dados ---------------- */
  const iso = (d) => d.toISOString().slice(0, 10);
  function sessionDates() {
    const set = new Set();
    ((window.S && S.sessions) || []).forEach(s => set.add(s.d));
    return set;
  }
  // domingo da semana que contém a data
  function sundayOf(dateStr) {
    const d = new Date(dateStr + "T12:00:00");
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  /* ---------------- widgets da Home ---------------- */
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
    // entra depois do card "Esta semana" (último card da home)
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

    // stats
    const total = ((S.sessions) || []).length;
    // sequência: dias consecutivos com >=1 sessão, terminando hoje ou ontem
    let streak = 0;
    const cursor = new Date(t + "T12:00:00");
    if (!done.has(t)) cursor.setDate(cursor.getDate() - 1);
    while (done.has(iso(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
    // aderência: concluídas vs. esperadas (~3 sessões/semana desde o início)
    const daysElapsed = Math.max(1, Math.round((new Date(t) - new Date(S.start)) / 864e5) + 1);
    const expected = Math.max(1, (daysElapsed / 7) * 3);
    const adh = Math.min(100, Math.round((total / expected) * 100));

    const el = (id) => document.getElementById(id);
    if (el("gvStatDone")) el("gvStatDone").textContent = total;
    if (el("gvStatStreak")) el("gvStatStreak").innerHTML = streak + "<small> dias</small>";
    if (el("gvStatAdh")) el("gvStatAdh").innerHTML = adh + "<small>%</small>";
  }

  /* ---------------- engancha no renderHome ---------------- */
  const _prevHome = window.renderHome;
  window.renderHome = function () {
    if (typeof _prevHome === "function") _prevHome();
    try { updateWidgets(); } catch (e) { console.error("gv-ui:", e); }
  };

  // primeira pintura, caso a home já esteja visível
  try { updateWidgets(); } catch (e) {}

})();
