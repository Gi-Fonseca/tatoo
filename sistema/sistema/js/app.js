const STORAGE_KEY = 'estudio_tatuagem_db_v1';
const SESSION_KEY = 'estudio_tatuagem_session_v1';
const CRYPTO_SECRET = 'Estúdio de Tatuagem-demo-chave-LGPD-2026';

const seed = {
  users: [
    { id: 1, name: 'Celso Rodrigo Giusti', email: 'admin@estudio.com', passwordHash: null, role: 'Administrador' },
    { id: 2, name: 'Marina Alves', email: 'marina@estudio.com', passwordHash: null, role: 'Atendente' },
    { id: 3, name: 'Rafael Lima', email: 'rafael@estudio.com', passwordHash: null, role: 'Tatuador' }
  ],
  clients: [
    { id: 1, name: 'Ana Beatriz Souza', cpf: '123.456.789-09', phone: '(11) 98888-1111', email: 'ana@email.com' },
    { id: 2, name: 'Bruno Martins', cpf: '234.567.890-10', phone: '(11) 97777-2222', email: 'bruno@email.com' },
    { id: 3, name: 'Camila Rocha', cpf: '345.678.901-21', phone: '(11) 96666-3333', email: 'camila@email.com' }
  ],
  projects: [
    { id: 1, name: 'Rosa botânica', description: 'Rosa com folhas e pontilhismo', style: 'Fine line', clientId: 1, status: 'Em planejamento' },
    { id: 2, name: 'Dragão oriental', description: 'Composição para antebraço', style: 'Oriental', clientId: 2, status: 'Aprovado' },
    { id: 3, name: 'Constelação', description: 'Pequena constelação minimalista', style: 'Minimalista', clientId: 3, status: 'Em planejamento' }
  ],
  sessions: [
    { id: 1, projectId: 1, clientId: 1, date: '2026-12-03T14:00', duration: 120, status: 'Agendada' },
    { id: 2, projectId: 2, clientId: 2, date: '2026-12-05T10:00', duration: 240, status: 'Agendada' },
    { id: 3, projectId: 3, clientId: 3, date: '2026-12-08T16:30', duration: 90, status: 'A confirmar' }
  ]
};

async function digest(value) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function bytesToB64(bytes) { return btoa(String.fromCharCode(...bytes)); }
function b64ToBytes(text) { return Uint8Array.from(atob(text), c => c.charCodeAt(0)); }
async function cryptoKey() {
  const raw = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(CRYPTO_SECRET));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function encryptCpf(cpf) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await cryptoKey(), new TextEncoder().encode(cpf));
  return { iv: bytesToB64(iv), data: bytesToB64(new Uint8Array(encrypted)) };
}
async function decryptCpf(payload) {
  try {
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64ToBytes(payload.iv) }, await cryptoKey(), b64ToBytes(payload.data));
    return new TextDecoder().decode(plain);
  } catch { return 'CPF protegido'; }
}

async function ensureDatabase() {
  if (localStorage.getItem(STORAGE_KEY)) return JSON.parse(localStorage.getItem(STORAGE_KEY));
  const db = structuredClone(seed);
  const passwordHash = await digest('123456');
  db.users.forEach(user => { user.passwordHash = passwordHash; });
  for (const client of db.clients) {
    client.cpfEncrypted = await encryptCpf(client.cpf);
    delete client.cpf;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  return db;
}
async function getDb() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || await ensureDatabase(); }
function saveDb(db) { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }
function nextId(items) { return Math.max(0, ...items.map(item => Number(item.id))) + 1; }
function sessionIsValid() {
  const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  return session && session.expiresAt > Date.now();
}
function currentSession() { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
function requireAuth() { if (!sessionIsValid()) { localStorage.removeItem(SESSION_KEY); location.href = 'index.html'; return false; } return true; }
function logout() { localStorage.removeItem(SESSION_KEY); location.href = 'index.html'; }
function esc(value) { return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
function fmtDate(value) { return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }); }
function cpfMask(value) { return value || 'CPF protegido'; }
function flash(message, type = 'success') { const box = document.getElementById('flash'); if (!box) return; box.textContent = message; box.className = `flash ${type}`; setTimeout(() => box.className = 'flash hidden', 2600); }
function setupShell(active) {
  if (!requireAuth()) return;
  const session = currentSession();
  document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = session.name);
  document.querySelectorAll('[data-page]').forEach(el => el.classList.toggle('active', el.dataset.page === active));
  document.querySelectorAll('[data-action="logout"]').forEach(el => el.addEventListener('click', logout));
  const timer = setInterval(() => { if (!sessionIsValid()) { clearInterval(timer); logout(); } }, 1000);
}
function shell(title, active) {
  return `<aside class="sidebar"><div class="brand"><span class="brand-mark small">ET</span><span>Estúdio de Tatuagem</span></div><p class="sidebar-label">PAINEL</p><nav><a data-page="home" href="principal.html">Visão geral</a><a data-page="clients" href="clientes.html">Clientes</a><a data-page="projects" href="projetos.html">Projetos</a><a data-page="sessions" href="sessoes.html">Sessões</a></nav><div class="sidebar-bottom"><span class="user-dot">${esc((currentSession()?.name || 'U')[0])}</span><div><strong data-user-name></strong><small>${esc(currentSession()?.role || '')}</small></div><button class="icon-button" data-action="logout" title="Sair">↪</button></div></aside><main class="main-content"><header class="topbar"><div><p class="eyebrow">ESTÚDIO DE TATUAGEM</p><h1>${title}</h1></div><button class="btn btn-ghost" data-action="logout">Sair</button></header><div id="flash" class="flash hidden"></div>`;
}
function closeShell() { return '</main>'; }
