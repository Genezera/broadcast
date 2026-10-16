import type { Section } from "../../components/layout/navigation";
import type { Lang } from "../../i18n/translate";

/**
 * Conteúdo do assistente de ajuda. É um grafo de tópicos (ids, botões e rotas,
 * iguais em todos os idiomas) com os textos de cada idioma ao lado. Fica em
 * dados puros para ser fácil de revisar, traduzir e testar.
 */
export type HelpAction = { label: string; to: string };

export type HelpNode = {
  id: string;
  /** Texto do botão que leva a este tópico. */
  label: string;
  intro?: string;
  steps?: string[];
  tips?: string[];
  action?: HelpAction;
  /** IDs dos botões oferecidos depois da resposta. */
  next: string[];
};

export const ROOT_ID = "root";

/** Estrutura compartilhada: para onde cada tópico leva e qual rota sugere. */
const GRAPH: Record<string, { next: string[]; to?: string }> = {
  root: {
    next: [
      "start",
      "connections",
      "contacts",
      "send",
      "schedule",
      "manage",
      "notifications",
      "account",
      "appearance",
      "troubleshoot",
    ],
  },
  start: {
    next: ["connections", "contacts", "send", "schedule"],
    to: "/connections",
  },
  connections: { next: ["contacts", "send"], to: "/connections" },
  contacts: { next: ["send", "t_phone"], to: "/contacts" },
  send: {
    next: ["format", "schedule", "manage", "t_nocontacts"],
    to: "/broadcasts",
  },
  format: { next: ["send", "schedule"], to: "/broadcasts" },
  notifications: { next: ["schedule", "send"], to: "/broadcasts" },
  schedule: { next: ["manage", "t_scheduled"], to: "/broadcasts" },
  manage: { next: ["schedule", "send"], to: "/broadcasts" },
  account: { next: ["appearance", "t_password"], to: "/profile" },
  appearance: { next: ["start", "account"] },
  troubleshoot: {
    next: ["t_scheduled", "t_nocontacts", "t_phone", "t_password"],
  },
  t_scheduled: { next: ["schedule", "troubleshoot"] },
  t_nocontacts: { next: ["send", "troubleshoot"], to: "/contacts" },
  t_phone: { next: ["contacts", "troubleshoot"] },
  t_password: { next: ["account", "troubleshoot"] },
};

type TopicText = {
  label: string;
  intro?: string;
  steps?: string[];
  tips?: string[];
  /** Texto do botão de ação (a rota vem do grafo). */
  action?: string;
};

const TEXT: Record<Lang, Record<string, TopicText>> = {
  pt: {
    root: { label: "Menu principal", intro: "Sobre o que você quer ajuda?" },
    start: {
      label: "Primeiros passos",
      intro: "Em 4 passos você envia a sua primeira mensagem:",
      steps: [
        "Crie uma conexão (por exemplo, o nome da sua loja) em Conexões.",
        "Abra a conexão e cadastre seus contatos, com nome e telefone.",
        "Vá em Broadcast, clique em Nova mensagem, escolha os contatos e escreva o texto.",
        "Escolha Enviar agora ou Agendar e confirme. Acompanhe o status na lista.",
      ],
      action: "Criar minha primeira conexão",
    },
    connections: {
      label: "Conexões",
      intro:
        "Uma conexão agrupa contatos e mensagens, como uma loja ou uma campanha.",
      steps: [
        "Em Conexões, clique em Nova conexão e dê um nome.",
        "Use o lápis para renomear e a lixeira para excluir.",
        "Clique em Ver contatos para abrir a lista daquela conexão.",
      ],
      tips: [
        "Excluir uma conexão também apaga todos os contatos e mensagens dela.",
      ],
      action: "Ir para Conexões",
    },
    contacts: {
      label: "Contatos",
      intro: "Cada conexão tem a sua própria lista de contatos.",
      steps: [
        "Abra uma conexão e clique em Novo contato.",
        "Digite o nome e escolha o país pela bandeira. O telefone é formatado enquanto você digita.",
        "Use a busca para achar alguém por nome ou telefone.",
        "Edite ou exclua pelos ícones de cada contato.",
      ],
      tips: [
        "Se você excluir um contato, as mensagens antigas continuam mostrando o nome dele.",
      ],
      action: "Ir para Contatos",
    },
    send: {
      label: "Enviar uma mensagem",
      steps: [
        "Em Broadcast, clique em Nova mensagem.",
        "Em Enviar para, escolha Contatos (uma conexão e os contatos que quiser) ou Conexões (todos os contatos das conexões marcadas).",
        "Use a busca e o Selecionar todos para marcar mais rápido. A lista rola quando é grande.",
        "Escreva a mensagem, deixe Enviar agora marcado e confirme.",
      ],
      tips: [
        "O envio é uma simulação: nenhuma mensagem real é disparada.",
        "Enviando para várias conexões, sai uma mensagem por conexão. Conexões sem contatos são puladas.",
      ],
      action: "Ir para Broadcast",
    },
    format: {
      label: "Formatar o texto",
      intro: "Dá para deixar a mensagem mais clara com estilos:",
      steps: [
        "Selecione um trecho do texto e clique em N (negrito), I (itálico), S (sublinhado) ou no risco (riscado) na barra acima do campo.",
        "Atalhos: Ctrl+B, Ctrl+I, Ctrl+U e Ctrl+Shift+X.",
        "Você também pode digitar *negrito*, _itálico_, __sublinhado__ e ~riscado~.",
        "A prévia abaixo do campo mostra como a mensagem fica.",
      ],
      action: "Ir para Broadcast",
    },
    notifications: {
      label: "Notificações",
      intro: "O sino no cabeçalho avisa quando uma mensagem é enviada:",
      steps: [
        "Mensagens enviadas na hora e agendadas geram um aviso quando são enviadas.",
        "Um número no sino mostra quantas notificações você ainda não leu.",
        "Clique em uma notificação para ver as mensagens daquela conexão. Dá para marcar tudo como lido ou limpar a lista.",
      ],
      tips: [
        "Com o site aberto, um aviso também aparece na tela assim que a mensagem agendada é enviada.",
      ],
      action: "Ir para Broadcast",
    },
    schedule: {
      label: "Agendar uma mensagem",
      steps: [
        "Na nova mensagem, escolha Agendar.",
        "Escolha a data no calendário e o horário no relógio (sempre no futuro).",
        "Confirme. A mensagem fica com o status Agendada.",
        "No horário, o servidor muda para Enviada sozinho, mesmo com o site fechado.",
      ],
      tips: [
        "O processamento roda a cada minuto, então pode levar até 1 minuto depois do horário.",
        "Enquanto estiver Agendada, você pode editar o texto, os contatos e o horário.",
      ],
      action: "Ir para Broadcast",
    },
    manage: {
      label: "Editar ou excluir mensagens",
      steps: [
        "Em Broadcast você vê as mensagens de todas as conexões. Use o filtro de conexão e os botões Todas, Enviadas e Agendadas para localizar.",
        "Clique em Ver detalhes (ou no olho) para ler o texto completo e a lista de todos os destinatários, com busca.",
        "Use o lápis para editar ou a lixeira para excluir.",
      ],
      tips: [
        "Uma mensagem já enviada pode ter o texto corrigido, mas não é reenviada nem volta a ser agendada.",
        "Excluir uma mensagem agendada cancela o envio.",
      ],
      action: "Ir para Broadcast",
    },
    account: {
      label: "Minha conta e senha",
      steps: [
        "Clique na sua foto, no canto superior direito, e escolha Perfil e senha.",
        "Altere o nome e a foto (JPG, PNG ou WebP, até 5 MB).",
        "Em Segurança, informe a senha atual e a nova senha duas vezes.",
      ],
      tips: ["Esqueceu a senha? Na tela de login, use Esqueci minha senha."],
      action: "Abrir Minha conta",
    },
    appearance: {
      label: "Idioma, tema e celular",
      steps: [
        "Use o seletor PT | EN no cabeçalho para trocar o idioma de todo o sistema. A escolha fica salva.",
        "Use o ícone de sol ou lua para alternar entre claro e escuro.",
        "No celular, a navegação fica na barra inferior. No tablet, no menu lateral de ícones.",
      ],
    },
    troubleshoot: {
      label: "Algo deu errado",
      intro: "Veja os casos mais comuns:",
    },
    t_scheduled: {
      label: "Minha mensagem não virou Enviada",
      steps: [
        "Aguarde até 1 minuto depois do horário. O servidor processa a cada minuto.",
        "Confira se o horário que você escolheu já passou.",
        "Se ela continuar Agendada por vários minutos, edite a mensagem e salve de novo.",
      ],
    },
    t_nocontacts: {
      label: "Não consigo criar a mensagem",
      steps: [
        "Cadastre ao menos um contato na conexão escolhida.",
        "Marque pelo menos um destinatário e escreva o texto.",
        "Para agendar, a data precisa estar no futuro.",
      ],
      action: "Ir para Contatos",
    },
    t_phone: {
      label: "O telefone aparece como inválido",
      steps: [
        "Confira o país na bandeira ao lado do campo.",
        "Digite o DDD e o número completos. O campo formata sozinho.",
        "Você também pode colar o número com +DDI, e o país muda automaticamente.",
      ],
    },
    t_password: {
      label: "Não lembro a minha senha",
      steps: [
        "Na tela de login, digite seu e-mail e clique em Esqueci minha senha.",
        "Confira também a caixa de spam.",
        "Já está logado? Use Minha conta, em Segurança.",
      ],
    },
  },
  en: {
    root: { label: "Main menu", intro: "What do you need help with?" },
    start: {
      label: "Getting started",
      intro: "In 4 steps you can send your first message:",
      steps: [
        "Create a connection (for example, your store's name) under Connections.",
        "Open the connection and add your contacts, with name and phone.",
        "Go to Broadcast, click New message, pick the contacts and write the text.",
        "Choose Send now or Schedule and confirm. Follow the status in the list.",
      ],
      action: "Create my first connection",
    },
    connections: {
      label: "Connections",
      intro:
        "A connection groups contacts and messages, like a store or a campaign.",
      steps: [
        "Under Connections, click New connection and give it a name.",
        "Use the pencil to rename and the trash can to delete.",
        "Click View contacts to open that connection's list.",
      ],
      tips: [
        "Deleting a connection also deletes all of its contacts and messages.",
      ],
      action: "Go to Connections",
    },
    contacts: {
      label: "Contacts",
      intro: "Each connection has its own contact list.",
      steps: [
        "Open a connection and click New contact.",
        "Type the name and pick the country with the flag. The phone is formatted as you type.",
        "Use the search box to find someone by name or phone.",
        "Edit or delete with the icons on each contact.",
      ],
      tips: ["If you delete a contact, old messages still show their name."],
      action: "Go to Contacts",
    },
    send: {
      label: "Send a message",
      steps: [
        "Under Broadcast, click New message.",
        "Under Send to, choose Contacts (one connection and the contacts you want) or Connections (every contact in the checked connections).",
        "Use the search and Select all to pick faster. The list scrolls when it is long.",
        "Write the message, leave Send now selected and confirm.",
      ],
      tips: [
        "Sending is a simulation: no real message is delivered.",
        "Sending to several connections creates one message per connection. Connections without contacts are skipped.",
      ],
      action: "Go to Broadcast",
    },
    format: {
      label: "Format the text",
      intro: "You can make a message clearer with styles:",
      steps: [
        "Select part of the text and click B (bold), I (italic), U (underline) or the strikethrough button in the bar above the field.",
        "Shortcuts: Ctrl+B, Ctrl+I, Ctrl+U and Ctrl+Shift+X.",
        "You can also type *bold*, _italic_, __underline__ and ~strikethrough~.",
        "The preview below the field shows how the message looks.",
      ],
      action: "Go to Broadcast",
    },
    notifications: {
      label: "Notifications",
      intro: "The bell in the header tells you when a message is sent:",
      steps: [
        "Messages sent right away and scheduled ones create a notice when they are sent.",
        "A number on the bell shows how many notifications you have not read.",
        "Click a notification to see that connection's messages. You can mark everything as read or clear the list.",
      ],
      tips: [
        "With the site open, a notice also pops up on screen as soon as the scheduled message is sent.",
      ],
      action: "Go to Broadcast",
    },
    schedule: {
      label: "Schedule a message",
      steps: [
        "In the new message, choose Schedule.",
        "Pick the date on the calendar and the time on the clock (always in the future).",
        "Confirm. The message gets the Scheduled status.",
        "At that time, the server switches it to Sent by itself, even with the site closed.",
      ],
      tips: [
        "Processing runs every minute, so it can take up to 1 minute after the time.",
        "While it is Scheduled, you can edit the text, contacts and time.",
      ],
      action: "Go to Broadcast",
    },
    manage: {
      label: "Edit or delete messages",
      steps: [
        "Broadcast shows the messages of all connections. Use the connection filter and the All, Sent and Scheduled buttons to find them.",
        "Click View details (or the eye) to read the full text and the list of every recipient, with search.",
        "Use the pencil to edit or the trash can to delete.",
      ],
      tips: [
        "A sent message can have its text corrected, but it is not sent again or scheduled again.",
        "Deleting a scheduled message cancels the sending.",
      ],
      action: "Go to Broadcast",
    },
    account: {
      label: "My account and password",
      steps: [
        "Click your photo in the top right corner and choose Profile and password.",
        "Change your name and photo (JPG, PNG or WebP, up to 5 MB).",
        "Under Security, enter your current password and the new one twice.",
      ],
      tips: [
        "Forgot your password? On the login screen, use Forgot my password.",
      ],
      action: "Open My account",
    },
    appearance: {
      label: "Language, theme and mobile",
      steps: [
        "Use the PT | EN switch in the header to change the language of the whole system. Your choice is saved.",
        "Use the sun or moon icon to switch between light and dark.",
        "On a phone, navigation is in the bottom bar. On a tablet, in the icon side menu.",
      ],
    },
    troubleshoot: {
      label: "Something went wrong",
      intro: "Here are the most common cases:",
    },
    t_scheduled: {
      label: "My message didn't become Sent",
      steps: [
        "Wait up to 1 minute after the time. The server processes every minute.",
        "Check that the time you chose has already passed.",
        "If it stays Scheduled for several minutes, edit the message and save again.",
      ],
    },
    t_nocontacts: {
      label: "I can't create the message",
      steps: [
        "Add at least one contact to the chosen connection.",
        "Check at least one recipient and write the text.",
        "To schedule, the date must be in the future.",
      ],
      action: "Go to Contacts",
    },
    t_phone: {
      label: "The phone shows as invalid",
      steps: [
        "Check the country on the flag next to the field.",
        "Enter the full area code and number. The field formats itself.",
        "You can also paste the number with +country code, and the country changes automatically.",
      ],
    },
    t_password: {
      label: "I don't remember my password",
      steps: [
        "On the login screen, type your e-mail and click Forgot my password.",
        "Check your spam folder too.",
        "Already signed in? Use My account, under Security.",
      ],
    },
  },
};

/** Todos os tópicos de um idioma, já com a estrutura e as rotas aplicadas. */
const getNodes = (lang: Lang): Record<string, HelpNode> =>
  Object.fromEntries(
    Object.entries(GRAPH).map(([id, { next, to }]) => {
      const text = TEXT[lang][id];
      return [
        id,
        {
          id,
          label: text.label,
          intro: text.intro,
          steps: text.steps,
          tips: text.tips,
          action: text.action && to ? { label: text.action, to } : undefined,
          next,
        } satisfies HelpNode,
      ];
    }),
  );

const NODES: Record<Lang, Record<string, HelpNode>> = {
  pt: getNodes("pt"),
  en: getNodes("en"),
};

export const getNode = (lang: Lang, id: string): HelpNode | undefined =>
  NODES[lang][id];

/** IDs de todos os tópicos (iguais em todos os idiomas). */
export const TOPIC_IDS = Object.keys(GRAPH);

/** Tópico mais útil para cada tela, oferecido logo ao abrir a ajuda. */
export const topicForSection = (section: Section): string | null =>
  ({
    overview: "start",
    connections: "connections",
    contacts: "contacts",
    broadcasts: "send",
    profile: "account",
  })[section] ?? null;

export type Faq = { question: string; answer: string };

export const FAQ: Record<Lang, Faq[]> = {
  pt: [
    {
      question: "O envio de mensagens é real?",
      answer:
        "Não. O disparo é apenas uma simulação: a mensagem é registrada como Enviada, mas nada é enviado para os telefones.",
    },
    {
      question: "Por que minha mensagem agendada ainda aparece como Agendada?",
      answer:
        "O servidor verifica as mensagens a cada minuto, então a mudança para Enviada pode levar até 1 minuto depois do horário. Você não precisa manter o site aberto.",
    },
    {
      question: "Posso editar uma mensagem que já foi enviada?",
      answer:
        "Pode corrigir o texto e os destinatários do registro, mas ela não é reenviada nem volta a ser agendada.",
    },
    {
      question: "O que acontece se eu excluir uma conexão?",
      answer:
        "Todos os contatos e mensagens dessa conexão também são excluídos. Essa ação não pode ser desfeita.",
    },
    {
      question: "Se eu excluir um contato, perco o histórico?",
      answer:
        "Não. As mensagens guardam o nome e o telefone do contato no momento do envio, então o histórico continua legível.",
    },
    {
      question: "Outros clientes conseguem ver os meus dados?",
      answer:
        "Não. Cada conta é um cliente isolado: conexões, contatos e mensagens só aparecem para quem os criou.",
    },
    {
      question: "Como altero meu nome, minha foto ou minha senha?",
      answer:
        "Clique na sua foto no canto superior direito e abra Perfil e senha. Para trocar a senha você precisa informar a atual.",
    },
    {
      question: "Esqueci minha senha. E agora?",
      answer:
        "Na tela de login, digite seu e-mail e clique em Esqueci minha senha. Enviamos um link de redefinição (veja também o spam).",
    },
    {
      question: "Posso enviar para todos os contatos ou para várias conexões?",
      answer:
        "Pode. Em Nova mensagem, escolha Conexões para mandar para todos os contatos das conexões marcadas (sai uma mensagem por conexão) ou Contatos para escolher quem recebe dentro de uma conexão.",
    },
    {
      question: "Como coloco negrito, itálico ou sublinhado?",
      answer:
        "Use a barra acima do campo da mensagem ou os atalhos Ctrl+B, Ctrl+I e Ctrl+U. Ou digite *negrito*, _itálico_, __sublinhado__ e ~riscado~.",
    },
    {
      question: "Como sei que uma mensagem foi enviada?",
      answer:
        "Pelo sino no cabeçalho: cada mensagem enviada, na hora ou agendada, gera uma notificação. Com o site aberto, aparece também um aviso na tela.",
    },
    {
      question: "Como mudo o idioma?",
      answer:
        "Use o seletor PT | EN no cabeçalho (ou no canto da tela de login). Todo o sistema muda na hora e a escolha fica salva.",
    },
  ],
  en: [
    {
      question: "Is message sending real?",
      answer:
        "No. Sending is only a simulation: the message is recorded as Sent, but nothing is delivered to any phone.",
    },
    {
      question: "Why does my scheduled message still show as Scheduled?",
      answer:
        "The server checks messages every minute, so the change to Sent can take up to 1 minute after the time. You don't need to keep the site open.",
    },
    {
      question: "Can I edit a message that was already sent?",
      answer:
        "You can correct the text and recipients of the record, but it is not sent again or scheduled again.",
    },
    {
      question: "What happens if I delete a connection?",
      answer:
        "All contacts and messages in that connection are deleted too. This can't be undone.",
    },
    {
      question: "If I delete a contact, do I lose the history?",
      answer:
        "No. Messages keep the contact's name and phone at the time of sending, so the history stays readable.",
    },
    {
      question: "Can other customers see my data?",
      answer:
        "No. Each account is an isolated customer: connections, contacts and messages are only visible to whoever created them.",
    },
    {
      question: "How do I change my name, photo or password?",
      answer:
        "Click your photo in the top right corner and open Profile and password. To change the password you must enter the current one.",
    },
    {
      question: "I forgot my password. What now?",
      answer:
        "On the login screen, type your e-mail and click Forgot my password. We send a reset link (check spam too).",
    },
    {
      question: "Can I send to all contacts or to several connections?",
      answer:
        "Yes. In New message, choose Connections to send to every contact in the checked connections (one message per connection) or Contacts to pick who receives it within one connection.",
    },
    {
      question: "How do I add bold, italic or underline?",
      answer:
        "Use the bar above the message field or the shortcuts Ctrl+B, Ctrl+I and Ctrl+U. Or type *bold*, _italic_, __underline__ and ~strikethrough~.",
    },
    {
      question: "How do I know a message was sent?",
      answer:
        "Through the bell in the header: every sent message, right away or scheduled, creates a notification. With the site open, a notice also pops up on screen.",
    },
    {
      question: "How do I change the language?",
      answer:
        "Use the PT | EN switch in the header (or in the corner of the login screen). The whole system changes right away and your choice is saved.",
    },
  ],
};
