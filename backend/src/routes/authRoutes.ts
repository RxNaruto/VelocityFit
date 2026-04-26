import { Router } from "express";
import * as ctrl from "../controllers/authContoller.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.post("/logout", requireAuth, ctrl.logout);
router.get("/me", requireAuth, ctrl.me);

export default router;