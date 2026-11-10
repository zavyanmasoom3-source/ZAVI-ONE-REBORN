#!/usr/bin/env node
'use strict';
/* Release-readiness source guard. Validates safety config, not an APK. */
const fs=require('node:fs'),assert=require('node:assert/strict');
const read=f=>fs.readFileSync(f,'utf8');
const gradle=read('android-build/app/build.gradle');
const settings=read('settings.gradle');
const wrapper=read('gradle/wrapper/gradle-wrapper.properties');
const manifest=read('android-build/app/src/main/AndroidManifest.xml');
const java=read('android-build/app/src/main/java/com/zavione/mobile/MainActivity.java');
const win=read('desktop/windows/Program.cs');
const csproj=read('desktop/windows/ZaviOneDesktop.csproj');
const wf=read('.github/workflows/stage6-release-readiness.yml');
assert.match(gradle,/compileSdk 36/);
assert.match(gradle,/minSdk 26/);
assert.match(gradle,/targetSdk 36/);
assert.match(gradle,/minifyEnabled true/);
assert.match(gradle,/shrinkResources true/);
assert.match(gradle,/zaviUnsignedReleaseQa/);
assert.match(gradle,/signingConfig unsignedReleaseQa \? null : signingConfigs\.release/);
assert.match(gradle,/applicationId admin \? 'com\.zavione\.one\.admin' : 'com\.zavione\.one'/);
assert.match(gradle,/throw new GradleException\('Persistent QA signing key required/);
assert.match(gradle,/throw new GradleException\('Release signing is missing required environment variables/);
assert.match(settings,/rootProject\.name/);
assert.match(wrapper,/distributionSha256Sum=20f1b1176237254a6fc204d8434196fa11a4cfb387567519c61556e8710aed78/);
assert.match(manifest,/android:allowBackup="false"/);
assert.match(manifest,/android:usesCleartextTraffic="false"/);
assert.match(manifest,/android:exported="false"/);
assert.match(java,/WebViewAssetLoader/);
assert.match(java,/appassets\.androidplatform\.net/);
assert.match(java,/onRenderProcessGone/);
assert.match(win,/AppVariant = "admin"/);
assert.match(win,/AppVariant = "one"/);
assert.match(win,/LocalApplicationData/);
assert.match(win,/SetVirtualHostNameToFolderMapping/);
assert.match(csproj,/Microsoft\.Web\.WebView2/);
assert.match(wf,/android-r8-unsigned:/);
assert.match(wf,/windows-compile:/);
assert.match(wf,/accounting-and-admin:/);
assert.match(wf,/themes-and-locales:/);
assert.match(wf,/--no-build-cache/);
assert.doesNotMatch(wf,/actions\/upload-artifact/,'Never upload unsigned Android APK or unapproved installer');
for(const app of ['one','admin']){
 const html=read('apps/'+app+'/index.html');
 if(app==='one' && fs.existsSync('apps/one/v6662-original-design-lock.json')){
   // Original 62MB V66.62 interface is the owner's approval baseline.
   // Shared utility code must load without reactivating rejected PDF CSS.
   assert.match(html,/zavi-theme-unified-v6538\.css/);
   assert.doesNotMatch(html,/zavi-reference-one-v3\.css|zavi-showcase-v6668\.css/);
   for(const mod of ['database/supabase-config.js','security/access-contract.js','i18n/language-core.js'])
     assert.ok(html.includes('../../packages/shared/'+mod),'Missing functional import: '+mod);
   assert.ok(fs.existsSync('scripts/prepare-v6662-native-webview.py'),
     'Missing mandatory native-only legacy WebView safety repair');
 }else{
   assert.match(html,/design-system-v1\.css/);
   assert.match(html,/zavi-reference-/);
 }
}
console.log('PASS: Android 26..36, R8, two app identities, persistent-signing enforcement and no app data backup');
console.log('PASS: Windows WebView2 isolation; no unsigned build or installer upload in Stage 6 gates');
console.log('NOT VERIFIED: actual APK signing, physical Android upgrade, Windows installer trust');
