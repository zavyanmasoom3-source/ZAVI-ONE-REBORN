#!/usr/bin/env node
'use strict';
/* Phase 3: keep client preflight consistent with the deployed server's
   previous-device freshness policy. Uses synthetic rows only, no DB writes.
 */
const assert=require('node:assert/strict');
const {classifyOtherDevices,isFresh,isVerifiedSynced}=require('../apps/one/zavi-devices-v652.js');
const now=Date.parse('2026-11-09T18:00:00.000Z');
const at=mins=>new Date(now-mins*60000).toISOString();
const other='device-previous';
const self='device-current';
const previous=(changes={})=>({
  device_id:other,status:'active',reported_pending_count:0,
  last_report_at:at(4),last_sync_at:at(4),...changes
});
function state(rows){
 return classifyOtherDevices(rows,self,now).status;
}
assert.equal(isFresh(at(4),now),true);
assert.equal(isFresh(at(16),now),false);
assert.equal(isVerifiedSynced(previous(),now),true,'complete recent cloud sync');
assert.equal(isVerifiedSynced(previous({last_sync_at:at(30)}),now),false,'stale sync blocks revocation');
assert.equal(isVerifiedSynced(previous({last_report_at:at(16)}),now),false,'stale heartbeat blocks revocation');
assert.equal(isVerifiedSynced(previous({reported_pending_count:2}),now),false,'pending records block revocation');
assert.equal(isVerifiedSynced(previous({reported_pending_count:null}),now),false,'unknown pending count blocks revocation');
assert.equal(isVerifiedSynced(previous({last_sync_at:null}),now),false,'missing proof blocks revocation');

assert.equal(state([previous()]),'clear','fresh successful sync');
assert.equal(state([previous({reported_pending_count:2})]),'pending','unsent ledger');
assert.equal(state([previous({reported_pending_count:null})]),'unknown','unknown queue');
assert.equal(state([previous({last_report_at:at(16)})]),'unknown','stale heartbeat');
assert.equal(state([previous({last_sync_at:null})]),'unknown','no confirmed cloud sync');
assert.equal(state([previous({last_sync_at:at(30)})]),'unknown',
  'a recent heartbeat must not hide a 30-minute-old sync');
assert.equal(state([previous({last_report_at:at(4),last_sync_at:at(20)})]),'unknown',
  'server rejects sync older than report by more than 15 minutes');
assert.equal(state([previous({last_sync_at:new Date(now+2*60000).toISOString()})]),
 'unknown','future sync timestamps');
assert.equal(state([previous({last_report_at:new Date(now+2*60000).toISOString()})]),
 'unknown','future heartbeat timestamps');
assert.equal(state([previous({reported_pending_count:0}),
 previous({device_id:'device-older',last_sync_at:at(40)})]),'unknown',
 'all active previous devices must be clean');
assert.equal(state([previous({reported_pending_count:2}),
 previous({device_id:'device-older',last_sync_at:at(40)})]),'pending',
 'unsent data takes precedence');
assert.equal(state([previous({device_id:self})]),'clear',
 'current device must not count as a previous device');
assert.equal(state([previous({status:'revoked'})]),'clear',
 'revoked devices should not block new activation');
assert.equal(state([]),'clear','first eligible device');
console.log('PASS: previous-device pending/stale/sync-gap classification matches server guard');
