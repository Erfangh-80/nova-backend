import type { PasswordHasher } from "../ports/password-hasher.js";
import type {
    PublicUser,
    UserRepository,
} from "../ports/user.repository.js";

import { emailAlreadyExistsError } from "../../domain/errors/auth.errors.js";

export interface RegisterUserInput {
    email: string;
    password: string;
}

export type RegisterUserResult =
    | { success: true; user: PublicUser }
    | {
        success: false;
        error: ReturnType<typeof emailAlreadyExistsError>;
    };

export function createRegisterUserUseCase(
    users: UserRepository,
    passwordHasher: PasswordHasher,
) {
    return {
        async execute(input: RegisterUserInput): Promise<RegisterUserResult> {
            const email = input.email.trim().toLowerCase();

            if (await users.existsByEmail(email)) {
                return {
                    success: false,
                    error: emailAlreadyExistsError(),
                };
            }

            const passwordHash = await passwordHasher.hash(input.password);

            const result = await users.create({
                email,
                passwordHash,
            });

            if (!result.success) {
                return {
                    success: false,
                    error: emailAlreadyExistsError(),
                };
            }

            return {
                success: true,
                user: result.user,
            };
        },
    };
}