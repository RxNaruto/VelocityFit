import { Router } from "express";
import * as ctrl from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/:username", ctrl.getByUsername);

export default router;