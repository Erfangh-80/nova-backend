import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../../../src/app.js";
import { prisma } from "../../../../src/config/prisma/prisma.js";

describe("PATCH /users/me", () => {
    let token: string;
    let userId: string;

    beforeEach(async () => {
        await prisma.refreshSession.deleteMany();
        await prisma.user.deleteMany();

        await request(app)
            .post("/auth/register")
            .send({
                email: "profile@example.com",
                password: "StrongPassword123!",
            });

        const login = await request(app)
            .post("/auth/login")
            .send({
                email: "profile@example.com",
                password: "StrongPassword123!",
            });
        expect(login.status).toBe(200);
        expect(login.body.data.accessToken).toBeTypeOf("string");

        token = login.body.data.accessToken;

        const user = await prisma.user.findUnique({
            where: { email: "profile@example.com" },
        });

        userId = user!.id;
    });

    it("should update profile", async () => {
        const response = await request(app)
            .patch("/users/me")
            .set("Authorization", `Bearer ${token}`)
            .send({
                firstName: "Erfan",
                lastName: "Gholami",
                phone: "09120000000",
                nationalCode: "0012345678",
                postalCode: "0123456789",
                address: "Hamedan",
            });

        expect(response.status).toBe(200);
        expect(response.body.user).toMatchObject({
            id: userId,
            email: "profile@example.com",
            firstName: "Erfan",
            lastName: "Gholami",
            phone: "09120000000",
            nationalCode: "0012345678",
            postalCode: "0123456789",
            address: "Hamedan",
        });

        expect(response.body.user.password).toBeUndefined();
        expect(response.body.user.passwordHash).toBeUndefined();
    });

    it("should update only provided fields", async () => {
        const response = await request(app)
            .patch("/users/me")
            .set("Authorization", `Bearer ${token}`)
            .send({ firstName: "Erfan" });

        expect(response.status).toBe(200);
        expect(response.body.user.firstName).toBe("Erfan");
        expect(response.body.user.lastName).toBeNull();
    });

    it("should reject invalid email", async () => {
        const response = await request(app)
            .patch("/users/me")
            .set("Authorization", `Bearer ${token}`)
            .send({ email: "invalid-email" });

        expect(response.status).toBe(400);
    });

    it("should reject empty update", async () => {
        const response = await request(app)
            .patch("/users/me")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(response.status).toBe(400);
    });

    it("should reject duplicate email", async () => {
        await prisma.user.create({
            data: {
                email: "other@example.com",
                password: "hashed-password",
            },
        });

        const response = await request(app)
            .patch("/users/me")
            .set("Authorization", `Bearer ${token}`)
            .send({ email: "other@example.com" });

        expect(response.status).toBe(409);
    });

    it("should reject unauthenticated requests", async () => {
        const response = await request(app)
            .patch("/users/me")
            .send({ firstName: "Erfan" });

        expect(response.status).toBe(401);
    });
});