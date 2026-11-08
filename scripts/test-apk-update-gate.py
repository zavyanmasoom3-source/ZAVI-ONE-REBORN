#!/usr/bin/env python3
"""Isolated test vectors for release/update safety. No APKs or credentials needed."""
import importlib.util
from pathlib import Path
import unittest

path=Path(__file__).with_name('verify-apk-update.py')
spec=importlib.util.spec_from_file_location('zavi_verify_apk_update',path)
mod=importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
H=mod.LEGACY_ONE_SHA256
OTHER='a'*64
class UpgradeSafetyTests(unittest.TestCase):
    def test_parse_android_badging(self):
        self.assertEqual(mod.parse_badging("package: name='com.zavione.one' versionCode='6675' versionName='66.75'\n"),('com.zavione.one',6675))
        with self.assertRaises(mod.UnsafeUpdate):mod.parse_badging('garbage')
    def test_parse_signer(self):
        self.assertEqual(mod.parse_signers('Signer #1 certificate SHA-256 digest: '+H+'\n'),H)
        with self.assertRaises(mod.UnsafeUpdate):mod.parse_signers('Verification failed')
        with self.assertRaises(mod.UnsafeUpdate):mod.parse_signers('Signer #1 certificate SHA-256 digest: '+H+'\nSigner #2 certificate SHA-256 digest: '+OTHER+'\n')
    def test_qa_is_separate(self):
        self.assertEqual(mod.check_update(('com.zavione.one.rebornqa',667844,OTHER),'one','qa'),'separate-qa')
        with self.assertRaises(mod.UnsafeUpdate):mod.check_update(('com.zavione.one',667844,OTHER),'one','qa')
    def test_qa_pinned_certificate_must_match(self):
        current=('com.zavione.one.rebornqa',667844,OTHER)
        self.assertEqual(mod.check_update(current,'one','qa',OTHER),'separate-qa')
        with self.assertRaises(mod.UnsafeUpdate):
            mod.check_update(current,'one','qa',H)
        with self.assertRaises(mod.UnsafeUpdate):
            mod.check_update(current,'one','qa','invalid')
    def test_qa_requires_same_signer_and_newer_version(self):
        prior=('com.zavione.one.rebornqa',667843,OTHER)
        self.assertEqual(mod.check_update(('com.zavione.one.rebornqa',667844,OTHER),'one','qa',installed=prior),'separate-qa')
        with self.assertRaises(mod.UnsafeUpdate):mod.check_update(('com.zavione.one.rebornqa',667844,H),'one','qa',installed=prior)
        with self.assertRaises(mod.UnsafeUpdate):mod.check_update(('com.zavione.one.rebornqa',667842,OTHER),'one','qa',installed=prior)
    def test_release_must_match_original_certificate(self):
        old=('com.zavione.one',6675,H)
        self.assertEqual(mod.check_update(('com.zavione.one',667901,H),'one','release-candidate',H,old),'same-certificate-release-candidate')
        for candidate in [('com.zavione.one',667901,OTHER),('com.zavione.one.rebornqa',667901,H),('com.zavione.one',6674,H)]:
            with self.subTest(candidate=candidate),self.assertRaises(mod.UnsafeUpdate):
                mod.check_update(candidate,'one','release-candidate',H,old)
        with self.assertRaises(mod.UnsafeUpdate):
            mod.check_update(('com.zavione.one',667901,H),'one','release-candidate')
        with self.assertRaises(mod.UnsafeUpdate):
            mod.check_update(('com.zavione.one',667901,H),'one','release-candidate',OTHER)
    def test_admin_requires_its_own_trusted_fingerprint(self):
        old=('com.zavione.one.admin',146700,OTHER)
        self.assertEqual(mod.check_update(('com.zavione.one.admin',147001,OTHER),'admin','release-candidate',OTHER,old),'same-certificate-release-candidate')
        with self.assertRaises(mod.UnsafeUpdate):
            mod.check_update(('com.zavione.one.admin',147001,H),'admin','release-candidate',OTHER,old)
    def test_inspect_separately_validates_all_three_schemes(self):
        original=mod.run_command
        calls=[]
        try:
            def pretend(argv):
                calls.append(argv)
                if argv[0]=='aapt':
                    return "package: name='com.zavione.one.rebornqa' versionCode='667802' versionName='66.78'\n"
                if '--min-sdk-version' in argv:
                    return ('Verified using v1 scheme (JAR signing): true\n'
                            'Signer #1 certificate SHA-256 digest: '+OTHER+'\n')
                return ('Verified using v1 scheme (JAR signing): false\n'
                        'Verified using v2 scheme (APK Signature Scheme v2): true\n'
                        'Verified using v3 scheme (APK Signature Scheme v3): true\n'
                        'Signer #1 certificate SHA-256 digest: '+OTHER+'\n')
            mod.run_command=pretend
            self.assertEqual(mod.inspect('dummy.apk','aapt','apksigner'),
                             ('com.zavione.one.rebornqa',667802,OTHER))
            self.assertTrue(any('--min-sdk-version' in c and '23' in c for c in calls))
        finally:
            mod.run_command=original

    def test_inspect_rejects_bad_legacy_v1_even_with_v2v3(self):
        original=mod.run_command
        try:
            def pretend(argv):
                if argv[0]=='aapt':
                    return "package: name='com.zavione.one.rebornqa' versionCode='667802' versionName='66.78'\n"
                if '--min-sdk-version' in argv:
                    return ('Verified using v1 scheme (JAR signing): false\n'
                            'Signer #1 certificate SHA-256 digest: '+OTHER+'\n')
                return ('Verified using v1 scheme (JAR signing): false\n'
                        'Verified using v2 scheme (APK Signature Scheme v2): true\n'
                        'Verified using v3 scheme (APK Signature Scheme v3): true\n'
                        'Signer #1 certificate SHA-256 digest: '+OTHER+'\n')
            mod.run_command=pretend
            with self.assertRaisesRegex(mod.UnsafeUpdate,'v1'):
                mod.inspect('dummy.apk','aapt','apksigner')
        finally:
            mod.run_command=original
if __name__=='__main__':unittest.main()
