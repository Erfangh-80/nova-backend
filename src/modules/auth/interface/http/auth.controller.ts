import type { Request, Response, NextFunction } from "express";

import { createRegisterUserUseCase } from "../../application/use-cases/register-user.js";
import { createPrismaUserRepository } from "../../infrastructure/persistence/prisma-user.repository.js";
import { argon2PasswordHasher } from "../../infrastructure/security/argon2-password-hasher.js";
import { registerSchema } from "./auth.schemas.js";
import { prisma } from "../../../../config/prisma/prisma.js";

const registerUser = createRegisterUserUseCase(
    createPrismaUserRepository(prisma),
    argon2PasswordHasher,
);

export async function registerController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
        return res.status(400).json({
            error: {
                code: "VALIDATION_ERROR",
                message: "Invalid input",
                details: validation.error.flatten(),
            },
        });
    }

    try {
        const result = await registerUser.execute(validation.data);

        if (!result.success) {
            return res.status(409).json({
                error: result.error,
            });
        }

        return res.status(201).json({
            data: result.user,
        });
    } catch (error) {
        return next(error);
    }
}