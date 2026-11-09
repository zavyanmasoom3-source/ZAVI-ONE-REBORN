-- Disposable PostgreSQL 17 contract test for Stage 3 trial / paid offline policy.
-- Run in GitHub Actions only. Does not connect to production Supabase.
\set ON_ERROR_STOP on
BEGIN;
CREATE SCHEMA private;

CREATE TABLE public.zavi_subscriptions (
  workspace_id uuid PRIMARY KEY,
  plan text NOT NULL,
  status text NOT NULL,
  expires_at timestamptz
);
CREATE TABLE public.zavi_v269_offline_policies (
  workspace_id uuid PRIMARY KEY,
  offline_days integer NOT NULL,
  is_enabled boolean NOT NULL,
  updated_at timestamptz
);
CREATE TABLE private.zavi_customer_archives (
  workspace_id uuid PRIMARY KEY,
  archived boolean NOT NULL DEFAULT false
);

\i supabase/migrations/20261109_phase3_trial_offline_policy.sql

CREATE TRIGGER zavi_auto_offline_cloud_subscription
AFTER INSERT OR UPDATE OF plan, status, expires_at ON public.zavi_subscriptions
FOR EACH ROW EXECUTE FUNCTION private.zavi_auto_offline_from_subscription();

-- 7-day trial, then upgrade to paid 180 days, then 365 days.
INSERT INTO public.zavi_subscriptions
VALUES ('00000000-0000-4000-8000-000000000101','trial','active',now()+interval '7 days');
DO $test$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.zavi_v269_offline_policies
   WHERE workspace_id='00000000-0000-4000-8000-000000000101'
   AND offline_days=7 AND is_enabled) THEN
   RAISE EXCEPTION 'Trial must receive exactly 7-day offline policy';
 END IF;
END $test$;
UPDATE public.zavi_subscriptions SET plan='semiannual',expires_at=now()+interval '180 days'
WHERE workspace_id='00000000-0000-4000-8000-000000000101';
DO $test$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.zavi_v269_offline_policies
   WHERE workspace_id='00000000-0000-4000-8000-000000000101'
   AND offline_days=180 AND is_enabled) THEN
   RAISE EXCEPTION 'Upgraded trial must switch from 7 to 180 days';
 END IF;
END $test$;
UPDATE public.zavi_subscriptions SET plan='annual',expires_at=now()+interval '365 days'
WHERE workspace_id='00000000-0000-4000-8000-000000000101';
DO $test$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.zavi_v269_offline_policies
   WHERE workspace_id='00000000-0000-4000-8000-000000000101'
   AND offline_days=365 AND is_enabled) THEN
   RAISE EXCEPTION 'Annual plan must use 365 days';
 END IF;
END $test$;

-- Paid-plan 7-day management limit must remain intact across renewals.
UPDATE public.zavi_v269_offline_policies SET offline_days=7
WHERE workspace_id='00000000-0000-4000-8000-000000000101';
UPDATE public.zavi_subscriptions SET expires_at=now()+interval '355 days'
WHERE workspace_id='00000000-0000-4000-8000-000000000101';
DO $test$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.zavi_v269_offline_policies
   WHERE workspace_id='00000000-0000-4000-8000-000000000101'
   AND offline_days=7 AND is_enabled) THEN
   RAISE EXCEPTION 'Manual paid policy of 7 days must not be overwritten';
 END IF;
END $test$;

-- Inactive, expired, or archived subscriptions must not enable offline use.
INSERT INTO public.zavi_subscriptions
VALUES ('00000000-0000-4000-8000-000000000102','trial','suspended',now()+interval '7 days');
DO $test$
BEGIN
 IF EXISTS (SELECT 1 FROM public.zavi_v269_offline_policies
   WHERE workspace_id='00000000-0000-4000-8000-000000000102' AND is_enabled) THEN
   RAISE EXCEPTION 'Suspended trial unexpectedly enabled offline';
 END IF;
END $test$;
UPDATE public.zavi_subscriptions SET status='active',expires_at=now()-interval '1 day'
WHERE workspace_id='00000000-0000-4000-8000-000000000102';
DO $test$
BEGIN
 IF EXISTS (SELECT 1 FROM public.zavi_v269_offline_policies
   WHERE workspace_id='00000000-0000-4000-8000-000000000102' AND is_enabled) THEN
   RAISE EXCEPTION 'Expired trial unexpectedly enabled offline';
 END IF;
END $test$;
INSERT INTO private.zavi_customer_archives
VALUES ('00000000-0000-4000-8000-000000000103',true);
INSERT INTO public.zavi_subscriptions
VALUES ('00000000-0000-4000-8000-000000000103','annual','active',now()+interval '365 days');
DO $test$
BEGIN
 IF EXISTS (SELECT 1 FROM public.zavi_v269_offline_policies
   WHERE workspace_id='00000000-0000-4000-8000-000000000103' AND is_enabled) THEN
   RAISE EXCEPTION 'Archived customer unexpectedly enabled offline';
 END IF;
END $test$;

-- Lifetime subscription uses 365-day renewable lease policy, not infinite signed lease.
INSERT INTO public.zavi_subscriptions
VALUES ('00000000-0000-4000-8000-000000000104','lifetime','active',null);
DO $test$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.zavi_v269_offline_policies
   WHERE workspace_id='00000000-0000-4000-8000-000000000104'
   AND offline_days=365 AND is_enabled) THEN
   RAISE EXCEPTION 'Lifetime plan must have renewable 365-day offline policy';
 END IF;
END $test$;

ROLLBACK;
\echo 'PASS: Stage 3 trial=7, paid=180/365, manual 7, archived/expired/suspended deny'
