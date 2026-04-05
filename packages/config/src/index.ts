export const FREE_PLAN_LIMITS = {
  maxAppsPerUser: 3,
  maxTagsPerApp: 10,
  maxConcurrentConnectionsPerApp: 100,
} as const;

export type PlanLimits = typeof FREE_PLAN_LIMITS;
