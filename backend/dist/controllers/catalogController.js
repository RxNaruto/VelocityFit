import * as catalogService from "../services/catalogService.js";
export async function getMuscleGroups(_req, res, next) {
    try {
        res.json(await catalogService.listMuscleGroups());
    }
    catch (err) {
        next(err);
    }
}
export async function getExercises(req, res, next) {
    try {
        const muscleGroupId = typeof req.query.muscleGroupId === "string"
            ? req.query.muscleGroupId
            : undefined;
        res.json(await catalogService.listExercises(muscleGroupId ? { muscleGroupId } : {}));
    }
    catch (err) {
        next(err);
    }
}
//# sourceMappingURL=catalogController.js.map