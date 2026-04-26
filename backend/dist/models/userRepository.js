import prisma from '../data/prisma.js';
import { generateToken } from '../utils/crypto.js';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
export function findByUsername(username) {
    if (!username)
        return Promise.resolve(null);
    // Postgres collation makes case-insensitive matches via `mode: 'insensitive'`.
    return prisma.user.findFirst({
        where: { username: { equals: username, mode: 'insensitive' } },
    });
}
export function findById(id) {
    return prisma.user.findUnique({ where: { id } });
}
export function findAll() {
    return prisma.user.findMany();
}
export function create(input) {
    return prisma.user.create({
        data: {
            username: input.username,
            name: input.name,
            passwordHash: input.passwordHash,
            profilePhotoUrl: input.profilePhotoUrl ?? '',
        },
    });
}
export async function update(id, patch) {
    try {
        return await prisma.user.update({ where: { id }, data: patch });
    }
    catch {
        return null;
    }
}
export async function createSession(userId) {
    return prisma.session.create({
        data: {
            token: generateToken(),
            userId,
            expiresAt: new Date(Date.now() + SESSION_TTL_MS),
        },
    });
}
export async function findSession(token) {
    if (!token)
        return null;
    const session = await prisma.session.findUnique({ where: { token } });
    if (!session)
        return null;
    if (session.expiresAt.getTime() < Date.now())
        return null;
    return session;
}
export async function deleteSession(token) {
    try {
        await prisma.session.delete({ where: { token } });
        return true;
    }
    catch {
        return false;
    }
}
export function publicView(user) {
    if (!user)
        return null;
    return {
        id: user.id,
        username: user.username,
        name: user.name,
        profilePhotoUrl: user.profilePhotoUrl,
        points: user.points,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updateAt.toISOString(),
    };
}
//# sourceMappingURL=userRepository.js.map