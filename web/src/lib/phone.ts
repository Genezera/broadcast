import {
  AsYouType,
  getCountryCallingCode,
  isValidPhoneNumber,
  type CountryCode,
} from "libphonenumber-js/min";

export type { CountryCode };

export const DEFAULT_COUNTRY: CountryCode = "BR";

// Países oferecidos no seletor. Lista curta de propósito: cobre o público do
// produto sem carregar as 240 bandeiras no bundle.
// prettier-ignore
export const COUNTRIES: CountryCode[] = [
  "BR", "PT", "US", "CA", "AR", "UY", "PY", "CL", "CO", "PE", "MX", "BO",
  "EC", "VE", "ES", "FR", "DE", "IT", "GB", "IE", "NL", "CH", "BE", "AO",
  "MZ", "CV", "JP", "CN", "IN", "AU", "ZA", "AE",
];

// E.164 limita o número a 15 dígitos (código do país + número nacional).
const MAX_DIGITS = 15;

export const callingCode = (country: CountryCode): string =>
  getCountryCallingCode(country);

export const digitsOf = (text: string): string => text.replace(/\D/g, "");

/** Nome do país em português (ex.: "Brasil"), pelo Intl do navegador. */
const regionNames = new Intl.DisplayNames(["pt-BR"], { type: "region" });
export const countryName = (country: CountryCode): string =>
  regionNames.of(country) ?? country;

/** Parte nacional formatada enquanto digita: "(11) 99999-1111". */
export const formatNational = (
  country: CountryCode,
  nationalDigits: string,
): string => new AsYouType(country).input(nationalDigits);

/**
 * Valor guardado no Firestore: formato internacional, "+55 11 99999 1111".
 * Só usa dígitos, espaços e "+", então continua passando na regra do banco.
 */
export const toInternational = (
  country: CountryCode,
  nationalDigits: string,
): string =>
  nationalDigits
    ? new AsYouType().input(`+${callingCode(country)}${nationalDigits}`)
    : "";

export const maxNationalDigits = (country: CountryCode): number =>
  MAX_DIGITS - callingCode(country).length;

/**
 * Separa um telefone guardado (ou colado) em país + dígitos nacionais.
 * Sem "+" considero número nacional do país padrão (dados antigos).
 */
export const splitPhone = (
  value: string,
): { country: CountryCode; digits: string } => {
  const digits = digitsOf(value);
  if (!digits) return { country: DEFAULT_COUNTRY, digits: "" };
  if (!value.trim().startsWith("+")) {
    return { country: DEFAULT_COUNTRY, digits };
  }

  const parser = new AsYouType();
  parser.input(`+${digits}`);
  const code = parser.getCallingCode();
  if (!code) return { country: DEFAULT_COUNTRY, digits: "" };

  // Vários países dividem o mesmo código (+1); sem área definida,
  // escolho o primeiro da lista que usa esse código.
  const detected = parser.getCountry();
  const country =
    detected && COUNTRIES.includes(detected)
      ? detected
      : (COUNTRIES.find((item) => callingCode(item) === code) ??
        DEFAULT_COUNTRY);
  return { country, digits: digits.slice(code.length) };
};

export const phoneCountry = (value: string): CountryCode =>
  splitPhone(value).country;

/** Telefone para exibição: DDI + parte nacional formatada. */
export const displayPhone = (value: string): string => {
  const { country, digits } = splitPhone(value);
  return `+${callingCode(country)} ${formatNational(country, digits)}`.trim();
};

export const isValidPhone = (value: string): boolean =>
  isValidPhoneNumber(value, DEFAULT_COUNTRY);
