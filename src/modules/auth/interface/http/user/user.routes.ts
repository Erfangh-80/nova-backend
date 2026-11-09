import { Router } from "express";

import { prisma } from "../../../../../config/prisma/prisma.js";
import { createPrismaUserRepository } from "../../../../auth/infrastructure/persistence/prisma-user.repository.js";
import { authMiddleware } from "../../../../auth/interface/http/auth/auth.middleware.js";

import { createGetCurrentUser } from "../../../application/use-cases/get-current-user.js";
import { createUserController } from "./user.controller.js";
import { createUpdateProfile } from "../../../application/use-cases/update-profile.js";

const router = Router();

const userRepository = createPrismaUserRepository(prisma);

const getCurrentUser = createGetCurrentUser(userRepository);

const updateProfile = createUpdateProfile(userRepository);

const userController = createUserController(getCurrentUser, updateProfile);

router.get("/me", authMiddleware, userController.me);
router.patch("/me", authMiddleware, userController.updateProfile);

export { router as userRoutes };