import { Router } from "express";

import { prisma } from "../../../../../config/prisma/prisma.js";
import { createPrismaUserRepository } from "../../../../auth/infrastructure/persistence/prisma-user.repository.js";
import { authMiddleware } from "../../../../auth/interface/http/auth/auth.middleware.js";

import { createGetCurrentUser } from "../../../application/use-cases/get-current-user.js";
import { createUserController } from "./user.controller.js";

const router = Router();

const userRepository = createPrismaUserRepository(prisma);

const getCurrentUser = createGetCurrentUser(userRepository);

const userController = createUserController(getCurrentUser);

router.get("/me", authMiddleware, userController.me);

export { router as userRoutes };