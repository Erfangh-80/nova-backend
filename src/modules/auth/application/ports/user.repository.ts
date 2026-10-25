import type { User } from "../../domain/entities/user.entity.js";

export interface CreateUserData {
    email: string;
    passwordHash: string;
}

export type PublicUser = Pick<User, "id" | "email" | "createdAt">;

export interface UserRepository {
    existsByEmail(email: string): Promise<boolean>;
    create(data: CreateUserData): Promise<PublicUser>;
}