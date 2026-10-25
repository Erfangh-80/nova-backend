import type { PrismaClient } from "../../../../generated/prisma/client.js";
import { Prisma } from "../../../../generated/prisma/client.js";

import type {
    CreateUserData,
    CreateUserResult,
    UserRepository,
} from "../../application/ports/user.repository.js";

export function createPrismaUserRepository(
    prisma: PrismaClient,
): UserRepository {
    return {
        async existsByEmail(email) {
            const user = await prisma.user.findUnique({
                where: { email },
                select: { id: true },
            });

            return user !== null;
        },

        async create(data: CreateUserData): Promise<CreateUserResult> {
            try {
                const user = await prisma.user.create({
                    data: {
                        email: data.email,
                        password: data.passwordHash,
                    },
                    select: {
                        id: true,
                        email: true,
                        createdAt: true,
                    },
                });

                return { success: true, user };
            } catch (error) {
                if (
                    error instanceof Prisma.PrismaClientKnownRequestError &&
                    error.code === "P2002"
                ) {
                    return {
                        success: false,
                        reason: "EMAIL_ALREADY_EXISTS",
                    };
                }

                throw error;
            }
        },
    };
}