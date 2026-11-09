import type { PrismaClient } from "../../../../generated/prisma/client.js";
import { Prisma } from "../../../../generated/prisma/client.js";

import type {
    CreateUserData,
    CreateUserResult,
    UserRepository,
    UpdateUserProfileData,
    UpdateUserProfileResult
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
        async updateProfile(id: string, data: UpdateUserProfileData): Promise<UpdateUserProfileResult> {
            try {
                const user = await prisma.user.update({
                    where: { id },
                    data: {
                        ...data,
                        email: data.email?.trim().toLowerCase(),
                    },
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        address: true,
                        nationalCode: true,
                        postalCode: true,
                        phone: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                });

                return { success: true, user };
            } catch (error) {
                if (
                    typeof error === "object" &&
                    error !== null &&
                    "code" in error
                ) {
                    if (error.code === "P2025") {
                        return {
                            success: false,
                            reason: "USER_NOT_FOUND",
                        };
                    }

                    if (error.code === "P2002") {
                        return {
                            success: false,
                            reason: "EMAIL_ALREADY_EXISTS",
                        };
                    }
                }

                throw error;
            }
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
        async findByEmail(email): Promise<User | null> {
            const user = await prisma.user.findUnique({
                where: { email },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    firstName: true,
                    lastName: true,
                    address: true,
                    nationalCode: true,
                    postalCode: true,
                    phone: true,
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
                firstName: user.firstName,
                lastName: user.lastName,
                address: user.address,
                nationalCode: user.nationalCode,
                postalCode: user.postalCode,
                phone: user.phone,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
        },

        async findById(id: string): Promise<User | null> {
            const user = await prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    email: true,
                    password: true,
                    firstName: true,
                    lastName: true,
                    address: true,
                    nationalCode: true,
                    postalCode: true,
                    phone: true,
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
                firstName: user.firstName,
                lastName: user.lastName,
                address: user.address,
                nationalCode: user.nationalCode,
                postalCode: user.postalCode,
                phone: user.phone,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            };
        },

    };
}
