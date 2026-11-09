import type { User } from "../../domain/entities/user.entity.js";

export interface CreateUserData {
    email: string;
    passwordHash: string;
}

export interface UpdateUserProfileData {
    firstName?: string;
    lastName?: string;
    address?: string;
    nationalCode?: string;
    postalCode?: string;
    email?: string;
    phone?: string;
}

export type UpdateUserProfileResult =
    | {
        success: true;
        user: PublicUser & {
            firstName: string | null;
            lastName: string | null;
            address: string | null;
            nationalCode: string | null;
            postalCode: string | null;
            phone: string | null;
            updatedAt: Date;
        };
    }
    | {
        success: false;
        reason: "USER_NOT_FOUND" | "EMAIL_ALREADY_EXISTS";
    };

export type PublicUser = Pick<User, "id" | "email" | "createdAt">;

export type CreateUserResult =
    | { success: true; user: PublicUser }
    | { success: false; reason: "EMAIL_ALREADY_EXISTS" };

export interface UserRepository {
    existsByEmail(email: string): Promise<boolean>;
    create(data: CreateUserData): Promise<CreateUserResult>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    updateProfile(
        id: string,
        data: UpdateUserProfileData,
    ): Promise<UpdateUserProfileResult>;
}
