import type { RequestHandler } from "express";
/**
 * Auth that accepts either an `Authorization: Bearer ...` header
 * or a `?token=...` query parameter.
 * Browsers can't set custom headers on an EventSource,
 * so SSE endpoints rely on the query fallback.
 */
export declare const requireAuthHeaderOrQuery: RequestHandler;
//# sourceMappingURL=authQuery.d.ts.map