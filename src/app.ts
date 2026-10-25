import express from "express";
import type { Express } from "express";
import healthRouter from "./modules/health/health.routes.js";
import healthDbRoutes from "./modules/health/health-db.routes.js";
import authRoutes from "./modules/auth/interface/http/auth.routes.js";
const app: Express = express();

app.use(express.json());

/******** api routes ********/
// health
app.use("/health", healthRouter);
app.use("/health/db", healthDbRoutes);

// auth
app.use("/auth", authRoutes);


app.get("/", (_req, res) => {
    res.status(200).json({
        message: "Welcome to NOVA API",
    });
});

export default app;