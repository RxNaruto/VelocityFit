import type { Request, Response, NextFunction } from "express";
import * as usersService from "../services/userService.js";

export async function getByUsername(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const username = req.params.username;
        if (typeof username !== "string" || !username) {
            res.status(400).json({ error: "username is required" });
            return;
        }
        res.json(
            await usersService.getPublicProfile(username)
        );
    } catch (err) {
        next(err);
    }
}