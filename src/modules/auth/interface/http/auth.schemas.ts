import { z } from "zod";

export const registerSchema = z.object({
    email: z
        .string()
        .trim()
        .email()
        .max(254)
        .transform((email) => email.toLowerCase()),

    password: z.string().min(8).max(128),
});