/* ============================================================
   GV RUN — Login por magic link + sincronização entre aparelhos
   ------------------------------------------------------------
   Como funciona:
   - O aluno digita o e-mail e recebe um link de acesso (sem senha).
   - Só entra quem está na lista de autorizados (allowlist) do Supabase.
   - O progresso é salvo no localStorage NA HORA (funciona offline) e
     sincronizado com o Supabase, então celular e computador ficam iguais.

   O que você precisa editar: só as duas linhas de CONFIG logo abaixo.
   A chave "anon" é pública de propósito — pode ficar no código. Quem
   protege os dados é o RLS que você configurou no supabase-setup.sql.
   ============================================================ */

const GV_CONFIG = {
  SUPABASE_URL:  'https://kzgdlsstrffiubzkvqeo.supabase.co',   // ja preenchido
  SUPABASE_ANON: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6Z2Rsc3N0cmZmaXViemt2cWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5OTk1NjksImV4cCI6MjEwMDU3NTU2OX0._1O1PSe94zPmtqfwc0PxpcMTf0Fl02QIgIAbAzaMmu4',                   // <-- cole a chave que comeca com eyJhbG...
};

/* ---------- Cliente Supabase (vem do <script> do CDN) ---------- */
const sb = window.supabase.createClient(
  GV_CONFIG.SUPABASE_URL,
  GV_CONFIG.SUPABASE_ANON
);

/* ---------- Chaves do cache local ---------- */
const CACHE_KEY = 'gvrun_state';   // último estado salvo
const DIRTY_KEY = 'gvrun_dirty';   // "tem coisa pra subir quando voltar a internet"

/* ============================================================
   TELA DE LOGIN (injetada na página; some depois que entra)
   ============================================================ */
function montarTelaLogin() {
  if (document.getElementById('gv-login')) return;

  const css = `
    #gv-login{position:fixed;inset:0;z-index:99999;display:flex;
      align-items:center;justify-content:center;padding:24px;
      background:radial-gradient(120% 120% at 50% 0%, #16264a 0%, #0A1730 60%);
      font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#EAF2FF;}
    #gv-login .card{width:100%;max-width:380px;text-align:center;}
    #gv-login .eyebrow{font-size:12px;letter-spacing:.28em;text-transform:uppercase;
      color:#4CC4FF;margin:0 0 10px;font-weight:600;}
    #gv-login h1{font-size:30px;line-height:1.1;margin:0 0 6px;font-weight:800;
      letter-spacing:-.02em;}
    #gv-login p.sub{margin:0 0 26px;color:#9fb3d1;font-size:15px;}
    #gv-login label{display:block;text-align:left;font-size:13px;color:#9fb3d1;
      margin:0 0 6px;}
    #gv-login input{width:100%;box-sizing:border-box;padding:14px 16px;border-radius:12px;
      border:1px solid #2a3d63;background:#0d1c38;color:#EAF2FF;font-size:16px;outline:none;}
    #gv-login input:focus{border-color:#4CC4FF;box-shadow:0 0 0 3px rgba(76,196,255,.18);}
    #gv-login button{width:100%;margin-top:14px;padding:14px 16px;border:0;border-radius:12px;
      background:#4CC4FF;color:#04121f;font-size:16px;font-weight:700;cursor:pointer;
      transition:filter .15s;}
    #gv-login button:hover{filter:brightness(1.07);}
    #gv-login button:disabled{opacity:.55;cursor:default;}
    #gv-login .msg{min-height:20px;margin-top:14px;font-size:14px;}
    #gv-login .msg.err{color:#ff9a8a;}
    #gv-login .msg.ok{color:#7ee0a2;}
    @media (prefers-reduced-motion:no-preference){#gv-login .card{animation:gvfade .4s ease}}
    @keyframes gvfade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  `;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const wrap = document.createElement('div');
  wrap.id = 'gv-login';
  wrap.innerHTML = `
    <div class="card">
      <p class="eyebrow">Corra sem dor</p>
      <h1>GV Run</h1>
      <p class="sub">Acesse com o e-mail que você usou na compra.</p>
      <label for="gv-email">Seu e-mail</label>
      <input id="gv-email" type="email" inputmode="email" autocomplete="email"
             placeholder="voce@email.com" />
      <button id="gv-btn">Enviar link de acesso</button>
      <div class="msg" id="gv-msg"></div>
    </div>`;
  document.body.appendChild(wrap);

  const email = wrap.querySelector('#gv-email');
  const btn   = wrap.querySelector('#gv-btn');
  const msg   = wrap.querySelector('#gv-msg');
  const diz   = (t, tipo='') => { msg.textContent = t; msg.className = 'msg ' + tipo; };

  async function enviar() {
    const e = (email.value || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) {
      return diz('Digite um e-mail válido.', 'err');
    }
    btn.disabled = true; diz('Verificando...');

    // 1) o e-mail está na lista de autorizados?
    const { data: liberado, error: e1 } =
      await sb.rpc('is_email_allowed', { check_email: e });

    if (e1) { btn.disabled = false; return diz('Erro ao verificar. Tente de novo.', 'err'); }
    if (!liberado) {
      btn.disabled = false;
      return diz('Este e-mail não está liberado. Use o mesmo e-mail da compra ou fale com o suporte.', 'err');
    }

    // 2) manda o link mágico
    const { error: e2 } = await sb.auth.signInWithOtp({
      email: e,
      options: { emailRedirectTo: window.location.origin }
    });

    btn.disabled = false;
    if (e2) return diz('Não consegui enviar o link. Tente novamente em instantes.', 'err');
    diz('Pronto! Enviamos um link de acesso para ' + e + '. Abra seu e-mail e clique no link.', 'ok');
  }

  btn.addEventListener('click', enviar);
  email.addEventListener('keydown', ev => { if (ev.key === 'Enter') enviar(); });
}

function esconderTelaLogin() {
  const el = document.getElementById('gv-login');
  if (el) el.remove();
}

/* ============================================================
   INIT — chame isso uma vez, no início do app.
   Resolve a Promise só quando o aluno está logado e autorizado.
   ============================================================ */
const GVCloud = {
  user: null,

  async init() {
    // se o aluno acabou de clicar no link do e-mail, o Supabase já detecta
    // a sessão na URL automaticamente. Confirmamos abaixo:
    const { data: { session } } = await sb.auth.getSession();

    if (!session) {
      montarTelaLogin();
      // espera o aluno logar (o clique no link recarrega a página com sessão)
      await new Promise(resolve => {
        sb.auth.onAuthStateChange((_evt, s) => { if (s) resolve(); });
      });
    }

    const { data: { user } } = await sb.auth.getUser();
    this.user = user;
    esconderTelaLogin();

    // se voltou a internet e tinha coisa pendente, sobe agora
    window.addEventListener('online', () => this._sincronizarPendente());
    await this._sincronizarPendente();

    return user;
  },

  async logout() {
    await sb.auth.signOut();
    location.reload();
  },

  /* ---------- LOAD: busca na nuvem; cai pro cache se offline ---------- */
  async load() {
    try {
      const { data, error } = await sb
        .from('user_progress')
        .select('data')
        .eq('user_id', this.user.id)
        .maybeSingle();

      if (error) throw error;

      if (data && data.data) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(data.data)); // atualiza cache
        return data.data;
      }
      // ainda não tem nada na nuvem: usa o que tiver no cache local
      const cache = localStorage.getItem(CACHE_KEY);
      return cache ? JSON.parse(cache) : {};
    } catch (_e) {
      // offline ou falhou: usa o cache local
      const cache = localStorage.getItem(CACHE_KEY);
      return cache ? JSON.parse(cache) : {};
    }
  },

  /* ---------- SAVE: grava local NA HORA e sobe pra nuvem ---------- */
  async save(state) {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state)); // instantâneo e offline
    try {
      const { error } = await sb.from('user_progress').upsert({
        user_id: this.user.id,
        data: state,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      localStorage.removeItem(DIRTY_KEY); // subiu com sucesso
    } catch (_e) {
      localStorage.setItem(DIRTY_KEY, '1'); // ficou pendente; sobe quando voltar a net
    }
  },

  /* ---------- sobe o que ficou pendente enquanto estava offline ---------- */
  async _sincronizarPendente() {
    if (localStorage.getItem(DIRTY_KEY) !== '1') return;
    const cache = localStorage.getItem(CACHE_KEY);
    if (!cache) { localStorage.removeItem(DIRTY_KEY); return; }
    try {
      const { error } = await sb.from('user_progress').upsert({
        user_id: this.user.id,
        data: JSON.parse(cache),
        updated_at: new Date().toISOString()
      });
      if (!error) localStorage.removeItem(DIRTY_KEY);
    } catch (_e) { /* segue pendente até a próxima */ }
  }
};

window.GVCloud = GVCloud;
