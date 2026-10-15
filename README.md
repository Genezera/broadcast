# Broadcast

Aplicação SaaS multi-tenant simplificada para organizar **conexões**, **contatos** e **mensagens em massa (simuladas)**, com envio imediato ou agendado. Nenhuma mensagem é realmente enviada: o disparo é uma simulação.

- **Frontend:** React 19 + TypeScript + Vite, Material UI + Tailwind CSS, React Router, React Hook Form + Zod.
- **Backend:** Firebase Authentication, Firestore, Cloud Functions v2 (Node 22) e Cloud Scheduler.
- **Interface:** abertura com splash e painel que abre para a direita, transições de página, entrada escalonada de listas, microinterações em botões e cards, diálogos com _grow_, skeletons de carregamento e barra de progresso na navegação. Tudo respeita `prefers-reduced-motion`.
- **Paradigma:** funcional — funções puras, hooks e componentes pequenos; sem classes próprias.

## Sumário

1. [Estrutura do projeto](#estrutura-do-projeto)
2. [Modelagem do Firestore](#modelagem-do-firestore)
3. [Isolamento entre clientes](#isolamento-entre-clientes)
4. [Agendamento no backend](#agendamento-no-backend)
5. [Regras de negócio](#regras-de-negócio)
6. [Como executar](#como-executar)
7. [Testes](#testes)
8. [Publicação](#publicação)
9. [Decisões e limitações](#decisões-e-limitações)

## Estrutura do projeto

```text
.
├── web/                         # Frontend (Vite)
│   └── src/
│       ├── app/                 # App, providers (notificações), tema e rotas
│       ├── features/            # Uma pasta por funcionalidade
│       │   ├── auth/            # Login, cadastro, sessão
│       │   ├── connections/     # CRUD de conexões e seleção da conexão atual
│       │   ├── contacts/        # CRUD de contatos
│       │   ├── broadcasts/      # Mensagens: criar, editar, excluir, filtrar
│       │   └── dashboard/       # Indicadores e mensagens recentes
│       │       (cada feature: components/, hooks/, services/, schemas.ts)
│       ├── components/          # layout/ (shell) e ui/ (peças reutilizáveis)
│       ├── hooks/               # useFirestoreQuery (onSnapshot genérico)
│       ├── lib/                 # firebase, erros, datas, ordenação
│       └── types/               # Tipos do modelo de dados
├── functions/                   # Cloud Functions
│   └── src/
│       ├── messages/            # createMessage, updateMessage, deleteMessage
│       ├── connections/         # deleteConnection (cascata)
│       ├── scheduled/           # processScheduledMessages
│       └── shared/              # validators (Zod), authorization, tipos
├── tests/                       # Regras do Firestore, Functions e validadores
├── firestore.rules
├── firestore.indexes.json
└── firebase.json
```

Fluxo de responsabilidades: **UI** (componentes) → **hooks** (leitura em tempo real) → **services** (escritas) → **Firestore / Cloud Functions**. Validação de formulário com Zod no cliente e, novamente, no servidor.

## Modelagem do Firestore

Quatro coleções **na raiz**, sem subcoleções. Os relacionamentos são feitos por IDs e todo documento carrega o `tenantId`.

| Coleção       | Documento (campos além dos timestamps)                                                              | Quem escreve                                 |
| ------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `tenants`     | ID = `uid`; `email`                                                                                 | Cliente (apenas o próprio perfil, uma vez)   |
| `connections` | `tenantId`, `name`, `status` (`active` \| `deleting`)                                               | Cliente (criar/renomear); Function (excluir) |
| `contacts`    | `tenantId`, `connectionId`, `name`, `phone`                                                         | Cliente                                      |
| `messages`    | `tenantId`, `connectionId`, `body`, `contactIds`, `recipients[]`, `status`, `scheduledAt`, `sentAt` | **Somente Cloud Functions**                  |

Decisões:

- **Denormalização controlada:** `tenantId` em todas as coleções simplifica consultas e regras.
- **Snapshot de destinatários:** `recipients` guarda `{id, name, phone}` no momento do envio; o histórico continua legível se o contato for editado ou excluído.
- **Relacionamentos imutáveis:** `tenantId` e `connectionId` não podem ser alterados após a criação.
- **Horários do servidor:** `createdAt`/`updatedAt`/`sentAt` usam `serverTimestamp()`; `scheduledAt` é um `Timestamp` (instante UTC absoluto).
- **Índices compostos** (`firestore.indexes.json`): mensagens por conexão (com e sem filtro de status) e mensagens recentes do cliente, ordenadas por `createdAt`, além da varredura do agendador (`status` + `scheduledAt`). O emulador não exige índices; eles só são cobrados no Firestore real, por isso o deploy de `firestore` vem antes do uso.

## Isolamento entre clientes

O isolamento é garantido no backend, não pela interface:

1. Cada conta do Firebase Authentication é um cliente; o `uid` é o `tenantId`.
2. **Security Rules** (`firestore.rules`) negam tudo por padrão e só liberam leitura/escrita quando `resource.data.tenantId == request.auth.uid`. Consultas precisam filtrar por `tenantId` (as regras não são filtros).
3. Criação de contatos exige que a conexão exista, seja do mesmo tenant e esteja `active`; campos extras e alteração de `tenantId`, `connectionId` ou `status` são rejeitados.
4. `messages` é somente leitura para o cliente. **Cloud Functions** (Admin SDK, que ignora as regras) revalidam identidade, dono da conexão e de **cada contato** — que precisa pertencer à mesma conexão — antes de gravar.
5. Respostas de "não encontrado" são iguais para documentos inexistentes e de outro cliente, sem vazar existência.
6. No frontend, abrir por URL a conexão de outro cliente mostra "Conexão não encontrada".

## Agendamento no backend

```text
Cliente agenda → createMessage grava status "scheduled" + scheduledAt (Timestamp)
Cloud Scheduler (a cada minuto) → processScheduledMessages
  └─ consulta mensagens status == scheduled e scheduledAt <= agora (em páginas)
      └─ para cada uma, uma transação revalida status e horário e grava status "sent"
Firestore onSnapshot → a interface atualiza sozinha, se estiver aberta
```

- Roda no servidor, **sem depender do navegador**.
- **Idempotência / concorrência:** a transação relê o documento; mensagem já enviada, reagendada para o futuro ou excluída não é alterada nem recriada. Execuções sobrepostas enviam cada mensagem **uma única vez**.
- **Lotes controlados** (100 por página, até 20 páginas por execução) e `Promise.allSettled`, para que uma falha não bloqueie as demais.
- **Fuso horário:** o formulário usa o horário local do navegador e envia ISO 8601 em UTC.
- **Logs estruturados** (`message_created`, `scheduled_message_sent`, `scheduled_message_failed`, …) sem o conteúdo das mensagens.

## Regras de negócio

| Situação                            | Comportamento                                                                                                                                |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Mensagem sem contatos / vazia       | Rejeitada (cliente e servidor)                                                                                                               |
| Agendar no passado ou além de 1 ano | Rejeitado                                                                                                                                    |
| Envio imediato                      | Gravada direto como `sent`                                                                                                                   |
| Mensagem agendada                   | Gravada como `scheduled`; vira `sent` pelo backend no horário                                                                                |
| Editar mensagem agendada            | Permite alterar conteúdo, contatos e horário futuro                                                                                          |
| Excluir mensagem agendada           | Removida; o agendador não a recria nem envia                                                                                                 |
| Editar mensagem enviada             | Altera só o registro; não reenvia nem volta a ser agendada                                                                                   |
| Excluir conexão                     | `deleteConnection` marca `deleting` (bloqueia escritas), apaga contatos e mensagens e, por fim, a conexão; pode ser repetida se interrompida |
| Contato excluído                    | Histórico preservado pelos snapshots dos destinatários                                                                                       |
| Limites                             | 1–100 destinatários, até 2.000 caracteres por mensagem                                                                                       |

## Como executar

Requisitos: Node 22+, Java 21+ (apenas para os emuladores/testes) e um projeto Firebase com **Authentication (E-mail/senha)**, **Firestore** e **Cloud Functions** habilitados (o deploy de Functions exige o plano Blaze).

```bash
npm install
cp web/.env.example web/.env.local   # preencha com os dados do app Web do Firebase
```

Variáveis em `web/.env.local`:

| Variável                                                                                              | Descrição                                              |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `VITE_FIREBASE_API_KEY`, `..._AUTH_DOMAIN`, `..._PROJECT_ID`, `..._APP_ID`, `..._MESSAGING_SENDER_ID` | Configuração do app Web                                |
| `VITE_FUNCTIONS_REGION`                                                                               | Região das Functions (padrão `southamerica-east1`)     |
| `VITE_USE_EMULATORS`                                                                                  | `true` para usar os emuladores locais em `npm run dev` |

**Com emuladores** (sem tocar em dados reais): defina `VITE_USE_EMULATORS=true` e use `demo-broadcast` como `VITE_FIREBASE_PROJECT_ID`; depois rode, em terminais separados:

```bash
npm run build -w functions && npm run emulators
npm run dev
```

O emulador não dispara o Cloud Scheduler; para ver um agendamento virar "Enviada" localmente, use a varredura nos testes ou publique no Firebase.

## Testes

```bash
npm run typecheck     # TypeScript (web e functions)
npm run test:unit     # validadores do backend + utilitários, schemas e componentes do frontend (Vitest + Testing Library)
npm run test:integration # Rules + Functions + agendador, em um único emulador do Firestore
npm test                 # unit + integration
npm run test:rules       # (opcional) apenas Security Rules
npm run test:functions   # (opcional) apenas Functions e agendador
```

Cobertura principal:

- **Rules:** isolamento entre tenants (leitura e escrita), spoofing e troca de `tenantId`/`connectionId`, contato apontando para conexão alheia, escrita de mensagens bloqueada, perfil `tenants`, conexões em exclusão.
- **Functions:** validação de entrada, destinatários de outro tenant/conexão, edição de mensagens, agendamento sem navegador, reagendamento contra varredura antiga, varreduras concorrentes (envio único), mensagem excluída, cascata de exclusão.

## Publicação

```bash
npm run build
npx firebase use --add          # selecione o projeto
npx firebase deploy --only firestore,functions,hosting
```

O Hosting serve `web/dist` com fallback para `index.html` (SPA). Registre dois usuários distintos no app publicado para demonstrar o isolamento.

## Decisões e limitações

- **Conta:** login, cadastro e recuperação de senha por e-mail (Firebase Authentication).
- **Frequência do agendador:** a cada minuto; o envio ocorre com tolerância de até ~1 minuto. Para precisão por mensagem, a evolução natural seria Cloud Tasks.
- **Sem RBAC:** há um usuário por cliente, então não há papéis.
- **Sem App Check:** não está ativado nas Functions. Seria o próximo passo de hardening contra uso fora do app.
- **Paginação:** mensagens carregam 20 por vez ("Carregar mais"), aumentando o `limit` da consulta para continuar em tempo real. Contatos carregam inteiros por conexão, porque a busca e o seletor de destinatários dependem da lista completa.
- **Contagens do dashboard e dos filtros:** usam agregação no servidor (`getCountFromServer`), atualizada quando a lista visível muda e a cada 30 s. Não são em tempo real como as listas.
- **Dependências:** `npm audit --omit=dev` retorna 0 alertas (o `@grpc/grpc-js` é fixado em versão corrigida via `overrides`). Os alertas restantes de `npm audit` vêm apenas do CLI `firebase-tools`, que não faz parte do app publicado.
- O projeto é um teste prático: não há envio externo, cobrança ou integração com gateways.
