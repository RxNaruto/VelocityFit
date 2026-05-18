import type { Request, Response, NextFunction } from 'express';
import * as catalogService from '../services/catalogService.js';

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
            typeof req.query.muscleGroupId === 'string'
                ? req.query.muscleGroupId
                : undefined;

        // Fix 1: exactOptionalPropertyTypes — only include the key when it has a value
        res.json(
            await catalogService.listExercises(
                muscleGroupId !== undefined ? { muscleGroupId } : {}
            )
        );
    } catch (err) {
        next(err);
    }
}

// ─── Admin/portal writes ─────────────────────────────────────────────

export async function createMuscleGroup(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const group = await catalogService.createMuscleGroup(req.body || {});
        res.status(201).json(group);
    } catch (err) {
        next(err);
    }
}

export async function createExercise(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const exercise = await catalogService.createExercise(req.body || {});
        res.status(201).json(exercise);
    } catch (err) {
        next(err);
    }
}

export async function updateExercise(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Fix 2: req.params values are always strings in Express, but the
        // strict index signature types them as string | string[] | undefined.
        // Guard and fall through to the error handler if somehow absent.
        const id = typeof req.params.id === 'string' ? req.params.id : undefined;
        if (!id) { res.status(400).json({ error: 'Missing exercise id' }); return; }

        const exercise = await catalogService.updateExercise(id, req.body || {});
        res.json(exercise);
    } catch (err) {
        next(err);
    }
}

export async function deleteExercise(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Fix 3: same guard as updateExercise
        const id = typeof req.params.id === 'string' ? req.params.id : undefined;
        if (!id) { res.status(400).json({ error: 'Missing exercise id' }); return; }

        await catalogService.deleteExercise(id);
        res.status(204).end();
    } catch (err) {
        next(err);
    }
}