# ZAVI ONE REBORN — original signing and safe upgrades

Status: blocked until the **original** private signing keystore is recovered.
This is not a release authorization, a recommendation to uninstall, or a
guarantee that Android will accept an update on each device.

## Reference established from the actual owner-supplied 66.75 APK

- Original ONE Android package: `com.zavione.one`.
- Original APK Signing Block v2 certificate SHA-256:
  `f88cfa395f1f256198e81a82ae002de591d772745ae19c70a495b23619c25f25`.
- REBORN debug packages: `com.zavione.one.rebornqa` and
  `com.zavione.one.admin.rebornqa`; these **cannot** overwrite production APKs.
- Current QA builds use ephemeral Android debug signing by default. They
  cannot be relied on to update QA builds from other CI runs.

### Missing indispensable material

An APK contains a *public certificate*, not the *private key* that signed it.
The private key cannot be reconstructed from the SHA-256 digest, source
repository, or a copy of the APK. Generating a fresh key with a long validity
period does **not** solve an in-place upgrade of the old installed app.
Never commit a keystore or password into this public repository.

## GitHub Secrets required for an original-key-only preflight

Use **Repository Settings -> Secrets and variables -> Actions**.

| App | GitHub Actions secret | Contents |
| --- | --- | --- |
| ONE | `ZAVI_RELEASE_ONE_KEYSTORE_BASE64` | Original keystore base64 (single line) |
| ONE | `ZAVI_RELEASE_ONE_STORE_PASSWORD` | Original keystore password |
| ONE | `ZAVI_RELEASE_ONE_KEY_ALIAS` | Original signing alias |
| ONE | `ZAVI_RELEASE_ONE_KEY_PASSWORD` | Original key password |
| ADMIN | `ZAVI_RELEASE_ADMIN_KEYSTORE_BASE64` | Original ADMIN keystore base64 |
| ADMIN | `ZAVI_RELEASE_ADMIN_STORE_PASSWORD` | ADMIN keystore password |
| ADMIN | `ZAVI_RELEASE_ADMIN_KEY_ALIAS` | Original ADMIN signing alias |
| ADMIN | `ZAVI_RELEASE_ADMIN_KEY_PASSWORD` | Original ADMIN key password |
| ADMIN | `ZAVI_RELEASE_ADMIN_EXPECTED_CERT_SHA256` | SHA-256 certificate digest measured from the *original ADMIN APK*, not a newly generated key |

Separately add repository **Variable** `ZAVI_RELEASE_PREFLIGHT` set to
`enabled`. Without the variable, the original-key job is deliberately
**skipped**. A later dev-branch workflow change can trigger the preflight,
or dispatch it when the workflow has been made available on the default branch.

Security note: do **not** paste passwords, private keystores, raw key material
or account tokens into ChatGPT, GitHub issues or public logs.

The preflight compiles both production-package release variants with R8,
verifies their real Android package and signing certificates, and deletes the
signed APKs on the ephemeral runner. It **does not upload a signed APK**.

ONE's signer is compared to the actual supplied 66.75 certificate. ADMIN is
blocked until its independently measured reference fingerprint is configured.

## If the original private signing key cannot be recovered

In-place upgrade is not technically possible with a mismatched signing key.
Use a *new* stable key for future REBORN installations (saved securely), and
treat installation as a **migration**. Before retiring the original app:

1. Keep the old APK installed and make more than one verified backup.
2. Export from the old owner profile; verify backup integrity and scope.
3. Install REBORN side by side, restore to an approved, matching owner/workspace
   in a disposable profile, and compare invoices, products, cash, debts,
   cheque records and offline-pending transactions.
4. Test a restart, airplane mode, sync retry, and two-device conflict while
   preserving unsent records.
5. Obtain explicit owner acceptance of the recovered ledger **before**
   removing the original app. Do not delete the only working copy of data.

## Outstanding release blockers (even after matching key)

- Real-device upgrade test from original installed APK, without data loss.
- PDF feature/UI parity; Android camera/printing/WhatsApp attachments.
- Offline replay and concurrency testing with test tenants.
- Server authorization audits, ADMIN actions, cheques clearing and ledger tests.
- Final release builds and independently verified installer signing.
