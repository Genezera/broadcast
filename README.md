# Broadcast

Aplicação SaaS multi-tenant simplificada para organizar **conexões**, **contatos** e **mensagens em massa (simuladas)**, com envio imediato ou agendado. Nenhuma mensagem é realmente enviada: o disparo é uma simulação.

Publicado em: https://broadcast-renan-2026.web.app

- **Frontend:** React 19 + TypeScript + Vite, Material UI + Tailwind CSS, React Router, React Hook Form + Zod.
- **Backend:** Firebase Authentication, Firestore, Cloud Functions v2 (Node 22) e Cloud Scheduler.
- **Paradigma:** funcional. Funções puras, hooks e componentes pequenos, sem classes próprias.

## O que o sistema faz

| Área                   | O que tem                                                                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Conexões**           | Criar, renomear e excluir (com exclusão em cascata). Cada conexão tem os seus contatos e mensagens.                                                                                         |
| **Contatos**           | CRUD com busca por nome ou telefone. Campo de telefone com bandeira do país, DDI e máscara aplicada enquanto digita; o valor é salvo no formato internacional.                              |
| **Broadcast**          | Criar mensagem para um ou mais contatos, enviar agora ou agendar, editar, excluir e filtrar por status. Lista em tempo real.                                                                |
| **Agendamento**        | Uma Cloud Function roda a cada minuto e muda `Agendada` para `Enviada`, mesmo com o navegador fechado.                                                                                      |
| **Painel**             | Totais de conexões, contatos, enviadas e agendadas, e as mensagens mais recentes.                                                                                                           |
| **Conta**              | Nome no cadastro, página Minha conta (editar nome, enviar ou remover foto, trocar a senha confirmando a atual) e recuperação de senha por e-mail.                                           |
| **Português e inglês** | O sistema inteiro nos dois idiomas, com seletor **PT \| EN** no cabeçalho e na tela de login. A escolha fica salva, o idioma do navegador é o padrão e a troca é animada.                   |
| **Modo escuro**        | Botão no cabeçalho e no login. Segue o tema do sistema na primeira visita, lembra a escolha e troca com uma revelação circular animada.                                                     |
| **Ajuda**              | Assistente guiado por botões (sem digitar) que já sugere o assunto da tela atual, mais uma aba de perguntas frequentes. Também troca de idioma.                                             |
| **Responsivo**         | Celular (barra inferior, listas em cards, diálogos em tela cheia), tablet (menu lateral só com ícones) e desktop (menu completo).                                                           |
| **Animações**          | Splash com painel que abre para a direita, transições de página, entrada escalonada de listas, diálogos com _grow_, skeletons e barra de progresso. Tudo respeita `prefers-reduced-motion`. |

## Sumário

1. [Estrutura do projeto](#estrutura-do-projeto)
2. [Português e inglês](#português-e-inglês)
3. [Modelagem do Firestore](#modelagem-do-firestore)
4. [Isolamento entre clientes](#isolamento-entre-clientes)
5. [Agendamento no backend](#agendamento-no-backend)
6. [Regras de negócio](#regras-de-negócio)
7. [Como executar](#como-executar)
8. [Testes](#testes)
9. [Publicação](#publicação)
10. [Decisões e limitações](#decisões-e-limitações)

## Estrutura do projeto

```text
.
├── web/                         # Frontend (Vite)
│   └── src/
│       ├── app/                 # App, providers (notificações e tema) e rotas
│       ├── features/            # Uma pasta por funcionalidade
│       │   ├── auth/            # Login, cadastro, recuperação de senha, sessão
│       │   ├── profile/         # Minha conta: nome, foto e senha
│       │   ├── connections/     # CRUD de conexões e seleção da conexão atual
│       │   ├── contacts/        # CRUD de contatos
│       │   ├── broadcasts/      # Mensagens: criar, editar, excluir, filtrar
│       │   ├── dashboard/       # Indicadores e mensagens recentes
│       │   └── help/            # Assistente de ajuda e perguntas frequentes
│       │       (cada feature: components/, hooks/, services/, schemas.ts)
│       ├── components/          # layout/ (shell) e ui/ (peças reutilizáveis)
│       ├── i18n/                # Dicionários pt/en, tradutor e provider
│       ├── hooks/               # useFirestoreQuery (onSnapshot genérico)
│       ├── lib/                 # firebase, erros, datas, telefone, imagem, ordenação
│       └── types/               # Tipos do modelo de dados
├── functions/                   # Cloud Functions
│   └── src/
│       ├── messages/            # createMessage, updateMessage, deleteMessage
│       ├── connections/         # deleteConnection (cascata)
│       ├── scheduled/           # processScheduledMessages
│       └── shared/              # validators (Zod), authorization, errors, tipos
├── tests/                       # Regras do Firestore, Functions e validadores
├── firestore.rules
├── firestore.indexes.json
└── firebase.json
```

Fluxo de responsabilidades: **UI** (componentes) → **hooks** (leitura em tempo real) → **services** (escritas) → **Firestore / Cloud Functions**. A validação é feita com Zod no cliente e de novo no servidor.

## Português e inglês

A tradução é própria, sem biblioteca, e fica em `web/src/i18n`:

- `pt.ts` e `en.ts` são dicionários aninhados. O `pt.ts` define o formato e o TypeScript obriga o `en.ts` a ter exatamente as mesmas chaves. As chaves são tipadas (`t("contacts.count")`), então um erro de digitação falha na compilação.
- **Parâmetros e plural:** `{nome}` é substituído pelos valores e, quando há `count`, o sufixo `_one` ou `_other` é escolhido com `Intl.PluralRules` (por exemplo, "1 contato" e "3 contatos").
- **Troca animada:** o `I18nProvider` usa a View Transitions API. A tela antiga some desfocando e a nova entra subindo; sem suporte, o conteúdo apenas reaparece com um fade. Com `prefers-reduced-motion`, a troca é instantânea.
- **Datas e nomes de países** seguem o idioma com `Intl` (`pt-BR` e `en-US`). O `<html lang>`, o título e a descrição da página também mudam.
- **Formulários:** os schemas do Zod são funções que recebem o `t`, e os erros ficam guardados em estado estruturado. Ao trocar o idioma, os erros que já estão na tela são refeitos no novo idioma.
- **Erros do servidor:** as Cloud Functions devolvem uma chave estável em `details.key` (por exemplo `bodyTooLong`, com `params`) e uma mensagem padrão em português. O app traduz pela chave (`errors.server.*`). Quem consome a API direto ainda recebe texto legível.
- **Ajuda:** a conversa guarda só ids de tópicos e é montada na hora no idioma atual, então muda junto com a troca sem recomeçar.

Para incluir um idioma novo, é preciso adicionar o dicionário, o texto da ajuda e a entrada em `LANGS`; os testes de paridade apontam o que faltar.

## Modelagem do Firestore

Quatro coleções **na raiz**, sem subcoleções. Os relacionamentos são feitos por IDs e todo documento carrega o `tenantId`.

| Coleção       | Documento (campos além dos timestamps)                                                              | Quem escreve                                          |
| ------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `tenants`     | ID = `uid`; `email`, `name`, `photoData`                                                            | Cliente (cria o próprio perfil; edita só nome e foto) |
| `connections` | `tenantId`, `name`, `status` (`active` \| `deleting`)                                               | Cliente (criar/renomear); Function (excluir)          |
| `contacts`    | `tenantId`, `connectionId`, `name`, `phone`                                                         | Cliente                                               |
| `messages`    | `tenantId`, `connectionId`, `body`, `contactIds`, `recipients[]`, `status`, `scheduledAt`, `sentAt` | **Somente Cloud Functions**                           |

Decisões:

- **Denormalização controlada:** `tenantId` em todas as coleções simplifica consultas e regras.
- **Snapshot de destinatários:** `recipients` guarda `{id, name, phone}` no momento do envio; o histórico continua legível se o contato for editado ou excluído.
- **Relacionamentos imutáveis:** `tenantId` e `connectionId` não podem ser alterados após a criação.
- **Horários do servidor:** `createdAt`, `updatedAt` e `sentAt` usam `serverTimestamp()`; `scheduledAt` é um `Timestamp` (instante UTC absoluto).
- **Índices compostos** (`firestore.indexes.json`): mensagens por conexão (com e sem filtro de status), mensagens recentes do cliente ordenadas por `createdAt` e a varredura do agendador (`status` + `scheduledAt`). O emulador não exige índices; só o Firestore real, por isso o deploy de `firestore` vem antes do uso.

## Isolamento entre clientes

O isolamento é garantido no backend, não pela interface:

1. Cada conta do Firebase Authentication é um cliente; o `uid` é o `tenantId`.
2. **Security Rules** (`firestore.rules`) negam tudo por padrão e só liberam leitura e escrita quando `resource.data.tenantId == request.auth.uid`. As consultas precisam filtrar por `tenantId` (as regras não são filtros).
3. Criar um contato exige que a conexão exista, seja do mesmo tenant e esteja `active`. Campos extras e alteração de `tenantId`, `connectionId` ou `status` são rejeitados.
4. `messages` é somente leitura para o cliente. As **Cloud Functions** (Admin SDK, que ignora as regras) revalidam identidade, dono da conexão e de **cada contato**, que precisa pertencer à mesma conexão, antes de gravar.
5. As respostas de "não encontrado" são iguais para documentos inexistentes e de outro cliente, sem revelar a existência.
6. No frontend, abrir por URL a conexão de outro cliente mostra "Conexão não encontrada".
7. O perfil em `tenants` só aceita editar `name`, `photoData` e `updatedAt`; o e-mail é fixado na criação.

## Agendamento no backend

```text
Cliente agenda → createMessage grava status "scheduled" + scheduledAt (Timestamp)
Cloud Scheduler (a cada minuto) → processScheduledMessages
  └─ consulta mensagens status == scheduled e scheduledAt <= agora (em páginas)
      └─ para cada uma, uma transação revalida status e horário e grava status "sent"
Firestore onSnapshot → a interface atualiza sozinha, se estiver aberta
```

- Roda no servidor, **sem depender do navegador**.
- **Idempotência e concorrência:** a transação relê o documento; mensagem já enviada, reagendada para o futuro ou excluída não é alterada nem recriada. Execuções sobrepostas enviam cada mensagem **uma única vez**.
- **Lotes controlados** (100 por página, até 20 páginas por execução) e `Promise.allSettled`, para que uma falha não bloqueie as demais.
- **Fuso horário:** o formulário usa o horário local do navegador e envia ISO 8601 em UTC.
- **Logs estruturados** (`message_created`, `scheduled_message_sent`, `scheduled_message_failed`, ...) sem o conteúdo das mensagens.

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
| Limites                             | 1 a 100 destinatários, até 2.000 caracteres por mensagem                                                                                     |

## Como executar

Requisitos: Node 22+, Java 21+ (apenas para os emuladores e testes) e um projeto Firebase com **Authentication (e-mail/senha)**, **Firestore** e **Cloud Functions** habilitados. O deploy de Functions exige o plano Blaze.

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

**Com emuladores** (sem tocar em dados reais): defina `VITE_USE_EMULATORS=true` e use `demo-broadcast` como `VITE_FIREBASE_PROJECT_ID`. Depois rode, em terminais separados:

```bash
npm run build -w functions && npm run emulators
npm run dev
```

O emulador não dispara o Cloud Scheduler. Para ver um agendamento virar "Enviada" localmente, use a varredura dos testes ou publique no Firebase.

Scripts úteis: `npm run typecheck`, `npm run format` e `npm run build`.

## Testes

```bash
npm run typecheck        # TypeScript (web e functions)
npm run test:unit        # validadores do backend + frontend (Vitest e Testing Library)
npm run test:integration # Rules + Functions + agendador, em um único emulador do Firestore
npm test                 # unit + integration
npm run test:rules       # (opcional) apenas Security Rules
npm run test:functions   # (opcional) apenas Functions e agendador
```

São **131 testes automatizados**: 105 no frontend, 5 nos validadores do backend e 21 de integração com o emulador.

- **Rules:** isolamento entre tenants (leitura e escrita), spoofing e troca de `tenantId` ou `connectionId`, contato apontando para conexão alheia, escrita de mensagens bloqueada, perfil `tenants` e conexões em exclusão.
- **Functions:** validação de entrada, destinatários de outro tenant ou conexão, edição de mensagens, agendamento sem navegador, reagendamento contra varredura antiga, varreduras concorrentes (envio único), mensagem excluída e cascata de exclusão. Os erros devolvem a chave estável para tradução.
- **Frontend:** schemas, telefone, datas, imagem de perfil, nome de exibição, navegação, mensagens de erro, diálogo de confirmação, campo de telefone e assistente de ajuda.
- **Idiomas:** paridade dos dois dicionários (mesmas chaves, mesmos `{parâmetros}`, plurais completos), interpolação e plural, persistência da troca de idioma, conteúdo da ajuda nos dois idiomas e cobertura de todas as chaves de erro do backend.

## Publicação

```bash
npm run build
npx firebase use --add          # selecione o projeto
npx firebase deploy --only firestore,functions,hosting
```

O Hosting serve `web/dist` com fallback para `index.html` (SPA). Registre dois usuários distintos no app publicado para demonstrar o isolamento. O `web/.env.production` guarda só a configuração pública do app Web; a segurança vem das Security Rules, não do sigilo dessas chaves.

## Decisões e limitações

- **Foto de perfil sem Storage:** a imagem é recortada e reduzida para 256 px no navegador (JPEG, de 20 a 40 KB) e guardada como data URL em `tenants/{uid}.photoData`. As Security Rules aceitam só `data:image/...` de até 120 KB. Isso evita configurar mais um serviço para um avatar; para fotos grandes ou compartilhadas, o caminho natural seria o Firebase Storage.
- **Idiomas sem biblioteca:** são só dois, e um dicionário tipado resolve com plural e parâmetros. Para muitos idiomas ou tradução por equipe, uma biblioteca como i18next compensaria.
- **Frequência do agendador:** a cada minuto; o envio ocorre com tolerância de até cerca de 1 minuto. Para precisão por mensagem, a evolução natural seria Cloud Tasks.
- **Sem RBAC:** há um usuário por cliente, então não há papéis.
- **Sem App Check:** não está ativado nas Functions. Seria o próximo passo de hardening contra uso fora do app.
- **Paginação:** mensagens carregam 20 por vez ("Carregar mais"), aumentando o `limit` da consulta para continuar em tempo real. Contatos carregam inteiros por conexão, porque a busca e o seletor de destinatários dependem da lista completa.
- **Contagens do painel e dos filtros:** usam agregação no servidor (`getCountFromServer`), atualizada quando a lista visível muda e a cada 30 s. Não são em tempo real como as listas.
- **Dependências:** `npm audit --omit=dev` retorna 0 alertas (o `@grpc/grpc-js` é fixado em versão corrigida via `overrides`). Os alertas restantes vêm apenas do CLI `firebase-tools`, que não faz parte do app publicado.
- O projeto é um teste prático: não há envio externo, cobrança ou integração com gateways.
