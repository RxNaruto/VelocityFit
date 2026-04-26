import { Router } from "express";
import * as ctrl from "../controllers/realtimeController.js";
import { requireAuthHeaderOrQuery } from "../middleware/authQuery.js";
const router = Router();
router.get("/stream", requireAuthHeaderOrQuery, ctrl.stream);
export default router;
//# sourceMappingURL=realTimeRoutes.js.map