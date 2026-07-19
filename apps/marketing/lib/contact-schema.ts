import { z } from "zod";

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe seu nome")
    .max(80, "Nome muito longo"),
  email: z.string().trim().email("E-mail inválido"),
  workshop: z
    .string()
    .trim()
    .min(2, "Informe o nome da oficina")
    .max(120, "Nome muito longo"),
  message: z
    .string()
    .trim()
    .min(10, "Conte um pouco mais (mín. 10 caracteres)")
    .max(2000, "Mensagem muito longa"),
});

export type ContactInput = z.infer<typeof contactSchema>;
