# ZAVI ONE REBORN — Verified engineering delivery / 2026-11-08

## Release classification: **QA ONLY; NOT READY FOR PUBLIC RELEASE**

Repository `zavyanmasoom3-source/ZAVI-ONE-REBORN`, branch `dev`.
Last confirmed Windows QA source: `a435f3a87bc7f998f7c09a512bded2300ddbca91`.

### Proof, not assertions
| Gate | Outcome | Evidence |
|---|---|---|
| Three-device workspace CAS, concurrent invoice edits, dropped ACK, deletion/edit conflict, clock skew | PASS in disposable Chrome profiles with mock Supabase entitlement | [GitHub run 42509601844](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42509601844); 3 profiles, 4 cases, last revision 14 |
| Legacy ADMIN soft delete requires two confirmations; rejects failed RPC | PASS in isolated regression | [GitHub run 42509986549](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42509986549) |
| Pure cheque clearing/partial/bounce/reversal/FX/idempotency arithmetic | PASS; pure contract only | [GitHub run 42510343434](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42510343434) |
| Complete migration/source consistency and browser regression | PASS at source a435f3a | [GitHub run 42511473552](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42511473552) |
| Windows .NET 8/WebView2 app + installer, including print popup fix | PASS build/packaging, not installed on a Windows device | [GitHub run 42511473520](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42511473520) |
| Windows QA installer SHA256 | PASS artifact hash check | `8e1bf8d8fe2553b565121322ef2deb37801da4622112da557afe014007f808fe` for `ZAVI_ONE_REBORN_Windows_QA_2.exe` |
| Android installable APK stable certificate | BLOCKED intentionally; missing owner-configured Actions Secrets | [Latest Android signing failure](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/actions/runs/42511321047) |
| 59-page PDF traceability | 59/59 indexed; **not pixel/performance certified** | [Matrix](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/blob/dev/docs/PDF_59_PAGE_TRACEABILITY.md) |
| Cheque atomic server clearing | NOT IMPLEMENTED/DEPLOYED | Live schema constrains cheque status to pending; separate draft has no callable clearing RPC |
| Real production Supabase 3-device E2E | NOT TESTED | The 3-device pass above uses a disposable mock, not real authenticated devices |
| Physical Android installation, background/offline, camera, print, biometrics, rotations | NOT TESTED | Must be executed on real hardware/emulator |
| Original APK 66.75 in-place upgrade | NOT POSSIBLE WITH NEW KEY | Original signing fingerprint differs; backup/migration must be verified before changing installation |
| ADMIN security certification for expired/foreign staff users and all RPCs | NOT COMPLETE | Anonymous finance RPC test exists; 85 authenticated SECURITY DEFINER advisor warnings remain for manual review |
| Windows release code signing and production SmartScreen/device QA | NOT COMPLETE | Current Installer is unsigned QA |

## Actual source files changed during this engineering session
- `scripts/test-cloud-three-device-browser.py` — authorize mock profiles through genuine-shaped server entitlement; never stub away production license.
- `apps/admin/zavi-admin-recovery-v141.js` — require second exact-name confirmation for legacy soft delete.
- `scripts/test-admin-customer-trash.cjs` and `.github/workflows/migration-integrity.yml` — prove authorization/UI correctness and avoid false success.
- `packages/shared/accounting/cheque-settlement-contract.js` — pure 2-decimal accounting journal, idempotent clearing, reversal and FX guard.
- `scripts/test-cheque-settlement.cjs` — financial invariants including partial/full settlement and bounce.
- `desktop/windows/ZaviOneDesktop.csproj`, `desktop/windows/Program.cs` — Windows x64 WebView2 shell with persistent account storage, restricted navigation and controlled receipt windows.
- `desktop/windows/installer.iss`, `desktop/windows/README.md` — per-user Windows QA packaging.
- `.github/workflows/build-desktop-qa.yml`, `scripts/stamp-desktop-qa.py` — repeatable Windows packaging, commit/version provenance and SHA256.
- `scripts/test-android-upgrade-on-device.py` — explicit, QA-only physical Android update tester (not yet run).

## Irreducible owner/device/external actions (not completed)
1. Securely back up **both private PKCS12 keystores and passwords**, then add the eight per-app Actions Secrets described at [signing/README.md](https://github.com/zavyanmasoom3-source/ZAVI-ONE-REBORN/blob/dev/signing/README.md). Never commit keys or paste them in public chats/issues.
2. Make two consecutive signed builds with the same pinned certificate, validate versionCode, and run QA-only `scripts/test-android-upgrade-on-device.py` on a dedicated device. Test actual cached accounting records separately.
3. If an older production APK is installed, either obtain its **original private signing key**, or export, validate and reconcile a secure backup in a separate new installation before retiring the old app. Never uninstall the only data copy.
4. Export/verify a recoverable Supabase database backup in a protected administrative environment and rehearse restore in a disposable project before any cheque/server-role migrations. Existing live customer data has not been modified here.
5. Deploy a reviewed **atomic, owner-authorized cheque journal RPC** with reversal, immutable audit, CAS, idempotency, table grants and rollback, then test it with disposable multi-tenant records. The pure JS contract is not a live feature.
6. Perform Android/Windows device-level login, RTL/Dari/Pashto/English, solar/Gregorian dates, printing, camera, low-memory, disconnect/reconnect, and all 59 PDF comparisons.
7. Provide a signed Windows code-signing certificate for an official production installer and run SmartScreen/reinstall/upgrade QA.

## Product safety policy
- No production customer rows, financial transactions or Supabase schema were changed in this session.
- No deleted or overwritten production APKs or old repositories.
- **Do not label QA artifacts as final releases. Do not state 'پروژه بسته شد'.**
