import {
  AE,
  AO,
  AR,
  AU,
  BE,
  BO,
  BR,
  CA,
  CH,
  CL,
  CN,
  CO,
  CV,
  DE,
  EC,
  ES,
  FR,
  GB,
  IE,
  IN,
  IT,
  JP,
  MX,
  MZ,
  NL,
  PE,
  PT,
  PY,
  US,
  UY,
  VE,
  ZA,
  type FlagComponent,
} from "country-flag-icons/react/3x2";
import type { CountryCode } from "../../lib/phone";

// Bandeiras em SVG: emojis de bandeira não aparecem no Windows (viram "BR").
const FLAGS: Partial<Record<CountryCode, FlagComponent>> = {
  AE,
  AO,
  AR,
  AU,
  BE,
  BO,
  BR,
  CA,
  CH,
  CL,
  CN,
  CO,
  CV,
  DE,
  EC,
  ES,
  FR,
  GB,
  IE,
  IN,
  IT,
  JP,
  MX,
  MZ,
  NL,
  PE,
  PT,
  PY,
  US,
  UY,
  VE,
  ZA,
};

export function Flag({
  country,
  className = "",
}: {
  country: CountryCode;
  className?: string;
}) {
  const Icon = FLAGS[country];
  if (!Icon) return null;
  return (
    <Icon
      aria-hidden="true"
      className={`h-4 w-6 shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgba(0,0,0,0.12)] ${className}`}
    />
  );
}
