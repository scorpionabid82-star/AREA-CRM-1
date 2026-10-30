/**
 * Geolocation & Geofencing utilities for AREA-CRM Staff QR Attendance
 */

// Haversine formula to compute great-circle distance between two GPS coordinates in meters
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function isWithinGeofence(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  allowedRadiusMeters: number
): { isInside: boolean; distanceMeters: number } {
  const distance = calculateDistanceMeters(userLat, userLng, targetLat, targetLng);
  return {
    isInside: distance <= allowedRadiusMeters,
    distanceMeters: distance,
  };
}

// Generates dynamic QR attendance token that rotates periodically for anti-fraud
export function generateDynamicQrToken(branchId: string, timestamp: number): string {
  const windowIndex = Math.floor(timestamp / (30 * 1000)); // 30 second rotation
  return JSON.stringify({
    type: 'AREA_STAFF_ATTENDANCE',
    branchId,
    t: windowIndex,
    signature: `area_${branchId}_${windowIndex}`,
  });
}
