-- Stage 3 | ZAVI ONE | safe policy mapping for subscription-triggered offline leases.
-- Applies to future subscription writes, preserving existing owner-configured
-- seven-day limits on paid subscriptions. No customer or accounting rows touched.
--
-- The signed ES256 lease remains the ONLY offline authorization. The deployed
-- Edge Function independently checks active ownership, primary device and
-- subscription expiry; this migration cannot issue or extend a lease.
--
-- Trial -> paid upgrade must replace a trial's former seven-day policy with the
-- new paid duration. Other *manual* seven-day overrides remain respected.
CREATE OR REPLACE FUNCTION private.zavi_auto_offline_from_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $zavi_phase3$
DECLARE
  v_upgrading_from_trial boolean := false;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_upgrading_from_trial :=
      OLD.plan = 'trial' AND NEW.plan <> 'trial';
  END IF;

  INSERT INTO public.zavi_v269_offline_policies AS current_policy
    (workspace_id, offline_days, is_enabled, updated_at)
  VALUES
    (NEW.workspace_id,
     CASE
       WHEN NEW.plan = 'trial' THEN 7
       WHEN NEW.plan = 'semiannual' THEN 180
       ELSE 365
     END,
     NEW.status = 'active'
       AND (NEW.plan = 'lifetime' OR NEW.expires_at > now())
       AND NOT EXISTS (
         SELECT 1 FROM private.zavi_customer_archives AS a
         WHERE a.workspace_id = NEW.workspace_id AND a.archived = true
       ),
     now())
  ON CONFLICT (workspace_id) DO UPDATE SET
    offline_days = CASE
      WHEN NEW.plan = 'trial' THEN 7
      WHEN v_upgrading_from_trial THEN EXCLUDED.offline_days
      WHEN current_policy.offline_days = 7 THEN 7
      ELSE EXCLUDED.offline_days
    END,
    is_enabled = EXCLUDED.is_enabled,
    updated_at = now();

  RETURN NEW;
END;
$zavi_phase3$;

COMMENT ON FUNCTION private.zavi_auto_offline_from_subscription()
IS 'ZAVI stage 3: trial=7 days, semiannual=180, annual/lifetime=365; retain explicit paid-plan 7-day override; never grant access without signed offline lease';
