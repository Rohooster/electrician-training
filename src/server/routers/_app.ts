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
import { conceptRouter } from './concept';
import { embeddingRouter } from './embedding';

export const appRouter = createTRPCRouter({
  exam: examRouter,
  trainer: trainerRouter,
  calc: calcRouter,
  admin: adminRouter,
  concept: conceptRouter,
  embedding: embeddingRouter,
});

export type AppRouter = typeof appRouter;
