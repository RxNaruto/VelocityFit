import { Router } from "express";
import * as ctrl from "../controllers/profileController.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.use(requireAuth);
router.get("/me", ctrl.getMe);
router.put("/me", ctrl.updateMe);
router.get("/me/stats", ctrl.getStats);
export default router;
//# sourceMappingURL=profileRoute.js.map