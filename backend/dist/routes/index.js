import { Router } from "express";
import catalogRoutes from "./catalogRoutes.js";
import workoutRoutes from "./workoutRoutes.js";
import authRoutes from "./authRoutes.js";
import profileRoutes from "./profileRoute.js";
import leaderboardRoutes from "./leaderboardRoutes.js";
import usersRoutes from "./userRoutes.js";
import realtimeRoutes from "./realTimeRoutes.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.get("/health", (_req, res) => res.json({ status: "ok" }));
router.use("/auth", authRoutes);
// Catalog is read-only but still protected
router.use("/catalog", requireAuth, catalogRoutes);
router.use("/workouts", workoutRoutes);
router.use("/profile", profileRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/users", usersRoutes);
router.use("/realtime", realtimeRoutes);
export default router;
//# sourceMappingURL=index.js.map