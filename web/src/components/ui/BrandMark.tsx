import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";

type BrandMarkProps = {
  size?: "sm" | "md";
  /** Cor do ponto final do logotipo. */
  dotClassName?: string;
  showName?: boolean;
};

export function BrandMark({
  size = "md",
  dotClassName = "text-brand",
  showName = true,
}: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <span className={`brand-mark ${size === "sm" ? "brand-mark-sm" : ""}`}>
        <CampaignOutlinedIcon fontSize={size === "sm" ? "small" : "medium"} />
      </span>
      {showName && (
        <span className="font-display text-[21px] font-extrabold tracking-tight">
          broadcast<span className={dotClassName}>.</span>
        </span>
      )}
    </div>
  );
}
