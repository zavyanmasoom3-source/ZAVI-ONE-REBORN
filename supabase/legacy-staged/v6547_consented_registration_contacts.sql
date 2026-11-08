-- ZAVI ONE V65.47 Account contacts. For review before production migration.
-- Store contacts only after authenticated user confirmation. Administrative read is server-guarded.
BEGIN;
CREATE TABLE IF NOT EXISTS public.zavi_v6547_account_contacts (
 user_uid uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 contact_e164 text NOT NULL DEFAULT '',
 whatsapp_e164 text NOT NULL DEFAULT '',
 country_iso text NOT NULL DEFAULT '',
 contact_opt_in boolean NOT NULL DEFAULT false,
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT zavi_v6547_phone_format CHECK (
  (contact_e164 = '' OR contact_e164 ~ '^\+[1-9][0-9]{5,14}$') AND
  (whatsapp_e164 = '' OR whatsapp_e164 ~ '^\+[1-9][0-9]{5,14}$') AND
  length(country_iso) <= 3 AND
  (NOT contact_opt_in OR contact_e164 <> '' OR whatsapp_e164 <> '')
 )
);
ALTER TABLE public.zavi_v6547_account_contacts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.zavi_v6547_account_contacts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.zavi_v6547_account_contacts TO authenticated;
DROP POLICY IF EXISTS zavi_contact_self_select ON public.zavi_v6547_account_contacts;
CREATE POLICY zavi_contact_self_select ON public.zavi_v6547_account_contacts
 FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_uid);
DROP POLICY IF EXISTS zavi_contact_self_insert ON public.zavi_v6547_account_contacts;
CREATE POLICY zavi_contact_self_insert ON public.zavi_v6547_account_contacts
 FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_uid);
DROP POLICY IF EXISTS zavi_contact_self_update ON public.zavi_v6547_account_contacts;
CREATE POLICY zavi_contact_self_update ON public.zavi_v6547_account_contacts
 FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_uid)
 WITH CHECK ((SELECT auth.uid()) = user_uid);
CREATE OR REPLACE FUNCTION public.zavi_admin_registration_contacts()
RETURNS TABLE (
 user_uid uuid, account_email text, phone_e164 text, whatsapp_e164 text,
 country_iso text, contact_opt_in boolean, updated_at timestamptz
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $body$
BEGIN
 IF auth.uid() IS NULL OR NOT private.zavi_is_billing_admin() THEN
   RAISE EXCEPTION 'Not authorized' USING errcode='42501';
 END IF;
 RETURN QUERY SELECT c.user_uid, u.email::text, c.contact_e164, c.whatsapp_e164,
   c.country_iso, c.contact_opt_in, c.updated_at
 FROM public.zavi_v6547_account_contacts AS c
 JOIN auth.users AS u ON u.id = c.user_uid
 WHERE c.contact_opt_in = true
 ORDER BY c.updated_at DESC LIMIT 500;
END
$body$;
REVOKE ALL ON FUNCTION public.zavi_admin_registration_contacts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.zavi_admin_registration_contacts() TO authenticated;
COMMIT;
-- Before rollout: test as anon, ordinary authenticated, central admin and a non-owner colleague.
-- Frontends use public anon key only; never put a service key in JS/APK.
