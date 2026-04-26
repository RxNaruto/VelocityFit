import type { Request, Response, NextFunction } from "express";
import * as profileService from "../services/profileService.js";
import * as userRepo from "../models/userRepository.js";

export function getMe(req: Request, res: Response): void {
    res.json(userRepo.publicView(req.user ?? null));
}

export async function getStats(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const period =
            typeof req.query.period === "string"
                ? req.query.period
                : "all";

        res.json(
            await profileService.getStats(req.user!.id, { period })
        );
    } catch (err) {
        next(err);
    }
}

export async function updateMe(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const updated = await profileService.updateProfile(
            req.user!.id,
            req.body || {}
        );

        res.json(updated);
    } catch (err) {
        next(err);
    }
}