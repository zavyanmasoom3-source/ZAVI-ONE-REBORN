# ZAVI ONE ADMIN — live grant inventory and authorization matrix (READ ONLY)

Generated from **read-only PostgreSQL catalog queries** on 2026-11-09. Primary project reference `wbbmwfnmurpphwxesssx`; **no customer rows exposed and no database writes executed**.

This is an *exposure/permission inventory*, NOT authenticated role-attestation. `Grant; logic untested` means PostgreSQL allows `authenticated` to EXECUTE but function-body authorization for the named business role is **not** proven. `Denied by grant` means the PostgreSQL role `anon` lacked EXECUTE in this snapshot; HTTP negative test and token refresh still required. `DEF` means SECURITY DEFINER, which requires especially careful owner and tenant scope checks. "Expired" is a license state, not a separate PostgreSQL role.

Count of RPCs inventoried: **48**; SECURITY DEFINER + executable by authenticated: **44**. Public SECURITY DEFINER RPCs do not necessarily leak data by themselves if their bodies correctly reject ineligible callers.

| RPC | Mode | Main owner | Admin/agent | Normal user | Expired account | No token |
|---|---|---|---|---|---|---|
| `zavi_admin_add_agent` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_add_expense` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_assign_agent` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_billing_history` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_finance_snapshot` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_get_report_period` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_grant_lifetime` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_grant_trial_7days` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_list_workspaces` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_message_history_v6595` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_message_mark_v6595` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_offline_grace_check` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_pay_agent` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_preview_trial_7days` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_receipts` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_recovery_catalog` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_registration_contacts` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_renew_annual` | DEF | No grant | No grant | No grant | No grant | Denied by grant |
| `zavi_admin_replace_device` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_restore_trash_customer` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_revoke_lifetime` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_set_subscription_status` | DEF | No grant | No grant | No grant | No grant | Denied by grant |
| `zavi_admin_support_list` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_support_reply` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_trash_all_customer_accounts` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_trash_customer` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_unassign_agent` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_v241_audit` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_v241_disable_resource` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_v241_finance_summary` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_v241_overview` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_v241_register_resource` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_v24_accounts` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_v24_archive` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_v24_events` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_v24_pin_decide` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_v24_pin_requests` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_v6570_offline_status` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_admin_v6573_industry_edition_report` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_owner_delete_customer` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_owner_reset_admin_report_period` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_owner_reset_customer_accounts` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_v28_device_sync_authorization` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_v28_my_sync_status` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_v28_receive_sync_operation` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_v28_sync_device_allowed` | DEF | Grant; logic untested | Grant; logic untested | Denial NOT verified | Denial NOT verified | Denied by grant |
| `zavi_v28_sync_security_guard` | DEF | No grant | No grant | No grant | No grant | Denied by grant |
| `zavi_v28_sync_subscription_tables` | DEF | No grant | No grant | No grant | No grant | Denied by grant |

## Critical review queue

- `zavi_owner_delete_customer` exists and contains **permanent DELETE operations**; it is distinct from soft-delete `zavi_admin_trash_customer`. Although its code has privileged-user and typed confirmation guards, the requirement here is recoverable soft delete only. It must be retired/restricted with a tested migration and rollback; do not call it on real accounts. **No endpoint changed today.**
- `zavi_admin_trash_customer` and `zavi_admin_restore_trash_customer` verify a privileged billing administrator in their function bodies and use a recoverable archive path; cross-tenant, audit, expired-user and simultaneous operations are not yet tested against isolated staging actors.
- For every grant exposed to authenticated (including OWNER and administrative operations), test owner, delegated admin, unrelated tenant, expired account, and expired/revoked token. Catalog GRANT is not sufficient for authorization.
- Review RLS policies and `search_path` on each privileged function, and check its called dependencies. Never trust UI hiding a button.

## Test plan (staging only)

1. Create a **separate disposable Supabase staging project** (not the primary) and clone **schema only**, then enable RLS and apply all reviewed policies there. Do not use production customer backups as fixtures.
2. Create 5 synthetic principal types (owner, admin, normal user, expired, no JWT), plus a second workspace with an unrelated owner.
3. Call every RPC with a disposable workspace under each identity, testing both read and write paths. Negative cases must return 401/403 or SQLSTATE 42501 *without changing any record*.
4. For trash/restore, check two independent confirmations in UI, one durable server event, no data loss, and success after restore. Try cross-tenant workspace ID and an unauthorized user; compare before/after record counts.
5. Save machine-generated results, SQLSTATE, and test fixture IDs. If any negative case unexpectedly succeeds, block Release and do not migrate production.

No live auth session or production mutation was used to generate this inventory.
