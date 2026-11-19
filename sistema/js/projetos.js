let bancoProjetos;

function preencherOpcoesCliente(idSelecionado = '') {
  document.getElementById('clienteProjeto').innerHTML = bancoProjetos.clientes.map(cliente => {
    const selecionado = String(cliente.id) === String(idSelecionado) ? 'selected' : '';
    return `<option value="${cliente.id}" ${selecionado}>${escaparTexto(cliente.nome)}</option>`;
  }).join('');
}

function renderizarProjetos() {
  const nomeCliente = id => bancoProjetos.clientes.find(cliente => cliente.id === id)?.nome || 'Cliente removido';

  document.getElementById('linhasProjetos').innerHTML = bancoProjetos.projetos.map(projeto => `
    <tr>
      <td><strong>${escaparTexto(projeto.nome)}</strong><small class="texto-fraco">${escaparTexto(projeto.descricao)}</small></td>
      <td>${escaparTexto(nomeCliente(projeto.idCliente))}</td>
      <td>${escaparTexto(projeto.estilo)}</td>
      <td><span class="etiqueta">${escaparTexto(projeto.status)}</span></td>
      <td class="acoes">
        <button class="botao botao-suave" data-editar-projeto="${projeto.id}">Editar</button>
        <button class="botao botao-perigo" data-excluir-projeto="${projeto.id}">Excluir</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="5" class="vazio">Nenhum projeto cadastrado.</td></tr>';

  document.querySelectorAll('[data-editar-projeto]').forEach(botao => {
    botao.onclick = () => editarProjeto(Number(botao.dataset.editarProjeto));
  });

  document.querySelectorAll('[data-excluir-projeto]').forEach(botao => {
    botao.onclick = () => excluirProjeto(Number(botao.dataset.excluirProjeto));
  });
}

function editarProjeto(id) {
  const projeto = bancoProjetos.projetos.find(item => item.id === id);
  document.getElementById('formularioProjeto').classList.remove('oculto');
  document.getElementById('idProjeto').value = projeto.id;
  document.getElementById('nomeProjeto').value = projeto.nome;
  document.getElementById('estiloProjeto').value = projeto.estilo;
  document.getElementById('descricaoProjeto').value = projeto.descricao;
  document.getElementById('statusProjeto').value = projeto.status;
  preencherOpcoesCliente(projeto.idCliente);
}

function excluirProjeto(id) {
  if (!confirm('Excluir este projeto?')) return;
  bancoProjetos.projetos = bancoProjetos.projetos.filter(projeto => projeto.id !== id);
  bancoProjetos.sessoes = bancoProjetos.sessoes.filter(sessao => sessao.idProjeto !== id);
  salvarBanco(bancoProjetos);
  renderizarProjetos();
  mostrarAviso('Projeto removido.');
}

document.addEventListener('DOMContentLoaded', async () => {
  prepararMenu('projetos');
  bancoProjetos = await obterBanco();
  preencherOpcoesCliente();
  renderizarProjetos();

  document.getElementById('novoProjeto').onclick = () => {
    document.getElementById('formularioProjeto').classList.remove('oculto');
    document.getElementById('formularioProjeto').reset();
    preencherOpcoesCliente();
  };

  document.getElementById('cancelarProjeto').onclick = () => {
    document.getElementById('formularioProjeto').classList.add('oculto');
  };

  document.getElementById('formularioProjeto').onsubmit = evento => {
    evento.preventDefault();
    const id = Number(document.getElementById('idProjeto').value);
    const projeto = {
      id: id || proximoId(bancoProjetos.projetos),
      nome: document.getElementById('nomeProjeto').value.trim(),
      idCliente: Number(document.getElementById('clienteProjeto').value),
      estilo: document.getElementById('estiloProjeto').value.trim(),
      status: document.getElementById('statusProjeto').value,
      descricao: document.getElementById('descricaoProjeto').value.trim()
    };

    if (id) {
      bancoProjetos.projetos = bancoProjetos.projetos.map(item => item.id === id ? projeto : item);
    } else {
      bancoProjetos.projetos.push(projeto);
    }

    salvarBanco(bancoProjetos);
    evento.target.classList.add('oculto');
    renderizarProjetos();
    mostrarAviso('Projeto salvo.');
  };
});
