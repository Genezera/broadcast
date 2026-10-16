/** Região das Cloud Functions. Deve coincidir com `VITE_FUNCTIONS_REGION` no frontend. */
export const REGION = "southamerica-east1";

// maxInstances limita o custo caso alguém dispare as functions em massa.
export const callableOptions = { region: REGION, maxInstances: 10 } as const;

export const LIMITS = {
  messageBodyMaxLength: 2000,
  /** Destinatários por mensagem (e contatos por conexão no envio em massa). */
  maxRecipients: 500,
  /** Conexões escolhidas de uma vez no envio para várias conexões. */
  maxConnectionsPerSend: 20,
  /** Agendamentos são aceitos até este intervalo a partir de agora. */
  maxScheduleAheadMs: 365 * 24 * 60 * 60 * 1000,
  /** Lote das exclusões em cascata (o batch do Firestore aceita até 500 operações). */
  batchSize: 400,
  /** Mensagens vencidas processadas por página do agendador. */
  schedulerPageSize: 100,
  /** Teto de páginas por execução, para não monopolizar a instância. */
  schedulerMaxPages: 20,
  /** Tentativas de envio antes de a mensagem ser marcada como "failed". */
  schedulerMaxAttempts: 5,
} as const;
