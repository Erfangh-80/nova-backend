import { describe, expect, it, vi } from "vitest";
import { createLoginUserUseCase } from "../../../../src/modules/auth/application/use-cases/login-user.js";
import type { User } from "../../../../src/modules/auth/domain/entities/user.entity.js";
import type { UserRepository } from "../../../../src/modules/auth/application/ports/user.repository.js";
import type { PasswordHasher } from "../../../../src/modules/auth/application/ports/password-hasher.js";

const existingUser: User = {
    id: "user-123",
    email: "erfan@example.com",
    passwordHash: "$argon2id$hashed-password",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

function setup() {
    const users: UserRepository = {
        existsByEmail: vi.fn(),
        findByEmail: vi.fn(),
        create: vi.fn(),
    };

    const passwordHasher: PasswordHasher = {
        hash: vi.fn(),
        verify: vi.fn(),
    };

    const loginUser = createLoginUserUseCase(users, passwordHasher);

    return { users, passwordHasher, loginUser };
}

describe("LoginUserUseCase", () => {
    it("authenticates a user with valid credentials", async () => {
        const { users, passwordHasher, loginUser } = setup();

        vi.mocked(users.findByEmail).mockResolvedValue(existingUser);
        vi.mocked(passwordHasher.verify).mockResolvedValue(true);

        const result = await loginUser.execute({
            email: "erfan@example.com",
            password: "CorrectPassword123!",
        });

        expect(users.findByEmail).toHaveBeenCalledWith("erfan@example.com");
        expect(passwordHasher.verify).toHaveBeenCalledWith(
            existingUser.passwordHash,
            "CorrectPassword123!",
        );
        expect(result).toEqual({
            success: true,
            user: {
                id: existingUser.id,
                email: existingUser.email,
                createdAt: existingUser.createdAt,
            },
        });
    });

    it("rejects login when the user does not exist", async () => {
        const { users, passwordHasher, loginUser } = setup();

        vi.mocked(users.findByEmail).mockResolvedValue(null);

        const result = await loginUser.execute({
            email: "missing@example.com",
            password: "SomePassword123!",
        });

        expect(result).toEqual({
            success: false,
            reason: "INVALID_CREDENTIALS",
        });
        expect(passwordHasher.verify).not.toHaveBeenCalled();
    });

    it("rejects login when the password is incorrect", async () => {
        const { users, passwordHasher, loginUser } = setup();

        vi.mocked(users.findByEmail).mockResolvedValue(existingUser);
        vi.mocked(passwordHasher.verify).mockResolvedValue(false);

        const result = await loginUser.execute({
            email: existingUser.email,
            password: "WrongPassword123!",
        });

        expect(result).toEqual({
            success: false,
            reason: "INVALID_CREDENTIALS",
        });
    });
});