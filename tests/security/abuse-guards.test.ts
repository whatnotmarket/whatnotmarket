import test from "node:test";
import assert from "node:assert/strict";
import { evaluateAbuseSnapshot } from "../../src/lib/domains/security/abuse-scoring";

test("abuse guard blocks heavy burst traffic", () => {
  const decision = evaluateAbuseSnapshot({
    ipHitsLastMinute: 65,
    deviceHitsLastTenMinutes: 90,
    userHitsLastTenMinutes: 5,
    uniqueUsersOnIpLastHour: 2,
    uniqueUsersOnDeviceLastHour: 1,
    endpointFanoutLastTenMinutes: 2,
    blockedHitsLastThirtyMinutes: 0,
  });

  assert.equal(decision.blocked, true);
  assert.ok(decision.score >= 100);
});

test("abuse guard blocks account-farm style behavior", () => {
  const decision = evaluateAbuseSnapshot({
    ipHitsLastMinute: 10,
    deviceHitsLastTenMinutes: 20,
    userHitsLastTenMinutes: 4,
    uniqueUsersOnIpLastHour: 7,
    uniqueUsersOnDeviceLastHour: 6,
    endpointFanoutLastTenMinutes: 7,
    blockedHitsLastThirtyMinutes: 1,
  });

  assert.equal(decision.blocked, true);
  assert.ok(decision.score >= 100);
});

test("abuse guard allows normal traffic envelopes", () => {
  const decision = evaluateAbuseSnapshot({
    ipHitsLastMinute: 4,
    deviceHitsLastTenMinutes: 9,
    userHitsLastTenMinutes: 6,
    uniqueUsersOnIpLastHour: 1,
    uniqueUsersOnDeviceLastHour: 1,
    endpointFanoutLastTenMinutes: 2,
    blockedHitsLastThirtyMinutes: 0,
  });

  assert.equal(decision.blocked, false);
  assert.ok(decision.score < 100);
});

