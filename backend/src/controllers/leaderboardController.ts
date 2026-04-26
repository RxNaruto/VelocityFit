import type { Request, Response, NextFunction } from "express";
import * as leaderboardService from "../services/leaderboardService.js"

export async function getTop(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const limit = Math.min(
            parseInt(String(req.query.limit ?? "50"), 10) || 50,
            200
        );

        res.json({
            generatedAt: new Date().toISOString(),
            top: await leaderboardService.getTop(limit),
        });
    } catch (err) {
        next(err);
    }
}

export async function getMyRank(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        res.json(await leaderboardService.getRank(req.user!.id));
    } catch (err) {
        next(err);
    }
}