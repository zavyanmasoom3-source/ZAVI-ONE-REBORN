#!/usr/bin/env python3
"""Stage the REAL ZAVI ONE 66.62 offline speech model, never fake padding.
Use the owner's 62,226,180-byte public original APK from GitHub. Its entire
SHA-256 is pinned. The model is written ONLY into the disposable build staging
area, never committed to Git or inserted into ZAVI ONE ADMIN.
"""
from pathlib import Path
from zipfile import ZipFile
import hashlib,sys,shutil

ORIGINAL_SIZE=62226180
ORIGINAL_SHA='2eb852d7cdb026ccd828a660328bd26bb474f9880430e0ea3007f51489ee50dc'
MODEL_PATH='assets/models/ggml-base-q5_1.bin'
MODEL_SIZE=59707625

def main(apk,root):
    apk=Path(apk).resolve();root=Path(root).resolve()
    if apk.stat().st_size!=ORIGINAL_SIZE:
        raise RuntimeError('Original 66.62 APK size mismatch')
    with apk.open('rb') as f:
        h=hashlib.file_digest(f,'sha256').hexdigest()
    if h!=ORIGINAL_SHA:
        raise RuntimeError('Original 66.62 APK SHA-256 mismatch')
    if root.name!='assets' or 'android-build' not in root.parts:
        raise RuntimeError('Refusing to stage outside Android build assets')
    target=root/'models/ggml-base-q5_1.bin'
    target.parent.mkdir(parents=True,exist_ok=True)
    if target.exists():
        raise RuntimeError('Refusing to overwrite preexisting model')
    with ZipFile(apk) as z:
        meta=z.getinfo(MODEL_PATH)
        if meta.file_size!=MODEL_SIZE:
            raise RuntimeError('Original full model missing or truncated')
        with z.open(meta) as reader,target.open('wb') as writer:
            shutil.copyfileobj(reader,writer,1024*1024)
    if target.stat().st_size!=MODEL_SIZE:
        target.unlink(missing_ok=True)
        raise RuntimeError('Staged model corrupted')
    with target.open('rb') as f:
        modelhash=hashlib.file_digest(f,'sha256').hexdigest()
    print('PASS full genuine 66.62 offline model',target,MODEL_SIZE,'sha256',modelhash,
          'from verified original APK',ORIGINAL_SHA)
if __name__=='__main__':
    if len(sys.argv)!=3:
        raise SystemExit('Usage: stage-original-v6662-model.py ORIGINAL_APK STAGED_ASSETS_DIR')
    main(sys.argv[1],sys.argv[2])
