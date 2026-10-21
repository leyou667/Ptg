import { z } from "zod";

const text = (max: number) => z.string().trim().max(max);

/** Numéro belge ou international : au moins 9 chiffres. */
export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => /^[+\d\s().-]+$/.test(v) && v.replace(/\D/g, "").length >= 9 && v.replace(/\D/g, "").length <= 15);

export const quoteSchema = z.object({
  profile: z.enum(["particulier", "societe"]),
  type: text(60).min(1),
  surface: z.coerce.number().int().min(5).max(100000),
  frequency: text(60).min(1),
  city: text(80).min(1),
  note: text(600).optional().default(""),
  formula: z.enum(["essentiel", "confort", "pro", "premium"]),
  name: text(100).min(2),
  phone: phoneSchema,
  email: z.string().trim().max(160).pipe(z.email()),
  consent: z.literal(true),
  /** Champ piège : doit rester vide (anti-spam). */
  website: z.string().max(0).optional().default(""),
});

export type QuoteInput = z.infer<typeof quoteSchema>;

export const advisorSchema = z.object({
  profile: z.enum(["particulier", "societe"]).optional(),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: text(600).min(1) }))
    .min(1)
    .max(12),
});
