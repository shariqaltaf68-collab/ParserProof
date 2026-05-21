import prisma from '@/lib/prisma';
import { PLAN_LIMITS } from '@/lib/plans';

const RESET_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Resets the user's usage count if the current reset window has expired.
 *
 * @param {string} userId - The user's ID.
 * @returns {Promise<import('@prisma/client').User>} Updated user record.
 */
export async function resetUsageIfNeeded(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, usageCount: true, usageResetAt: true, plan: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const now = new Date();
  if (now >= new Date(user.usageResetAt)) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        usageCount: 0,
        usageResetAt: new Date(now.getTime() + RESET_WINDOW_MS),
      },
    });
  }

  return user;
}

/**
 * Checks whether the user has remaining AI generations within their plan limit.
 *
 * @param {string} userId - The user's ID.
 * @returns {Promise<{ allowed: boolean, used: number, limit: number, remaining: number }>}
 */
export async function checkUsageLimit(userId) {
  const user = await resetUsageIfNeeded(userId);
  const limit = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;
  const used = user.usageCount;
  const remaining = Math.max(0, limit - used);

  return {
    allowed: remaining > 0,
    used,
    limit,
    remaining,
  };
}

/**
 * Increments the user's usage count after a successful AI generation.
 *
 * @param {string} userId - The user's ID.
 * @returns {Promise<import('@prisma/client').User>} Updated user record.
 */
export async function incrementUsage(userId) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      usageCount: { increment: 1 },
    },
  });
}

/**
 * Returns detailed usage statistics for the user.
 *
 * @param {string} userId - The user's ID.
 * @returns {Promise<{ used: number, limit: number, remaining: number, resetDate: Date }>}
 */
export async function getUsageStats(userId) {
  const user = await resetUsageIfNeeded(userId);
  const limit = PLAN_LIMITS[user.plan] || PLAN_LIMITS.free;
  const used = user.usageCount;
  const remaining = Math.max(0, limit - used);

  return {
    used,
    limit,
    remaining,
    resetDate: new Date(user.usageResetAt),
  };
}
