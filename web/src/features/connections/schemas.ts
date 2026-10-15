import { z } from "zod";

export const connectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome da conexão.")
    .max(100, "Use no máximo 100 caracteres."),
});

export type ConnectionFormValues = z.infer<typeof connectionSchema>;
