const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

const aplicacao = express();

aplicacao.use(cors());
aplicacao.use(express.json());

const conexaoBanco = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tatoo_db',
  waitForConnections: true,
  connectionLimit: 5
});

const chaveToken = process.env.JWT_SECRET || 'chave-secreta-do-sistema';

function verificarAcesso(requisicao, resposta, proximo) {
  const chave = (requisicao.headers.authorization || '').replace('Bearer ', '');

  try {
    requisicao.funcionario = jwt.verify(chave, chaveToken);
    proximo();
  } catch {
    resposta.status(401).json({ mensagem: 'Sessão inválida ou expirada.' });
  }
}

function responderErro(resposta, erro) {
  console.error(erro.message);
  resposta.status(500).json({ mensagem: 'Erro interno do servidor.' });
}

aplicacao.get('/api/situacao', (requisicao, resposta) => {
  resposta.json({ sistema: 'Estúdio de Tatuagem', situacao: 'funcionando' });
});

aplicacao.post('/api/entrar', async (requisicao, resposta) => {
  try {
    const { email, senha } = requisicao.body;
    const [funcionarios] = await conexaoBanco.query(
      'SELECT id_funcionario, nome, email FROM funcionarios WHERE email = ? AND senha = SHA2(?, 256)',
      [email, senha]
    );

    if (!funcionarios.length) {
      return resposta.status(401).json({ mensagem: 'E-mail ou senha inválidos.' });
    }

    const funcionario = funcionarios[0];
    const chaveAcesso = jwt.sign(
      {
        id_funcionario: funcionario.id_funcionario,
        nome: funcionario.nome,
        email: funcionario.email
      },
      chaveToken,
      { expiresIn: '30m' }
    );

    resposta.json({ chaveAcesso, nome: funcionario.nome });
  } catch (erro) {
    responderErro(resposta, erro);
  }
});

aplicacao.get('/api/clientes', verificarAcesso, async (requisicao, resposta) => {
  try {
    const busca = `%${requisicao.query.busca || ''}%`;
    const [clientes] = await conexaoBanco.query(
      "SELECT id_cliente, nome, CAST(AES_DECRYPT(cpf_criptografado, 'chave-estudio-2026') AS CHAR) AS cpf, telefone, email FROM clientes WHERE nome LIKE ? OR telefone LIKE ? OR email LIKE ? ORDER BY nome",
      [busca, busca, busca]
    );
    resposta.json(clientes);
  } catch (erro) {
    responderErro(resposta, erro);
  }
});

aplicacao.post('/api/clientes', verificarAcesso, async (requisicao, resposta) => {
  try {
    const { nome, cpf, telefone, email } = requisicao.body;
    const [resultado] = await conexaoBanco.query(
      "INSERT INTO clientes (nome, cpf_criptografado, telefone, email) VALUES (?, AES_ENCRYPT(?, 'chave-estudio-2026'), ?, ?)",
      [nome, cpf, telefone, email]
    );
    resposta.status(201).json({ id: resultado.insertId, mensagem: 'Cliente cadastrado.' });
  } catch (erro) {
    responderErro(resposta, erro);
  }
});

aplicacao.put('/api/clientes/:id', verificarAcesso, async (requisicao, resposta) => {
  try {
    const { nome, cpf, telefone, email } = requisicao.body;
    await conexaoBanco.query(
      "UPDATE clientes SET nome = ?, cpf_criptografado = AES_ENCRYPT(?, 'chave-estudio-2026'), telefone = ?, email = ? WHERE id_cliente = ?",
      [nome, cpf, telefone, email, requisicao.params.id]
    );
    resposta.json({ mensagem: 'Cliente atualizado.' });
  } catch (erro) {
    responderErro(resposta, erro);
  }
});

aplicacao.get('/api/projetos', verificarAcesso, async (requisicao, resposta) => {
  try {
    const [projetos] = await conexaoBanco.query(
      'SELECT p.id_projeto, p.nome, p.descricao, p.estilo, p.status, p.id_cliente, c.nome AS cliente_nome FROM projetos p JOIN clientes c ON c.id_cliente = p.id_cliente ORDER BY p.nome'
    );
    resposta.json(projetos);
  } catch (erro) {
    responderErro(resposta, erro);
  }
});

aplicacao.post('/api/projetos', verificarAcesso, async (requisicao, resposta) => {
  try {
    const { id_cliente, nome, descricao, estilo, status } = requisicao.body;
    const [resultado] = await conexaoBanco.query(
      'INSERT INTO projetos (id_cliente, nome, descricao, estilo, status) VALUES (?, ?, ?, ?, ?)',
      [id_cliente, nome, descricao, estilo, status]
    );
    resposta.status(201).json({ id: resultado.insertId, mensagem: 'Projeto cadastrado.' });
  } catch (erro) {
    responderErro(resposta, erro);
  }
});

aplicacao.put('/api/projetos/:id', verificarAcesso, async (requisicao, resposta) => {
  try {
    const { id_cliente, nome, descricao, estilo, status } = requisicao.body;
    await conexaoBanco.query(
      'UPDATE projetos SET id_cliente = ?, nome = ?, descricao = ?, estilo = ?, status = ? WHERE id_projeto = ?',
      [id_cliente, nome, descricao, estilo, status, requisicao.params.id]
    );
    resposta.json({ mensagem: 'Projeto atualizado.' });
  } catch (erro) {
    responderErro(resposta, erro);
  }
});

aplicacao.get('/api/sessoes', verificarAcesso, async (requisicao, resposta) => {
  try {
    const [sessoes] = await conexaoBanco.query(
      'SELECT s.id_sessao, s.data, s.duracao, s.status, c.id_cliente, c.nome AS cliente_nome, f.id_funcionario, f.nome AS funcionario_nome, p.id_projeto, p.nome AS projeto_nome, p.descricao, p.estilo, p.status AS projeto_status FROM sessoes s JOIN clientes c ON c.id_cliente = s.id_cliente JOIN funcionarios f ON f.id_funcionario = s.id_funcionario JOIN projetos p ON p.id_projeto = s.id_projeto ORDER BY s.data'
    );
    resposta.json(sessoes);
  } catch (erro) {
    responderErro(resposta, erro);
  }
});

aplicacao.post('/api/sessoes', verificarAcesso, async (requisicao, resposta) => {
  try {
    const { id_projeto, id_cliente, id_funcionario, data, duracao, status } = requisicao.body;
    const tatuador = id_funcionario || requisicao.funcionario.id_funcionario;
    const [resultado] = await conexaoBanco.query(
      'INSERT INTO sessoes (id_projeto, id_cliente, id_funcionario, data, duracao, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id_projeto, id_cliente, tatuador, data, duracao, status]
    );
    resposta.status(201).json({ id: resultado.insertId, mensagem: 'Sessão cadastrada.' });
  } catch (erro) {
    responderErro(resposta, erro);
  }
});

aplicacao.put('/api/sessoes/:id', verificarAcesso, async (requisicao, resposta) => {
  try {
    await conexaoBanco.query(
      'UPDATE sessoes SET data = ? WHERE id_sessao = ?',
      [requisicao.body.data, requisicao.params.id]
    );
    resposta.json({ mensagem: 'Data da sessão atualizada.' });
  } catch (erro) {
    responderErro(resposta, erro);
  }
});

aplicacao.get('/api/funcionarios/eu', verificarAcesso, async (requisicao, resposta) => {
  try {
    const [funcionarios] = await conexaoBanco.query(
      'SELECT id_funcionario, nome, email FROM funcionarios WHERE id_funcionario = ?',
      [requisicao.funcionario.id_funcionario]
    );

    if (!funcionarios.length) {
      return resposta.status(404).json({ mensagem: 'Funcionário não encontrado.' });
    }

    resposta.json(funcionarios[0]);
  } catch (erro) {
    responderErro(resposta, erro);
  }
});

aplicacao.listen(process.env.PORT || 3000, () => {
  console.log('Backend funcionando na porta 3000');
});
