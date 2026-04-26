export default class HttpError extends Error {
    status: number;
    details?: unknown;
    constructor(status: number, message: string, details?: unknown);
}
//# sourceMappingURL=HttpError.d.ts.map