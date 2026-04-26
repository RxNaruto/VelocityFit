import type { Session, User } from '@prisma/client';
import type { PublicUser } from '../types/domain.js';
export interface CreateUserInput {
    username: string;
    name: string;
    passwordHash: string;
    profilePhotoUrl?: string;
}
export declare function findByUsername(username: string | undefined | null): Promise<User | null>;
export declare function findById(id: string): Promise<User | null>;
export declare function findAll(): Promise<User[]>;
export declare function create(input: CreateUserInput): Promise<User>;
export declare function update(id: string, patch: Partial<Pick<User, 'name' | 'profilePhotoUrl' | 'points'>>): Promise<User | null>;
export declare function createSession(userId: string): Promise<Session>;
export declare function findSession(token: string | undefined | null): Promise<Session | null>;
export declare function deleteSession(token: string): Promise<boolean>;
export declare function publicView(user: User | null | undefined): PublicUser | null;
//# sourceMappingURL=userRepository.d.ts.map