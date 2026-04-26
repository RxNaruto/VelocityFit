import type { Request, Response, NextFunction } from "express";
import * as catalogService from "../services/catalogService.js";

export async function getMuscleGroups(
    _req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        res.json(await catalogService.listMuscleGroups());
    } catch (err) {
        next(err);
    }
}

export async function getExercises(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const muscleGroupId =
            typeof req.query.muscleGroupId === "string"
                ? req.query.muscleGroupId
                : undefined;

        res.json(
            await catalogService.listExercises(
                muscleGroupId ? { muscleGroupId } : {}
            )
        );
    } catch (err) {
        next(err);
    }
}