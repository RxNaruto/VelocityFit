import * as muscleGroupRepo from "../models/muscleGroupRepository.js";
import * as exerciseRepo from "../models/exerciseRepository.js";
import HttpError from "../utils/HttpError.js";
import prisma from "../data/prisma.js";
export function listMuscleGroups() {
    return muscleGroupRepo.findAll();
}
export async function listExercises({ muscleGroupId, } = {}) {
    if (muscleGroupId) {
        const group = await muscleGroupRepo.findById(muscleGroupId);
        if (!group) {
            throw new HttpError(404, `Muscle group ${muscleGroupId} not found`);
        }
        return exerciseRepo.findByMuscleGroup(muscleGroupId);
    }
    return exerciseRepo.findAll();
}
//# sourceMappingURL=catalogService.js.map