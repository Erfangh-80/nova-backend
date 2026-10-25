import { Router } from "express";
import { prisma } from "../../config/prisma/prisma.js";

const router = Router();

router.get("/", async (_req, res, next) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            status: "ok",
            database: "connected",
        });
    } catch (error) {
        next(error);
    }
});

export default router;