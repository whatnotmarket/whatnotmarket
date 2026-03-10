export type AbuseSnapshot = {
  ipHitsLastMinute: number;
  deviceHitsLastTenMinutes: number;
  userHitsLastTenMinutes: number;
  uniqueUsersOnIpLastHour: number;
  uniqueUsersOnDeviceLastHour: number;
  endpointFanoutLastTenMinutes: number;
  blockedHitsLastThirtyMinutes: number;
};

export type AbuseDecision = {
  blocked: boolean;
  score: number;
  reason: string | null;
};

export function evaluateAbuseSnapshot(snapshot: AbuseSnapshot): AbuseDecision {
  let score = 0;
  let reason: string | null = null;

  if (snapshot.ipHitsLastMinute >= 120) {
    score += 100;
    reason = reason || "Excessive IP burst traffic";
  } else if (snapshot.ipHitsLastMinute >= 60) {
    score += 70;
    reason = reason || "High IP burst traffic";
  } else if (snapshot.ipHitsLastMinute >= 30) {
    score += 35;
  }

  if (snapshot.deviceHitsLastTenMinutes >= 120) {
    score += 100;
    reason = reason || "Excessive device traffic";
  } else if (snapshot.deviceHitsLastTenMinutes >= 80) {
    score += 70;
    reason = reason || "High device traffic";
  } else if (snapshot.deviceHitsLastTenMinutes >= 40) {
    score += 35;
  }

  if (snapshot.userHitsLastTenMinutes >= 60) {
    score += 80;
    reason = reason || "User velocity anomaly";
  } else if (snapshot.userHitsLastTenMinutes >= 30) {
    score += 45;
  }

  if (snapshot.uniqueUsersOnIpLastHour >= 12) {
    score += 80;
    reason = reason || "IP account-farm pattern";
  } else if (snapshot.uniqueUsersOnIpLastHour >= 6) {
    score += 45;
  }

  if (snapshot.uniqueUsersOnDeviceLastHour >= 8) {
    score += 90;
    reason = reason || "Device account-farm pattern";
  } else if (snapshot.uniqueUsersOnDeviceLastHour >= 4) {
    score += 50;
  }

  if (snapshot.endpointFanoutLastTenMinutes >= 10) {
    score += 70;
    reason = reason || "Cross-endpoint abuse fanout";
  } else if (snapshot.endpointFanoutLastTenMinutes >= 6) {
    score += 40;
  }

  if (snapshot.blockedHitsLastThirtyMinutes >= 6) {
    score += 100;
    reason = reason || "Repeated blocked abuse activity";
  } else if (snapshot.blockedHitsLastThirtyMinutes >= 3) {
    score += 60;
  }

  return {
    blocked: score >= 100,
    score,
    reason,
  };
}
