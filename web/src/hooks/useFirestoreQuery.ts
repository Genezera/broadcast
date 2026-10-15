import { useEffect, useState, type DependencyList } from "react";
import { onSnapshot, type Query } from "firebase/firestore";
import { useI18n } from "../i18n/I18nProvider";
import { getErrorMessage } from "../lib/errors";

export type QueryState<T> = {
  items: T[];
  loading: boolean;
  error: string;
};

type RawState<T> = Omit<QueryState<T>, "error"> & { failure: unknown };

/**
 * Assina uma consulta do Firestore em tempo real e devolve os documentos com
 * o ID injetado. A assinatura é refeita quando `deps` mudam e cancelada ao
 * desmontar o componente.
 */
export function useFirestoreQuery<T extends { id: string }>(
  buildQuery: () => Query,
  deps: DependencyList,
): QueryState<T> {
  const { t } = useI18n();
  // Guardo o erro bruto e traduzo na leitura: se o idioma mudar com o erro na
  // tela, a mensagem acompanha.
  const [state, setState] = useState<RawState<T>>({
    items: [],
    loading: true,
    failure: null,
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
          failure: null,
        }),
      // Erro comum aqui: permission-denied (query sem filtro de tenantId) ou
      // índice composto ausente.
      (cause) =>
        setState({ items: [], loading: false, failure: cause ?? true }),
    );
  }, deps);

  return {
    items: state.items,
    loading: state.loading,
    error: state.failure ? getErrorMessage(state.failure, t) : "",
  };
}
