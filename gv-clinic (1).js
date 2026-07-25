/* ============================================================
   GV RUN — Camada clínica (Etapas 1 + 2)
   E1: semáforo como gate da força + diário de tolerância
   E2: check de 24h (manhã seguinte) fechando entrada → tolerância
   ------------------------------------------------------------
   Este arquivo "encaixa por cima" do app. Não substitui nada do
   index.html — só melhora o comportamento de algumas funções.
   IMPORTANTE: carregue este arquivo DEPOIS do <script> principal
   (logo antes de </body>).
   ============================================================ */
(function () {

  /* ================= HELPERS DE ESTADO DA DOR ================= */
  window.currentPainColor = function () {
    return (S && S.pain && S.pain.length) ? S.pain[S.pain.length - 1].c : null;
  };
  window.painToday = function () {
    const lp = (S && S.pain && S.pain.length) ? S.pain[S.pain.length - 1] : null;
    return (lp && lp.d === today()) ? lp.c : null;
  };
  window.strengthBlocked = function () {
    return currentPainColor() === 'r';
  };
  window.pendingSession = null;

  /* ================= TEXTOS DE ORIENTAÇÃO ================= */
  const GUIDE_YELLOW =
    `<div class="card"><span class="tag">Protocolo pós-dor (amarelo)</span><p>1 · Corte o volume de corrida pela metade; tire ritmo forte e descidas por 3–5 dias.<br><br>2 · Na força, volte às doses da semana anterior e mantenha só os exercícios sem dor. Respeite o ângulo de proteção.<br><br>3 · Mantenha a mobilidade diária.<br><br>4 · Teste de retorno: 15 min de trote leve → dor ≤ 3/10 durante e na manhã seguinte? Retome a progressão.<br><br>5 · Dor voltou 2x no mesmo lugar? Poste vídeo + descrição no grupo.</p></div>`;

  const GUIDE_GREEN =
    `<div class="card"><span class="tag" style="color:#7FDCA9">Tudo certo</span><p>Semáforo verde registrado. Treine e progrida normalmente. 👊</p></div>`;

  const GUIDE_RED =
    `<div class="card" style="border-color:rgba(214,69,69,.5)">
      <span class="tag" style="color:#F0A0A0">🔴 Vermelho — força bloqueada</span>
      <p><b>A sessão de força fica bloqueada automaticamente</b> enquanto o semáforo estiver vermelho. Ela volta a liberar sozinha assim que você registrar um semáforo fora do vermelho — não force antes.</p>
      <p><b>Hoje você pode:</b> apenas <b>mobilidade articular</b>, sempre no ângulo indolor e mantendo a dor entre <b>0 e 3/10</b> durante o movimento. Passou disso, pare.</p>
      <p><b>Corrida:</b> suspenda ou reduza bastante enquanto estiver no vermelho — nada de ritmo forte, tiros ou descidas.</p>
      <p><b>Monitore:</b> anote o local da dor, quando começou, o que piora e o que melhora, e a nota de 0–10. Reavalie a cada 24–48 h.</p>
      <p><b>Procure avaliação presencial se houver:</b> dor que piora à noite ou em repouso, inchaço, calor ou vermelhidão local, sensação de falseio/instabilidade, formigamento ou dormência, ou dor que não melhora em alguns dias.</p>
      <p>Descreva o quadro e mande pra gente no grupo ou no direct <b style="color:var(--sky)">@vyni.fisio · @guicarlii</b>.</p>
    </div>`;

  const PROMPT_GATE =
    `<div class="card" style="border-color:rgba(87,160,255,.4)"><span class="tag" style="color:var(--sky)">Antes de treinar força</span><p>Registre como está a dor de hoje para liberar a sessão. 🟢 verde e 🟡 amarelo liberam (o amarelo entra no protocolo modificado); 🔴 vermelho bloqueia a força e libera só mobilidade.</p></div>`;

  /* ================= REGISTRO DA DOR (com gate) ================= */
  window.logPain = function (c) {
    S.pain.push({ d: today(), c });
    save();
    renderPain(c);
    if (c === 'r') {
      pendingSession = null;
    } else if (pendingSession) {
      const t = pendingSession;
      pendingSession = null;
      openSession(t);
    }
  };

  window.renderPain = function (justLogged) {
    const cur = currentPainColor();
    const g = document.getElementById("painGuide");
    let html = "";
    if (pendingSession && !painToday()) html += PROMPT_GATE;
    if (cur === 'r') html += GUIDE_RED;
    else if (cur === 'y') html += GUIDE_YELLOW;
    else if (justLogged === 'g') html += GUIDE_GREEN;
    g.innerHTML = html;

    const h = document.getElementById("painHistory");
    if (!S.pain.length) { h.innerHTML = "<p>Nenhum registro ainda.</p>"; return; }
    const col = { g: "var(--green)", y: "var(--amber)", r: "var(--red)" },
          nm = { g: "Verde", y: "Amarelo", r: "Vermelho" };
    h.innerHTML = S.pain.slice(-14).reverse()
      .map(p => `<div class="log"><span class="dot" style="background:${col[p.c]}"></span>${br(p.d)} — ${nm[p.c]}</div>`)
      .join("");
  };

  /* ================= SESSÃO COM GATE CLÍNICO ================= */
  const _openList = function (t) {
    curSession = t; curChecks = {};
    const w = week(), ph = phaseOf(w), P = PHASE_INFO[ph];
    const list = WEEKS[w][t];
    const titles = { M: "(A) Mobilidade", B: "(B) Controle e propriocepção", C: "(C) Força" };
    document.getElementById("sesTag").textContent = t === "M" ? `Semana ${w} · todos os dias` : `Semana ${w} · Fase ${ph} · ${P.name}`;
    document.getElementById("sesTitle").textContent = titles[t];
    document.getElementById("sesFocus").textContent = t === "M"
      ? "Antes de correr, complete com o RAMP: trote leve → ativação com faixa → esta rotina → 3–4 acelerações."
      : P.focus;
    const nb = document.getElementById("sesLevelNote");
    let note = "";
    if (t === "M" && strengthBlocked()) {
      note += `<div class="banner warn" style="margin-top:10px">🔴 Você está no vermelho: faça <b>apenas mobilidade no ângulo indolor</b>, mantendo a dor entre <b>0 e 3/10</b>. Se passar disso, pare.</div>`;
    }
    if (t !== "M" && S.level !== "int" && LEVEL_NOTE[ph][S.level]) note += `<div class="banner blue" style="margin-top:10px"><b>${levelName(S.level)}:</b> ${LEVEL_NOTE[ph][S.level]}</div>`;
    if (t !== "M" && painToday() === 'y') {
      note += `<div class="banner warn" style="margin-top:10px">🟡 Amarelo hoje: use as doses da semana anterior e mantenha só os exercícios sem dor. Respeite o ângulo de proteção.</div>`;
    }
    if (t !== "M") note += `<div class="banner warn" style="margin-top:10px">⚠️ ${SAFETY_NOTE}</div>`;
    nb.innerHTML = note;
    document.getElementById("sesList").innerHTML = list.map((e, i) => `<div class="ex" id="ex${i}" onclick="toggleEx(${i})"><div class="box"></div><div style="flex:1"><div class="nm">${e.n}</div><div class="ds">${e.d}</div>${VIDEOS[e.id] ? `<a class="vid" href="#" onclick="event.stopPropagation();event.preventDefault();openVideo('${VIDEOS[e.id]}')">▶ ver vídeo do exercício</a>` : ""}</div></div>`).join("");
    updateDoneBtn(list.length); show("vSession");
  };

  window.openSession = function (t) {
    if (t !== 'M') {
      if (strengthBlocked()) {
        alert("🔴 Sessão de força bloqueada enquanto a dor está no vermelho.\n\nHoje, só mobilidade articular (dor 0–3/10). Veja as orientações na aba Dor.");
        show('vPain');
        return;
      }
      if (!painToday()) {
        pendingSession = t;
        show('vPain');
        return;
      }
    }
    _openList(t);
  };

  window.completeSession = function () {
    const total = document.querySelectorAll("#sesList .ex").length,
          done = Object.values(curChecks).filter(Boolean).length;
    S.sessions.push({ d: today(), t: curSession, ph: phaseOf(week()), done, total, pain: painToday() || null });
    save();
    alert("Sessão registrada! 💪 Consistência é o que previne lesão.");
    show("vHome");
  };

  /* ================= CHECK DE 24H (manhã seguinte) ================= */
  // sessão de força de um dia anterior, ainda sem resposta de 24h
  window.pendingCheck24 = function () {
    if (!S || !S.sessions) return null;
    const t = today();
    const past = S.sessions.filter(s => (s.t === 'B' || s.t === 'C') && s.d !== t && !s.pain24);
    if (!past.length) return null;
    past.sort((a, b) => (a.d < b.d ? 1 : -1)); // mais recente primeiro
    return past[0];
  };

  window.logPain24 = function (c) {
    const s = pendingCheck24();
    if (!s) return;
    s.pain24 = c;                     // grava a tolerância naquela sessão
    S.pain.push({ d: today(), c });   // vale também como o semáforo de hoje
    save();
    const msg = c === 'g'
      ? "✅ Tolerou bem o treino de força. Pode progredir normalmente."
      : c === 'y'
      ? "🟡 Ainda com sintoma em 24h: segure a carga — use as doses da semana anterior e só o que não dói."
      : "🔴 Não tolerou: a força fica bloqueada hoje. Siga o protocolo do vermelho na aba Dor.";
    alert(msg);
    renderHome();
  };

  function injectCheck24() {
    const home = document.getElementById("vHome");
    if (!home || document.getElementById("check24")) return;
    const pb = document.getElementById("painBanner");
    const c = document.createElement("div");
    c.id = "check24"; c.className = "card hidden"; c.style.marginBottom = "14px";
    pb.parentNode.insertBefore(c, pb.nextSibling);
  }

  function renderCheck24() {
    const el = document.getElementById("check24");
    if (!el) return;
    const s = pendingCheck24();
    if (!s) { el.classList.add("hidden"); el.innerHTML = ""; return; }
    el.classList.remove("hidden");
    el.innerHTML =
      `<span class="tag" style="color:var(--sky)">Check de 24h</span>
       <h3>Como está a dor hoje, depois do último treino de força?</h3>
       <p style="color:var(--mut);margin:4px 0 12px">Treino de ${br(s.d)}. Esta resposta também vale como o seu semáforo de hoje.</p>
       <button class="sem g" onclick="logPain24('g')">🟢 Verde<small>Voltou ao normal / sem dor</small></button>
       <button class="sem y" onclick="logPain24('y')">🟡 Amarelo<small>Ainda incomoda (3–5/10)</small></button>
       <button class="sem r" onclick="logPain24('r')">🔴 Vermelho<small>Piorou / dor forte</small></button>`;
  }

  /* ================= HOME (banner vermelho + check 24h) ================= */
  const _origHome = window.renderHome;
  window.renderHome = function () {
    _origHome();
    const cur = currentPainColor(), pb = document.getElementById("painBanner");
    if (cur === 'r') {
      pb.classList.remove("hidden");
      pb.innerHTML = "🔴 Força bloqueada enquanto a dor está no vermelho. Hoje só mobilidade articular (dor 0–3/10). Veja as orientações na aba Dor.";
    }
    renderCheck24();
  };

  /* ================= DIÁRIO DE TOLERÂNCIA + RESUMO 24H ================= */
  window.renderDaily = function () {
    const el = document.getElementById("repDaily");
    if (!el) return;
    const col = { g: "var(--green)", y: "var(--amber)", r: "var(--red)" };
    const icon = { M: "🌀", B: "🎯", C: "💪" };

    // resumo de tolerância (sessões de força com check de 24h respondido)
    const checked = (S.sessions || []).filter(s => (s.t === 'B' || s.t === 'C') && s.pain24);
    const tol = checked.filter(s => s.pain24 === 'g').length;
    const flag = checked.length - tol;
    let summary = "";
    if (checked.length) {
      summary = `<p style="color:var(--mut);margin:0 0 10px">Tolerância em 24h: 🟢 ${tol} tolerado(s) · ⚠️ ${flag} com sintoma</p>`;
    }

    const days = {};
    (S.sessions || []).forEach(s => { (days[s.d] = days[s.d] || { ses: [], pain: null }).ses.push(s); });
    (S.pain || []).forEach(p => { (days[p.d] = days[p.d] || { ses: [], pain: null }).pain = p.c; });
    const dates = Object.keys(days).sort().reverse().slice(0, 14);
    if (!dates.length) { el.innerHTML = `<p style="color:var(--mut);margin-top:4px">Ainda sem registros diários. Marque uma sessão ou a dor para começar.</p>`; return; }

    const rows = dates.map(d => {
      const day = days[d];
      const ses = day.ses.length
        ? day.ses.map(s => {
            const base = `${icon[s.t] || "•"} ${s.done}/${s.total}`;
            const t24 = s.pain24 ? ` <span style="color:var(--mut)">· 24h</span> <span class="dot" style="background:${col[s.pain24]}"></span>` : "";
            return base + t24;
          }).join(" &nbsp; ")
        : `<span style="color:var(--mut)">só dor</span>`;
      const dot = day.pain ? `<span class="dot" style="background:${col[day.pain]}"></span>` : `<span class="dot" style="background:var(--line)"></span>`;
      return `<div class="log">${dot}${br(d)} — ${ses}</div>`;
    }).join("");

    el.innerHTML = summary + rows;
  };

  function injectDaily() {
    const rep = document.getElementById("vReport");
    if (!rep || document.getElementById("repDaily")) return;
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<span class="tag">Diário de tolerância</span><h3>Treino × dor, dia a dia</h3><div id="repDaily"></div>`;
    const cards = rep.querySelectorAll(".card");
    if (cards[2]) rep.insertBefore(card, cards[2]); else rep.appendChild(card);
  }

  const _origReport = window.renderReport;
  window.renderReport = function () {
    if (typeof _origReport === "function") _origReport();
    renderDaily();
  };

  /* ================= INICIALIZAÇÃO DOS ENXERTOS ================= */
  injectCheck24();
  injectDaily();

})();
