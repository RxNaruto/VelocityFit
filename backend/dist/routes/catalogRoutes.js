import { Router } from "express";
import * as ctrl from "../controllers/catalogController.js";
const router = Router();
router.get("/muscle-groups", ctrl.getMuscleGroups);
router.get("/exercises", ctrl.getExercises);
export default router;
//# sourceMappingURL=catalogRoutes.js.map