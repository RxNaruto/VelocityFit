import type { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService.js"
import * as userRepo from "../models/userRepository.js"

export async function register(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const result = await authService.register(req.body || {});
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
}

export async function login(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const result = await authService.login(req.body || {});
        res.json(result);
    } catch (err) {
        next(err);
    }
}

export async function logout(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        await authService.logout(req.token ?? null);
        res.status(204).end();
    } catch (err) {
        next(err);
    }
}

export function me(req: Request, res: Response): void {
    res.json(userRepo.publicView(req.user ?? null));
}