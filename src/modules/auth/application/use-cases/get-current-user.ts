import type { UserRepository } from "../../../auth/application/ports/user.repository.js";

export interface CurrentUser {
    id: string;
    email: string;
    createdAt: Date;
}

export type GetCurrentUserResult =
    | {
        success: true;
        user: CurrentUser;
    }
    | {
        success: false;
        reason: "USER_NOT_FOUND";
    };

export function createGetCurrentUser(userRepository: UserRepository) {
    return async (userId: string): Promise<GetCurrentUserResult> => {
        const user = await userRepository.findById(userId);

        if (!user) {
            return {
                success: false,
                reason: "USER_NOT_FOUND",
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
    };
}