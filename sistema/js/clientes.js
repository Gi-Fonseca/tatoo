let bancoClientes;
async function renderizarClientes(filtro = '') {
  bancoClientes = await obterBanco();

  const busca = filtro.toLowerCase();
  const clientes = bancoClientes.clientes.filter(cliente => (
    [cliente.nome, cliente.email, cliente.telefone].join(' ').toLowerCase().includes(busca)
  ));

  document.getElementById('linhasClientes').innerHTML = clientes.map(cliente => `
    <tr>
      <td><strong>${escaparTexto(cliente.nome)}</strong><small class="texto-fraco">${escaparTexto(cliente.email)}</small></td>
      <td>CPF protegido</td>
      <td>${escaparTexto(cliente.telefone)}</td>
      <td class="acoes">
        <button class="botao botao-suave" data-editar-cliente="${cliente.id}">Editar</button>
        <button class="botao botao-perigo" data-excluir-cliente="${cliente.id}">Excluir</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="4" class="vazio">Nenhum cliente encontrado.</td></tr>';

  document.querySelectorAll('[data-editar-cliente]').forEach(botao => {
    botao.onclick = () => editarCliente(Number(botao.dataset.editarCliente));
  });

  document.querySelectorAll('[data-excluir-cliente]').forEach(botao => {
    botao.onclick = () => excluirCliente(Number(botao.dataset.excluirCliente));
  });
}

function editarCliente(id) {
  const cliente = bancoClientes.clientes.find(item => item.id === id);
  document.getElementById('idCliente').value = cliente.id;
  document.getElementById('nomeCliente').value = cliente.nome;
  document.getElementById('cpfCliente').value = '';
  document.getElementById('cpfCliente').placeholder = 'Deixe vazio para manter';
  document.getElementById('telefoneCliente').value = cliente.telefone;
  document.getElementById('emailCliente').value = cliente.email;
  document.getElementById('tituloFormulario').textContent = 'Editar cliente';
}

async function excluirCliente(id) {
  if (!confirm('Excluir este cliente?')) return;

  bancoClientes.clientes = bancoClientes.clientes.filter(cliente => cliente.id !== id);
  bancoClientes.projetos = bancoClientes.projetos.filter(projeto => projeto.idCliente !== id);
  bancoClientes.sessoes = bancoClientes.sessoes.filter(sessao => sessao.idCliente !== id);
  salvarBanco(bancoClientes);
  mostrarAviso('Cliente removido.');
  renderizarClientes();
}

document.addEventListener('DOMContentLoaded', async () => {
  prepararMenu('clientes');
  await renderizarClientes();

  document.getElementById('botaoBusca').onclick = () => {
    renderizarClientes(document.getElementById('campoBuscaCliente').value);
  };

  document.getElementById('campoBuscaCliente').oninput = evento => {
    renderizarClientes(evento.target.value);
  };

  document.getElementById('cancelarEdicao').onclick = () => {
    document.getElementById('formularioCliente').reset();
    document.getElementById('cpfCliente').placeholder = '000.000.000-00';
  };

  document.getElementById('formularioCliente').onsubmit = async evento => {
    evento.preventDefault();
    const id = Number(document.getElementById('idCliente').value);
    const cliente = {
      id: id || proximoId(bancoClientes.clientes),
      nome: document.getElementById('nomeCliente').value.trim(),
      telefone: document.getElementById('telefoneCliente').value.trim(),
      email: document.getElementById('emailCliente').value.trim(),
      cpfCriptografado: document.getElementById('cpfCliente').value.trim()
        ? await criptografarCpf(document.getElementById('cpfCliente').value.trim())
        : bancoClientes.clientes.find(item => item.id === id)?.cpfCriptografado
    };

    if (id) {
      bancoClientes.clientes = bancoClientes.clientes.map(item => item.id === id ? cliente : item);
    } else {
      bancoClientes.clientes.push(cliente);
    }

    salvarBanco(bancoClientes);
    evento.target.reset();
    document.getElementById('cpfCliente').placeholder = '000.000.000-00';
    document.getElementById('tituloFormulario').textContent = 'Novo cliente';
    mostrarAviso('Cliente salvo.');
    renderizarClientes();
  };
});
