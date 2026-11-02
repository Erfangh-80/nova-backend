import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import app from "../../../../src/app.js";
import { prisma } from "../../../../src/config/prisma/prisma.js";

describe("GET /users/me", () => {
    const email = "current-user@example.com";
    const password = "StrongPassword123";

    beforeEach(async () => {
        await prisma.user.deleteMany({
            where: { email },
        });
    });

    async function createAuthenticatedUser() {
        await request(app).post("/auth/register").send({
            email,
            password,
        });

        const loginResponse = await request(app).post("/auth/login").send({
            email,
            password,
        });

        return loginResponse.body.data.accessToken as string;
    }

    it("returns the current user", async () => {
        const accessToken = await createAuthenticatedUser();

        const response = await request(app)
            .get("/users/me")
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(200);

        expect(response.body.data).toMatchObject({
            email: "current-user@example.com",
        });

        expect(response.body.data.password).toBeUndefined();
    });

    it("returns 401 when access token is missing", async () => {
        const response = await request(app).get("/users/me");

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 401 when access token is invalid", async () => {
        const response = await request(app)
            .get("/users/me")
            .set("Authorization", "Bearer invalid-token");

        expect(response.status).toBe(401);
        expect(response.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 404 when the authenticated user no longer exists", async () => {
        const accessToken = await createAuthenticatedUser();

        await prisma.user.delete({
            where: { email },
        });

        const response = await request(app)
            .get("/users/me")
            .set("Authorization", `Bearer ${accessToken}`);

        expect(response.status).toBe(404);
        expect(response.body.error.code).toBe("USER_NOT_FOUND");
    });
});