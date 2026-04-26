import type { User } from '@prisma/client';

// Augment Express's Request so `req.user` and `req.token` are typed
// everywhere they're set by the auth middleware.
declare global {
    namespace Express {
        interface Request {
            user?: User;
            token?: string | null;
        }
    }
}

export { };