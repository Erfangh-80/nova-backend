import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import app from "../../../../src/app.js";
import { prisma } from "../../../../src/config/prisma/prisma.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
}

const databaseName = new URL(connectionString).pathname.slice(1);

if (databaseName !== "nova_test_db") {
    throw new Error(
        `Integration tests must use nova_test_db, received: ${databaseName}`,
    );
}

const testEmails: string[] = [];

function createTestEmail(): string {
    const email = `api-${randomUUID()}@example.com`;
    testEmails.push(email);
    return email;
}

describe("POST /auth/register", () => {
    beforeAll(async () => {
        await prisma.$connect();
    });

    afterAll(async () => {
        try {
            if (testEmails.length > 0) {
                await prisma.user.deleteMany({
                    where: {
                        email: { in: testEmails },
                    },
                });
            }
        } finally {
            await prisma.$disconnect();
        }
    });

    it("registers a user and returns 201", async () => {
        const email = createTestEmail();

        const response = await request(app)
            .post("/auth/register")
            .send({
                email: `  ${email.toUpperCase()}  `,
                password: "SecurePass123!",
            });

        expect(response.status).toBe(201);
        expect(response.body.data).toMatchObject({
            email,
        });
        expect(response.body.data.id).toBeTruthy();
        expect(response.body.data.createdAt).toBeTruthy();
        expect(response.body.data).not.toHaveProperty("password");
        expect(response.body.data).not.toHaveProperty("passwordHash");

        const storedUser = await prisma.user.findUnique({
            where: { email },
            select: { password: true },
        });

        expect(storedUser).not.toBeNull();
        expect(storedUser!.password).not.toBe("SecurePass123!");
        expect(storedUser!.password).toMatch(/^\$argon2/);
    });

    it("returns 409 when the email already exists", async () => {
        const email = createTestEmail();

        const payload = {
            email,
            password: "SecurePass123!",
        };

        const firstResponse = await request(app)
            .post("/auth/register")
            .send(payload);

        expect(firstResponse.status).toBe(201);

        const secondResponse = await request(app)
            .post("/auth/register")
            .send(payload);

        expect(secondResponse.status).toBe(409);
        expect(secondResponse.body.error.code).toBe(
            "EMAIL_ALREADY_EXISTS",
        );
    });

    it("returns 400 when the input is invalid", async () => {
        const response = await request(app)
            .post("/auth/register")
            .send({
                email: "not-an-email",
                password: "123",
            });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });
});