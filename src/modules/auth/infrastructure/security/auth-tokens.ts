import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getAccessTokenSecret(): string {
    const secret = process.env.ACCESS_TOKEN_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error(
            "ACCESS_TOKEN_SECRET must be configured with at least 32 characters",
        );
    }

    return secret;
}

export function createAccessToken(user: {
    id: string;
    email: string;
}): string {
    return jwt.sign(
        {
            email: user.email,
            jti: randomUUID(),
        },
        getAccessTokenSecret(),
        {
            subject: user.id,
            expiresIn: ACCESS_TOKEN_TTL_SECONDS,
            issuer: "nova-api",
            audience: "nova-client",
        },
    );
}

export function createRefreshToken(): string {
    return randomBytes(32).toString("base64url");
}

export function hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

export function createRefreshTokenExpiry(now = new Date()): Date {
    return new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);
}