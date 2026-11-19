const CHAVE_ARMAZENAMENTO = 'estudio_tatuagem_db_v5';
const CHAVE_SESSAO = 'estudio_tatuagem_session_v5';
const SEGREDO_CRIPTOGRAFIA = 'Estudio-Tatuagem-chave-2026';

const dadosIniciais = {
  funcionarios: [
    { id: 1, nome: 'Tatuador 1', email: 'tatuador@estudio.com', resumoSenha: null, funcao: 'Tatuador' },
    { id: 2, nome: 'Tatuador 2', email: 'tatuador2@estudio.com', resumoSenha: null, funcao: 'Tatuador' },
    { id: 3, nome: 'Tatuador 3', email: 'tatuador3@estudio.com', resumoSenha: null, funcao: 'Tatuador' },
    { id: 4, nome: 'Laisla', email: 'laisla@estudio.com', resumoSenha: null, funcao: 'Tatuador' },
    { id: 5, nome: 'Joao Marcelo', email: 'JoaoM@estudio.com', resumoSenha: null, funcao: 'Tatuador' }
  ],
  clientes: [
    { id: 1, nome: 'Ana Beatriz Souza', cpf: '123.456.789-09', telefone: '(11) 98888-1111', email: 'ana@email.com' },
    { id: 2, nome: 'Bruno Martins', cpf: '234.567.890-10', telefone: '(11) 97777-2222', email: 'bruno@email.com' },
    { id: 3, nome: 'Camila Rocha', cpf: '345.678.901-21', telefone: '(11) 96666-3333', email: 'camila@email.com' }
  ],
  projetos: [
    { id: 1, nome: 'Rosa botânica', descricao: 'Rosa com folhas e pontilhismo', estilo: 'Linha fina', idCliente: 1, status: 'Em planejamento' },
    { id: 2, nome: 'Dragão oriental', descricao: 'Composição para antebraço', estilo: 'Oriental', idCliente: 2, status: 'Aprovado' },
    { id: 3, nome: 'Constelação', descricao: 'Pequena constelação minimalista', estilo: 'Minimalista', idCliente: 3, status: 'Em planejamento' }
  ],
  sessoes: [
    { id: 1, idProjeto: 1, idCliente: 1, idFuncionario: 1, data: '2026-12-03T14:00', duracao: 120, status: 'Agendada' },
    { id: 2, idProjeto: 2, idCliente: 2, idFuncionario: 2, data: '2026-12-05T10:00', duracao: 240, status: 'Agendada' },
    { id: 3, idProjeto: 3, idCliente: 3, idFuncionario: 3, data: '2026-12-08T16:30', duracao: 90, status: 'A confirmar' }
  ]
};

async function gerarResumo(valor) {
  const bytes = new TextEncoder().encode(valor);
  const resumo = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(resumo)].map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function bytesParaBase64(bytes) {
  return btoa(String.fromCharCode(...bytes));
}

function base64ParaBytes(texto) {
  return Uint8Array.from(atob(texto), caractere => caractere.charCodeAt(0));
}

async function obterChaveCriptografia() {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(SEGREDO_CRIPTOGRAFIA));
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function criptografarCpf(cpf) {
  const vetorInicial = crypto.getRandomValues(new Uint8Array(12));
  const dados = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: vetorInicial },
    await obterChaveCriptografia(),
    new TextEncoder().encode(cpf)
  );
  return { vetorInicial: bytesParaBase64(vetorInicial), dados: bytesParaBase64(new Uint8Array(dados)) };
}

async function descriptografarCpf(cpfCriptografado) {
  try {
    const texto = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: base64ParaBytes(cpfCriptografado.vetorInicial) },
      await obterChaveCriptografia(),
      base64ParaBytes(cpfCriptografado.dados)
    );
    return new TextDecoder().decode(texto);
  } catch {
    return 'CPF protegido';
  }
}

async function prepararBanco() {
  const salvo = JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO) || 'null');
  if (salvo && Array.isArray(salvo.funcionarios) && Array.isArray(salvo.sessoes)) return salvo;

  localStorage.removeItem(CHAVE_SESSAO);
  const banco = structuredClone(dadosIniciais);
  const resumoSenha = await gerarResumo('123456');

  banco.funcionarios.forEach(funcionario => {
    funcionario.resumoSenha = resumoSenha;
  });

  for (const cliente of banco.clientes) {
    cliente.cpfCriptografado = await criptografarCpf(cliente.cpf);
    delete cliente.cpf;
  }

  localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(banco));
  return banco;
}

async function obterBanco() {
  return JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO)) || prepararBanco();
}

function salvarBanco(banco) {
  localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(banco));
}

function proximoId(itens) {
  return Math.max(0, ...itens.map(item => Number(item.id))) + 1;
}

function sessaoValida() {
  const sessao = JSON.parse(localStorage.getItem(CHAVE_SESSAO) || 'null');
  return sessao && sessao.expiraEm > Date.now();
}

function sessaoAtual() {
  return JSON.parse(localStorage.getItem(CHAVE_SESSAO) || 'null');
}

function exigirLogin() {
  if (!sessaoValida()) {
    localStorage.removeItem(CHAVE_SESSAO);
    location.href = 'index.html';
    return false;
  }
  return true;
}

function sairSistema() {
  localStorage.removeItem(CHAVE_SESSAO);
  location.href = 'index.html';
}

function escaparTexto(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, caractere => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[caractere]));
}

function formatarData(data) {
  return new Date(data).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function mostrarCpf(cpf) {
  return cpf || 'CPF protegido';
}

function mostrarAviso(mensagem, tipo = 'sucesso') {
  const aviso = document.getElementById('aviso');
  if (!aviso) return;
  aviso.textContent = mensagem;
  aviso.className = `aviso ${tipo}`;
  setTimeout(() => { aviso.className = 'aviso oculto'; }, 2600);
}

function prepararMenu(paginaAtiva) {
  if (!exigirLogin()) return;
  const sessao = sessaoAtual();
  document.querySelectorAll('[data-nome-funcionario]').forEach(elemento => {
    elemento.textContent = sessao.nome;
  });
  document.querySelectorAll('[data-pagina]').forEach(elemento => {
    elemento.classList.toggle('ativa', elemento.dataset.pagina === paginaAtiva);
  });
  document.querySelectorAll('[data-acao="sair"]').forEach(elemento => {
    elemento.addEventListener('click', sairSistema);
  });
  const verificador = setInterval(() => {
    if (!sessaoValida()) {
      clearInterval(verificador);
      sairSistema();
    }
  }, 1000);
}

function montarMenu(titulo, paginaAtiva) {
  return `
    <aside class="menu-lateral">
      <div class="identidade"><span class="marca pequena">ET</span><span>Estúdio de Tatuagem</span></div>
      <p class="rotulo-menu">MENU</p>
      <nav>
        <a data-pagina="principal" href="principal.html">Visão geral</a>
        <a data-pagina="clientes" href="clientes.html">Clientes</a>
        <a data-pagina="projetos" href="projetos.html">Projetos</a>
        <a data-pagina="sessoes" href="sessoes.html">Sessões</a>
      </nav>
      <div class="rodape-menu">
        <strong data-nome-funcionario></strong>
        <small>Tatuador</small>
        <button class="botao-icone" data-acao="sair" title="Sair">Sair</button>
      </div>
    </aside>
    <main class="conteudo-principal">
      <header class="barra-superior">
        <div><p class="subtitulo">ESTÚDIO DE TATUAGEM</p><h1>${titulo}</h1></div>
        <button class="botao botao-discreto" data-acao="sair">Sair</button>
      </header>
      <div id="aviso" class="aviso oculto"></div>`;
}

function fecharMenu() {
  return '</main>';
}
