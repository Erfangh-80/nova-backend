import type { Request, Response, NextFunction } from "express";

import type { createGetCurrentUser } from "../../../application/use-cases/get-current-user.js";
import { createUpdateProfile } from "../../../application/use-cases/update-profile.js";
import { updateProfileSchema } from "./user.schemas.js";

type GetCurrentUser = ReturnType<typeof createGetCurrentUser>;
type UpdateProfile = ReturnType<typeof createUpdateProfile>;

export function createUserController(getCurrentUser: GetCurrentUser, updateProfile: UpdateProfile) {
    return {
        me: async (
            req: Request,
            res: Response,
            next: NextFunction,
        ): Promise<void> => {
            try {
                const userId = req.auth?.id;

                if (!userId) {
                    res.status(401).json({
                        error: { code: "UNAUTHORIZED" },
                    });
                    return;
                }

                const result = await getCurrentUser(userId);

                if (!result.success) {
                    res.status(404).json({
                        error: { code: result.reason },
                    });
                    return;
                }

                res.status(200).json({
                    data: result.user,
                });
            } catch (error) {
                next(error);
            }
        },
        updateProfile: async (req: Request, res: Response) => {
            const parsed = updateProfileSchema.safeParse(req.body);

            if (!parsed.success) {
                return res.status(400).json({
                    message: "Invalid profile data",
                    errors: parsed.error.flatten().fieldErrors,
                });
            }

            const result = await updateProfile(
                req.auth!.id,
                parsed.data,
            );

            if (!result.success) {
                if (result.reason === "USER_NOT_FOUND") {
                    return res.status(404).json({
                        message: "User not found",
                        code: "USER_NOT_FOUND",
                    });
                }

                return res.status(409).json({
                    message: "Email already exists",
                    code: "EMAIL_ALREADY_EXISTS",
                });
            }

            return res.status(200).json({
                user: result.user,
            });
        },
    };
}