import type {
    ErrorRequestHandler,
    RequestHandler,
} from "express";
import HttpError from "../utils/HttpError.js";

export const notFound: RequestHandler = (req, _res, next) => {
    next(
        new HttpError(
            404,
            `Route ${req.method} ${req.originalUrl} not found`
        )
    );
};

export const errorHandler: ErrorRequestHandler = (
    err,
    _req,
    res,
    _next
) => {
    const status =
        err instanceof HttpError ? err.status : 500;

    const payload: {
        error: { message: string; details?: unknown };
    } = {
        error: {
            message:
                (err && err.message) || "Internal Server Error",
        },
    };

    if (err && err.details) {
        payload.error.details = err.details;
    }

    if (status >= 500) {
        console.error("[error]", err);
    }

    res.status(status).json(payload);
};