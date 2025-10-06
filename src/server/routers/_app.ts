/**
 * Root tRPC Router
 *
 * Combines all feature routers into the main app router.
 */

import { createTRPCRouter } from '../trpc';
import { examRouter } from './exam';
import { trainerRouter } from './trainer';
import { calcRouter } from './calc';
import { adminRouter } from './admin';

export const appRouter = createTRPCRouter({
  exam: examRouter,
  trainer: trainerRouter,
  calc: calcRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
