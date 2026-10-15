import { useEffect, useRef, useState, type Ref } from "react";
import {
  ButtonBase,
  InputAdornment,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  callingCode,
  COUNTRIES,
  countryName,
  digitsOf,
  formatNational,
  maxNationalDigits,
  splitPhone,
  toInternational,
  type CountryCode,
} from "../../lib/phone";
import { Flag } from "./Flag";

const PLACEHOLDERS: Partial<Record<CountryCode, string>> = {
  BR: "(11) 99999-9999",
  PT: "912 345 678",
  US: "(213) 373-4253",
};

type PhoneFieldProps = {
  /** Telefone no formato internacional ("+55 11 99999 1111") ou vazio. */
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  inputRef?: Ref<HTMLInputElement>;
  name?: string;
  label: string;
  error?: boolean;
  helperText?: string;
  autoFocus?: boolean;
};

/**
 * Campo de telefone com seletor de país (bandeira + DDI) e máscara aplicada
 * enquanto digita. O valor que sai daqui é sempre internacional, e o que o
 * usuário vê é só a parte nacional formatada.
 */
export function PhoneField({
  value,
  onChange,
  onBlur,
  inputRef,
  name,
  label,
  error,
  helperText,
  autoFocus,
}: PhoneFieldProps) {
  const [country, setCountry] = useState<CountryCode>(
    () => splitPhone(value).country,
  );
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  // Último valor que eu mesmo emiti: se `value` mudar por outro motivo
  // (reset do formulário ao abrir a edição), sincronizo o país.
  const lastEmitted = useRef(value);

  useEffect(() => {
    if (value !== lastEmitted.current) {
      lastEmitted.current = value;
      setCountry(splitPhone(value).country);
    }
  }, [value]);

  // Dígitos nacionais derivados do valor, usando o DDI do país selecionado.
  const digits = value
    ? digitsOf(value).slice(callingCode(country).length)
    : "";
  const display = formatNational(country, digits);

  const emit = (nextCountry: CountryCode, nextDigits: string) => {
    const trimmed = nextDigits.slice(0, maxNationalDigits(nextCountry));
    const next = toInternational(nextCountry, trimmed);
    lastEmitted.current = next;
    setCountry(nextCountry);
    onChange(next);
  };

  const handleInput = (text: string) => {
    // Número colado já com "+DDI": troca o país automaticamente.
    if (text.trim().startsWith("+")) {
      const pasted = splitPhone(text);
      emit(pasted.country, pasted.digits);
      return;
    }
    let nextDigits = digitsOf(text);
    // Apagar um caractere de formatação (parêntese, hífen) não muda os
    // dígitos e a máscara o recolocaria; nesse caso apago o último dígito.
    if (text.length < display.length && nextDigits === digits) {
      nextDigits = nextDigits.slice(0, -1);
    }
    emit(country, nextDigits);
  };

  return (
    <>
      <TextField
        fullWidth
        label={label}
        name={name}
        value={display}
        error={error}
        helperText={helperText}
        autoFocus={autoFocus}
        inputRef={inputRef}
        onBlur={onBlur}
        onChange={(event) => handleInput(event.target.value)}
        placeholder={PLACEHOLDERS[country] ?? "Número de telefone"}
        slotProps={{
          htmlInput: { inputMode: "tel", autoComplete: "tel-national" },
          input: {
            startAdornment: (
              <InputAdornment position="start" sx={{ mr: 0.5 }}>
                <ButtonBase
                  onClick={(event) => setMenuAnchor(event.currentTarget)}
                  aria-label={`País: ${countryName(country)}, +${callingCode(country)}. Alterar país`}
                  aria-haspopup="listbox"
                  sx={{
                    gap: 0.75,
                    px: 1,
                    py: 0.5,
                    borderRadius: 1.5,
                    fontSize: 14,
                    fontWeight: 700,
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Flag country={country} />
                  <span>+{callingCode(country)}</span>
                  <KeyboardArrowDownIcon sx={{ fontSize: 18, opacity: 0.6 }} />
                </ButtonBase>
              </InputAdornment>
            ),
          },
        }}
      />
      <Menu
        anchorEl={menuAnchor}
        open={!!menuAnchor}
        onClose={() => setMenuAnchor(null)}
        slotProps={{ paper: { sx: { maxHeight: 320, minWidth: 260 } } }}
      >
        {COUNTRIES.map((item) => (
          <MenuItem
            key={item}
            selected={item === country}
            onClick={() => {
              setMenuAnchor(null);
              emit(item, digits);
            }}
            sx={{ gap: 1.5 }}
          >
            <Flag country={item} />
            <ListItemText primary={countryName(item)} />
            <span className="text-sm text-muted">+{callingCode(item)}</span>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
