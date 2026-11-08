# ZAVI shared core — phase 2 initial scaffold

- `database/supabase-config.js`: EU Supabase project invariant; only public browser credentials.
- `security/access-contract.js`: authentication and server-RPC invocation contract; **not an authorization bypass**.
- `i18n/language-core.js`: common locale identifiers and RTL/LTR; **not a complete translation replacement**.

These modules are additive and **not wired into both apps yet**. Existing translation dictionaries, device licensing, and Supabase RLS/RPC remain authoritative. No claim of 100% feature parity until integration tests.
