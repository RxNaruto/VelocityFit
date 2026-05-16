import * as userRepo from '../models/userRepository.js';
import * as workoutRepo from '../models/workoutRepository.js';
import * as leaderboardService from './leaderboardService.js';
import type { WorkoutDTO } from '../types/domain.js';

/**
 * Points formula (deterministic, easy to audit):
 *
 *   per workout day:
 *     base          = 25
 *     exercises     = 5  * # of exercise entries
 *     sets          = 2  * total # of sets across entries
 *     failure sets  = 3  * # of sets marked as taken to failure
 *     streak bonus  = min(streakDays * 5, 100)
 */
export const POINTS = {
  PER_WORKOUT: 25,
  PER_EXERCISE: 5,
  PER_SET: 2,
  PER_FAILURE_SET: 3,
  STREAK_PER_DAY: 5,
  STREAK_BONUS_CAP: 100,
} as const;

function isNextDay(prevKey: string | null, key: string): boolean {
  if (!prevKey || !key) return false;
  const parts = prevKey.split('-');
  if (parts.length !== 3) return false;
  const [py, pm, pd] = parts.map(Number) as [number, number, number];
  const next = new Date(py, pm - 1, pd);
  next.setDate(next.getDate() + 1);
  const nKey = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(
    next.getDate()
  ).padStart(2, '0')}`;
  return nKey === key;
}

function streakBonus(streakDays: number): number {
  return Math.min(streakDays * POINTS.STREAK_PER_DAY, POINTS.STREAK_BONUS_CAP);
}

export function pointsForWorkout(workout: WorkoutDTO | null | undefined, streakDays = 1): number {
  if (!workout || !Array.isArray(workout.entries)) return 0;
  const exerciseCount = workout.entries.length;
  if (exerciseCount === 0) return 0;

  let setCount = 0;
  let failureSetCount = 0;

  workout.entries.forEach((e) => {
    if (!Array.isArray(e.sets)) return;
    setCount += e.sets.length;
    failureSetCount += e.sets.filter((s) => s && s.isFailure).length;
  });

  return (
    POINTS.PER_WORKOUT +
    POINTS.PER_EXERCISE * exerciseCount +
    POINTS.PER_SET * setCount +
    POINTS.PER_FAILURE_SET * failureSetCount +
    streakBonus(Math.max(1, streakDays))
  );
}

/**
 * Walks the user's workouts in chronological order so we can compute the
 * streak length at each workout date and credit the streak bonus accordingly.
 */
export async function totalPointsForUser(userId: string): Promise<number> {
  const workouts = await workoutRepo.findAllForUser(userId);
  if (workouts.length === 0) return 0;

  const sorted = [...workouts].sort((a, b) => (a.date < b.date ? -1 : 1));

  let total = 0;
  let streak = 0;
  let prevDate: string | null = null;

  for (const w of sorted) {
    streak = isNextDay(prevDate, w.date) ? streak + 1 : 1;
    total += pointsForWorkout(w, streak);
    prevDate = w.date;
  }

  return total;
}

/**
 * Persist new total to the user and update the leaderboard cache so the next
 * GET /api/leaderboard call serves fresh values.
 */
export async function onWorkoutChanged(userId: string): Promise<number> {
  const total = await totalPointsForUser(userId);
  await userRepo.update(userId, { points: total });
  await leaderboardService.setUserScore(userId, total);
  return total;
}

export async function recomputeAll(): Promise<void> {
  const users = await userRepo.findAll();
  for (const u of users) {
    const total = await totalPointsForUser(u.id);
    if (total !== u.points) {
      await userRepo.update(u.id, { points: total });
    }
    await leaderboardService.setUserScore(u.id, total);
  }
  console.log(`[points] hydrated leaderboard with ${users.length} user(s)`);
}

export async function initUser(userId: string): Promise<void> {
  await leaderboardService.setUserScore(userId, 0);
}