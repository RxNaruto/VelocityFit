import prisma from '../data/prisma.js';
export function findAll() {
    return prisma.muscleGroup.findMany({ orderBy: { name: 'asc' } });
}
export function findById(id) {
    return prisma.muscleGroup.findUnique({ where: { id } });
}
//# sourceMappingURL=muscleGroupRepository.js.map