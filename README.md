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
4. Deploy automático

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
