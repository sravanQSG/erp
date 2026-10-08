// Explicit migration registry — same rationale as entities.ts: avoids
// glob-based dynamic import, which doesn't resolve consistently across our
// tsc/tsx/Vitest runtimes.
import { InitialSchema1791427823259 } from './1791427823259-InitialSchema.js';

export const publicMigrations = [InitialSchema1791427823259];
