import * as authService from "../services/authService.js";
import HttpError from "../utils/HttpError.js";
function extractToken(req) {
    const header = req.headers.authorization || "";
    if (header.startsWith("Bearer ")) {
        return header.slice("Bearer ".length).trim();
    }
    return null;
}
export const requireAuth = async (req, _res, next) => {
    const token = extractToken(req);
    const user = token
        ? await authService.getUserFromToken(token)
        : null;
    if (!user) {
        return next(new HttpError(401, "Authentication required"));
    }
    req.user = user;
    req.token = token;
    next();
};
export const attachUserIfPresent = async (req, _res, next) => {
    const token = extractToken(req);
    const user = token
        ? await authService.getUserFromToken(token)
        : null;
    if (user) {
        req.user = user;
        req.token = token;
    }
    next();
};
//# sourceMappingURL=auth.js.map