import { z } from "zod";

export const updateProfileSchema =
    z.object({
        firstName: z.string().trim().min(1).max(100).optional(),
        lastName: z.string().trim().min(1).max(100).optional(),
        address: z.string().trim().max(500).optional(),
        nationalCode: z.string().regex(/^\d{10}$/).optional(),
        postalCode: z.string().regex(/^\d{10}$/).optional(),
        email: z.string().trim().email().max(255).optional(),
        phone: z.string().regex(/^09\d{9}$/).optional(),
    }).strict().refine(
        (data) => Object.keys(data).length > 0,
        { message: "At least one field is required" },
    );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;