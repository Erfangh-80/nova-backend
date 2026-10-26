import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { authMiddleware } from "../../../../src/modules/auth/interface/http/auth.middleware";

const app = express();

app.get("/protected", authMiddleware, (_req, res) => {
    res.status(200).json({ message: "Authenticated" });
});

const secret = process.env.ACCESS_TOKEN_SECRET!;

function createToken(
    payload: Record<string, unknown> = {},
    options: jwt.SignOptions = {},
): string {
    return jwt.sign(
        {
            email: "test@example.com",
            ...payload,
        },
        secret,
        {
            subject: "user-123",
            issuer: "nova-api",
            audience: "nova-client",
            expiresIn: "15m",
            ...options,
        },
    );
}

describe("Auth Middleware", () => {
    it("rejects requests without an Authorization header", async () => {
        const response = await request(app).get("/protected");

        expect(response.status).toBe(401);
    });

    it("rejects malformed Authorization headers", async () => {
        const response = await request(app)
            .get("/protected")
            .set("Authorization", "Basic some-token");

        expect(response.status).toBe(401);
    });

    it("rejects invalid tokens", async () => {
        const response = await request(app)
            .get("/protected")
            .set("Authorization", "Bearer invalid-token");

        expect(response.status).toBe(401);
    });

    it("rejects tokens signed with another secret", async () => {
        const token = jwt.sign(
            { email: "test@example.com" },
            "a-different-secret-that-is-long-enough",
            {
                subject: "user-123",
                issuer: "nova-api",
                audience: "nova-client",
                expiresIn: "15m",
            },
        );

        const response = await request(app)
            .get("/protected")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(401);
    });

    it("rejects expired tokens", async () => {
        const token = createToken({}, { expiresIn: -1 });

        const response = await request(app)
            .get("/protected")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(401);
    });

    it("rejects tokens with an incorrect issuer", async () => {
        const token = createToken({}, { issuer: "another-api" });

        const response = await request(app)
            .get("/protected")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(401);
    });

    it("accepts valid access tokens", async () => {
        const token = createToken();

        const response = await request(app)
            .get("/protected")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Authenticated");
    });
});