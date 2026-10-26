import type { UserRepository } from "../ports/user.repository.js";
import type { PasswordHasher } from "../ports/password-hasher.js";
import type { PublicUser } from "../ports/user.repository.js";

interface LoginUserInput {
    email: string;
    password: string;
}

type LoginUserResult =
    | {
        success: true;
        user: PublicUser;
    }
    | {
        success: false;
        reason: "INVALID_CREDENTIALS";
    };

export function createLoginUserUseCase(
    users: UserRepository,
    passwordHasher: PasswordHasher,
) {
    return {
        async execute(input: LoginUserInput): Promise<LoginUserResult> {
            const user = await users.findByEmail(input.email);

            if (!user) {
                return {
                    success: false,
                    reason: "INVALID_CREDENTIALS",
                };
            }

            const isPasswordValid = await passwordHasher.verify(
                user.passwordHash,
                input.password,
            );

            if (!isPasswordValid) {
                return {
                    success: false,
                    reason: "INVALID_CREDENTIALS",
                };
            }

            return {
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    createdAt: user.createdAt,
                },
            };
        },
    };
}   