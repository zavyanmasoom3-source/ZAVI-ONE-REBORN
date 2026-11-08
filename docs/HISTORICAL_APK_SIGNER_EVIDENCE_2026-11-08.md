# Historical APK signer inventory — read-only, 2026-11-08

These are fingerprint values extracted from the **embedded v2 APK Signing Block certificates** of selected APK copies in the user's file library. They are not downloaded from, or part of, this GitHub repository. The full per-file SHA256 provenance and results are in the separately delivered baseline CSV report. An embedded signer certificate does not, by itself, prove that the APK's cryptographic signature is valid; run Android SDK apksigner verify --verbose --print-certs on each APK for definitive verification.

| File | Embedded signer SHA-256 | Certificate subject |
|---|---|---|
| ZAVI_ONE_66.75_pdf_final_QA.apk | be7ec29030eb0eaacdd6363c83102cca9e4b7fd33184ed2cf9033777e7434977 | Android Debug |
| ZAVI_ONE_66.75_recovery_QA_new.apk | 7f31a99869a54bb3e479a8df6455ba16435f0a990bd5f6e6b7bdd7886c492b76 | Android Debug |
| ZAVI_ONE_66.78_pdf_final_QA.apk | 486c7cc97177fd205d77d07df6dd78a56c4a98336f89ce25b9d7563d34b6fc4e | Android Debug |
| ZAVI_ONE_6675.apk | 7f31a99869a54bb3e479a8df6455ba16435f0a990bd5f6e6b7bdd7886c492b76 | Android Debug |
| ZAVI_ONE_ADMIN_1.4.66_pdf_final_QA.apk | be7ec29030eb0eaacdd6363c83102cca9e4b7fd33184ed2cf9033777e7434977 | Android Debug |
| ZAVI_ONE_ADMIN_1.4.69_pdf_final_QA.apk | 486c7cc97177fd205d77d07df6dd78a56c4a98336f89ce25b9d7563d34b6fc4e | Android Debug |
| ZAVI_ONE_ADMIN_NEW_QA.apk | 7bdb8d9293fa577eb3d8351f08ea8d8870963b856280bb5d23e95822bb7efd85 | Android Debug |
| ZAVI_ONE_NEW_QA.apk | 831e643305b3a30ab032fedd1e5553ae36516116fab4298252e52450c16b526c | Android Debug |
| ZAVI_ONE_REBORN_NEW_QA.apk | 8802975b5a500d651d4986227bd2ab3db72258f4ddaf32a11fb2d2069ba24f32 | Android Debug |

**Verified observation:** historical QA APK filenames with nearby version numbers have multiple different signer fingerprints. Hence same-name overwrite or assumed direct upgrade is unsafe. In particular, ONE 66.75_pdf_final_QA and ONE 66.78_pdf_final_QA have different identities, despite similar package branding.

**Important baseline distinction:** the repository's original-release compatibility preflight uses a separately recorded 66.75 signing reference beginning f88cfa39. None of the above QA APKs match that reference. This does **not** disprove the reference for a different, original APK. Do not infer the user's installed-app signature from its marketing version number alone; measure it on the actual installed/distributed APK.

**Next safety gate:** preserve all existing customer installations; verify each intended upgrade against its exact original APK with Android SDK apksigner and package/version checks. Never automatically generate a new key in the build runner.
