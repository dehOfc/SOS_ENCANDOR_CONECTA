# SOS Encanador Conecta

Projeto MVP para um website responsivo de agenciamento de serviços de encanamento.

## Estrutura

- `apps/web`: Frontend em React + Vite + Tailwind CSS
- `apps/api`: Backend em Node.js + Express + TypeScript

## Como usar

1. Abra o terminal no diretório do projeto:
   ```bash
   cd C:\Users\gtaga\source\SOS-Encanador-Conecta
   ```
2. Instale dependências:
   ```bash
   npm install
   ```
3. Inicie o backend e frontend localmente:
   ```bash
   npm run start
   ```

O frontend será servido em `http://localhost:4173` e o backend em `http://localhost:5174`.

## Deploy do frontend estático

Para hospedar apenas o frontend em GitHub Pages ou em qualquer servidor de arquivos estáticos:

1. Entre na pasta do frontend:
   ```bash
   cd apps/web
   ```
2. Gere o build estático:
   ```bash
   npm run build
   ```
3. Publique a pasta `dist` no seu host estático.

No caso do GitHub Pages, use a branch `gh-pages` ou a pasta `docs` com o conteúdo de `apps/web/dist`.

> Atenção: o GitHub Pages serve apenas o frontend estático. A API Node/Express precisa ser hospedada em outro serviço (por exemplo, Render, Railway, Fly.io, Vercel Serverless ou outro backend Node) e o frontend deve apontar para essa URL de API.

## Funcionalidades implementadas

- Landing page responsiva com CTA e seções de serviço
- Formulário de solicitação de serviço para clientes
- Seção de parceiro e informações comerciais
- API simples com endpoints de serviços, solicitações e parceiros

## Próximos passos

- Autenticação de cliente e encanador
- Área restrita com histórico de serviços
- Paginação e banco de dados real
- Integrações com mapas e WhatsApp
