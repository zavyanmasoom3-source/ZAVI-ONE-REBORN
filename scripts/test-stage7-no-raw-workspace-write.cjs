#!/usr/bin/env node
'use strict';
// Structural regression against reintroducing direct workspace CAS bypass.
// Do not mistake a client-side guard or a publishable key for server auth.
const assert=require('node:assert/strict'),fs=require('node:fs');
const cloud=fs.readFileSync('apps/one/cloud.js','utf8');
const db=fs.readFileSync('supabase/migrations/20261110_stage7_server_cas_device_guard.sql','utf8');
const start=cloud.indexOf('async function push(){');
const end=cloud.indexOf('\nfunction logout(){',start);
assert.ok(start>0&&end>start,'Real cloud synchronization source located');
const push=cloud.slice(start,end);
assert.match(push,/rest\/v1\/rpc\/zavi_stage7_workspace_cas/);
assert.match(push,/p_expected_revision:oldRev/);
assert.match(push,/p_workspace_id:uploadWorkspace/);
assert.match(push,/p_device_id:deviceId/);
assert.match(push,/p_payload:snapshot/);
assert.match(push,/zaviCloudSamePayload\(current\.payload,snapshot\)/);
assert.doesNotMatch(push,/method\s*:\s*['"]PATCH['"]/i,
  'Client financial writes must not bypass the server-authorized CAS RPC');
assert.match(db,/SECURITY DEFINER SET search_path TO ''/);
assert.match(db,/auth\.uid\(\)/);
assert.match(db,/d\.revoked_at IS NULL/);
assert.match(db,/private\.zavi_subscription_is_active/);
assert.match(db,/w\.revision=p_expected_revision/);
assert.match(db,/RETURN QUERY\s+UPDATE public\.zavi_workspaces/s);
assert.match(db,/REVOKE ALL ON FUNCTION public\.zavi_stage7_workspace_cas/);
assert.match(db,/DO NOT revoke legacy UPDATE yet/);
assert.doesNotMatch(db,/^\s*REVOKE\s+UPDATE\s+ON\s+public\.zavi_workspaces/gmi,
 'An untested hard cutover would strand customer-installed old APKs');
console.log('PASS: real ZAVI ONE uses device/owner/subscription-guarded server-side revision CAS');
console.log('PASS: no client-side direct financial PATCH or unapproved forced legacy cutover');
console.log('NOT PROVEN: cryptographic hardware possession or revoked real JWT/session checks');
