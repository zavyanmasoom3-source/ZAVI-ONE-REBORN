#!/usr/bin/env python3
"""Isolated regression tests for fail-closed persistent APK signing."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('zavi_prepare', Path(__file__).with_name('prepare-ci-signing.py'))
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
KEY = {'ZAVI_KEYSTORE_BASE64': 'YQ==' * 300, 'ZAVI_STORE_PASSWORD': 'safe-password',
       'ZAVI_KEY_ALIAS': 'stable-key', 'ZAVI_KEY_PASSWORD': 'different-key-password'}
DIGEST = '1'*64


class CiSigningGateTest(unittest.TestCase):
    def test_missing_secret_fails_closed(self):
        with self.assertRaisesRegex(mod.SigningGateError, 'ZAVI_KEYSTORE_BASE64'):
            mod.load_credentials({k:v for k,v in KEY.items() if k!='ZAVI_KEYSTORE_BASE64'})

    def test_invalid_base64_fails_closed(self):
        with self.assertRaises(mod.SigningGateError):
            mod.load_credentials({**KEY, 'ZAVI_KEYSTORE_BASE64':'not-base64***'})

    def test_password_newline_refused(self):
        with self.assertRaises(mod.SigningGateError):
            mod.load_credentials({**KEY, 'ZAVI_STORE_PASSWORD': 'secret\nunsafe'})

    def test_malformed_fingerprint_pin(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp)/'pins.json'
            path.write_text(json.dumps({'one':{'sha256':'invalid'}}))
            with self.assertRaises(mod.SigningGateError):
                mod.check_pin('one', DIGEST, path)

    def test_wrong_fingerprint_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp)/'pins.json'
            path.write_text(json.dumps({'one':{'sha256':'2'*64}}))
            with self.assertRaisesRegex(mod.SigningGateError, 'یکسان نیست'):
                mod.check_pin('one', DIGEST, path)

    def test_matching_fingerprint_allowed(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp)/'pins.json'
            path.write_text(json.dumps({'one':{'sha256':DIGEST}}))
            self.assertEqual(mod.check_pin('one', DIGEST, path), DIGEST)

    def test_preflight_exports_correct_keys_without_logging_secrets(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); envfile=root/'github-env'; envfile.write_text('')
            pin=root/'pins.json';pin.write_text(json.dumps({'one':{'sha256':DIGEST}}))
            with patch.object(mod, 'compute_fingerprint', return_value=DIGEST):
                env={**KEY,'ZAVI_KEYSTORE_BASE64':mod.base64.b64encode(b'fake-keystore'*100).decode('ascii')}
                mod.prepare('one', env, root, envfile, pin)
            data=envfile.read_text()
            self.assertIn('ZAVI_QA_SIGNING_MODE=stable\n',data)
            self.assertIn('ZAVI_QA_EXPECTED_CERT_SHA256='+DIGEST,data)
            self.assertIn('ZAVI_QA_STORE_PASSWORD=safe-password\n',data)
            self.assertEqual((root/'zavi-stable-one.keystore').stat().st_mode & 0o777, 0o600)

    def test_preflight_removes_key_when_pin_wrong(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp); envfile=root/'github-env'; envfile.write_text('')
            pin=root/'pins.json';pin.write_text(json.dumps({'one':{'sha256':'2'*64}}))
            env={**KEY,'ZAVI_KEYSTORE_BASE64':mod.base64.b64encode(b'fake-keystore'*100).decode('ascii')}
            with patch.object(mod, 'compute_fingerprint', return_value=DIGEST):
                with self.assertRaises(mod.SigningGateError): mod.prepare('one',env,root,envfile,pin)
            self.assertFalse((root/'zavi-stable-one.keystore').exists())
            self.assertEqual(envfile.read_text(),'')

    def test_keytool_error_does_not_print_secret(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'placeholder.keystore';p.write_text('not a keystore')
            from subprocess import CalledProcessError
            with patch.object(mod.subprocess,'run',side_effect=CalledProcessError(1,['keytool'])):
                with self.assertRaisesRegex(mod.SigningGateError,'alias'):
                    mod.compute_fingerprint(p,KEY)


if __name__=='__main__':
    unittest.main(verbosity=2)
