import { useMemo, useState, type ReactNode } from "react";
import { Checkbox, FormHelperText, IconButton, TextField } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import SearchIcon from "@mui/icons-material/Search";
import { useI18n } from "../../i18n/I18nProvider";

export type ChecklistItem = {
  id: string;
  label: string;
  /** Texto secundário à direita (telefone, por exemplo). */
  hint?: string;
  /** Algo extra antes do nome (uma bandeira, um ícone...). */
  adornment?: ReactNode;
};

type SearchableChecklistProps = {
  items: ChecklistItem[];
  value: string[];
  onChange: (ids: string[]) => void;
  title: string;
  /** Rótulo e placeholder da busca. */
  searchLabel: string;
  emptyText: string;
  /** Texto do contador ao lado do título, ex.: "(3 selecionados)". */
  selectedLabel: string;
  error?: string;
};

const normalize = (text: string) =>
  text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const digits = (text: string) => text.replace(/\D/g, "");

/** Casa por nome sem acento e, se a busca tiver números, também pelo telefone. */
const matches = (item: ChecklistItem, query: string): boolean => {
  const needle = normalize(query.trim());
  if (!needle) return true;
  if (normalize(`${item.label} ${item.hint ?? ""}`).includes(needle)) {
    return true;
  }
  const numbers = digits(needle);
  return numbers.length > 0 && digits(item.hint ?? "").includes(numbers);
};

/**
 * Lista de marcar vários itens, com busca e rolagem própria. A lista tem
 * altura máxima: mesmo com centenas de itens ela não estoura o diálogo, só
 * ganha barra de rolagem. "Selecionar todos" vale para o que está filtrado.
 */
export function SearchableChecklist({
  items,
  value,
  onChange,
  title,
  searchLabel,
  emptyText,
  selectedLabel,
  error,
}: SearchableChecklistProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () => items.filter((item) => matches(item, query)),
    [items, query],
  );
  const selected = useMemo(() => new Set(value), [value]);
  const allVisibleSelected =
    visible.length > 0 && visible.every((item) => selected.has(item.id));

  const toggle = (id: string) =>
    onChange(
      selected.has(id) ? value.filter((item) => item !== id) : [...value, id],
    );

  const toggleAll = () => {
    if (allVisibleSelected) {
      const hidden = new Set(visible.map((item) => item.id));
      onChange(value.filter((id) => !hidden.has(id)));
    } else {
      onChange([
        ...value,
        ...visible.map((item) => item.id).filter((id) => !selected.has(id)),
      ]);
    }
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3">
        <p className="text-sm font-bold">
          {title}{" "}
          <span className="font-normal text-muted">{selectedLabel}</span>
        </p>
        {visible.length > 1 && (
          <button
            type="button"
            className="cursor-pointer text-sm font-bold text-brand hover:underline"
            onClick={toggleAll}
          >
            {allVisibleSelected
              ? t("broadcasts.dialog.clearSelection")
              : t("broadcasts.dialog.selectAll")}
          </button>
        )}
      </div>

      {items.length > 0 && (
        <TextField
          size="small"
          fullWidth
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchLabel}
          sx={{ mb: 1 }}
          slotProps={{
            htmlInput: { "aria-label": searchLabel },
            input: {
              startAdornment: <SearchIcon fontSize="small" color="disabled" />,
              endAdornment: query && (
                <IconButton
                  size="small"
                  aria-label={t("common.clearSearch")}
                  onClick={() => setQuery("")}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              ),
            },
          }}
        />
      )}

      <div
        className={`max-h-56 overflow-y-auto overscroll-contain rounded-xl border ${error ? "border-red-400" : "border-line-strong"}`}
      >
        {items.length === 0 ? (
          <p className="p-4 text-sm text-muted">{emptyText}</p>
        ) : visible.length === 0 ? (
          <p className="p-4 text-sm text-muted">
            {t("broadcasts.dialog.noResults")}
          </p>
        ) : (
          visible.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-2 border-b border-line px-3 py-2 last:border-b-0 hover:bg-surface-hover"
            >
              <Checkbox
                size="small"
                checked={selected.has(item.id)}
                onChange={() => toggle(item.id)}
              />
              {item.adornment}
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                {item.label}
              </span>
              {item.hint && (
                <span className="shrink-0 text-xs text-muted">{item.hint}</span>
              )}
            </label>
          ))
        )}
      </div>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </div>
  );
}
