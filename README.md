# macOS Desktop

Uma aplicação web que simula o desktop do macOS, com autenticação Firebase, permissões por usuário, janelas flutuantes e apps integrados via iframe.

## Stack

- React + TypeScript + Vite
- TailwindCSS + Framer Motion
- Firebase (Auth + Firestore)
- React Router v6
- Lucide React

## Instalação

```bash
npm install
```

Crie um arquivo `.env` baseado no `.env.example`:

```bash
cp .env.example .env
```

Preencha as variáveis com as credenciais do seu projeto Firebase.

## Configuração Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Crie um projeto Firebase
3. Ative **Authentication > Email/Password**
4. Ative **Firestore Database**
5. Copie as credenciais do projeto para o `.env`
6. Aplique as regras de segurança do arquivo `firestore.rules`

## Desenvolvimento

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Deploy na Vercel

1. Faça push do repositório para o GitHub
2. Importe o projeto na [Vercel](https://vercel.com)
3. Configure as variáveis de ambiente (`VITE_FIREBASE_*`) no painel da Vercel
4. Configure `VERCEL_TOKEN` para ativar o dock automático com seus projetos Vercel
5. Deploy automático

## Dock automático da Vercel

O dock consulta uma API serverless em `/api/vercel/projects`, lista seus projetos Vercel e usa o favicon/manifest real de cada app como logo. Novos projetos publicados aparecem automaticamente no dock após a próxima sincronização.

Em desenvolvimento, `npm run dev` também expõe `/api/vercel/projects` e `/api/vercel/logo`, então o dock consegue sincronizar localmente quando `VERCEL_TOKEN` estiver no `.env`.

Variáveis server-side:

| Variável | Uso |
|----------|-----|
| `VERCEL_TOKEN` | Token da Vercel com permissão para listar projetos |
| `VERCEL_TEAM_ID` | Opcional, força a busca em um time específico |
| `VERCEL_TEAM_SLUG` | Opcional, cria links diretos para o painel da Vercel |
| `VERCEL_DOCK_LIMIT` | Quantidade máxima de projetos, padrão `100` |
| `VERCEL_DOCK_EXCLUDE_PROJECTS` | IDs ou nomes separados por vírgula para ocultar |
| `VERCEL_DOCK_INCLUDE_SELF` | Use `true` para mostrar o próprio projeto macOS no dock |

## Primeiro acesso

1. Acesse a aplicação
2. Clique em **"Criar primeira conta"** na tela de login
3. Crie o usuário **owner** (administrador principal)
4. Após isso, o cadastro público fica bloqueado
5. Novos usuários só podem ser criados pelo **Painel Admin**

## Aplicativos incluídos

| App | URL |
|-----|-----|
| Crescer | https://crescerb.vercel.app/ |
| Gardenz | https://gardenz.vercel.app/ |
| Cripto Hub | https://cripto-hub.vercel.app/ |
| Bitrade | https://bitrade-eight.vercel.app/ |
| Trade | https://trade-eosin-kappa.vercel.app/ |
| BetIntel | https://betintel-api.vercel.app/ |
| Yield | https://yield-two-orcin.vercel.app/ |
| Aura | https://aura-full.vercel.app/ |

## Roles e permissões

| Role | Descrição |
|------|-----------|
| owner | Acesso total. Imutável por outros usuários |
| admin | Gerencia usuários e permissões |
| manager | Acessa apps e configurações |
| user | Usa apenas apps permitidos |
| guest | Acesso mínimo |
