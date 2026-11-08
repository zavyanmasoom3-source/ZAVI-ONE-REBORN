# ZAVI ONE signing baseline and safe upgrades

Two new RSA-3072, 100-year PKCS12 keystores were generated outside this public
repository. Private keys and passwords MUST NOT be committed.

Public certificate SHA-256:
- ONE: `7e68bc0c0525785de756acc56a72c25fc171f1b01dd579e7a9b343133b29757c` (alias `zavi-one-release`)
- ADMIN: `78395f24d3543bc5ac91ac268142ea849d79ef8efc0518ffeb878ac6980613de` (alias `zavi-admin-release`)

These **new** certificates are not the certificates of old APKs. In particular,
original ZAVI ONE 66.75 has certificate
`f88cfa395f1f256198e81a82ae002de591d772745ae19c70a495b23619c25f25`.
Therefore the original APK cannot be updated in place with the new certificate.
A fresh installation must import a verified backup and reconcile cash, products,
customers and invoices before the original application is retired.

## GitHub Actions repository Secrets (owner action)
Open https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/settings/secrets/actions
and add the following eight secrets. Never paste values in GitHub issues or logs.

| ONE | ADMIN | Value |
| --- | --- | --- |
| ZAVI_ONE_KEYSTORE_BASE64 | ZAVI_ADMIN_KEYSTORE_BASE64 | single-line base64 of the corresponding .p12 |
| ZAVI_ONE_STORE_PASSWORD | ZAVI_ADMIN_STORE_PASSWORD | private PKCS12 password |
| ZAVI_ONE_KEY_ALIAS | ZAVI_ADMIN_KEY_ALIAS | zavi-one-release / zavi-admin-release |
| ZAVI_ONE_KEY_PASSWORD | ZAVI_ADMIN_KEY_PASSWORD | same as store password (PKCS12) |

Generate base64 locally without printing private passwords:
`base64 -w 0 ZAVI_ONE_release_key.p12` (Linux);
`[Convert]::ToBase64String([IO.File]::ReadAllBytes('ZAVI_ONE_release_key.p12'))`
(PowerShell). Repeat for ADMIN.

**Important:** CI rejects missing secrets and rejects any certificate that
does not match `signing/certificates.json`. No ephemeral Android Debug key
is accepted for an installable build. Android Gradle Plugin is configured for
APK v1, v2, v3 schemes, and CI verifies the signed output with apksigner.

## Re-create NEW key only if creating a DIFFERENT identity
```bash
export ZAVI_SIGNING_PASSWORD='CHOOSE_A_LONG_RANDOM_SECRET'
keytool -genkeypair -storetype PKCS12 -keystore ZAVI_ONE_release_key.p12 \
  -alias zavi-one-release -keyalg RSA -keysize 3072 \
  -sigalg SHA256withRSA -validity 36500 \
  -dname 'CN=ZAVI ONE Signing, O=ZAVI ONE, C=GB' \
  -storepass:env ZAVI_SIGNING_PASSWORD -keypass:env ZAVI_SIGNING_PASSWORD
unset ZAVI_SIGNING_PASSWORD
```
Use separate keystore and password for ADMIN. Creating another key
invalidates the previous pinned fingerprint for that new signing identity.

## Required physical migration/update tests (still open)
1. On a clean emulator install QA build N, create disposable financial records.
2. Install stable-signed QA build N+1 with `adb install -r` (no uninstall).
3. Verify same package, same signing fingerprint, greater versionCode, and
   preserved cash/invoice data. Repeat for ADMIN.
4. For old production installs, import a verified owner-scoped backup into a
   separate new installation and reconcile balances. Never uninstall the only
   copy of financial records.

Make two separate encrypted offsite backups of each keystore and password,
test recovery from backup, and restrict signing access to the release owner.
Lost private keys cannot be recreated from their certificate fingerprints.
