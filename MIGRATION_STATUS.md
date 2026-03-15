# MIGRATION STATUS

Date: 2026-03-15

## Etat global
- Suppression de Supabase terminee (dossiers + integration + dependances @supabase/*).
- Variables .env Supabase retirees et placeholder PocketBase ajoute.
- Imports Supabase remplaces par TODO + stub de compatibilite.
- Stubs appliques pour AuthContext et hooks de donnees afin de conserver la compilation.
- `npm install` execute (lockfile mis a jour) et `npm run build` valide.

## Fichiers ajoutes
- src/lib/pocketbase.ts

## Fichiers modifies
- .env
- package-lock.json
- package.json
- src/components/client/CircuitTrainingView.tsx
- src/components/client/SessionHistoryModal.tsx
- src/components/coach/AssignClientDialog.tsx
- src/components/coach/AssignRoutinesDialog.tsx
- src/components/coach/AssignWorkoutDialog.tsx
- src/components/coach/ClientHabitsTracker.tsx
- src/components/coach/ClientRoutineAssignment.tsx
- src/components/coach/ClientRoutineStats.tsx
- src/components/coach/CombinedWorkoutsBuilder.tsx
- src/components/coach/CreateExerciseDialog.tsx
- src/components/coach/CreateRoutineDialog.tsx
- src/components/coach/CreateWorkoutDialog.tsx
- src/components/coach/HabitManager.tsx
- src/components/coach/ProgramBuilder.tsx
- src/components/coach/SessionDetailsModal.tsx
- src/components/coach/WorkoutEditor.tsx
- src/components/exercises/EditExerciseDialog.tsx
- src/components/exercises/ExerciseLibrary.tsx
- src/components/session/ProofUpload.tsx
- src/components/session/SessionCompleteCard.tsx
- src/contexts/AuthContext.tsx
- src/hooks/useCoachClients.ts
- src/hooks/useHabits.ts
- src/hooks/useOfflineSync.ts
- src/hooks/useRoutines.ts
- src/hooks/useSessionData.ts
- src/hooks/useWeeklyProgram.ts
- src/pages/client/ClientArticle.tsx
- src/pages/client/ClientArticles.tsx
- src/pages/client/ClientHome.tsx
- src/pages/client/ClientSession.tsx
- src/pages/coach/CoachClient.tsx
- src/pages/coach/CoachRoutines.tsx
- src/pages/coach/CoachWorkouts.tsx

## Fichiers supprimes
- src/integrations/supabase/client.ts
- src/integrations/supabase/types.ts
- supabase/config.toml
- supabase/functions/add-exercise-to-workout/index.ts
- supabase/functions/auth-login/index.ts
- supabase/functions/create-exercise/index.ts
- supabase/functions/get-notion-article/index.ts
- supabase/functions/get-notion-articles/index.ts
- supabase/functions/link-client-to-coach/index.ts
- supabase/migrations/20250929124718_f2511fb9-5755-444a-a86b-ec698665e0ff.sql
- supabase/migrations/20250929125112_085fd819-9db7-4ba0-927c-1d9f524fd894.sql
- supabase/migrations/20250930080704_fbaa0005-027d-413a-be00-37cd6c62f396.sql
- supabase/migrations/20251001093336_fa08ad25-dd6c-4153-8a14-cd667ec3a32d.sql
- supabase/migrations/20251001093354_67d09aae-97e6-430b-8393-87ff7358ed70.sql
- supabase/migrations/20251002105228_560e26a6-9e5d-48f0-bfac-443544c66bbb.sql
- supabase/migrations/20251002105425_c404215e-06b6-45f8-9ccd-f5ff5ce158b2.sql
- supabase/migrations/20251002110100_251de49d-516d-462f-8af1-c1956af9cbfe.sql
- supabase/migrations/20251002110449_ae114c2f-391b-458c-9134-91724e0d6865.sql
- supabase/migrations/20251002120210_be48ad73-e48e-41c0-92d4-4d3592f59844.sql
- supabase/migrations/20251002165806_c9cf1c1a-d343-4411-94b0-0285a03ed5e1.sql
- supabase/migrations/20251002172458_2a592e7d-5edd-406b-ba11-c92f25516783.sql
- supabase/migrations/20251002172516_5dd19ad5-779b-4ca6-aa31-6c346af33ad0.sql
- supabase/migrations/20251002174629_ef1d3069-35e2-40c6-8558-df32d2ec0725.sql
- supabase/migrations/20251002174932_54dfef85-19b8-4060-a613-69a6bff10ee4.sql
- supabase/migrations/20251002175826_01b1863b-817c-402c-a00c-9e0dea430ee0.sql
- supabase/migrations/20251002180607_b7ed72d6-0a54-45b2-a188-a36457761aa0.sql
- supabase/migrations/20251003110400_aa572851-76d0-4d28-8c3d-4634f56ce024.sql
- supabase/migrations/20251003111844_2dcc6000-3397-403c-870a-f61940ec0802.sql
- supabase/migrations/20251003112320_56b2855e-1712-49d9-9a6e-cc8c7bfe94f0.sql
- supabase/migrations/20251003170208_074780ea-52c5-4784-87cc-04b91791bcfa.sql
- supabase/migrations/20251003170806_6d524fa4-28d0-4124-8af0-66fb93833fd9.sql
- supabase/migrations/20251003173415_4063e9cd-edc9-49f1-93bd-88bd812385d3.sql
- supabase/migrations/20251003173930_45f74a22-fb75-4bb3-845b-4bc7d840c423.sql
- supabase/migrations/20251003180336_33cf2b88-7c7e-4cb4-90f3-f4369dc5e38e.sql
- supabase/migrations/20251003180835_c65f2691-cab9-4941-903e-c0d57bc0b831.sql
- supabase/migrations/20251003180926_02e0506d-cf29-4a3d-b8a7-c20349fc170c.sql
- supabase/migrations/20251004075605_9c2af704-aefc-4040-8e00-02fab6ed1e7a.sql
- supabase/migrations/20251013123005_88880bb1-1168-4d21-bb73-46fd7a1f13d8.sql
- supabase/migrations/20251015172757_e7a318af-3c36-4e57-907f-191fd5c135ea.sql
- supabase/migrations/20251018091154_23ebbf80-fa6e-47a4-bed0-f40acd4daa59.sql
- supabase/migrations/20251027102305_c5e1d56e-4f0b-4b76-a7f6-2370413f03cf.sql
- supabase/migrations/20251101214538_6b1a4a67-b373-44bf-a4d2-54a8757e4316.sql
- supabase/migrations/20251102104911_fec50e61-d7be-48d0-9884-2fc458ee1601.sql
- supabase/migrations/20251102140632_eacb7fe6-13fd-4cfd-a224-48f8b6bed5f4.sql
- supabase/migrations/20251102154701_fb176592-4f1f-4925-be1d-d5e2aad847e5.sql
- supabase/migrations/20251102161227_b3a5e423-196e-4a99-a7dd-7863c149e4eb.sql
- supabase/migrations/20251102175220_ad728c7c-1db5-4d55-bb99-fe2da1db5b1b.sql

## TODO restants
- Aucun import du stub Supabase restant dans `src/`.
- Finaliser la suppression du fichier stub legacy non utilise dans `src/lib/`.
