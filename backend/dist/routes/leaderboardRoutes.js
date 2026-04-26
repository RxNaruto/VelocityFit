import { Router } from "express";
import * as ctrl from "../controllers/leaderboardController.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.use(requireAuth);
router.get("/", ctrl.getTop);
router.get("/me", ctrl.getMyRank);
export default router;
//# sourceMappingURL=leaderboardRoutes.js.map