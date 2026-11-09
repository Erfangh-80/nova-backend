import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUpdateProfile } from "../../../../src/modules/auth/application/use-cases/update-profile.js";

describe("Update Profile", () => {
    const userRepository = {
        updateProfile: vi.fn(),
    };

    const updateProfile = createUpdateProfile(
        userRepository as unknown as Parameters<
            typeof createUpdateProfile
        >[0],
    );

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should update user profile", async () => {
        userRepository.updateProfile.mockResolvedValue({
            success: true,
            user: {
                id: "user-1",
                email: "test@example.com",
                firstName: "Erfan",
                lastName: "Gholami",
                address: null,
                nationalCode: null,
                postalCode: null,
                phone: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });

        const result = await updateProfile("user-1", {
            firstName: "Erfan",
            lastName: "Gholami",
        });

        expect(result.success).toBe(true);
        expect(userRepository.updateProfile).toHaveBeenCalledWith(
            "user-1",
            {
                firstName: "Erfan",
                lastName: "Gholami",
            },
        );
    });

    it("should return USER_NOT_FOUND", async () => {
        userRepository.updateProfile.mockResolvedValue({
            success: false,
            reason: "USER_NOT_FOUND",
        });

        const result = await updateProfile("missing-user", {
            firstName: "Erfan",
        });

        expect(result).toEqual({
            success: false,
            reason: "USER_NOT_FOUND",
        });
    });

    it("should return EMAIL_ALREADY_EXISTS", async () => {
        userRepository.updateProfile.mockResolvedValue({
            success: false,
            reason: "EMAIL_ALREADY_EXISTS",
        });

        const result = await updateProfile("user-1", {
            email: "existing@example.com",
        });

        expect(result).toEqual({
            success: false,
            reason: "EMAIL_ALREADY_EXISTS",
        });
    });
});