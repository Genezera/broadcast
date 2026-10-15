/** Ordena por nome respeitando acentos e maiúsculas (o Firestore não faz isso). */
export const byName = <T extends { name: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
