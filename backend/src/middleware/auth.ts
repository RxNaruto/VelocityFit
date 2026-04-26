import type { Request, RequestHandler } from "express";
import * as authService from "../services/authService.js";
import HttpError from "../utils/HttpError.js"

function extractToken(req: Request): string | null {
    const header = req.headers.authorization || "";

    if (header.startsWith("Bearer ")) {
        return header.slice("Bearer ".length).trim();
    }

    return null;
}

export const requireAuth: RequestHandler = async (
    req,
    _res,
    next
) => {
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

export const attachUserIfPresent: RequestHandler = async (
    req,
    _res,
    next
) => {
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