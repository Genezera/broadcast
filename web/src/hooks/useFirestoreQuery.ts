import { useEffect, useState, type DependencyList } from "react";
import { onSnapshot, type Query } from "firebase/firestore";
import { getErrorMessage } from "../lib/errors";

export type QueryState<T> = {
  items: T[];
  loading: boolean;
  error: string;
};

/**
 * Assina uma consulta do Firestore em tempo real e devolve os documentos com
 * o ID injetado. A assinatura é refeita quando `deps` mudam e cancelada ao
 * desmontar o componente.
 */
export function useFirestoreQuery<T extends { id: string }>(
  buildQuery: () => Query,
  deps: DependencyList,
): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({
    items: [],
    loading: true,
    error: "",
  });

  useEffect(() => {
    // Mantenho os itens antigos enquanto recarrega, para a lista não piscar
    // quando troco o filtro ou peço mais resultados.
    setState((current) => ({ ...current, loading: true }));
    // onSnapshot devolve a função de cancelar: retornar ela no effect fecha
    // o listener ao desmontar ou quando as dependências mudam.
    return onSnapshot(
      buildQuery(),
      (snapshot) =>
        setState({
          items: snapshot.docs.map(
            (document) => ({ id: document.id, ...document.data() }) as T,
          ),
          loading: false,
          error: "",
        }),
      // Erro comum aqui: permission-denied (query sem filtro de tenantId) ou
      // índice composto ausente.
      (cause) =>
        setState({ items: [], loading: false, error: getErrorMessage(cause) }),
    );
  }, deps);

  return state;
}
