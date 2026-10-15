import { BrandMark } from "../../../components/ui/BrandMark";

export function AuthHero() {
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
          Comunicação em um só lugar
        </div>
        <h2 className="font-display text-5xl font-extrabold leading-tight tracking-tight xl:text-6xl">
          Mensagens certas.
          <br />
          <span className="text-[#a99fff]">Pessoas certas.</span>
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-[#c2bfdd]">
          Organize conexões, gerencie contatos e programe suas comunicações com
          clareza e simplicidade.
        </p>
      </div>
      <p className="relative text-sm text-[#a5a1c3]">
        © {new Date().getFullYear()} Broadcast. Uma experiência simples para sua
        comunicação.
      </p>
    </div>
  );
}
