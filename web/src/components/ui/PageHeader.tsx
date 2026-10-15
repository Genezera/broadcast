import type { ReactNode } from "react";
import { Typography } from "@mui/material";

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div>
        <Typography variant="h5" component="h1" sx={{ mb: 0.6 }}>
          {title}
        </Typography>
        <Typography color="text.secondary" fontSize={14}>
          {description}
        </Typography>
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
