import type { PrismaClient } from "../../../../generated/prisma/client.js";
import { Prisma } from "../../../../generated/prisma/client.js";

import type {
    CreateUserData,
    CreateUserResult,
    UserRepository,
} from "../../application/ports/user.repository.js";
import type { User } from "../../domain/entities/user.entity.js";

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
        async findByEmail(email) {
            const user = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (!user) {
                return null;
            }

            return {
                id: user.id,
                email: user.email,
                passwordHash: user.password,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
        },
        async findById(id: string): Promise<User | null> {
            const user = await prisma.user.findUnique({
                where: { id },
            });

            if (!user) {
                return null;
            }

            return {
                id: user.id,
                email: user.email,
                passwordHash: user.password,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
        }
    };
}
