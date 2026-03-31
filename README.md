# Helpdesk - Sistema de Chamados com suporte a BI

Este é um sistema de Helpdesk construído com foco em simplicidade, design moderno e facilidade de extração de dados para relatórios de Business Intelligence (BI).

## 🚀 Tecnologias Utilizadas

- **Frontend:** HTML5, Vanilla JavaScript, Vanilla CSS.
  - Design premium e responsivo sem necessidade de frameworks pesados.
  - Paleta de cores baseada na identidade visual da AESA (Teal e Dark Grey).
- **Backend:** Node.js com Express.js.
  - API REST responsável pelo gerenciamento de usuários e chamados.
  - Autenticação e segurança de rotas usando JSON Web Tokens (JWT) e bcrypt.
- **Banco de Dados:** SQLite3.
  - Banco relacional serverless, ideal para portabilidade e consultas analíticas (BI).

## 🗂 Estrutura do Projeto

```text
projetoclcode/
│
├── frontend/               # Código do cliente (Páginas WEB)
│   ├── admin.html          # Dashboard do Administrador (Gestão e Exportação BI)
│   ├── dashboard.html      # Dashboard do Usuário Comum (Meus Chamados)
│   ├── index.html          # Tela de Login e Registro
│   ├── styles.css          # Estilização CSS do sistema inteiro
│   ├── app.js              # Lógica Javascript, Rotas API e Exportar CSV
│   └── logo.png            # (Adicione a logo da empresa com este nome aqui)
│
├── auth.js                 # Lógica de Autenticação (Login, Registro, Hash senhas) e Midlewares Token
├── database.js             # Conexão SQLite e criação das tabelas (users e tickets)
├── routes.js               # APIs REST para gerenciamento de chamados (Tickets e Relatório)
├── server.js               # Ponto de entrada do Node.js (Servidor Web porta 3000)
├── seed.js                 # Script para popular dados de teste automaticamente
├── database.sqlite         # Arquivo local do Banco de Dados gerado
└── package.json            # Dependências NPM
```

## 🛠 Como Rodar o Projeto

### Pré-requisitos
- Ter o **[Node.js](https://nodejs.org/)** instalado.

### 1. Instalação
Abra o terminal na pasta raiz do projeto (`projetoclcode/`) e execute:

```bash
npm install
```
Isso instalará todas as dependências do servidor (express, sqlite3, cors, jsonwebtoken, etc).

### 2. Populando o Banco para Testes (Opcional)
Se for sua primeira vez rodando e quiser ver o sistema funcionando com dados reais e relatórios cheios, rode o script de _seed_:
```bash
node seed.js
```
*Isso criará uma base pronta com os usuários: `admin_master` (Senha: senha123) e `joao_silva` (Senha: senha123).*

### 3. Gerenciando o Servidor

#### ▶️ Como Iniciar:
Com o banco configurado, inicie a aplicação:
```bash
node server.js
```
O console deverá exibir a mensagem: `Server is running on port 3000`.

#### ⏸️ Como Parar (Encerrar):
Para desligar o servidor quando não estiver mais usando:
1. Volte na mesma janela do terminal onde ele está rodando.
2. Pressione as teclas **`Ctrl + C`** juntas.
3. Se perguntar "Deseja finalizar o arquivo em lotes (S/N)?", digite `S` e dê Enter.

*Dica: Se por acaso você fechar a aba do terminal sem desligar e a porta 3000 ficar "presa" rodando de fundo, você pode matar o processo rodando o comando: `npx kill-port 3000`.*

### 4. Acessando a Interface
Abra em seu navegador preferido:
`http://localhost:3000/frontend/index.html`


## 📊 Exportação de Dados para BI

Para a equipe de BI que precisa analisar tempo de resposta, volumetria por filas e resoluções, siga este fluxo:
1. Logue com uma conta Administradora (ex: `admin_master`).
2. Acesse o **Painel Admin**.
3. Clique no botão superior direito **"Exportar p/ BI (CSV)"**.
4. O sistema irá consultar a base em tempo real e baixar no navegador um arquivo `.csv` no formato ideal contendo o Histórico, Datas, Descrições e Status dos Chamados, pronto para ser absorvido pelo *Power BI, Tableau, Qlik*, etc.


## 🔒 Níveis de Acesso (Roles)
- `user`: Tem acesso ao `dashboard.html`. Pode criar chamados para si mesmo e ler tickets onde é o requerente.
- `admin`: Tem acesso ao `admin.html`. Pode ver todos os chamados da empresa, analisar, mover de fila (N1, N2, Operações), responder, concluir e rodar a rotina de exportação do banco inteiro.
