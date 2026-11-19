const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tatoo_db',
  waitForConnections: true,
  connectionLimit: 5
});

const jwtSecret = process.env.JWT_SECRET || 'chave-secreta-do-sistema';
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try { req.user = jwt.verify(token, jwtSecret); next(); }
  catch { res.status(401).json({ mensagem: 'Sessão inválida ou expirada.' }); }
}
function sendError(res, error) { console.error(error.message); res.status(500).json({ mensagem: 'Erro interno do servidor.' }); }

app.get('/api/status', (req, res) => res.json({ sistema: 'Estúdio de Tatuagem', status: 'ok' }));

app.post('/api/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const [rows] = await pool.query('SELECT id, nome, email FROM usuarios WHERE email = ? AND senha = SHA2(?, 256)', [email, senha]);
    if (!rows.length) return res.status(401).json({ mensagem: 'E-mail ou senha inválidos.' });
    const usuario = rows[0];
    const token = jwt.sign({ id: usuario.id, nome: usuario.nome, email: usuario.email }, jwtSecret, { expiresIn: '30m' });
    res.json({ token, nome: usuario.nome });
  } catch (error) { sendError(res, error); }
});

app.get('/api/clientes', auth, async (req, res) => {
  try {
    const termo = `%${req.query.busca || ''}%`;
    const [rows] = await pool.query("SELECT id, nome, CAST(AES_DECRYPT(cpf_criptografado, 'chave-estudio-2026') AS CHAR) AS cpf, telefone, email FROM clientes WHERE nome LIKE ? OR telefone LIKE ? OR email LIKE ? ORDER BY nome", [termo, termo, termo]);
    res.json(rows);
  } catch (error) { sendError(res, error); }
});

app.post('/api/clientes', auth, async (req, res) => {
  try {
    const { nome, cpf, telefone, email } = req.body;
    const [result] = await pool.query("INSERT INTO clientes (nome, cpf_criptografado, telefone, email) VALUES (?, AES_ENCRYPT(?, 'chave-estudio-2026'), ?, ?)", [nome, cpf, telefone, email]);
    res.status(201).json({ id: result.insertId, mensagem: 'Cliente cadastrado.' });
  } catch (error) { sendError(res, error); }
});

app.put('/api/clientes/:id', auth, async (req, res) => {
  try {
    const { nome, cpf, telefone, email } = req.body;
    await pool.query("UPDATE clientes SET nome = ?, cpf_criptografado = AES_ENCRYPT(?, 'chave-estudio-2026'), telefone = ?, email = ? WHERE id = ?", [nome, cpf, telefone, email, req.params.id]);
    res.json({ mensagem: 'Cliente atualizado.' });
  } catch (error) { sendError(res, error); }
});

app.get('/api/projetos', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT p.id, p.nome, p.descricao, p.estilo, p.status, p.cliente_id, c.nome AS cliente_nome FROM projetos p JOIN clientes c ON c.id = p.cliente_id ORDER BY p.nome');
    res.json(rows);
  } catch (error) { sendError(res, error); }
});

app.post('/api/projetos', auth, async (req, res) => {
  try {
    const { cliente_id, nome, descricao, estilo, status } = req.body;
    const [result] = await pool.query('INSERT INTO projetos (cliente_id, nome, descricao, estilo, status) VALUES (?, ?, ?, ?, ?)', [cliente_id, nome, descricao, estilo, status]);
    res.status(201).json({ id: result.insertId, mensagem: 'Projeto cadastrado.' });
  } catch (error) { sendError(res, error); }
});

app.get('/api/sessoes', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT s.id, s.data_sessao, s.duracao_minutos, s.status, c.id AS cliente_id, c.nome AS cliente_nome, c.telefone, c.email, p.id AS projeto_id, p.nome AS projeto_nome, p.descricao, p.estilo, p.status AS projeto_status FROM sessoes s JOIN clientes c ON c.id = s.cliente_id JOIN projetos p ON p.id = s.projeto_id ORDER BY s.data_sessao');
    res.json(rows);
  } catch (error) { sendError(res, error); }
});

app.post('/api/sessoes', auth, async (req, res) => {
  try {
    const { projeto_id, cliente_id, data_sessao, duracao_minutos, status } = req.body;
    const [result] = await pool.query('INSERT INTO sessoes (projeto_id, cliente_id, data_sessao, duracao_minutos, status) VALUES (?, ?, ?, ?, ?)', [projeto_id, cliente_id, data_sessao, duracao_minutos, status]);
    res.status(201).json({ id: result.insertId, mensagem: 'Sessão cadastrada.' });
  } catch (error) { sendError(res, error); }
});

app.put('/api/sessoes/:id', auth, async (req, res) => {
  try {
    const { data_sessao } = req.body;
    await pool.query('UPDATE sessoes SET data_sessao = ? WHERE id = ?', [data_sessao, req.params.id]);
    res.json({ mensagem: 'Data da sessão atualizada.' });
  } catch (error) { sendError(res, error); }
});


app.get('/api/usuarios/me', auth, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nome, email FROM usuarios WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ mensagem: 'Usuário não encontrado.' });
    res.json(rows[0]);
  } catch (error) { sendError(res, error); }
});

app.put('/api/projetos/:id', auth, async (req, res) => {
  try {
    const { cliente_id, nome, descricao, estilo, status } = req.body;
    await pool.query('UPDATE projetos SET cliente_id = ?, nome = ?, descricao = ?, estilo = ?, status = ? WHERE id = ?', [cliente_id, nome, descricao, estilo, status, req.params.id]);
    res.json({ mensagem: 'Projeto atualizado.' });
  } catch (error) { sendError(res, error); }
});

app.listen(process.env.PORT || 3000, () => console.log('Backend rodando na porta 3000'));
