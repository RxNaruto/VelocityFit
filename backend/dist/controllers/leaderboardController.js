import * as leaderboardService from "../services/leaderboardService.js";
export async function getTop(req, res, next) {
    try {
        const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 200);
        res.json({
            generatedAt: new Date().toISOString(),
            top: await leaderboardService.getTop(limit),
        });
    }
    catch (err) {
        next(err);
    }
}
export async function getMyRank(req, res, next) {
    try {
        res.json(await leaderboardService.getRank(req.user.id));
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=leaderboardController.js.map