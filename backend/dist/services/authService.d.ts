import type { PublicUser } from '../types/domain.js';
import type { User } from '@prisma/client';
interface RegisterPayload {
    username?: string;
    name?: string;
    password?: string;
    profilePhotoUrl?: string;
}
interface LoginPayload {
    username?: string;
    password?: string;
}
interface AuthResult {
    user: PublicUser;
    token: string;
}
export declare function register(payload: RegisterPayload): Promise<AuthResult>;
export declare function login({ username, password }: LoginPayload): Promise<AuthResult>;
export declare function logout(token: string | undefined | null): Promise<boolean>;
export declare function getUserFromToken(token: string): Promise<User | null>;
export {};
//# sourceMappingURL=authService.d.ts.map