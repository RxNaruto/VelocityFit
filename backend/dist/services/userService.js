import * as userRepo from '../models/userRepository.js';
import * as workoutRepo from '../models/workoutRepository.js';
import * as leaderboardService from './leaderboardService.js';
import * as profileService from './profileService.js';
import HttpError from '../utils/HttpError.js';
/**
 * Builds the *publicly viewable* shape of a user. We intentionally include
 * the same workout statistics so anyone can compare progress, but we never
 * expose `passwordHash`, sessions, or workout-entry detail.
 */
export async function getPublicProfile(username) {
    const user = await userRepo.findByUsername(username);
    if (!user)
        throw new HttpError(404, `User @${username} not found`);
    const [stats, rank, allWorkouts] = await Promise.all([
        profileService.getStats(user.id),
        leaderboardService.getRank(user.id),
        workoutRepo.findAllForUser(user.id),
    ]);
    const recent = allWorkouts.slice(0, 10).map((w) => ({
        id: w.id,
        date: w.date,
        exerciseCount: w.entries.length,
        setCount: w.entries.reduce((s, e) => s + e.sets.length, 0),
    }));
    return {
        id: user.id,
        username: user.username,
        name: user.name,
        profilePhotoUrl: user.profilePhotoUrl || '',
        createdAt: user.createdAt.toISOString(),
        points: rank.points,
        rank: rank.rank,
        totalUsers: rank.totalUsers,
        stats,
        recentWorkouts: recent,
    };
}
//# sourceMappingURL=userService.js.map