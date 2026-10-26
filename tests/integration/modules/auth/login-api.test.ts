import { afterAll, describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../../../src/app.js";
import { prisma } from "../../../../src/config/prisma/prisma.js";

function getSetCookies(headers: Record<string, string | string[] | undefined>): string[] {
    const cookies = headers["set-cookie"];

    if (!cookies) return [];
    return Array.isArray(cookies) ? cookies : [cookies];
}

function createTestEmail(): string {
    return `auth-${crypto.randomUUID()}@example.com`;
}

function extractRefreshCookie(response: {
    headers: Record<string, string | string[] | undefined>;
}): string {
    const refreshCookie = getSetCookies(response.headers).find((cookie) =>
        cookie.startsWith("refreshToken="),
    );

    expect(refreshCookie).toBeDefined();

    return refreshCookie!.split(";")[0]!;
}

async function registerAndLogin() {
    const email = createTestEmail();
    const password = "SecurePass123!";

    const registerResponse = await request(app)
        .post("/auth/register")
        .send({ email, password });

    expect(registerResponse.status).toBe(201);

    const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email, password });

    expect(loginResponse.status).toBe(200);

    return { email, password, loginResponse };
}

describe("POST /auth/login", () => {
    it("returns an access token, public user data, and an HttpOnly refresh cookie", async () => {
        const email = createTestEmail();
        const password = "SecurePass123!";

        const registerResponse = await request(app)
            .post("/auth/register")
            .send({ email, password });

        expect(registerResponse.status).toBe(201);

        const response = await request(app)
            .post("/auth/login")
            .send({ email, password });

        expect(response.status).toBe(200);

        expect(response.body.data.user).toMatchObject({
            id: registerResponse.body.data.id,
            email,
        });

        expect(response.body.data.user).not.toHaveProperty("password");
        expect(response.body.data.user).not.toHaveProperty("passwordHash");

        expect(response.body.data.accessToken).toEqual(expect.any(String));
        expect(response.body.data.accessToken.split(".")).toHaveLength(3);

        const setCookie = getSetCookies(response.headers);

        const refreshCookie = setCookie.find((cookie) =>
            cookie.startsWith("refreshToken="),
        );

        expect(refreshCookie).toBeDefined();
        expect(refreshCookie).toContain("HttpOnly");
        expect(refreshCookie).toContain("Path=/auth");
    });

    it("returns 401 for unknown users", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({
                email: createTestEmail(),
                password: "SecurePass123!",
            });

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("returns 401 for an incorrect password", async () => {
        const email = createTestEmail();

        await request(app)
            .post("/auth/register")
            .send({
                email,
                password: "SecurePass123!",
            });

        const response = await request(app)
            .post("/auth/login")
            .send({
                email,
                password: "WrongPassword123!",
            });

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("returns 400 for invalid input", async () => {
        const response = await request(app)
            .post("/auth/login")
            .send({
                email: "invalid-email",
                password: "",
            });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
});

describe("POST /auth/refresh", () => {
    it("rotates the refresh token and issues a new access token", async () => {
        const { loginResponse } = await registerAndLogin();

        const oldCookie = extractRefreshCookie(loginResponse);

        const response = await request(app)
            .post("/auth/refresh")
            .set("Cookie", oldCookie);

        expect(response.status).toBe(200);
        expect(response.body.data.accessToken).toEqual(expect.any(String));
        expect(response.body.data.accessToken).not.toBe(
            loginResponse.body.data.accessToken,
        );

        const newCookie = extractRefreshCookie(response);

        expect(newCookie).not.toBe(oldCookie);
    });

    it("rejects reuse of a rotated refresh token", async () => {
        const { loginResponse } = await registerAndLogin();

        const oldCookie = extractRefreshCookie(loginResponse);

        const refreshResponse = await request(app)
            .post("/auth/refresh")
            .set("Cookie", oldCookie);

        expect(refreshResponse.status).toBe(200);

        const reuseResponse = await request(app)
            .post("/auth/refresh")
            .set("Cookie", oldCookie);

        expect(reuseResponse.status).toBe(401);
    });

    it("rejects requests without a refresh cookie", async () => {
        const response = await request(app).post("/auth/refresh");

        expect(response.status).toBe(401);
    });
});

describe("POST /auth/logout", () => {
    it("revokes the current session and clears the refresh cookie", async () => {
        const { loginResponse } = await registerAndLogin();

        const refreshCookie = extractRefreshCookie(loginResponse);

        const logoutResponse = await request(app)
            .post("/auth/logout")
            .set("Cookie", refreshCookie);

        expect(logoutResponse.status).toBe(204);

        const clearedCookies = getSetCookies(logoutResponse.headers);

        const clearedRefreshCookie = clearedCookies.find((cookie) =>
            cookie.startsWith("refreshToken="),
        );

        expect(clearedRefreshCookie).toBeDefined();
        expect(clearedRefreshCookie).toContain("HttpOnly");

        const refreshResponse = await request(app)
            .post("/auth/refresh")
            .set("Cookie", refreshCookie);

        expect(refreshResponse.status).toBe(401);
    });

    it("handles logout without a refresh cookie", async () => {
        const response = await request(app).post("/auth/logout");

        expect(response.status).toBe(204);
    });
});

afterAll(async () => {
    await prisma.$disconnect();
});