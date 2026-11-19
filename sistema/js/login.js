document.addEventListener('DOMContentLoaded', async () => {
  await prepararBanco();

  if (sessaoValida()) {
    location.href = 'principal.html';
    return;
  }

  document.getElementById('formularioLogin').addEventListener('submit', async evento => {
    evento.preventDefault();

    const mensagemErro = document.getElementById('erroLogin');
    const email = document.getElementById('email').value.trim().toLowerCase();
    const senha = document.getElementById('senha').value;
    const banco = await obterBanco();
    const resumoSenha = await gerarResumo(senha);
    const funcionario = banco.funcionarios.find(item => (
      item.email.toLowerCase() === email && item.resumoSenha === resumoSenha
    ));

    if (!funcionario) {
      mensagemErro.textContent = 'E-mail ou senha inválidos.';
      return;
    }

    localStorage.setItem(CHAVE_SESSAO, JSON.stringify({
      idFuncionario: funcionario.id,
      nome: funcionario.nome,
      funcao: funcionario.funcao,
      expiraEm: Date.now() + 30 * 60 * 1000
    }));

    location.href = 'principal.html';
  });
});
