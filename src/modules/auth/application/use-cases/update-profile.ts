import type {
    UserRepository,
    UpdateUserProfileData,
} from "../ports/user.repository.js";

export function createUpdateProfile(
    userRepository: UserRepository,
) {
    return async (
        userId: string,
        data: UpdateUserProfileData,
    ) => {
        return userRepository.updateProfile(userId, data);
    };
}