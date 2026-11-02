import express from "express";
import cookieParser from "cookie-parser";
import type { Express } from "express";

import healthRouter from "./modules/health/health.routes.js";
import healthDbRoutes from "./modules/health/health-db.routes.js";
import authRoutes from "./modules/auth/interface/http/auth/auth.routes.js";
import { userRoutes } from "./modules/auth/interface/http/user/user.routes.js";

const app: Express = express();

app.use(express.json());
app.use(cookieParser());

/******** api routes ********/
app.use("/health", healthRouter);
app.use("/health/db", healthDbRoutes);
app.use("/auth", authRoutes);

// user
app.use("/users", userRoutes);

app.get("/", (_req, res) => {
    res.status(200).json({
        message: "Welcome to NOVA API",
    });
});

export default app;