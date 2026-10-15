import { BrandMark } from "../../../components/ui/BrandMark";
import { useT } from "../../../i18n/I18nProvider";

export function AuthHero() {
  const t = useT();
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-[#211d49] p-12 text-white lg:flex xl:p-20">
      <div className="animate-float absolute -right-40 top-20 h-[600px] w-[600px] rounded-full bg-brand opacity-30 blur-[130px]" />
      <div className="relative">
        <BrandMark dotClassName="text-[#a99fff]" />
      </div>
      <div
        className="stagger-children relative max-w-lg"
        style={{ ["--base" as string]: "350ms", ["--step" as string]: "220ms" }}
      >
        <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-[#d8d4ff]">
          <span className="h-2 w-2 rounded-full bg-[#8dffcb]" />
          {t("auth.hero.badge")}
        </div>
        <h2 className="font-display text-5xl font-extrabold leading-tight tracking-tight xl:text-6xl">
          {t("auth.hero.title1")}
          <br />
          <span className="text-[#a99fff]">{t("auth.hero.title2")}</span>
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-[#c2bfdd]">
          {t("auth.hero.text")}
        </p>
      </div>
      <p className="relative text-sm text-[#a5a1c3]">
        {t("auth.hero.footer", { year: new Date().getFullYear() })}
      </p>
    </div>
  );
}
