import { z } from "zod";

// Mesmo padrão do validPhone em firestore.rules. Se mudar um, mudar o outro.
export const PHONE_PATTERN = /^\+?[0-9 ()-]{8,24}$/;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome do contato.")
    .max(100, "Use no máximo 100 caracteres."),
  phone: z
    .string()
    .trim()
    .regex(PHONE_PATTERN, "Digite um telefone válido, com 8 a 24 caracteres."),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
