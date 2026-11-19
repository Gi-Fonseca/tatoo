# Backend

Backend simples em Node.js, Express e MySQL.

1. Execute `tatoo_db.sql` no MySQL.
2. Abra esta pasta no terminal.
3. Execute `npm install`.
4. Copie `.env.example` para `.env` e ajuste a senha do MySQL.
5. Execute `npm start`.

A API ficará em `http://localhost:3000`.

Rotas principais:

- `POST /api/entrar`
- `GET /api/funcionarios/eu`
- `GET /api/clientes?busca=termo`
- `POST /api/clientes`
- `PUT /api/clientes/:id`
- `GET /api/projetos`
- `POST /api/projetos`
- `PUT /api/projetos/:id`
- `GET /api/sessoes`
- `POST /api/sessoes`
- `PUT /api/sessoes/:id`
