import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/en";
import "dayjs/locale/pt-br";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { enUS, ptBR } from "@mui/x-date-pickers/locales";
import { useI18n } from "../../../i18n/I18nProvider";

const LOCAL_FORMAT = "YYYY-MM-DDTHH:mm";

type ScheduleFieldProps = {
  /** Data e hora locais no formato de `datetime-local` ("2026-10-15T18:00"). */
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

const LOCALE_TEXT = {
  pt: ptBR.components.MuiLocalizationProvider.defaultProps.localeText,
  en: enUS.components.MuiLocalizationProvider.defaultProps.localeText,
};

/**
 * Calendário e relógio no estilo do app (herdam o tema claro/escuro). Fica em
 * arquivo próprio porque é carregado sob demanda: só pesa quando o usuário
 * escolhe agendar.
 */
export default function ScheduleField({
  value,
  onChange,
  error,
}: ScheduleFieldProps) {
  const { t, lang } = useI18n();
  const parsed = value ? dayjs(value) : null;

  return (
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      adapterLocale={lang === "pt" ? "pt-br" : "en"}
      localeText={LOCALE_TEXT[lang]}
    >
      <DateTimePicker
        label={t("broadcasts.dialog.dateLabel")}
        value={parsed && parsed.isValid() ? parsed : null}
        onChange={(next: Dayjs | null) =>
          onChange(next && next.isValid() ? next.format(LOCAL_FORMAT) : "")
        }
        minDateTime={dayjs()}
        ampm={lang === "en"}
        disablePast
        slotProps={{
          textField: {
            fullWidth: true,
            error: !!error,
            helperText: error,
          },
          actionBar: { actions: ["clear", "today", "accept"] },
        }}
      />
    </LocalizationProvider>
  );
}
