import type { Section } from "../../components/layout/navigation";

/**
 * Conteúdo do assistente de ajuda. É um grafo de tópicos: cada tópico tem
 * uma resposta e os botões (`next`) que levam aos tópicos seguintes. Fica em
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

const nodes: HelpNode[] = [
  {
    id: ROOT_ID,
    label: "Menu principal",
    intro: "Sobre o que você quer ajuda?",
    next: [
      "start",
      "connections",
      "contacts",
      "send",
      "schedule",
      "manage",
      "account",
      "appearance",
      "troubleshoot",
    ],
  },
  {
    id: "start",
    label: "Primeiros passos",
    intro: "Em 4 passos você envia a sua primeira mensagem:",
    steps: [
      "Crie uma conexão (por exemplo, o nome da sua loja) em Conexões.",
      "Abra a conexão e cadastre seus contatos, com nome e telefone.",
      "Vá em Broadcast, clique em Nova mensagem, escolha os contatos e escreva o texto.",
      "Escolha Enviar agora ou Agendar e confirme. Acompanhe o status na lista.",
    ],
    action: { label: "Criar minha primeira conexão", to: "/connections" },
    next: ["connections", "contacts", "send", "schedule"],
  },
  {
    id: "connections",
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
    action: { label: "Ir para Conexões", to: "/connections" },
    next: ["contacts", "send"],
  },
  {
    id: "contacts",
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
    action: { label: "Ir para Contatos", to: "/contacts" },
    next: ["send", "t_phone"],
  },
  {
    id: "send",
    label: "Enviar uma mensagem",
    steps: [
      "Em Broadcast, escolha a conexão e clique em Nova mensagem.",
      "Marque os contatos (ou use Selecionar todos) e escreva a mensagem.",
      "Deixe Enviar agora marcado e confirme.",
    ],
    tips: [
      "O envio é uma simulação: nenhuma mensagem real é disparada.",
      "É preciso ter ao menos um contato cadastrado na conexão.",
    ],
    action: { label: "Ir para Broadcast", to: "/broadcasts" },
    next: ["schedule", "manage", "t_nocontacts"],
  },
  {
    id: "schedule",
    label: "Agendar uma mensagem",
    steps: [
      "Na nova mensagem, escolha Agendar.",
      "Informe uma data e um horário futuros.",
      "Confirme. A mensagem fica com o status Agendada.",
      "No horário, o servidor muda para Enviada sozinho, mesmo com o site fechado.",
    ],
    tips: [
      "O processamento roda a cada minuto, então pode levar até 1 minuto depois do horário.",
      "Enquanto estiver Agendada, você pode editar o texto, os contatos e o horário.",
    ],
    action: { label: "Ir para Broadcast", to: "/broadcasts" },
    next: ["manage", "t_scheduled"],
  },
  {
    id: "manage",
    label: "Editar ou excluir mensagens",
    steps: [
      "Na lista de Broadcast, use o lápis para editar ou a lixeira para excluir.",
      "Use os filtros Todas, Enviadas e Agendadas para localizar.",
    ],
    tips: [
      "Uma mensagem já enviada pode ter o texto corrigido, mas não é reenviada nem volta a ser agendada.",
      "Excluir uma mensagem agendada cancela o envio.",
    ],
    action: { label: "Ir para Broadcast", to: "/broadcasts" },
    next: ["schedule", "send"],
  },
  {
    id: "account",
    label: "Minha conta e senha",
    steps: [
      "Clique na sua foto, no canto superior direito, e escolha Perfil e senha.",
      "Altere o nome e a foto (JPG, PNG ou WebP, até 5 MB).",
      "Em Segurança, informe a senha atual e a nova senha duas vezes.",
    ],
    tips: ["Esqueceu a senha? Na tela de login, use Esqueci minha senha."],
    action: { label: "Abrir Minha conta", to: "/profile" },
    next: ["appearance", "t_password"],
  },
  {
    id: "appearance",
    label: "Tema escuro e celular",
    steps: [
      "Use o ícone de sol ou lua no cabeçalho para alternar entre claro e escuro. A escolha fica salva.",
      "No celular, a navegação fica na barra inferior. No tablet, no menu lateral de ícones.",
    ],
    next: ["start", "account"],
  },
  {
    id: "troubleshoot",
    label: "Algo deu errado",
    intro: "Veja os casos mais comuns:",
    next: ["t_scheduled", "t_nocontacts", "t_phone", "t_password"],
  },
  {
    id: "t_scheduled",
    label: "Minha mensagem não virou Enviada",
    steps: [
      "Aguarde até 1 minuto depois do horário. O servidor processa a cada minuto.",
      "Confira se o horário que você escolheu já passou.",
      "Se ela continuar Agendada por vários minutos, edite a mensagem e salve de novo.",
    ],
    next: ["schedule", "troubleshoot"],
  },
  {
    id: "t_nocontacts",
    label: "Não consigo criar a mensagem",
    steps: [
      "Cadastre ao menos um contato na conexão escolhida.",
      "Marque pelo menos um destinatário e escreva o texto.",
      "Para agendar, a data precisa estar no futuro.",
    ],
    action: { label: "Ir para Contatos", to: "/contacts" },
    next: ["send", "troubleshoot"],
  },
  {
    id: "t_phone",
    label: "O telefone aparece como inválido",
    steps: [
      "Confira o país na bandeira ao lado do campo.",
      "Digite o DDD e o número completos. O campo formata sozinho.",
      "Você também pode colar o número com +DDI, e o país muda automaticamente.",
    ],
    next: ["contacts", "troubleshoot"],
  },
  {
    id: "t_password",
    label: "Não lembro a minha senha",
    steps: [
      "Na tela de login, digite seu e-mail e clique em Esqueci minha senha.",
      "Confira também a caixa de spam.",
      "Já está logado? Use Minha conta, em Segurança.",
    ],
    next: ["account", "troubleshoot"],
  },
];

export const HELP_NODES: Record<string, HelpNode> = Object.fromEntries(
  nodes.map((node) => [node.id, node]),
);

export const getNode = (id: string): HelpNode | undefined => HELP_NODES[id];

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

export const FAQ: Faq[] = [
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
];
