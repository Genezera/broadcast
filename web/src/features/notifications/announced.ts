/**
 * IDs de mensagens que a própria tela já anunciou com um aviso (ao enviar na
 * hora). Assim a notificação em tempo real que chega logo depois não mostra
 * um segundo aviso igual; ela só entra no sino.
 */
const announcedIds = new Set<string>();

export const announce = (ids: string[]): void => {
  ids.forEach((id) => announcedIds.add(id));
};

/** Devolve `true` (e esquece o ID) se a mensagem já foi anunciada. */
export const wasAnnounced = (id: string): boolean => announcedIds.delete(id);
