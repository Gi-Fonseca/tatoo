-- Banco de dados do Estúdio de Tatuagem
CREATE DATABASE IF NOT EXISTS tatoo_db;
USE tatoo_db;

DROP TABLE IF EXISTS sessoes;
DROP TABLE IF EXISTS projetos;
DROP TABLE IF EXISTS clientes;
DROP TABLE IF EXISTS funcionarios;

CREATE TABLE funcionarios (
    id_funcionario INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL
);

CREATE TABLE clientes (
    id_cliente INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cpf_criptografado VARBINARY(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL
);

CREATE TABLE projetos (
    id_projeto INT AUTO_INCREMENT PRIMARY KEY,
    id_cliente INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    estilo VARCHAR(60) NOT NULL,
    status VARCHAR(30) NOT NULL,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente)
);

CREATE TABLE sessoes (
    id_sessao INT AUTO_INCREMENT PRIMARY KEY,
    id_projeto INT NOT NULL,
    id_cliente INT NOT NULL,
    id_funcionario INT NOT NULL,
    data DATE NOT NULL,
    duracao VARCHAR(30) NOT NULL,
    status BOOLEAN NOT NULL,
    FOREIGN KEY (id_projeto) REFERENCES projetos(id_projeto),
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    FOREIGN KEY (id_funcionario) REFERENCES funcionarios(id_funcionario)
);

-- Senha dos funcionários de teste: 123456
INSERT INTO funcionarios (nome, email, senha) VALUES
('Tatuador 1', 'tatuador@estudio.com', SHA2('123456', 256)),
('Tatuador 2', 'tatuador2@estudio.com', SHA2('123456', 256)),
('Tatuador 3', 'tatuador3@estudio.com', SHA2('123456', 256)),
('Laisla', 'laisla@estudio.com', SHA2('123456', 256)),
('Joao Marcelo', 'JoaoM@estudio.com', SHA2('123456', 256));

-- O CPF é criptografado antes de ser armazenado.
INSERT INTO clientes (nome, cpf_criptografado, telefone, email) VALUES
('Ana Beatriz Souza', AES_ENCRYPT('123.456.789-09', 'chave-estudio-2026'), '(11) 98888-1111', 'ana@email.com'),
('Bruno Martins', AES_ENCRYPT('234.567.890-10', 'chave-estudio-2026'), '(11) 97777-2222', 'bruno@email.com'),
('Camila Rocha', AES_ENCRYPT('345.678.901-21', 'chave-estudio-2026'), '(11) 96666-3333', 'camila@email.com');

INSERT INTO projetos (id_cliente, nome, descricao, estilo, status) VALUES
(1, 'Rosa botânica', 'Rosa com folhas e pontilhismo', 'Linha fina', 'Em planejamento'),
(2, 'Dragão oriental', 'Composição para antebraço', 'Oriental', 'Aprovado'),
(3, 'Constelação', 'Pequena constelação minimalista', 'Minimalista', 'Em planejamento');

INSERT INTO sessoes (id_projeto, id_cliente, id_funcionario, data, duracao, status) VALUES
(1, 1, 1, '2026-12-03', '120 minutos', TRUE),
(2, 2, 2, '2026-12-05', '240 minutos', TRUE),
(3, 3, 3, '2026-12-08', '90 minutos', FALSE);
