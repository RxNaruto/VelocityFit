import * as realtime from "../services/realtimeService.js";
import * as leaderboardService from "../services/leaderboardService.js";
function writeEvent(res, event, data) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
}
export async function stream(req, res) {
    res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
    });
    res.flushHeaders();
    res.write("retry: 5000\n\n");
    const snapshot = await leaderboardService.getSnapshot();
    writeEvent(res, realtime.EVENTS.LEADERBOARD_UPDATED, snapshot);
    const unsubLeaderboard = realtime.subscribe(realtime.EVENTS.LEADERBOARD_UPDATED, (payload) => writeEvent(res, realtime.EVENTS.LEADERBOARD_UPDATED, payload));
    const unsubUser = realtime.subscribe(realtime.EVENTS.USER_UPDATED, (payload) => writeEvent(res, realtime.EVENTS.USER_UPDATED, payload));
    const heartbeat = setInterval(() => {
        res.write(":ping\n\n");
    }, 25000);
    req.on("close", () => {
        clearInterval(heartbeat);
        unsubLeaderboard();
        unsubUser();
        res.end();
    });
}
//# sourceMappingURL=realtimeController.js.map