import type { Request, Response, NextFunction } from "express";

import { createRegisterUserUseCase } from "../../../application/use-cases/register-user.js";
import { createLoginUserUseCase } from "../../../application/use-cases/login-user.js";

import { createPrismaUserRepository } from "../../../infrastructure/persistence/prisma-user.repository.js";
import { createPrismaRefreshSessionRepository } from "../../../infrastructure/persistence/prisma-refresh-session.repository.js";
import { argon2PasswordHasher } from "../../../infrastructure/security/argon2-password-hasher.js";

import {
    createAccessToken,
    createRefreshToken,
    createRefreshTokenExpiry,
    hashRefreshToken,
} from "../../../infrastructure/security/auth-tokens.js";

import { loginSchema, registerSchema } from "./auth.schemas.js";
import { prisma } from "../../../../../config/prisma/prisma.js";

const users = createPrismaUserRepository(prisma);
const sessions = createPrismaRefreshSessionRepository(prisma);

const registerUser = createRegisterUserUseCase(
    users,
    argon2PasswordHasher,
);

const loginUser = createLoginUserUseCase(
    users,
    argon2PasswordHasher,
);

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/auth";

function refreshCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        path: REFRESH_COOKIE_PATH,
        maxAge: 7 * 24 * 60 * 60 * 1000,
    };
}

function clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: REFRESH_COOKIE_PATH,
    });
}

function invalidCredentials(res: Response) {
    return res.status(401).json({
        error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
        },
    });
}

function validationError(res: Response, details: unknown) {
    return res.status(400).json({
        error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details,
        },
    });
}

export async function registerController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
        return validationError(res, validation.error.flatten());
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

export async function loginController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
        return validationError(res, validation.error.flatten());
    }

    try {
        const result = await loginUser.execute(validation.data);

        if (!result.success) {
            return invalidCredentials(res);
        }

        const now = new Date();
        const refreshToken = createRefreshToken();

        await sessions.create({
            userId: result.user.id,
            tokenHash: hashRefreshToken(refreshToken),
            expiresAt: createRefreshTokenExpiry(now),
        });

        const accessToken = createAccessToken({
            id: result.user.id,
            email: result.user.email,
        });

        return res
            .cookie(
                REFRESH_COOKIE_NAME,
                refreshToken,
                refreshCookieOptions(),
            )
            .status(200)
            .json({
                data: {
                    user: result.user,
                    accessToken,
                },
            });
    } catch (error) {
        console.error("Login failed:", error);
        return next(error);
    }
}

export async function refreshController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const refreshToken: unknown = req.cookies?.[REFRESH_COOKIE_NAME];

    if (typeof refreshToken !== "string" || !refreshToken) {
        clearRefreshCookie(res);
        return invalidCredentials(res);
    }

    try {
        const now = new Date();
        const currentSession = await sessions.findByTokenHash(
            hashRefreshToken(refreshToken),
        );

        if (
            !currentSession ||
            currentSession.revokedAt !== null ||
            currentSession.expiresAt <= now
        ) {
            clearRefreshCookie(res);
            return invalidCredentials(res);
        }

        const nextRefreshToken = createRefreshToken();

        const rotated = await sessions.rotate({
            id: currentSession.id,
            userId: currentSession.userId,
            tokenHash: hashRefreshToken(nextRefreshToken),
            expiresAt: createRefreshTokenExpiry(now),
            now,
        });

        if (!rotated) {
            clearRefreshCookie(res);
            return invalidCredentials(res);
        }

        const accessToken = createAccessToken({
            id: currentSession.userId,
            email: currentSession.email,
        });

        return res
            .cookie(
                REFRESH_COOKIE_NAME,
                nextRefreshToken,
                refreshCookieOptions(),
            )
            .status(200)
            .json({
                data: {
                    accessToken,
                },
            });
    } catch (error) {
        return next(error);
    }
}

export async function logoutController(
    req: Request,
    res: Response,
    next: NextFunction,
) {
    const refreshToken: unknown = req.cookies?.[REFRESH_COOKIE_NAME];

    try {
        if (typeof refreshToken === "string" && refreshToken) {
            await sessions.revokeByTokenHash(
                hashRefreshToken(refreshToken),
                new Date(),
            );
        }

        clearRefreshCookie(res);

        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
}