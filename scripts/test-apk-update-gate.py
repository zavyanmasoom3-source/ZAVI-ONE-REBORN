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
if __name__=='__main__':unittest.main()
