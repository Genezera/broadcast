import { useEffect, useState, type DependencyList } from "react";
import { getCountFromServer, type Query } from "firebase/firestore";

const DEFAULT_REFRESH_MS = 30_000;

/**
 * Conta documentos no servidor, sem baixar nenhum deles.
 *
 * O Firestore não tem contagem em tempo real, então recarrego em dois casos:
 * quando `refreshKey` muda (uso a assinatura de uma lista já aberta na tela
 * como gatilho) e a cada 30s, para pegar mudanças feitas fora da tela, como o
 * agendador marcando uma mensagem como enviada.
 */
export function useCount(
  buildQuery: () => Query,
  deps: DependencyList,
  refreshKey?: string,
  refreshMs = DEFAULT_REFRESH_MS,
): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Evita atualizar o estado depois que o componente foi desmontado.
    let active = true;
    const load = () =>
      getCountFromServer(buildQuery())
        .then((snapshot) => active && setCount(snapshot.data().count))
        .catch(() => {
          // Contagem é só um indicador; em caso de erro mantenho o último valor.
        });

    load();
    const timer = setInterval(load, refreshMs);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [...deps, refreshKey, refreshMs]);

  return count;
}
