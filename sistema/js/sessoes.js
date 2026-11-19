let bancoSessoes;

function preencherProjetos(idSelecionado = '') {
  const campoProjeto = document.getElementById('projetoSessao');

  campoProjeto.innerHTML = bancoSessoes.projetos.map(projeto => {
    const cliente = bancoSessoes.clientes.find(item => item.id === projeto.idCliente);
    const selecionado = String(projeto.id) === String(idSelecionado) ? 'selected' : '';
    return `<option value="${projeto.id}" ${selecionado}>${escaparTexto(projeto.nome)} - ${escaparTexto(cliente?.nome || 'Cliente')}</option>`;
  }).join('');
}

function preencherTatuadores(idSelecionado = '') {
  const campoTatuador = document.getElementById('tatuadorSessao');

  campoTatuador.innerHTML = bancoSessoes.funcionarios.map(funcionario => {
    const selecionado = String(funcionario.id) === String(idSelecionado) ? 'selected' : '';
    return `<option value="${funcionario.id}" ${selecionado}>${escaparTexto(funcionario.nome)}</option>`;
  }).join('');
}

function encontrarCliente(id) {
  return bancoSessoes.clientes.find(cliente => cliente.id === id) || {};
}

function encontrarProjeto(id) {
  return bancoSessoes.projetos.find(projeto => projeto.id === id) || {};
}

function encontrarTatuador(id) {
  return bancoSessoes.funcionarios.find(funcionario => funcionario.id === id) || {};
}

function renderizarSessoes() {
  const lista = [...bancoSessoes.sessoes].sort((a, b) => new Date(a.data) - new Date(b.data));
  const linhas = document.getElementById('linhasSessoes');

  linhas.innerHTML = lista.map(sessao => {
    const cliente = encontrarCliente(sessao.idCliente);
    const projeto = encontrarProjeto(sessao.idProjeto);
    const tatuador = encontrarTatuador(sessao.idFuncionario);

    return `
      <tr>
        <td><strong>${formatarData(sessao.data)}</strong></td>
        <td><strong>${escaparTexto(cliente.nome || 'Cliente')}</strong><small class="texto-fraco">${escaparTexto(cliente.telefone || '')}</small></td>
        <td><strong>${escaparTexto(projeto.nome || 'Projeto')}</strong><small class="texto-fraco">${escaparTexto(projeto.estilo || '')}</small></td>
        <td>${escaparTexto(tatuador.nome || 'Tatuador')}</td>
        <td>${sessao.duracao} min</td>
        <td><span class="etiqueta">${escaparTexto(sessao.status)}</span></td>
        <td class="acoes"><button class="botao botao-suave" data-editar-sessao="${sessao.id}">Alterar data</button></td>
      </tr>`;
  }).join('') || '<tr><td colspan="7" class="vazio">Nenhuma sessão cadastrada.</td></tr>';

  document.querySelectorAll('[data-editar-sessao]').forEach(botao => {
    botao.onclick = () => editarSessao(Number(botao.dataset.editarSessao));
  });
}

function editarSessao(id) {
  const sessao = bancoSessoes.sessoes.find(item => item.id === id);
  document.getElementById('formularioSessao').classList.remove('oculto');
  document.getElementById('idSessao').value = sessao.id;
  document.getElementById('dataSessao').value = sessao.data;
  document.getElementById('duracaoSessao').value = sessao.duracao;
  document.getElementById('statusSessao').value = sessao.status;
  preencherProjetos(sessao.idProjeto);
  preencherTatuadores(sessao.idFuncionario);
}

document.addEventListener('DOMContentLoaded', async () => {
  prepararMenu('sessoes');
  bancoSessoes = await obterBanco();
  preencherProjetos();
  preencherTatuadores();
  renderizarSessoes();

  document.getElementById('novaSessao').onclick = () => {
    document.getElementById('formularioSessao').classList.remove('oculto');
    document.getElementById('formularioSessao').reset();
    preencherProjetos();
    preencherTatuadores();
  };

  document.getElementById('cancelarSessao').onclick = () => {
    document.getElementById('formularioSessao').classList.add('oculto');
  };

  document.getElementById('formularioSessao').onsubmit = evento => {
    evento.preventDefault();

    const id = Number(document.getElementById('idSessao').value);
    const projeto = bancoSessoes.projetos.find(item => item.id === Number(document.getElementById('projetoSessao').value));
    const sessao = {
      id: id || proximoId(bancoSessoes.sessoes),
      idProjeto: projeto.id,
      idCliente: projeto.idCliente,
      idFuncionario: Number(document.getElementById('tatuadorSessao').value),
      data: document.getElementById('dataSessao').value,
      duracao: Number(document.getElementById('duracaoSessao').value),
      status: document.getElementById('statusSessao').value
    };

    if (id) {
      bancoSessoes.sessoes = bancoSessoes.sessoes.map(item => item.id === id ? sessao : item);
    } else {
      bancoSessoes.sessoes.push(sessao);
    }

    salvarBanco(bancoSessoes);
    evento.target.classList.add('oculto');
    renderizarSessoes();
    mostrarAviso('Sessão salva com sucesso.');
  };
});
