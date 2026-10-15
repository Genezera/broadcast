const STORAGE_KEY = "broadcast:last-connection";

/** Lembra a última conexão aberta; falhas de armazenamento são irrelevantes. */
export const readLastConnectionId = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const saveLastConnectionId = (connectionId: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY, connectionId);
  } catch {
    // Armazenamento indisponível (modo privado, por exemplo).
  }
};
