import prisma from '../data/prisma.js';
export function findAll() {
    return prisma.exercise.findMany({ orderBy: { name: 'asc' } });
}
export function findByMuscleGroup(muscleGroupId) {
    return prisma.exercise.findMany({
        where: { muscleGroupId },
        orderBy: { name: 'asc' },
    });
}
export function findById(id) {
    return prisma.exercise.findUnique({ where: { id } });
}
//# sourceMappingURL=exerciseRepository.js.map