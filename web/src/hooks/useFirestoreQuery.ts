import { useEffect, useState, type DependencyList } from "react";
import { onSnapshot, type Query } from "firebase/firestore";
import { useI18n } from "../i18n/I18nProvider";
import { getErrorMessage } from "../lib/errors";

export type QueryState<T> = {
  items: T[];
  loading: boolean;
  error: string;
};

type RawState<T> = Omit<QueryState<T>, "error"> & {
  failure: unknown;
  /** De qual "escopo" são os itens (ver o parâmetro `scope` abaixo). */
  scope: string;
};

/**
 * Assina uma consulta do Firestore em tempo real e devolve os documentos com
 * o ID injetado. A assinatura é refeita quando `deps` mudam e cancelada ao
 * desmontar o componente.
 *
 * `scope` identifica "de quem" são os itens (a conexão aberta, por exemplo).
 * Enquanto `deps` mudam dentro do mesmo escopo (carregar mais, por exemplo),
 * os itens atuais continuam na tela e a lista não pisca. Quando o escopo
 * muda, os itens e o erro do escopo anterior somem na hora, em vez de
 * aparecerem por um instante misturados com os do novo.
 */
export function useFirestoreQuery<T extends { id: string }>(
  buildQuery: () => Query,
  deps: DependencyList,
  scope = "",
): QueryState<T> {
  const { t } = useI18n();
  // Guardo o erro bruto e traduzo na leitura: se o idioma mudar com o erro na
  // tela, a mensagem acompanha.
  const [state, setState] = useState<RawState<T>>({
    items: [],
    loading: true,
    failure: null,
    scope,
  });

  useEffect(() => {
    setState((current) =>
      current.scope === scope
        ? { ...current, loading: true }
        : { items: [], loading: true, failure: null, scope },
    );
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
          scope,
        }),
      // Erro comum aqui: permission-denied (query sem filtro de tenantId) ou
      // índice composto ausente.
      (cause) =>
        setState({
          items: [],
          loading: false,
          failure: cause ?? true,
          scope,
        }),
    );
  }, [scope, ...deps]);

  // No primeiro render depois de trocar o escopo, o estado ainda é do escopo
  // anterior (o efeito só roda depois): trato como "carregando", sem itens.
  const stale = state.scope !== scope;
  return {
    items: stale ? [] : state.items,
    loading: stale || state.loading,
    error: !stale && state.failure ? getErrorMessage(state.failure, t) : "",
  };
}
