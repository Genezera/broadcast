import { useMemo } from "react";
import {
  SearchableChecklist,
  type ChecklistItem,
} from "../../../components/ui/SearchableChecklist";
import { useI18n } from "../../../i18n/I18nProvider";
import type { Connection } from "../../../types";

type ConnectionPickerProps = {
  connections: Connection[];
  value: string[];
  error?: string;
  onChange: (ids: string[]) => void;
};

/** Escolha de uma ou mais conexões (a mensagem vai para todos os contatos de cada uma). */
export function ConnectionPicker({
  connections,
  value,
  error,
  onChange,
}: ConnectionPickerProps) {
  const { t } = useI18n();
  const items = useMemo<ChecklistItem[]>(
    () =>
      connections.map((connection) => ({
        id: connection.id,
        label: connection.name,
      })),
    [connections],
  );

  return (
    <SearchableChecklist
      items={items}
      value={value}
      onChange={onChange}
      error={error}
      title={t("broadcasts.dialog.connections")}
      selectedLabel={t("broadcasts.dialog.connectionsSelected", {
        count: value.length,
      })}
      searchLabel={t("broadcasts.dialog.searchConnections")}
      emptyText={t("broadcasts.dialog.noConnections")}
    />
  );
}
