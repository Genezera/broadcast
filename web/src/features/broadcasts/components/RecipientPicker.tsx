import { useMemo } from "react";
import {
  SearchableChecklist,
  type ChecklistItem,
} from "../../../components/ui/SearchableChecklist";
import { useI18n } from "../../../i18n/I18nProvider";
import { displayPhone } from "../../../lib/phone";
import type { Recipient } from "../../../types";

type RecipientPickerProps = {
  choices: Recipient[];
  /** IDs de destinatários cujo contato foi removido; ficam sinalizados. */
  removedIds: ReadonlySet<string>;
  value: string[];
  error?: string;
  onChange: (ids: string[]) => void;
};

/** Escolha dos contatos de uma conexão, com busca por nome ou telefone. */
export function RecipientPicker({
  choices,
  removedIds,
  value,
  error,
  onChange,
}: RecipientPickerProps) {
  const { t } = useI18n();
  const items = useMemo<ChecklistItem[]>(
    () =>
      choices.map((choice) => ({
        id: choice.id,
        label: removedIds.has(choice.id)
          ? `${choice.name} ${t("broadcasts.dialog.removed")}`
          : choice.name,
        hint: displayPhone(choice.phone),
      })),
    [choices, removedIds, t],
  );

  return (
    <SearchableChecklist
      items={items}
      value={value}
      onChange={onChange}
      error={error}
      title={t("broadcasts.dialog.recipients")}
      selectedLabel={t("broadcasts.dialog.selected", { count: value.length })}
      searchLabel={t("broadcasts.dialog.searchContacts")}
      emptyText={t("broadcasts.dialog.noContacts")}
    />
  );
}
