import type { Request, Response, NextFunction } from "express";
import * as workoutService from "../services/workoutService.js";

export async function list(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const from =
            typeof req.query.from === "string" ? req.query.from : undefined;
        const to =
            typeof req.query.to === "string" ? req.query.to : undefined;

        res.json(
            await workoutService.listWorkouts(
                req.user!.id,
                {
                    ...(from ? { from } : {}),
                    ...(to ? { to } : {}),
                }
            )
        );
    } catch (err) {
        next(err);
    }
}

export async function getByDate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const date = req.params.date;
        if (typeof date !== "string" || !date) {
            res.status(400).json({ error: "date is required" });
            return;
        }
        const workout = await workoutService.getWorkoutByDate(
            req.user!.id,
            date
        );

        if (!workout) {
            res.status(204).end();
            return;
        }

        res.json(workout);
    } catch (err) {
        next(err);
    }
}

export async function saveToday(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const workout = await workoutService.saveTodayWorkout(
            req.user!.id,
            req.body || {}
        );

        res.status(201).json(workout);
    } catch (err) {
        next(err);
    }
}

export async function update(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id;
        if (typeof id !== "string" || !id) {
            res.status(400).json({ error: "id is required" });
            return;
        }

        const workout = await workoutService.updateWorkout(
            req.user!.id,
            id,
            req.body || {}
        );

        res.json(workout);
    } catch (err) {
        next(err);
    }
}

export async function remove(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const id = req.params.id;
        if (typeof id !== "string" || !id) {
            res.status(400).json({ error: "id is required" });
            return;
        }

        await workoutService.deleteWorkout(req.user!.id, id);
        res.status(204).end();
    } catch (err) {
        next(err);
    }
}