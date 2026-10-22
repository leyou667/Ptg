import { z } from "zod";

export const advisorSchema = z.object({
  profile: z.enum(["particulier", "societe"]).optional(),
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(600) }))
    .min(1)
    .max(12),
});
