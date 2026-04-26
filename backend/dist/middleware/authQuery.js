import * as authService from "../services/authService.js";
import HttpError from "../utils/HttpError.js";
/**
 * Auth that accepts either an `Authorization: Bearer ...` header
 * or a `?token=...` query parameter.
 * Browsers can't set custom headers on an EventSource,
 * so SSE endpoints rely on the query fallback.
 */
export const requireAuthHeaderOrQuery = async (req, _res, next) => {
    let token = null;
    const header = req.headers.authorization || "";
    if (header.startsWith("Bearer ")) {
        token = header.slice("Bearer ".length).trim();
    }
    if (!token && req.query && req.query.token) {
        token = String(req.query.token);
    }
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
//# sourceMappingURL=authQuery.js.map