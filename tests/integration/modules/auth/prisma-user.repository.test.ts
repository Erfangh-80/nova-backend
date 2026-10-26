import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../../../src/generated/prisma/client.js";
import { createPrismaUserRepository } from "../../../../src/modules/auth/infrastructure/persistence/prisma-user.repository.js";

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

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
});

const repository = createPrismaUserRepository(prisma);
const testEmails: string[] = [];

function createTestEmail(): string {
    const email = `test-${randomUUID()}@example.com`;
    testEmails.push(email);
    return email;
}

describe("PrismaUserRepository", () => {
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

    it("creates a user and returns public fields only", async () => {
        const email = createTestEmail();
        const passwordHash = "$argon2id$test-hash";

        const result = await repository.create({
            email,
            passwordHash,
        });

        expect(result.success).toBe(true);

        if (!result.success) {
            throw new Error("Expected user creation to succeed");
        }

        expect(result.user).toMatchObject({ email });
        expect(result.user.id).toBeTruthy();
        expect(result.user.createdAt).toBeInstanceOf(Date);
        expect(result.user).not.toHaveProperty("password");
        expect(result.user).not.toHaveProperty("passwordHash");

        const storedUser = await prisma.user.findUnique({
            where: { email },
            select: { password: true },
        });

        expect(storedUser?.password).toBe(passwordHash);
    });

    it("returns false when the email does not exist", async () => {
        const email = createTestEmail();

        await expect(repository.existsByEmail(email)).resolves.toBe(false);
    });

    it("returns true when the email exists", async () => {
        const email = createTestEmail();

        const result = await repository.create({
            email,
            passwordHash: "$argon2id$test-hash",
        });

        expect(result.success).toBe(true);

        await expect(repository.existsByEmail(email)).resolves.toBe(true);
    });

    it("returns a failure result for duplicate emails", async () => {
        const email = createTestEmail();

        const data = {
            email,
            passwordHash: "$argon2id$test-hash",
        };

        const firstResult = await repository.create(data);
        expect(firstResult.success).toBe(true);

        const secondResult = await repository.create(data);

        expect(secondResult).toEqual({
            success: false,
            reason: "EMAIL_ALREADY_EXISTS",
        });
    });

    it("finds a user by email and returns the password hash", async () => {
        const email = createTestEmail();
        const passwordHash = "$argon2id$test-hash";

        const created = await repository.create({
            email,
            passwordHash,
        });

        expect(created.success).toBe(true);

        const user = await repository.findByEmail(email);

        expect(user).toMatchObject({
            email,
            passwordHash,
        });
    });

    it("returns null when the user is not found by email", async () => {
        const email = createTestEmail();

        const user = await repository.findByEmail(email);

        expect(user).toBeNull();
    });
});