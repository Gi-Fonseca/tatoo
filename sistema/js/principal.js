document.addEventListener('DOMContentLoaded', async () => {
  prepararMenu('principal');

  const banco = await obterBanco();
  const sessoesProximas = [...banco.sessoes]
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .slice(0, 3);

  const nomeCliente = id => banco.clientes.find(cliente => cliente.id === id)?.nome || 'Cliente';
  const nomeProjeto = id => banco.projetos.find(projeto => projeto.id === id)?.nome || 'Projeto';
  const nomeTatuador = id => banco.funcionarios.find(funcionario => funcionario.id === id)?.nome || 'Tatuador';

  document.getElementById('painelPrincipal').innerHTML = `
    <div class="cartoes">
      <div class="cartao-indicador"><p>CLIENTES</p><strong>${banco.clientes.length}</strong></div>
      <div class="cartao-indicador"><p>PROJETOS</p><strong>${banco.projetos.length}</strong></div>
      <div class="cartao-indicador"><p>SESSÕES</p><strong>${banco.sessoes.filter(sessao => sessao.status !== 'Concluída').length}</strong></div>
    </div>

    <div class="grade-dupla">
      <section class="painel">
        <h2>Próximas sessões</h2>
        <div class="lista">
          ${sessoesProximas.map(sessao => `
            <div class="item-lista">
              <div>
                <strong>${escaparTexto(nomeProjeto(sessao.idProjeto))}</strong>
                <small>${escaparTexto(nomeCliente(sessao.idCliente))}</small>
              </div>
              <div>
                <strong>${formatarData(sessao.data)}</strong>
                <small>${escaparTexto(nomeTatuador(sessao.idFuncionario))}</small>
              </div>
            </div>`).join('') || '<p class="vazio">Nenhuma sessão cadastrada.</p>'}
        </div>
      </section>

      <section class="painel">
        <h2>Acessos rápidos</h2>
        <div class="lista">
          <a class="item-lista" href="clientes.html"><strong>Clientes</strong><span>→</span></a>
          <a class="item-lista" href="projetos.html"><strong>Projetos</strong><span>→</span></a>
          <a class="item-lista" href="sessoes.html"><strong>Agenda</strong><span>→</span></a>
        </div>
      </section>
    </div>`;
});
