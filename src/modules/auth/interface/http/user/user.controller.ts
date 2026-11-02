import type { Request, Response, NextFunction } from "express";

import type { createGetCurrentUser } from "../../../application/use-cases/get-current-user.js";

type GetCurrentUser = ReturnType<typeof createGetCurrentUser>;

export function createUserController(getCurrentUser: GetCurrentUser) {
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
    };
}