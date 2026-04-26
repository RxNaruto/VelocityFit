import { Router } from "express";
import * as ctrl from "../controllers/workoutController.js";
import { requireAuth } from "../middleware/auth.js";
const router = Router();
router.use(requireAuth);
router.get("/", ctrl.list);
router.get("/by-date/:date", ctrl.getByDate);
router.post("/today", ctrl.saveToday);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);
export default router;
//# sourceMappingURL=workoutRoutes.js.map