-- RUN THIS CONCORDANTLY TO WIPE OLD TABLES BEFORE APPLYING THE NEW SCHEMA
-- This drops the old tables so that the new schemas (with user_id columns) can be applied correctly.

DROP TABLE IF EXISTS "public"."routine_logs" CASCADE;
DROP TABLE IF EXISTS "public"."routine_steps" CASCADE;
DROP TABLE IF EXISTS "public"."routines" CASCADE;

DROP TABLE IF EXISTS "public"."time_logs" CASCADE;
DROP TABLE IF EXISTS "public"."weekly_reviews" CASCADE;

DROP TABLE IF EXISTS "public"."milestones" CASCADE;
DROP TABLE IF EXISTS "public"."goals" CASCADE;

DROP TABLE IF EXISTS "public"."habit_logs" CASCADE;
DROP TABLE IF EXISTS "public"."habits" CASCADE;

DROP TABLE IF EXISTS "public"."health_logs" CASCADE;

DROP TABLE IF EXISTS "public"."tasks" CASCADE;
DROP TABLE IF EXISTS "public"."projects" CASCADE;
