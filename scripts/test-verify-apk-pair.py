#!/usr/bin/env python3
"""Non-mutating regression tests for signature and upgrade metadata gating."""
import importlib.util
import pathlib
import unittest

spec = importlib.util.spec_from_file_location('apkpair', pathlib.Path(__file__).with_name('verify-apk-pair.py'))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
QA_SHA = '7e68bc0c0525785de756acc56a72c25fc171f1b01dd579e7a9b343133b29757c'
ADMIN_SHA = '78395f24d3543bc5ac91ac268142ea849d79ef8efc0518ffeb878ac6980613de'


def info(package, version, signer):
    return {'package': package, 'versionCode': version, 'certificateSHA256': signer}


class ApkPairTests(unittest.TestCase):
    def test_valid_same_identity_qa(self):
        first = info(mod.QA_PACKAGES['one'], 667801, QA_SHA)
        second = info(mod.QA_PACKAGES['one'], 667802, QA_SHA)
        actual = mod.compare(first, second, 'one', 'qa', QA_SHA)
        self.assertEqual(actual['result'], 'APK_PAIR_METADATA_PASS')
        self.assertFalse(actual['financialDataPreservationTested'])

    def test_admin_distinct_identity(self):
        first = info(mod.QA_PACKAGES['admin'], 146901, ADMIN_SHA)
        second = info(mod.QA_PACKAGES['admin'], 146902, ADMIN_SHA)
        self.assertEqual(mod.compare(first, second, 'admin', 'qa', ADMIN_SHA)['app'], 'admin')

    def test_changed_signer_refused(self):
        one = info(mod.QA_PACKAGES['one'], 667801, QA_SHA)
        two = info(mod.QA_PACKAGES['one'], 667802, ADMIN_SHA)
        with self.assertRaises(mod.VerificationError):
            mod.compare(one, two, 'one', 'qa', QA_SHA)

    def test_downgrade_and_same_version_refused(self):
        first = info(mod.QA_PACKAGES['one'], 667802, QA_SHA)
        for version in (667802, 667801):
            with self.subTest(version=version), self.assertRaises(mod.VerificationError):
                mod.compare(first, info(mod.QA_PACKAGES['one'], version, QA_SHA), 'one', 'qa', QA_SHA)

    def test_release_key_must_be_original(self):
        old = info(mod.RELEASE_PACKAGES['one'], 6675, QA_SHA)
        new = info(mod.RELEASE_PACKAGES['one'], 667901, QA_SHA)
        with self.assertRaises(mod.VerificationError):
            mod.compare(old, new, 'one', 'release', QA_SHA)

    def test_wrong_package_refused(self):
        old = info(mod.RELEASE_PACKAGES['one'], 6675, mod.LEGACY_ONE_CERT)
        new = info(mod.QA_PACKAGES['one'], 667901, mod.LEGACY_ONE_CERT)
        with self.assertRaises(mod.VerificationError):
            mod.compare(old, new, 'one', 'release', mod.LEGACY_ONE_CERT)

    def test_original_release_identity_positive(self):
        old = info(mod.RELEASE_PACKAGES['one'], 6675, mod.LEGACY_ONE_CERT)
        new = info(mod.RELEASE_PACKAGES['one'], 667901, mod.LEGACY_ONE_CERT)
        self.assertEqual(mod.compare(old, new, 'one', 'release', mod.LEGACY_ONE_CERT)['result'], 'APK_PAIR_METADATA_PASS')

    def test_bad_certificate_refused(self):
        with self.assertRaises(mod.VerificationError):
            mod.normalise_cert('not-a-sha256')

    def test_valid_v1_v2_v3_signature_metadata(self):
        apk = pathlib.Path(__file__)
        original = mod.command
        try:
            def mocked(args):
                if args[0] == 'aapt':
                    return "package: name='com.zavione.one.rebornqa' versionCode='667802' versionName='66.78'\n"
                return ('Verified using v1 scheme (JAR signing): true\n'
                        'Verified using v2 scheme (APK Signature Scheme v2): true\n'
                        'Verified using v3 scheme (APK Signature Scheme v3): true\n'
                        'Signer #1 certificate SHA-256 digest: '+QA_SHA+'\n')
            mod.command = mocked
            self.assertEqual(mod.read_apk(apk, 'aapt', 'apksigner')['certificateSHA256'], QA_SHA)
        finally:
            mod.command = original

    def test_missing_signing_scheme_refused(self):
        # Mock the external command outputs, not the comparison logic.
        apk = pathlib.Path(__file__)
        original = mod.command
        try:
            def mocked(args):
                if args[0] == 'aapt':
                    return "package: name='com.zavione.one.rebornqa' versionCode='667802' versionName='66.78'\n"
                return ('Verified using v1 scheme (JAR signing): true\n'
                        'Verified using v2 scheme (APK Signature Scheme v2): true\n'
                        'Verified using v3 scheme (APK Signature Scheme v3): false\n'
                        'Signer #1 certificate SHA-256 digest: '+QA_SHA+'\n')
            mod.command = mocked
            with self.assertRaises(mod.VerificationError):
                mod.read_apk(apk, 'aapt', 'apksigner')
        finally:
            mod.command = original


if __name__ == '__main__':
    unittest.main(verbosity=2)
