#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const main=fs.readFileSync('apps/admin/app.js','utf8');
const recovery=fs.readFileSync('apps/admin/account-control.js','utf8');
const migration=fs.readFileSync('supabase/migrations/20261110_stage8_admin_owner_live_session.sql','utf8');
assert.doesNotMatch(main,/ZAVI_ADMIN_ALLOWED_EMAILS|zavyanmasoom6@gmail\.com/,
 'Old hardcoded email must not be used as an ADMIN permission');
assert.doesNotMatch(recovery,/MAIN_OWNER_EMAIL|zavyanmasoom6@gmail\.com/,
 'Customer archive owner cannot be authorized by user-editable email');
assert.match(main,/async function verifyCentralOwnerSession\(\)/);
assert.match(main,/zavi_stage8_admin_owner_session/);
assert.match(recovery,/rpc\('zavi_stage8_admin_owner_session'\)/);
const list=main.indexOf('async function fetchRows(){');
const listEnd=main.indexOf('function showApp()',list);
assert.ok(list>=0&&listEnd>list);
const f=main.slice(list,listEnd);
assert.ok(f.indexOf('await verifyCentralOwnerSession()')>=0);
assert.ok(f.indexOf('await verifyCentralOwnerSession()')<
 f.indexOf("zavi_admin_list_workspaces"),
 'Never query customer records before verifying actual current central owner');
assert.match(main,/const isMainAdmin=\(\)=>mode==='live' && centralOwnerVerified===true/);
assert.match(main,/async function resumeSavedSession\(\)/);
assert.match(main,/await refreshSession\(\);await fetchRows\(\)/);
assert.match(main,/session=savedSession\(\)/);
assert.match(main,/await verifyCentralOwnerSession\(\);\n  if\(!email\)/,
 'Password change must use the current server owner decision');
assert.match(main,/centralOwnerVerified=false;\n closeModal\(\);/,
 'Logout must invalidate the local owner authorization flag');
assert.match(migration,/auth\.sessions s/);
assert.match(migration,/r\.role='owner'/);
assert.match(migration,/s\.user_id=v_uid/);
assert.match(migration,/s\.not_after IS NULL OR s\.not_after>now\(\)/);
assert.match(migration,/v_session_text::uuid/);
assert.match(migration,/FROM PUBLIC,anon,authenticated/);
assert.doesNotMatch(migration,/INSERT INTO (auth|public)\./i);
assert.doesNotMatch(migration,/DELETE FROM (auth|public)\./i);
console.log('PASS: ADMIN login, refresh, account control and passwords require owner-role RPC, not stale email allowlist');
console.log('PASS: owner RPC verifies live Auth session against UID, role and active session; read-only migration');
