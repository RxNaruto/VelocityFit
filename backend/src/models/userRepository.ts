import prisma from '../data/prisma.js';
import type { Session, User } from '@prisma/client';
import { generateToken } from '../utils/crypto.js';
import type { PublicUser } from '../types/domain.js';

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export interface CreateUserInput {
    username: string;
    name: string;
    passwordHash: string;
    profilePhotoUrl?: string;
}

export function findByUsername(username: string | undefined | null): Promise<User | null> {
    if (!username) return Promise.resolve(null);
    return prisma.user.findFirst({
        where: { username: { equals: username, mode: 'insensitive' } },
    });
}

export function findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
}

export function findAll(): Promise<User[]> {
    return prisma.user.findMany();
}

export function create(input: CreateUserInput): Promise<User> {
    return prisma.user.create({
        data: {
            username: input.username,
            name: input.name,
            passwordHash: input.passwordHash,
            profilePhotoUrl: input.profilePhotoUrl ?? '',
        },
    });
}

export async function update(
    id: string,
    patch: Partial<Pick<User, 'name' | 'profilePhotoUrl' | 'points'>>
): Promise<User | null> {
    try {
        return await prisma.user.update({ where: { id }, data: patch });
    } catch {
        return null;
    }
}

export async function createSession(userId: string): Promise<Session> {
    return prisma.session.create({
        data: {
            token: generateToken(),
            userId,
            expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        },
    });
}

export async function findSession(token: string | undefined | null): Promise<Session | null> {
    if (!token) return null;
    const session = await prisma.session.findUnique({ where: { token } });
    if (!session) return null;
    if (session.expiresAt.getTime() < Date.now()) return null;
    return session;
}

export async function deleteSession(token: string): Promise<boolean> {
    try {
        await prisma.session.delete({ where: { token } });
        return true;
    } catch {
        return false;
    }
}

export function publicView(user: User | null | undefined): PublicUser | null {
    if (!user) return null;
    return {
        id: user.id,
        username: user.username,
        name: user.name,
        profilePhotoUrl: user.profilePhotoUrl,
        points: user.points,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(), // ✅ fixed: was user.updateAt
    };
}