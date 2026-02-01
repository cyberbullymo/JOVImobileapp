export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function filterGigsByDistance(
  gigs: Gig[],
  userLat: number,
  userLng: number,
  maxDistanceMiles: number
): Gig[] {
  return gigs
    .map(gig => ({
      ...gig,
      distance: calculateDistance(
        userLat,
        userLng,
        gig.location.lat,
        gig.location.lng
      )
    }))
    .filter(gig => gig.distance <= maxDistanceMiles)
    .sort((a, b) => a.distance - b.distance);
}
