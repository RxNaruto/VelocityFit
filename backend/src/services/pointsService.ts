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
 *     drop segments = 2  * # of drop-set segments (each drop counts once)
 *     streak bonus  = min(streakDays * 5, 100)
 */
export const POINTS = {
  PER_WORKOUT: 25,
  PER_EXERCISE: 5,
  PER_SET: 2,
  PER_FAILURE_SET: 3,
  PER_DROP_SEGMENT: 2,
  STREAK_PER_DAY: 5,
  STREAK_BONUS_CAP: 100,
} as const;

function isNextDay(prevKey: string | null, key: string): boolean {
  if (!prevKey || !key) return false;

  // Fix 5: `.map(Number)` returns `number[]` whose elements are
  // `number | undefined` under noUncheckedIndexedAccess.
  // Destructure into named variables and supply fallbacks so TypeScript
  // knows they are always `number`.
  const parts = prevKey.split('-').map(Number);
  const py = parts[0] ?? 0;
  const pm = parts[1] ?? 0;
  const pd = parts[2] ?? 0;

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

/**
 * Score one workout given how many counts it carries. Pure function —
 * the caller can supply either a full WorkoutDTO (which gets summarized
 * here) or pre-computed counts from the lean SQL summary query.
 */
function scoreFromCounts(
  counts: {
    exerciseCount: number;
    setCount: number;
    failureSetCount: number;
    dropSegmentCount: number;
  },
  streakDays: number
): number {
  if (counts.exerciseCount === 0) return 0;
  return (
    POINTS.PER_WORKOUT +
    POINTS.PER_EXERCISE * counts.exerciseCount +
    POINTS.PER_SET * counts.setCount +
    POINTS.PER_FAILURE_SET * counts.failureSetCount +
    POINTS.PER_DROP_SEGMENT * counts.dropSegmentCount +
    streakBonus(Math.max(1, streakDays))
  );
}

export function pointsForWorkout(
  workout: WorkoutDTO | null | undefined,
  streakDays = 1
): number {
  if (!workout || !Array.isArray(workout.entries)) return 0;
  const exerciseCount = workout.entries.length;
  if (exerciseCount === 0) return 0;

  let setCount = 0;
  let failureSetCount = 0;
  let dropSegmentCount = 0;

  workout.entries.forEach((e) => {
    if (!Array.isArray(e.sets)) return;
    setCount += e.sets.length;
    e.sets.forEach((s) => {
      if (s && s.isFailure) failureSetCount += 1;
      if (s && Array.isArray(s.drops)) dropSegmentCount += s.drops.length;
    });
  });

  return scoreFromCounts(
    { exerciseCount, setCount, failureSetCount, dropSegmentCount },
    streakDays
  );
}

/**
 * Walks the user's workouts in chronological order so we can compute the
 * streak length at each workout date and credit the streak bonus accordingly.
 *
 * Performance note: uses the lean `summariesForPointsForUser` query
 * (one aggregated SQL round trip) instead of `findAllForUser` (which
 * pulls every entry / set / drop with relations). Matters because this
 * is called on every workout mutation — the per-entry auto-save was
 * spending most of its 2–3 s round-trip budget here when run against
 * hosted Postgres.
 */
export async function totalPointsForUser(userId: string): Promise<number> {
  const summaries = await workoutRepo.summariesForPointsForUser(userId);
  if (summaries.length === 0) return 0;

  // Query already orders by date ASC, but a defensive sort is cheap.
  const sorted = [...summaries].sort((a, b) => (a.date < b.date ? -1 : 1));

  let total = 0;
  let streak = 0;
  let prevDate: string | null = null;

  for (const w of sorted) {
    streak = isNextDay(prevDate, w.date) ? streak + 1 : 1;
    total += scoreFromCounts(w, streak);
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

  // Drop any leaderboard members that no longer exist in Postgres before we
  // re-add the current ones. This is what makes "rank X / N" correct again
  // after Postgres is wiped while Redis keeps the old user IDs.
  await leaderboardService.reconcile(new Set(users.map((u) => u.id)));

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