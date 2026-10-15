import { z } from "zod";
import { isValidPhone } from "../../lib/phone";

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
    .regex(PHONE_PATTERN, "Digite um telefone válido, com 8 a 24 caracteres.")
    // Além do formato (igual ao das rules), confere se o número existe no país.
    .refine(isValidPhone, "Número inválido para o país selecionado."),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
