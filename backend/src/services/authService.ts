import * as userRepo from '../models/userRepository.js';
import * as pointsService from './pointsService.js';
import { hashPassword, verifyPassword } from '../utils/crypto.js';
import HttpError from '../utils/HttpError.js';
import type { PublicUser } from '../types/domain.js';
import type { User } from '@prisma/client';

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/;

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

function validateRegister({ username, name, password }: RegisterPayload): void {
    if (!username || !USERNAME_RE.test(username)) {
        throw new HttpError(400, 'username must be 3-30 chars (letters, numbers, _ . -)');
    }
    if (!name || typeof name !== 'string' || name.trim().length < 1) {
        throw new HttpError(400, 'name is required');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
        throw new HttpError(400, 'password must be at least 6 characters');
    }
}

export async function register(payload: RegisterPayload): Promise<AuthResult> {
    validateRegister(payload);
    const { username, name, password, profilePhotoUrl } = payload;
    const existing = await userRepo.findByUsername(username);
    if (existing) {
        throw new HttpError(409, 'username is already taken');
    }
    const user = await userRepo.create({
        username: username as string,
        name: (name as string).trim(),
        passwordHash: hashPassword(password as string),
        profilePhotoUrl: profilePhotoUrl || '',
    });
    await pointsService.initUser(user.id);
    const session = await userRepo.createSession(user.id);
    return { user: userRepo.publicView(user) as PublicUser, token: session.token };
}

export async function login({ username, password }: LoginPayload): Promise<AuthResult> {
    if (!username || !password) {
        throw new HttpError(400, 'username and password are required');
    }
    const user = await userRepo.findByUsername(username);
    if (!user || !verifyPassword(password, user.passwordHash)) {
        throw new HttpError(401, 'Invalid username or password');
    }
    const session = await userRepo.createSession(user.id);
    return { user: userRepo.publicView(user) as PublicUser, token: session.token };
}

export async function logout(token: string | undefined | null): Promise<boolean> {
    if (!token) return false;
    return userRepo.deleteSession(token);
}

export async function getUserFromToken(token: string): Promise<User | null> {
    const session = await userRepo.findSession(token);
    if (!session) return null;
    return userRepo.findById(session.userId);
}

