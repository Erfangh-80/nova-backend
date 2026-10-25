import { describe, it, expect, vi } from "vitest";

import { createRegisterUserUseCase } from "../../../../src/modules/auth/application/use-cases/register-user.js";
import type {
    UserRepository,
    PublicUser,
} from "../../../../src/modules/auth/application/ports/user.repository.js";
import type { PasswordHasher } from "../../../../src/modules/auth/application/ports/password-hasher.js";

import { emailAlreadyExistsError } from "../../../../src/modules/auth/domain/errors/auth.errors.js";

describe("RegisterUser", () => {
    const user: PublicUser = {
        id: "user-1",
        email: "test@example.com",
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    function createDependencies() {
        const users: UserRepository = {
            existsByEmail: vi.fn().mockResolvedValue(false),
            create: vi.fn().mockResolvedValue({
                success: true,
                user,
            }),
        };

        const passwordHasher: PasswordHasher = {
            hash: vi.fn().mockResolvedValue("hashed-password"),
            verify: vi.fn(),
        };

        return { users, passwordHasher };
    }

    it("registers a user with normalized email and hashed password", async () => {
        const { users, passwordHasher } = createDependencies();

        const registerUser = createRegisterUserUseCase(users, passwordHasher);

        const result = await registerUser.execute({
            email: "  TEST@EXAMPLE.COM ",
            password: "StrongPass123",
        });

        expect(result).toEqual({
            success: true,
            user,
        });

        expect(users.existsByEmail).toHaveBeenCalledWith("test@example.com");

        expect(passwordHasher.hash).toHaveBeenCalledWith("StrongPass123");

        expect(users.create).toHaveBeenCalledWith({
            email: "test@example.com",
            passwordHash: "hashed-password",
        });
    });

    it("rejects an existing email", async () => {
        const { users, passwordHasher } = createDependencies();

        vi.mocked(users.existsByEmail).mockResolvedValue(true);

        const registerUser = createRegisterUserUseCase(users, passwordHasher);

        const result = await registerUser.execute({
            email: "test@example.com",
            password: "StrongPass123",
        });

        expect(result).toEqual({
            success: false,
            error: emailAlreadyExistsError(),
        });

        expect(passwordHasher.hash).not.toHaveBeenCalled();
        expect(users.create).not.toHaveBeenCalled();
    });
});