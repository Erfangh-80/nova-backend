import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

interface AuthenticatedUser {
    id: string;
    email: string;
}

declare global {
    namespace Express {
        interface Request {
            auth?: AuthenticatedUser;
        }
    }
}

function getAccessTokenSecret(): string {
    const secret = process.env.ACCESS_TOKEN_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error(
            "ACCESS_TOKEN_SECRET must be configured with at least 32 characters",
        );
    }

    return secret;
}

export function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith("Bearer ")) {
        res.status(401).json({
            error: { code: "UNAUTHORIZED" },
        });
        return;
    }

    const token = authorization.slice("Bearer ".length).trim();

    if (!token) {
        res.status(401).json({
            error: { code: "UNAUTHORIZED" },
        });
        return;
    }

    try {
        const payload = jwt.verify(token, getAccessTokenSecret(), {
            algorithms: ["HS256"],
            issuer: "nova-api",
            audience: "nova-client",
        });

        if (
            typeof payload === "string" ||
            typeof (payload as JwtPayload).sub !== "string" ||
            typeof (payload as JwtPayload).email !== "string"
        ) {
            res.status(401).json({
                error: { code: "UNAUTHORIZED" },
            });
            return;
        }

        req.auth = {
            id: (payload as JwtPayload).sub!,
            email: (payload as JwtPayload).email as string,
        };

        next();
    } catch {
        res.status(401).json({
            error: { code: "UNAUTHORIZED" },
        });
    }
}