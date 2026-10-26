export interface RefreshSession {
    id: string;
    userId: string;
    email: string;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
}

export interface CreateRefreshSessionInput {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
}

export interface RotateRefreshSessionInput {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    now: Date;
}

export interface RefreshSessionRepository {
    create(input: CreateRefreshSessionInput): Promise<void>;

    findByTokenHash(tokenHash: string): Promise<RefreshSession | null>;

    rotate(input: RotateRefreshSessionInput): Promise<boolean>;

    revokeByTokenHash(
        tokenHash: string,
        now: Date,
    ): Promise<void>;
}
