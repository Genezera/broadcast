import { Checkbox, FormHelperText } from "@mui/material";
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

export function RecipientPicker({
  choices,
  removedIds,
  value,
  error,
  onChange,
}: RecipientPickerProps) {
  const { t } = useI18n();
  const allSelected = choices.length > 0 && value.length === choices.length;

  const toggle = (id: string) =>
    onChange(
      value.includes(id) ? value.filter((item) => item !== id) : [...value, id],
    );
  const toggleAll = () =>
    onChange(allSelected ? [] : choices.map((choice) => choice.id));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold">
          {t("broadcasts.dialog.recipients")}{" "}
          <span className="font-normal text-muted">
            {t("broadcasts.dialog.selected", { count: value.length })}
          </span>
        </p>
        {choices.length > 1 && (
          <button
            type="button"
            className="cursor-pointer text-sm font-bold text-brand hover:underline"
            onClick={toggleAll}
          >
            {allSelected
              ? t("broadcasts.dialog.clearSelection")
              : t("broadcasts.dialog.selectAll")}
          </button>
        )}
      </div>
      <div
        className={`max-h-44 overflow-y-auto rounded-xl border ${error ? "border-red-400" : "border-line-strong"}`}
      >
        {choices.length === 0 ? (
          <p className="p-4 text-sm text-muted">
            {t("broadcasts.dialog.noContacts")}
          </p>
        ) : (
          choices.map((choice) => (
            <label
              key={choice.id}
              className="flex cursor-pointer items-center gap-2 border-b border-line px-3 py-2 last:border-b-0 hover:bg-surface-hover"
            >
              <Checkbox
                size="small"
                checked={value.includes(choice.id)}
                onChange={() => toggle(choice.id)}
              />
              <span className="flex-1 text-sm font-semibold">
                {choice.name}
                {removedIds.has(choice.id) &&
                  ` ${t("broadcasts.dialog.removed")}`}
              </span>
              <span className="text-xs text-muted">
                {displayPhone(choice.phone)}
              </span>
            </label>
          ))
        )}
      </div>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </div>
  );
}
