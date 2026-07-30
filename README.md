# EAFI 2026/2027 — Sistema de Inscrição

Sistema web de cadastro e inscrição para a seletiva do Programa **EAFI (Escola de Atletas e
Formação Integral)** da Prefeitura de Taubaté.

Stack: **Node.js + Express**, **PostgreSQL + Prisma ORM**, front-end em **HTML/CSS/JS puro**.

## Estrutura do projeto

```
eafi/
├── prisma/
│   ├── schema.prisma        # Modelos: Modalidade, Responsavel, Inscricao
│   └── seed.js               # Popula as 10 modalidades oficiais
├── src/
│   ├── app.js                 # Ponto de entrada do Express
│   ├── config/
│   │   ├── prisma.js          # Cliente Prisma (singleton)
│   │   └── constants.js       # Datas, local e horário da prova
│   ├── routes/                # /api/modalidades, /api/inscricoes, /api/admin
│   ├── controllers/           # Camada HTTP (request/response)
│   ├── services/               # Regras de negócio (elegibilidade, inscrição)
│   └── middleware/
│       └── adminAuth.js       # Basic Auth para a área administrativa
└── public/                     # Front-end estático
    ├── index.html               # Página inicial
    ├── inscricao-etapa1.html    # Etapa 1: dados do candidato e família
    ├── inscricao-etapa2.html    # Etapa 2: escolha de modalidade
    ├── confirmacao.html         # Comprovante de inscrição
    ├── consulta.html            # Consultar minha inscrição
    ├── admin.html                # Painel administrativo
    ├── css/style.css
    └── js/*.js
```

## Como rodar localmente

### 1. Pré-requisitos
- Node.js 18+
- PostgreSQL rodando localmente (ou um serviço como Supabase/Neon/Railway)

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env
```
Edite o `.env` com a string de conexão do seu PostgreSQL e defina `ADMIN_USER`/`ADMIN_PASS`
para a área administrativa.

**Se estiver usando o [Neon](https://neon.tech):** o dashboard mostra a connection string
com pooling (host termina em `-pooler`). Use essa em `DATABASE_URL` — é a que a aplicação usa
em runtime. Para `DIRECT_URL` (usada só nas migrations do Prisma), pegue a versão sem
`-pooler` no host (no seletor da tela "Connection string", troque de "Pooled connection" para
"Direct connection"). O `schema.prisma` já está configurado para usar as duas.

### 4. Criar as tabelas no banco e gerar o Prisma Client
```bash
npx prisma generate
npx prisma migrate dev --name init
```

> Se você já tinha rodado as migrations antes e está atualizando para a versão com
> **resultado da seletiva** (campo `status` em `Inscricao` e a tabela `ResultadoConfig`),
> rode uma nova migration em vez da de cima:
> ```bash
> npx prisma migrate dev --name add_resultado_seletiva
> ```

### 5. Popular as modalidades oficiais
```bash
npm run prisma:seed
```

### 6. Rodar o servidor
```bash
npm start
```
Acesse http://localhost:3000

> Nota: este projeto foi desenvolvido em um ambiente sem acesso a um banco PostgreSQL nem
> acesso à internet para baixar o binário do Prisma Engine — por isso os comandos acima
> (`prisma generate` / `migrate` / `seed`) ainda não foram executados neste ambiente. Todo o
> código foi revisado e validado sintaticamente (`node --check` em todos os arquivos), mas
> rode os passos acima no seu ambiente local antes do primeiro uso.

## Fluxo do sistema

1. **Página inicial (`/`)** — apresenta o programa, datas, local e um botão "Fazer inscrição".
2. **Etapa 1** — formulário com dados do candidato, endereço, telefones (lista dinâmica),
   responsáveis (lista dinâmica) e perguntas de saúde/esporte com campos condicionais.
   Os dados ficam em `sessionStorage` até o envio final.
3. **Etapa 2** — lista as 10 modalidades oficiais. O back-end (`GET /api/modalidades`)
   calcula a elegibilidade cruzando sexo + ano de nascimento e devolve a lista já ordenada
   (elegíveis primeiro). As não elegíveis aparecem apagadas e desabilitadas. Ao escolher uma
   modalidade válida, aparecem automaticamente data/horário/local da prova e a data de
   divulgação. Em seguida, o usuário escolhe o responsável no dia da prova.
4. **Envio (`POST /api/inscricoes`)** — o back-end **revalida tudo no servidor** (nunca confia
   só no front-end): campos obrigatórios, elegibilidade da modalidade e duplicidade (por
   e-mail OU nome + data de nascimento). Gera um código único (`EAFI-XXXXXX`) e salva.
5. **Confirmação** — mostra o comprovante completo com o código gerado.
6. **Consulta (`/consulta.html`)** — permite buscar a inscrição pelo código ou por
   e-mail + data de nascimento.
7. **Admin (`/admin.html`)** — protegido por usuário/senha (HTTP Basic Auth). Lista todas as
   inscrições, permite filtrar por modalidade (com contagem de inscritos por modalidade ao
   lado), marcar o resultado de cada inscrito (Pendente / Aprovado / Reprovado — salvo
   automaticamente a cada alteração) e exportar tudo em CSV.
8. **Publicar resultado** — o botão "Publicar resultado da seletiva" no topo do admin
   revela, de uma vez, todos os status já marcados para quem consultar a inscrição em
   `/consulta.html`. Antes de publicar, a consulta pública mostra "resultado ainda não
   divulgado". O admin pode despublicar a qualquer momento se precisar corrigir algo.

## Principais endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/modalidades` | Lista modalidades (com `?sexo=&dataNascimento=` calcula elegibilidade) |
| POST | `/api/inscricoes` | Cria uma inscrição |
| GET | `/api/inscricoes/consulta?codigo=` | Consulta por código |
| GET | `/api/inscricoes/consulta?email=&dataNascimento=` | Consulta por e-mail + nascimento |
| GET | `/api/admin/inscricoes` | Lista inscrições (protegido, Basic Auth) |
| GET | `/api/admin/inscricoes/export` | Exporta CSV (protegido, Basic Auth) |
| PATCH | `/api/admin/inscricoes/:id/status` | Marca uma inscrição como `pendente`/`aprovado`/`reprovado` (protegido) |
| POST | `/api/admin/resultado/publicar` | Publica o resultado (fica visível na consulta pública) (protegido) |
| POST | `/api/admin/resultado/despublicar` | Esconde novamente o resultado da consulta pública (protegido) |

## Próximos passos sugeridos

- Adicionar validação de CPF/RG se a Secretaria exigir.
- Enviar e-mail de confirmação automático com o código gerado (ex: usando Nodemailer).
- Trocar a Basic Auth do admin por um login com sessão, se o número de administradores crescer.
- Adicionar limite de vagas por modalidade, se a Secretaria decidir criar um teto.
