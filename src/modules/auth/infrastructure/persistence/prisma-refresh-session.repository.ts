import type { PrismaClient } from "../../../../generated/prisma/client.js";

import type {
    CreateRefreshSessionInput,
    RefreshSession,
    RefreshSessionRepository,
    RotateRefreshSessionInput,
} from "../../application/ports/refresh-session.repository.js";

export function createPrismaRefreshSessionRepository(
    prisma: PrismaClient,
): RefreshSessionRepository {
    return {
        async create(input: CreateRefreshSessionInput): Promise<void> {
            await prisma.refreshSession.create({
                data: input,
            });
        },

        async findByTokenHash(
            tokenHash: string,
        ): Promise<RefreshSession | null> {
            const session = await prisma.refreshSession.findUnique({
                where: { tokenHash },
                select: {
                    id: true,
                    userId: true,
                    tokenHash: true,
                    expiresAt: true,
                    revokedAt: true,
                    user: {
                        select: {
                            email: true,
                        },
                    },
                },
            });

            if (!session) {
                return null;
            }

            return {
                id: session.id,
                userId: session.userId,
                email: session.user.email,
                tokenHash: session.tokenHash,
                expiresAt: session.expiresAt,
                revokedAt: session.revokedAt,
            };
        },

        async rotate(
            input: RotateRefreshSessionInput,
        ): Promise<boolean> {
            return prisma.$transaction(async (tx) => {
                const revoked = await tx.refreshSession.updateMany({
                    where: {
                        id: input.id,
                        userId: input.userId,
                        revokedAt: null,
                        expiresAt: { gt: input.now },
                    },
                    data: {
                        revokedAt: input.now,
                    },
                });

                if (revoked.count !== 1) {
                    return false;
                }

                await tx.refreshSession.create({
                    data: {
                        userId: input.userId,
                        tokenHash: input.tokenHash,
                        expiresAt: input.expiresAt,
                    },
                });

                return true;
            });
        },

        async revokeByTokenHash(
            tokenHash: string,
            now: Date,
        ): Promise<void> {
            await prisma.refreshSession.updateMany({
                where: {
                    tokenHash,
                    revokedAt: null,
                },
                data: {
                    revokedAt: now,
                },
            });
        },
    };
}